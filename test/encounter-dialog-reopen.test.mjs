import test from "node:test";
import assert from "node:assert/strict";

const DIALOG_ID = "morelord-encounters-roster";
const TRANSITION_MS = 40;

class Element {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.id = "";
    this.className = "";
    this.childNodes = [];
    this.parentElement = null;
    this.dataset = {};
    this.scrollTop = 0;
  }

  append(...nodes) {
    for (const node of nodes) {
      node.parentElement?.removeChild?.(node);
      node.parentElement = this;
      this.childNodes.push(node);
    }
  }

  removeChild(node) {
    const index = this.childNodes.indexOf(node);
    if (index >= 0) this.childNodes.splice(index, 1);
    node.parentElement = null;
  }

  remove() {
    this.parentElement?.removeChild(this);
  }

  get isConnected() {
    let node = this;
    while (node) {
      if (node === document.body) return true;
      node = node.parentElement;
    }
    return false;
  }

  matches(selector) {
    return selector.startsWith(".") && this.className.split(/\s+/).includes(selector.slice(1));
  }

  querySelector(selector) {
    const walk = node => {
      for (const child of node.childNodes ?? []) {
        if (child.matches?.(selector)) return child;
        const found = walk(child);
        if (found) return found;
      }
      return null;
    };
    return walk(this);
  }

  closest() {
    return null;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function installDocument() {
  let frames = 0;
  const document = {
    body: null,
    createElement(tag) {
      return new Element(tag);
    },
    getElementById(id) {
      const walk = node => {
        if (!node) return null;
        if (node.id === id) return node;
        for (const child of node.childNodes ?? []) {
          const found = walk(child);
          if (found) return found;
        }
        return null;
      };
      return walk(document.body);
    }
  };
  document.body = new Element("body");
  globalThis.document = document;
  globalThis.HTMLElement = class HTMLElement {};
  globalThis.requestAnimationFrame = callback => setTimeout(() => {
    frames += 1;
    callback(performance.now());
  }, 0);
  return { document, frames: () => frames };
}

function installFoundry(document) {
  const instances = new Map();
  const openings = [];
  const foundry = {
    applications: {
      instances,
      api: {
        ApplicationV2: class ApplicationV2 {},
        HandlebarsApplicationMixin: Base => class extends Base {},
        DialogV2: {
          wait(config) {
            openings.push({
              id: config.id,
              previous: instances.get(config.id) ?? null,
              previousElement: document.getElementById(config.id)
            });
            const element = document.createElement("section");
            element.id = config.id;
            element.className = "application";
            const windowContent = document.createElement("div");
            windowContent.className = "window-content";
            windowContent.scrollTop = 9;
            element.append(windowContent);
            document.body.append(element);
            const app = {
              id: config.id,
              element,
              rendered: true,
              close() {
                if (app.closing) return app.closing;
                app.rendered = false;
                // Foundry awaits the close transition, then instances.delete(id).
                // The window node can remain in the document after that promise resolves.
                app.closing = (async () => {
                  await delay(TRANSITION_MS);
                  instances.delete(app.id);
                })();
                void app.closing.then(() => delay(TRANSITION_MS).then(() => element.remove()));
                return app.closing;
              },
              choose(action) {
                void app.close();
                app.resolve?.(action);
              }
            };
            instances.set(config.id, app);
            return new Promise(resolve => {
              app.resolve = resolve;
            });
          }
        }
      }
    },
    utils: {
      escapeHTML: value => String(value ?? ""),
      deepClone: structuredClone,
      randomID: () => "id"
    }
  };
  globalThis.foundry = foundry;
  globalThis.ui = { notifications: { info() {}, error() {}, warn() {} } };
  return { instances, openings };
}

installFoundry(installDocument().document);
const { waitForEncounterDialog } = await import("../scripts/apps/encounter-builder-dialog.mjs");

function dialogConfig(content = { scrollTop: 0, parentElement: null }) {
  return {
    id: DIALOG_ID,
    content,
    buttons: [{ action: "close", label: "Close" }]
  };
}

async function until(predicate, timeout = 1000) {
  const deadline = Date.now() + timeout;
  while (!predicate()) {
    if (Date.now() >= deadline) return false;
    await delay(5);
  }
  return true;
}

test("reopening a dialog waits until the previous same-id close finishes", async () => {
  const { document } = installDocument();
  const { instances, openings } = installFoundry(document);
  const first = waitForEncounterDialog(dialogConfig());
  const firstApp = instances.get(DIALOG_ID);
  assert.ok(firstApp, "the first dialog registers under its id");
  const windowContent = () => firstApp.element.querySelector(".window-content");
  assert.equal(await until(() => windowContent().scrollTop === 0), true);
  assert.equal(windowContent().scrollTop, 0);

  firstApp.choose("start-over");
  await first;
  assert.equal(firstApp.rendered, false);
  assert.equal(instances.get(DIALOG_ID), firstApp, "Foundry keeps the closing dialog registered through its transition");
  assert.ok(document.getElementById(DIALOG_ID), "the closing dialog stays in the document until close finishes");

  const second = waitForEncounterDialog(dialogConfig());
  assert.equal(await until(() => openings.length >= 2), true);
  assert.equal(openings.length, 2);
  assert.equal(openings[1].previous, null, "DialogV2.wait must not run while the previous instance is still registered");
  assert.equal(openings[1].previousElement, null, "DialogV2.wait must not run while the previous element is still in the document");

  await delay(TRANSITION_MS + 30);
  const reopened = instances.get(DIALOG_ID);
  assert.ok(reopened, "the reopened dialog stays registered after the previous close deletes its id");
  assert.notEqual(reopened, firstApp);
  assert.equal(reopened.rendered, true);
  assert.equal(reopened.element.isConnected, true);
  assert.equal(document.getElementById(DIALOG_ID), reopened.element);
  reopened.choose("close");
  await second;
});

test("scroll reset leaves a same-id element alone unless it is the rendered dialog", async () => {
  const { document, frames } = installDocument();
  const { instances } = installFoundry(document);
  const pending = waitForEncounterDialog(dialogConfig());
  const app = instances.get(DIALOG_ID);
  const windowContent = app.element.querySelector(".window-content");
  windowContent.scrollTop = 18;
  app.rendered = false;
  app.element = document.createElement("div");
  const started = frames();

  assert.equal(await until(() => frames() > started), true);
  assert.equal(windowContent.scrollTop, 18);
  app.rendered = true;
  app.element = windowContent.parentElement;
  app.choose("close");
  await pending;
});

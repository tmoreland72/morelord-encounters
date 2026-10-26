import assert from "node:assert/strict";
import test from "node:test";
import { addMorelordTool, legacySceneToolKey } from "../../scripts/core/scene-tool.mjs";

const definition = {
  id: "morelord-encounters",
  title: "Morelord Encounters",
  icon: "fa-solid fa-hydra",
  order: 20,
  visible: () => true,
  onClick: () => "opened"
};

function createHooks() {
  const once = new Map();
  const on = new Map();
  return {
    once(event, callback) {
      once.set(event, [...(once.get(event) ?? []), callback]);
    },
    on(event, callback) {
      on.set(event, [...(on.get(event) ?? []), callback]);
    },
    emit(event, ...args) {
      for (const callback of once.get(event) ?? []) callback(...args);
      once.set(event, []);
      for (const callback of on.get(event) ?? []) callback(...args);
    },
    listeners(event, kind) {
      return (kind === "once" ? once : on).get(event) ?? [];
    }
  };
}

function coreModule({ version = "0.6.0", register = () => {} } = {}) {
  return { version, api: { tools: { register } } };
}

test("registers the Encounters tool with Core 0.6.0", () => {
  const hooks = createHooks();
  const registered = [];
  const game = {
    modules: new Map([["morelord-core", coreModule({
      register: def => registered.push(def)
    })]])
  };
  addMorelordTool(definition, { hooks, game });
  assert.equal(hooks.listeners("setup", "once").length, 1);
  hooks.emit("setup");
  assert.deepEqual(registered, [definition]);
  assert.equal(hooks.listeners("getSceneControlButtons", "on").length, 0);
  hooks.emit("setup");
  assert.equal(registered.length, 1);
});

test("keeps the Token-controls button when Core is older than 0.6.0", () => {
  const hooks = createHooks();
  let clicks = 0;
  let gm = true;
  const game = {
    user: { get isGM() { return gm; } },
    modules: new Map([["morelord-core", coreModule({ version: "0.5.1" })]])
  };
  addMorelordTool({
    ...definition,
    visible: () => game.user.isGM,
    onClick: event => { clicks += 1; return event; }
  }, { hooks, game });
  hooks.emit("setup");
  const controls = { tokens: { tools: { select: { name: "select" } } } };
  hooks.emit("getSceneControlButtons", controls);
  const button = controls.tokens.tools.morelordEncounters;
  assert.equal(legacySceneToolKey("morelord-encounters"), "morelordEncounters");
  assert.deepEqual({
    name: button.name,
    title: button.title,
    icon: button.icon,
    order: button.order,
    button: button.button,
    visible: button.visible
  }, {
    name: "morelordEncounters",
    title: "Morelord Encounters",
    icon: "fa-solid fa-hydra",
    order: 1,
    button: true,
    visible: true
  });
  button.onChange({ type: "click" }, true);
  assert.equal(clicks, 1);
  gm = false;
  hooks.emit("getSceneControlButtons", controls);
  assert.equal(controls.tokens.tools.morelordEncounters.visible, false);
});

test("registers when Core exposes tools without a readable version", () => {
  const hooks = createHooks();
  const registered = [];
  const game = {
    modules: new Map([["morelord-core", { api: { tools: { register: def => registered.push(def) } } }]])
  };
  addMorelordTool(definition, { hooks, game });
  hooks.emit("setup");
  assert.deepEqual(registered, [definition]);
});

test("uses the Token-controls button when Core is missing or has no tools API", () => {
  for (const modules of [new Map(), new Map([["morelord-core", { version: "0.6.0", api: {} }]])]) {
    const hooks = createHooks();
    addMorelordTool(definition, { hooks, game: { modules } });
    hooks.emit("setup");
    const controls = {};
    hooks.emit("getSceneControlButtons", controls);
    assert.equal(controls.tokens, undefined);
    const ready = { tokens: { tools: {} } };
    hooks.emit("getSceneControlButtons", ready);
    assert.equal(ready.tokens.tools.morelordEncounters.name, "morelordEncounters");
    assert.equal(ready.tokens.tools.morelordEncounters.order, 0);
  }
});

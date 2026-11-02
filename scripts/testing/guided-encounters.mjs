// Opt-in: run in a development world as GM, with no Encounters windows open.
import { runInGameTests, assert } from "../../../morelord-core/scripts/testing/in-game.js";
import { configureEncounter } from "../apps/encounter-builder-dialog.mjs";

const MODULE_ID = "morelord-encounters";
const windowIds = ["morelord-encounters-configure", "morelord-encounters-roster", "morelord-encounters-save"];
async function until(read, message) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const value = read();
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  throw new Error(message);
}
const renderedWindow = id => {
  const app = foundry.applications.instances.get(id);
  return app?.rendered && app.element ? app : null;
};
const element = selector => until(() => {
  const id = windowIds.find(windowId => selector.startsWith(`#${windowId}`));
  const app = id && renderedWindow(id);
  if (!app) return null;
  const match = app.element.querySelector(selector.slice(id.length + 1).trim());
  return match && app.element.contains(match) ? match : null;
}, `Missing test control: ${selector}`);
function change(input, value) {
  if (input.type === "radio") input.checked = true;
  else input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export async function runGuidedEncounterTests() {
  return runInGameTests({ checks: [{
    id: "encounters.guided-create-edit-save-reopen",
    skip: !game.user.isGM ? "GM-only encounter authoring" : undefined,
    async run() {
      assert(!windowIds.some(id => document.getElementById(id)), "Close Encounters windows before running this test.");
      const name = `Guided encounter test ${foundry.utils.randomID()}`;
      const settings = [...game.settings.settings.values()]
        .filter(setting => setting.namespace === MODULE_ID && (setting.key.startsWith("default") || setting.key === "lastEncounterSources" || setting.key === "recentGuidedSituations"))
        .map(setting => [setting.key, structuredClone(game.settings.get(MODULE_ID, setting.key))]);
      let pending;
      let saved;
      try {
        pending = configureEncounter({ initial: { encounterSource: "guided" } });
        let form = await element("#morelord-encounters-configure .ml-encounters-source-form");
        assert(!form.querySelector(".ml-encounters-guided-panel").hidden, "Guided questions are hidden.");
        assert(form.querySelector(".ml-encounters-party-section").hidden, "Guided mode requires a party.");
        assert(form.querySelector(".ml-encounters-source-section").hidden, "Guided mode requires monster sources.");
        assert(form.querySelector("[name='guided.setting']").value === "any", "Unknown setting is not the default.");
        change(form.querySelector("[name='encounterMode'][value='roster']"));
        assert(!form.querySelector(".ml-encounters-settings-section").hidden, "Existing encounter settings are inaccessible.");
        change(form.querySelector("[name='encounterSource']"), "custom");
        change(form.querySelector("[name='encounterMode'][value='guided']"));
        change(form.querySelector("[name='guided.setting']"), "city");
        change(form.querySelector("[name='guided.interaction']"), "rescue");
        change(form.querySelector("[name='guided.purpose']"), "clue");
        change(form.querySelector("[name='guided.connection']"), "a missing caravan");
        change(form.querySelector("[name='encounterMode'][value='roster']"));
        assert(form.querySelector("[name='encounterSource']").value === "custom", "Switching modes lost the roster selection.");
        change(form.querySelector("[name='encounterMode'][value='guided']"));
        (await element("#morelord-encounters-configure [data-morelord-action='save-encounter-defaults']")).click();
        await until(() => game.settings.get(MODULE_ID, "defaultGuidance")?.setting === "city"
          && game.settings.get(MODULE_ID, "defaultsConfigured"), "Guided defaults did not save.");
        (await element("#morelord-encounters-configure [data-action='generate']")).click();
        let scene = await element("#morelord-encounters-roster .ml-encounters-guided-scene");
        assert(scene.querySelectorAll("[data-scene-value]").length === 12, "Scene assistance is incomplete.");
        assert(!scene.querySelector(".ml-encounters-monsters, .ml-encounters-stealth-result"), "Combat-only controls leaked into the scene.");
        assert(scene.querySelector("[data-scene-value='reward']").textContent.includes("a missing caravan"), "Campaign connection was lost.");
        scene.querySelector("details").open = true;
        change(scene.querySelector("[data-guided-field='name']"), name);
        change(scene.querySelector("[data-guided-field='opening']"), "A changed opening with <strong>literal text</strong>.");
        assert(!scene.querySelector("[data-scene-value='opening'] strong"), "Edited text was treated as HTML.");
        (await element("#morelord-encounters-roster [data-morelord-action='save-encounter']")).click();
        (await element("#morelord-encounters-save [data-action='save']")).click();
        saved = await until(() => game.journal.find(entry => entry.name === name), "Scene was not saved.");
        assert(saved.ownership.default === 0, "Saved scene is not private.");
        assert(saved.getFlag(MODULE_ID, "savedEncounter").scene.opening.includes("literal text"), "Edits were not saved.");
        (await element("#morelord-encounters-roster .form-footer [data-action='close']")).click();
        await pending;
        pending = configureEncounter();
        form = await element("#morelord-encounters-configure .ml-encounters-source-form");
        assert(form.querySelector("[name='encounterMode']:checked").value === "guided", "Saved guided mode did not reopen.");
        assert(form.querySelector("[name='guided.setting']").value === "city", "Saved answers did not reopen.");
        const historyBeforeReopen = JSON.stringify(game.settings.get(MODULE_ID, "recentGuidedSituations"));
        change(form.querySelector("[name='encounterMode'][value='roster']"));
        change(form.querySelector("[name='encounterSource']"), "saved");
        change(form.querySelector(`[name='savedEncounterId'][value='${saved.id}']`));
        assert(!form.querySelector(`[name='savedEncounterId'][value='${saved.id}']`).parentElement.textContent.includes("total XP"), "Saved scene preview shows combat XP.");
        (await element("#morelord-encounters-configure [data-action='generate']")).click();
        scene = await element("#morelord-encounters-roster .ml-encounters-guided-scene");
        assert(scene.querySelector("[data-scene-value='opening']").textContent.includes("literal text"), "Reopening regenerated the saved scene.");
        assert(JSON.stringify(game.settings.get(MODULE_ID, "recentGuidedSituations")) === historyBeforeReopen, "Reopening a saved scene consumed a new situation.");
        (await element("#morelord-encounters-roster [data-action='regenerate']")).click();
        await until(() => {
          const app = renderedWindow("morelord-encounters-roster");
          const title = app?.element.querySelector("[data-scene-value='name']");
          return title && app.element.contains(title) && title.textContent !== name && app.element.querySelector(".ml-encounters-guided-scene");
        }, "New Scene did not generate a new draft.");
        assert(saved.getFlag(MODULE_ID, "savedEncounter").name === name, "New Scene overwrote the saved encounter.");
        (await element("#morelord-encounters-roster [data-action='start-over']")).click();
        await element("#morelord-encounters-configure .ml-encounters-source-form");
      } finally {
        let failure;
        try {
          await until(() => {
            const configure = foundry.applications.instances.get("morelord-encounters-configure");
            if (!configure) return true;
            return configure.rendered && configure.element ? configure : null;
          }, "Configure window did not finish rendering.");
          const configure = renderedWindow("morelord-encounters-configure");
          // Core restores window geometry in requestAnimationFrame after render. Let that setPosition run while the window is still open.
          if (configure) await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        } catch (error) {
          failure = error;
        }
        try {
          for (const app of foundry.applications.instances.values()) {
            if (windowIds.includes(app.id)) await app.close();
          }
          if (pending) {
            pending.catch(() => {});
            await Promise.race([
              pending,
              new Promise((_, reject) => setTimeout(() => reject(new Error("Encounter dialog did not settle.")), 20000))
            ]);
          }
        } catch (error) {
          failure ??= error;
        }
        try {
          for (const entry of [...game.journal].filter(entry => entry.name?.startsWith("Guided encounter test "))) await entry.delete();
        } catch (error) {
          failure ??= error;
        }
        try {
          for (const [key, value] of settings) {
            if (JSON.stringify(game.settings.get(MODULE_ID, key)) !== JSON.stringify(value)) await game.settings.set(MODULE_ID, key, value);
          }
        } catch (error) {
          failure ??= error;
        }
        if (failure) throw failure;
      }
    }
  }, {
    id: "encounters.guided-variety-across-builder-sessions",
    skip: !game.user.isGM ? "GM-only encounter authoring" : undefined,
    async run() {
      assert(!windowIds.some(id => document.getElementById(id)), "Close Encounters windows before running this test.");
      const history = structuredClone(game.settings.get(MODULE_ID, "recentGuidedSituations"));
      let pending;
      try {
        await game.settings.set(MODULE_ID, "recentGuidedSituations", []);
        const seen = [];
        for (let index = 0; index < 13; index++) {
          pending = configureEncounter({ initial: { encounterSource: "guided", guidance: { interaction: "social", setting: "road" } } });
          await element("#morelord-encounters-configure .ml-encounters-source-form");
          (await element("#morelord-encounters-configure [data-action='generate']")).click();
          await element("#morelord-encounters-roster .ml-encounters-guided-scene");
          const recent = game.settings.get(MODULE_ID, "recentGuidedSituations");
          const id = recent[0];
          if (index < 12) {
            assert(!seen.includes(id), "Guide Me repeated before all twelve social situations were used.");
            seen.push(id);
          } else assert(id === seen[0], "An exhausted library did not reuse the oldest situation.");
          (await element("#morelord-encounters-roster .form-footer [data-action='close']")).click();
          await pending;
          pending = null;
        }
      } finally {
        for (const app of foundry.applications.instances.values()) {
          if (windowIds.includes(app.id)) await app.close();
        }
        if (pending) await pending;
        await game.settings.set(MODULE_ID, "recentGuidedSituations", history);
      }
    }
  }] });
}

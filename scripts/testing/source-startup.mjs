import { runInGameTests, assert } from "../../../morelord-core/scripts/testing/in-game.js";
import { configureEncounter } from "../apps/encounter-builder-dialog.mjs";
import { CoreAccessService } from "../services/core-access-service.mjs";
import { Dnd5eMonsterSourceService } from "../services/dnd5e-monster-source-service.mjs";

export const sourceStartupCheck = {
  id: "encounters.source-books-without-opening-settings",
  get skip() { return !game.user.isGM ? "GM-only encounter builder" : undefined; },
  async run() {
    const id = "morelord-encounters-configure";
    assert(!foundry.applications.instances.has(id), "Close the encounter builder first.");
    assert(!foundry.applications.instances.has("morelord-encounters-settings"), "Close Encounters settings first.");
    const prototype = CoreAccessService.prototype;
    const access = Object.getOwnPropertyDescriptor(prototype, "access");
    const refresh = prototype.refresh;
    let refreshed = false;
    let pending;
    let settled = false;
    // Emulate a connected cold cache without changing account settings or entitlements.
    Object.defineProperty(prototype, "access", { ...access, get() {
      return refreshed ? access.get.call(this) : { standard: false, premium: false };
    } });
    prototype.refresh = async function(options) {
      await new Promise(resolve => setTimeout(resolve, 50));
      const result = await refresh.call(this, options);
      refreshed = true;
      return result;
    };
    try {
      pending = configureEncounter({ initial: { encounterSource: "monster-compendiums" } });
      void pending.finally(() => { settled = true; });
      const deadline = Date.now() + 60000;
      let app;
      while (Date.now() < deadline && !settled) {
        app = foundry.applications.instances.get(id);
        if (app?.rendered && app.element?.querySelector(".ml-encounters-source-list")) break;
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      assert(app?.rendered, "Encounter builder did not render.");
      assert(refreshed, "Builder used cold access without awaiting a refresh.");
      const service = new CoreAccessService();
      const expected = (await new Dnd5eMonsterSourceService().availableSources())
        .filter(source => service.canUseSource(source)).map(source => source.id).sort();
      assert(expected.length, "Enable at least one source permitted by this account before testing.");
      const actual = Array.from(app.element.querySelectorAll("[name='sourceId']"), input => input.value).sort();
      assert(JSON.stringify(actual) === JSON.stringify(expected), "First-open source books differ from allowed account sources.");
    } finally {
      Object.defineProperty(prototype, "access", access);
      prototype.refresh = refresh;
      await foundry.applications.instances.get(id)?.close();
      if (pending) await pending;
    }
  }
};

export function runSourceStartupTests() {
  return runInGameTests({ checks: [sourceStartupCheck] });
}

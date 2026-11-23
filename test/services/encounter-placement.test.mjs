import test from "node:test";
import assert from "node:assert/strict";
import { placeEncounterMonsters } from "../../scripts/services/encounter-placement.mjs";

test("native group placement receives exact normal and published quantities without saving a group", async () => {
  const calls = [];
  globalThis.game = { user: { isGM: true }, modules: new Map(), settings: { get: () => ({}) } };
  globalThis.canvas = { ready: true, scene: {} };
  globalThis.CONFIG = { Actor: { documentClass: class {
    constructor(data) {
      assert.equal(data.type, "group");
      this.system = { async placeMembers() { return this.getPlaceableMembers(); } };
    }
    static async fetchExisting(uuid) { calls.push(uuid); return { uuid }; }
  } } };
  try {
    const members = [{ uuid: "Actor.goblin", name: "Goblin", count: 2, rolledQuantity: 4 }];
    const normal = await placeEncounterMonsters({ name: "Test", members });
    assert.equal(normal[0].quantity.value, 2);
    const published = await placeEncounterMonsters({ name: "Test", published: true, members });
    assert.equal(published[0].quantity.value, 4);
    assert.deepEqual(calls, ["Actor.goblin", "Actor.goblin"]);
    game.settings.get = () => ({ "test.monsters": false });
    await assert.rejects(placeEncounterMonsters({ members: [{ uuid: "Compendium.test.monsters.Actor.id", name: "Disabled", count: 1 }] }), /disabled/);
    assert.equal(calls.length, 2);
    await assert.rejects(placeEncounterMonsters({ members: [{ uuid: "Actor.goblin", count: -1 }] }), /quantity/);
    canvas.ready = false;
    await assert.rejects(placeEncounterMonsters({ members }), /scene/);
    game.user.isGM = false;
    await assert.rejects(placeEncounterMonsters({ members }), /GMs/);
  } finally {
    delete globalThis.game; delete globalThis.canvas; delete globalThis.CONFIG;
  }
});

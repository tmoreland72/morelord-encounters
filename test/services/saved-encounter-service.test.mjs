import assert from "node:assert/strict";
import test from "node:test";
import { getSavedEncounters, saveEncounter } from "../../scripts/services/saved-encounter-service.mjs";

test("saves independent world encounter snapshots and protects GM access", async () => {
  const stored = [];
  globalThis.game = {
    user: { isGM: true },
    journal: stored
  };
  globalThis.JournalEntry = {
    create: async data => {
      assert.deepEqual(data.ownership, { default: 0 });
      const journal = { id: `journal-${stored.length}`, name: data.name,
        getFlag: (module, key) => data.flags[module]?.[key] };
      stored.push(journal);
      return journal;
    }
  };
  for (const published of [false, true]) {
    const encounter = { name: "Original", published, members: [{ uuid: "Actor.monster", count: 3 }], notes: [{ title: "Details", text: "Ambush" }], totalXp: 600 };
    const saved = await saveEncounter("  Sewer ambush  ", encounter);
    assert.equal(saved.name, "Sewer ambush");
    assert.deepEqual(saved.encounter, { ...encounter, name: "Sewer ambush" });
    encounter.members[0].count = 9;
    assert.equal(getSavedEncounters().at(-1).encounter.members[0].count, 3);
  }
  const reopened = getSavedEncounters();
  reopened[0].encounter.notes[0].text = "Changed";
  assert.equal(getSavedEncounters()[0].encounter.notes[0].text, "Ambush");
  assert.notEqual(reopened[0].id, reopened[1].id);
  stored[0].name = "Renamed in Journals";
  assert.equal(getSavedEncounters()[0].encounter.name, "Renamed in Journals");
  await assert.rejects(saveEncounter("  ", {}), /name/);
  assert.equal(stored.length, 2);
  game.user.isGM = false;
  assert.throws(() => getSavedEncounters(), /Only GMs/);
  await assert.rejects(saveEncounter("Blocked", {}), /Only GMs/);
  assert.equal(stored.length, 2);
});

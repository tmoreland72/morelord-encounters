import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEncounterConfiguration } from "../../scripts/domain/encounter-configuration.mjs";

test("normalizes encounter configuration", () => {
  assert.deepEqual(normalizeEncounterConfiguration({
    difficulty: "hard",
    sourceIds: ["dnd5e.monsters", " dnd5e.monsters ", "third-party.bestiary", ""],
    partyUuids: ["Actor.hero", "Actor.hero"]
  }), { difficulty: "hard", sourceIds: ["dnd5e.monsters", "third-party.bestiary"], partyUuids: ["Actor.hero"], encounterSource: "monster-compendiums", drakkenheimTableId: "" });
});

test("uses safe defaults for invalid configuration", () => {
  assert.deepEqual(normalizeEncounterConfiguration({ difficulty: "impossible", sourceIds: null }), {
    difficulty: "medium",
    sourceIds: [],
    partyUuids: [],
    encounterSource: "monster-compendiums",
    drakkenheimTableId: ""
  });
});

test("preserves a selected Drakkenheim table", () => {
  const configuration = normalizeEncounterConfiguration({ drakkenheimTableId: " table-id " });
  assert.equal(configuration.drakkenheimTableId, "table-id");
  assert.equal(configuration.encounterSource, "drakkenheim");
});

test("migrates the former killer difficulty to the rebalanced hard tier", () => {
  assert.equal(normalizeEncounterConfiguration({ difficulty: "killer" }).difficulty, "hard");
});

test("preserves the custom encounter source", () => {
  assert.equal(normalizeEncounterConfiguration({ encounterSource: "custom" }).encounterSource, "custom");
});

import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEncounterConfiguration } from "../../scripts/domain/encounter-configuration.mjs";

test("normalizes encounter configuration", () => {
  assert.deepEqual(normalizeEncounterConfiguration({
    difficulty: "hard",
    terrain: "forest",
    sourceIds: ["dnd5e.monsters", " dnd5e.monsters ", "third-party.bestiary", ""],
    partyUuids: ["Actor.hero", "Actor.hero"]
  }), { difficulty: "hard", terrain: "forest", sourceIds: ["dnd5e.monsters", "third-party.bestiary"], partyUuids: ["Actor.hero"] });
});

test("uses safe defaults for invalid configuration", () => {
  assert.deepEqual(normalizeEncounterConfiguration({ difficulty: "impossible", sourceIds: null }), {
    difficulty: "medium",
    terrain: "any",
    sourceIds: [],
    partyUuids: []
  });
});

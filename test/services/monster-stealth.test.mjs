import assert from "node:assert/strict";
import test from "node:test";
import { lowestEncounterStealth, monsterStealthModifier } from "../../scripts/domain/encounter-stealth.mjs";

test("uses a monster's explicit Stealth modifier when available", () => {
  assert.equal(monsterStealthModifier({ skills: { ste: { mod: 7 } } }), 7);
});

test("derives Stealth from Dexterity and proficiency for source data", () => {
  assert.equal(monsterStealthModifier({
    abilities: { dex: { value: 16 } },
    attributes: { prof: 3 },
    skills: { ste: { value: 1 } }
  }), 6);
});

test("selects the lowest Stealth modifier in an encounter", () => {
  assert.deepEqual(lowestEncounterStealth({ members: [
    { name: "Scout", stealthModifier: 6 },
    { name: "Brute", stealthModifier: -1 },
    { name: "Guard", stealthModifier: 2 }
  ] }), { name: "Brute", modifier: -1 });
});

import assert from "node:assert/strict";
import test from "node:test";
import { encounterBudget, generateEncounterOptions, monsterMatchesTerrain, rerollEncounterMember } from "../../scripts/domain/encounter-generator.mjs";

const monsters = [
  { id: "rat", name: "Giant Rat", cr: 0.125, xp: 25 },
  { id: "goblin", name: "Goblin", cr: 0.25, xp: 50 },
  { id: "orc", name: "Orc", cr: 0.5, xp: 100 },
  { id: "ogre", name: "Ogre", cr: 2, xp: 450 },
  { id: "troll", name: "Troll", cr: 5, xp: 1800 },
  { id: "giant", name: "Hill Giant", cr: 5, xp: 1800 }
];

test("calculates a party encounter budget from character levels", () => {
  assert.equal(encounterBudget(Array.from({ length: 4 }, () => ({ level: 5 })), "medium"), 2000);
  assert.equal(encounterBudget(Array.from({ length: 4 }, () => ({ level: 5 })), "killer"), 5060);
});

test("generates all six encounter archetypes with monster rosters", () => {
  const options = generateEncounterOptions({
    monsters,
    party: Array.from({ length: 4 }, () => ({ level: 5 })),
    difficulty: "medium",
    random: () => 0.25
  });
  assert.deepEqual(options.map(option => option.id), ["pack", "boss", "boss-minions", "horde", "elite", "random"]);
  assert.ok(options.every(option => option.members.length > 0));
  assert.ok(options.every(option => option.totalXp > 0));
});

test("difficulty changes target budget and upgrades generated creatures", () => {
  const party = Array.from({ length: 4 }, () => ({ level: 5 }));
  const easy = generateEncounterOptions({ monsters, party, difficulty: "easy", random: () => 0.25 });
  const hard = generateEncounterOptions({ monsters, party, difficulty: "hard", random: () => 0.25 });
  assert.ok(easy[0].budget < hard[0].budget);
  assert.notEqual(easy[0].members[0].name, hard[0].members[0].name);
  assert.ok(easy[0].adjustedXp < hard[0].adjustedXp);
});

test("every encounter roster is capped at ten creatures", () => {
  const options = generateEncounterOptions({
    monsters,
    party: Array.from({ length: 6 }, () => ({ level: 20 })),
    difficulty: "killer",
    random: () => 0.9
  });
  assert.ok(options.every(option => option.creatureCount <= 10));
});

test("rerolls one member without changing its quantity or the other members", () => {
  const [option] = generateEncounterOptions({
    monsters,
    party: Array.from({ length: 4 }, () => ({ level: 5 })),
    difficulty: "medium",
    random: () => 0.25
  });
  const original = option.members[0];
  const originalCount = original.count;
  rerollEncounterMember(option, 0, monsters, () => 0.5);
  assert.notEqual(option.members[0].name, original.name);
  assert.equal(option.members[0].count, originalCount);
  assert.equal(option.creatureCount, originalCount);
  assert.ok(option.adjustedXp > 0);
});

test("balances equally suitable creatures across selected source books", () => {
  const broadCatalog = Array.from({ length: 15 }, (_, index) => ({
    id: `creature-${index}`,
    uuid: `Compendium.source-${index}.creature-${index}`,
    name: `Creature ${index}`,
    cr: 0.5,
    xp: 100,
    sourceId: `source-${index}`,
    sourceSelectorId: `source-${index}::book-${index}`
  }));
  let seed = 0;
  const options = generateEncounterOptions({
    monsters: broadCatalog,
    party: Array.from({ length: 4 }, () => ({ level: 2 })),
    difficulty: "medium",
    random: () => ((seed++ * 7) % 17) / 17
  });
  const usedSources = new Set(options.flatMap(option => option.members.map(member => member.sourceSelectorId)));
  assert.ok(usedSources.size >= 6, `expected broad source coverage, got ${usedSources.size}`);
});

test("regeneration can choose beyond the first six equally rated creatures", () => {
  const broadCatalog = Array.from({ length: 20 }, (_, index) => ({
    id: `creature-${index}`,
    name: `Creature ${index}`,
    cr: 1,
    xp: 200,
    sourceId: `source-${index}`
  }));
  const option = {
    members: [{ ...broadCatalog[0], count: 1, totalXp: 200 }],
    totalXp: 200,
    adjustedXp: 200,
    creatureCount: 1
  };
  rerollEncounterMember(option, 0, broadCatalog, () => 0.95);
  assert.ok(Number(option.members[0].id.split("-")[1]) > 6);
});

test("prefers suitably rated monsters from the selected terrain", () => {
  const terrainCatalog = [
    { id: "city-guard", name: "City Guard", cr: 0.5, xp: 100, sourceId: "urban", habitats: [{ type: "urban" }] },
    { id: "forest-rat", name: "Forest Rat", cr: 0.25, xp: 50, sourceId: "forest-low", habitats: [{ type: "forest" }] },
    ...Array.from({ length: 8 }, (_, index) => ({
      id: `forest-${index}`,
      name: `Forest Creature ${index}`,
      cr: 0.5,
      xp: 100,
      sourceId: `forest-${index}`,
      habitats: [{ type: "forest" }]
    }))
  ];
  const options = generateEncounterOptions({
    monsters: terrainCatalog,
    party: Array.from({ length: 4 }, () => ({ level: 2 })),
    difficulty: "medium",
    terrain: "forest",
    random: () => 0.5
  });
  assert.ok(options.every(option => option.members.every(member => monsterMatchesTerrain(member, "forest"))));
});

test("falls back to a suitably rated creature when terrain metadata is unavailable", () => {
  const [option] = generateEncounterOptions({
    monsters: [{ id: "unknown", name: "Unknown Habitat", cr: 1, xp: 200, sourceId: "source" }],
    party: [{ level: 1 }],
    difficulty: "medium",
    terrain: "swamp",
    random: () => 0.5
  });
  assert.equal(option.members[0].name, "Unknown Habitat");
});

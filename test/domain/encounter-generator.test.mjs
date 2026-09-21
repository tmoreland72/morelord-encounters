import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCustomEncounter,
  encounterBudget,
  encounterDifficulty,
  generateEncounterOptions,
  rerollEncounterMember
} from "../../scripts/domain/encounter-generator.mjs";

test("NPC allies increase all budgets by XP and change custom encounter difficulty", () => {
  const heroes = [{ level: 1 }];
  const party = [...heroes, { type: "npc", cr: 0.25 }, { type: "npc", cr: 0, xp: 10 }];
  for (const difficulty of ["easy", "medium", "hard", "deadly"]) {
    assert.equal(encounterBudget(party, difficulty), encounterBudget(heroes, difficulty) + 60);
  }
  assert.equal(encounterDifficulty(heroes, 100), "hard");
  assert.equal(buildCustomEncounter([{ cr: 0.5, count: 1 }], party).difficulty, "easy");
  for (const option of generateEncounterOptions({ monsters: [{ id: "wolf", cr: 0.25 }], party, difficulty: "medium", random: () => 0 })) {
    assert.equal(option.budget, 135);
  }
});

const monsters = [
  { id: "rat", name: "Giant Rat", cr: 0.125, xp: 25 },
  { id: "goblin", name: "Goblin", cr: 0.25, xp: 50 },
  { id: "orc", name: "Orc", cr: 0.5, xp: 100 },
  { id: "ogre", name: "Ogre", cr: 2, xp: 450 },
  { id: "troll", name: "Troll", cr: 5, xp: 1800 },
  { id: "giant", name: "Hill Giant", cr: 5, xp: 1800 }
];

test("Hard bosses for four level-3 characters and a CR 1/4 pet stay in the nearest XP tier", () => {
  const party = [...Array.from({ length: 4 }, () => ({ level: 3 })), { type: "npc", cr: 0.25 }];
  const catalog = [3, 4, 5, 5, 6].map((cr, id) => ({ id: String(id), name: `Boss ${id}`, cr }));
  const picked = new Set();
  for (let i = 0; i < 100; i++) {
    const boss = generateEncounterOptions({ monsters: catalog, party, difficulty: "hard", random: () => i / 100 })
      .find(option => option.id === "boss");
    assert.equal(boss.budget, 1650);
    assert.equal(boss.totalXp, 1800);
    assert.equal(boss.members[0].cr, 5);
    picked.add(boss.members[0].id);
    const original = boss.members[0].id;
    rerollEncounterMember(boss, 0, catalog, () => i / 100);
    assert.notEqual(boss.members[0].id, original);
    assert.equal(boss.totalXp, 1800);
    const sparse = catalog.filter(monster => monster.cr !== 5 || monster.id === boss.members[0].id);
    const retained = boss.members[0];
    rerollEncounterMember(boss, 0, sparse, () => i / 100);
    assert.equal(boss.members[0], retained, "No alternative in the nearest tier must retain the current boss");
  }
  assert.equal(picked.size, 2, "Different creatures at the same strength remain available");
});

test("bosses use the closest available tier and resolve XP ties consistently", () => {
  const catalog = [{ id: "lower", xp: 1000 }, { id: "upper", xp: 1200 }];
  for (const random of [() => 0, () => 0.99]) {
    const boss = generateEncounterOptions({ monsters: catalog, party: [{ level: 5 }], difficulty: "hard", random })
      .find(option => option.id === "boss");
    assert.equal(boss.budget, 1100);
    assert.equal(boss.totalXp, 1000);
  }
});

test("calculates a party encounter budget from character levels", () => {
  const party = Array.from({ length: 4 }, () => ({ level: 5 }));
  assert.equal(encounterBudget(party, "easy"), 2000);
  assert.equal(encounterBudget(party, "medium"), 3000);
  assert.equal(encounterBudget(party, "hard"), 4400);
  assert.equal(encounterBudget(party, "deadly"), 6600);
});

test("rates and totals a custom encounter as its roster changes", () => {
  const party = Array.from({ length: 4 }, () => ({ level: 5 }));
  const encounter = buildCustomEncounter([
    { ...monsters[3], count: 2 },
    { ...monsters[2], count: 1 }
  ], party);
  assert.equal(encounter.totalXp, 1000);
  assert.equal(encounter.creatureCount, 3);
  assert.equal(encounter.difficulty, "easy");
  assert.equal(encounterDifficulty(party, 3001), "medium");
  assert.equal(encounterDifficulty(party, 4400), "hard");
  assert.equal(encounterDifficulty(party, 6600), "deadly");
});

test("classifies custom difficulty from canonical lower-bound thresholds", () => {
  const party = Array.from({ length: 4 }, () => ({ level: 3 }));
  assert.equal(encounterDifficulty(party, 200), "easy");
  assert.equal(encounterDifficulty(party, 600), "easy");
  assert.equal(encounterDifficulty(party, 900), "medium");
  assert.equal(encounterDifficulty(party, 1600), "hard");
  assert.equal(encounterDifficulty(party, 2400), "deadly");
});

test("custom encounters preserve quantities above the random encounter cap", () => {
  const encounter = buildCustomEncounter([
    { ...monsters[0], count: 12 },
    { ...monsters[1], count: 8 }
  ], Array.from({ length: 4 }, () => ({ level: 5 })));
  assert.equal(encounter.creatureCount, 20);
  assert.deepEqual(encounter.members.map(member => member.count), [12, 8]);
  assert.equal(encounter.totalXp, encounter.members.reduce((sum, member) => sum + member.xp * member.count, 0));
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

test("difficulty changes the target budget", () => {
  const party = Array.from({ length: 4 }, () => ({ level: 5 }));
  const easy = generateEncounterOptions({ monsters, party, difficulty: "easy", random: () => 0.25 });
  const hard = generateEncounterOptions({ monsters, party, difficulty: "hard", random: () => 0.25 });
  assert.ok(easy[0].budget < hard[0].budget);
});

test("every encounter roster is capped at ten creatures", () => {
  const options = generateEncounterOptions({
    monsters,
    party: Array.from({ length: 6 }, () => ({ level: 20 })),
    difficulty: "deadly",
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
  const alternative = { ...original, id: "alternative", name: "Alternative" };
  rerollEncounterMember(option, 0, [...monsters, alternative], () => 0.5);
  assert.notEqual(option.members[0].name, original.name);
  assert.equal(option.members[0].count, originalCount);
  assert.equal(option.creatureCount, originalCount);
  assert.ok(option.totalXp > 0);
});

test("all styles keep total XP stable across regeneration and repeated creature rerolls", () => {
  const party = [...Array.from({ length: 4 }, () => ({ level: 3 })), { type: "npc", cr: 0.25 }];
  const catalog = [0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6].flatMap(cr =>
    Array.from({ length: 12 }, (_, i) => ({ id: `${cr}-${i}`, name: `${cr}-${i}`, cr, sourceId: `book-${i % 3}` })));
  let baseline;
  const names = new Set();
  for (let seed = 1; seed <= 100; seed++) {
    let state = seed;
    const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
    const options = generateEncounterOptions({ monsters: catalog, party, difficulty: "hard", random });
    const totals = options.map(option => option.totalXp);
    baseline ??= totals;
    assert.deepEqual(totals, baseline);
    for (const option of options) {
      assert.ok(Math.abs(option.totalXp - 1650) <= 165, `${option.id} missed the example budget by over 10%`);
      const xp = option.totalXp;
      const count = option.creatureCount;
      names.add(option.members[0].name);
      for (let repeat = 0; repeat < 10; repeat++) {
        for (let index = 0; index < option.members.length; index++) rerollEncounterMember(option, index, catalog, random);
        assert.equal(option.totalXp, xp);
        assert.equal(option.creatureCount, count);
      }
    }
  }
  assert.ok(names.size > 12, "Stable strength must retain creature variety");
});

test("sparse catalogs keep stable totals and rerolls cannot drift when same-XP replacements are absent", () => {
  const catalog = [{ id: "weak", cr: 0.125 }, { id: "strong", cr: 5 }];
  let baseline;
  for (const random of [() => 0, () => 0.5, () => 0.999]) {
    const options = generateEncounterOptions({ monsters: catalog, party: [{ level: 3 }], difficulty: "hard", random });
    const totals = options.map(option => option.totalXp);
    baseline ??= totals;
    assert.deepEqual(totals, baseline);
    for (const option of options) {
      const before = structuredClone(option);
      for (let index = 0; index < option.members.length; index++) rerollEncounterMember(option, index, catalog, random);
      assert.deepEqual(option, before);
    }
  }
  assert.ok(generateEncounterOptions({ monsters: [], party: [{ level: 3 }], difficulty: "hard" }).every(option => option.members.length === 0));
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
    creatureCount: 1
  };
  rerollEncounterMember(option, 0, broadCatalog, () => 0.95);
  assert.ok(Number(option.members[0].id.split("-")[1]) > 6);
});

test("uses distinct monsters across encounter suggestions when alternatives exist", () => {
  const broadCatalog = Array.from({ length: 100 }, (_, index) => ({
    id: `creature-${index}`,
    name: `Creature ${index}`,
    cr: 1,
    xp: 200,
    sourceId: `source-${index % 5}`
  }));
  const options = generateEncounterOptions({
    monsters: broadCatalog,
    party: Array.from({ length: 4 }, () => ({ level: 4 })),
    difficulty: "medium",
    random: () => 0.99
  });
  const names = options.flatMap(option => option.members.map(member => member.name));
  assert.equal(new Set(names).size, names.length);
  assert.ok(names.some(name => Number(name.split(" ")[1]) > 48), "expected the full suitable pool to be reachable");
});

test("treats copies of the same named monster from different compendiums as repeats", () => {
  const broadCatalog = Array.from({ length: 30 }, (_, index) => ({
    id: `creature-${index}`,
    uuid: `Compendium.source-${index}.creature-${index}`,
    name: index < 3 ? "Goblin" : `Creature ${index}`,
    cr: 0.5,
    xp: 100,
    sourceId: `source-${index}`
  }));
  const options = generateEncounterOptions({
    monsters: broadCatalog,
    party: Array.from({ length: 4 }, () => ({ level: 2 })),
    difficulty: "medium",
    random: () => 0
  });
  const names = options.flatMap(option => option.members.map(member => member.name));
  assert.ok(names.filter(name => name === "Goblin").length <= 1);
});

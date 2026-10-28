import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCustomEncounter,
  encounterBudget,
  encounterDifficulty,
  encounterWarnings,
  formatEncounterWarning,
  generateEncounterOptions,
  maxEncounterCreatures,
  partyCharacterCount,
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

test("boss XP stays on the nearest tier while other styles stay within the budget and cap", () => {
  const party = [...Array.from({ length: 4 }, () => ({ level: 3 })), { type: "npc", cr: 0.25 }];
  const catalog = [0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6].flatMap(cr =>
    Array.from({ length: 12 }, (_, i) => ({ id: `${cr}-${i}`, name: `${cr}-${i}`, cr, sourceId: `book-${i % 3}` })));
  const cap = maxEncounterCreatures(party, "hard");
  let bossXp;
  const names = new Set();
  for (let seed = 1; seed <= 100; seed++) {
    let state = seed;
    const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
    const options = generateEncounterOptions({ monsters: catalog, party, difficulty: "hard", random });
    for (const option of options) {
      if (option.id === "horde") {
        assert.equal(option.members.length, 1);
        assert.equal(option.creatureCount, 10);
        assert.ok(option.totalXp <= option.budget);
      } else assert.ok(option.creatureCount <= cap, `${option.id} exceeded the creature cap`);
      if (option.id === "elite") {
        assert.equal(option.creatureCount, 4);
        assert.ok(option.members.every(member => member.count === 1 && member.cr === 3));
        if (option.totalXp > option.budget) assert.ok(option.warnings.some(warning => warning.code === "elite-budget"));
      } else if (option.id === "boss") {
        bossXp ??= option.totalXp;
        assert.equal(option.totalXp, bossXp);
        assert.ok(Math.abs(option.totalXp - 1650) <= 165);
      } else if (option.creatureCount > 1) assert.ok(option.totalXp <= option.budget, `${option.id} exceeded the XP budget`);
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

test("sparse catalogs stay in budget and rerolls cannot drift when same-XP replacements are absent", () => {
  const catalog = [{ id: "weak", cr: 0.125 }, { id: "strong", cr: 5 }];
  for (const random of [() => 0, () => 0.5, () => 0.999]) {
    const options = generateEncounterOptions({ monsters: catalog, party: [{ level: 3 }], difficulty: "hard", random });
    for (const option of options) {
      if (option.id === "horde") {
        assert.equal(option.creatureCount, 10);
        assert.equal(option.members[0].id, "weak");
        assert.ok(option.totalXp <= option.budget);
      } else assert.ok(option.creatureCount <= maxEncounterCreatures([{ level: 3 }], "hard"));
      if (option.id !== "horde" && option.creatureCount > 1) assert.ok(option.totalXp <= option.budget);
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

const seaHag = {
  id: "sea-hag",
  name: "Sea Hag",
  cr: 2,
  xp: 450,
  features: [
    { name: "Coven", description: "While within 30 feet of at least two hag allies, the hag can cast shared coven spells." },
    { name: "Death Glare", description: "If the target is already Frightened by this effect, it drops to 0 hit points." }
  ]
};

const levelFiveParty = () => [
  ...Array.from({ length: 4 }, () => ({ level: 5 })),
  { type: "npc", name: "Jasper", cr: 1, xp: 200 }
];

test("a tiger companion adds XP to the budget and does not increase the creature cap", () => {
  const heroes = Array.from({ length: 4 }, () => ({ level: 5 }));
  const party = levelFiveParty();
  assert.equal(encounterBudget(heroes, "medium"), 3000);
  assert.equal(encounterBudget(party, "medium"), 3200);
  assert.equal(partyCharacterCount(party), 4);
  assert.equal(maxEncounterCreatures(party, "medium"), maxEncounterCreatures(heroes, "medium"));
  assert.equal(maxEncounterCreatures(party, "medium"), 4);
});

test("pack and horde vary count, CR, and creature under the party cap", () => {
  const catalog = [1, 2, 3, 4, 5].flatMap(cr => ["Wolf", "Ogre Zombie", "Cult Fanatic", "Ghoul"].map(name => ({
    id: `${name}-${cr}`,
    name: `${name} ${cr}`,
    cr,
    sourceId: `book-${name}`
  })));
  catalog.push(seaHag);
  const party = levelFiveParty();
  const cap = maxEncounterCreatures(party, "medium");
  const packs = [];
  const hordes = [];
  for (let seed = 1; seed <= 40; seed++) {
    let state = seed;
    const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
    const options = generateEncounterOptions({ monsters: catalog, party, difficulty: "medium", random });
    for (const option of options) {
      assert.ok(option.members.every(member => member.name !== "Sea Hag"), `${option.id} included a coven creature`);
      if (option.id === "horde") {
        assert.equal(option.members.length, 1);
        assert.equal(option.creatureCount, 10);
        assert.ok(option.totalXp <= 3200);
        assert.equal(option.warnings.length, 0);
        continue;
      }
      if (option.id === "elite") {
        assert.equal(option.creatureCount, 4);
        assert.ok(option.members.every(member => member.count === 1 && member.cr === 5));
        assert.ok(option.warnings.some(warning => warning.code === "elite-budget"));
        continue;
      }
      assert.ok(option.creatureCount <= cap, `${option.id} fielded ${option.creatureCount}`);
      if (option.creatureCount > 1) assert.ok(option.totalXp <= 3200);
      assert.equal(option.warnings.length, 0);
    }
    packs.push(options.find(option => option.id === "pack"));
    hordes.push(options.find(option => option.id === "horde"));
  }
  assert.ok(new Set(packs.map(option => option.creatureCount)).size > 1, "Pack Skirmish count did not vary");
  assert.ok(new Set(packs.map(option => option.members[0].cr)).size > 1, "Pack Skirmish CR did not vary");
  assert.ok(new Set(packs.map(option => option.members[0].name)).size > 1, "Pack Skirmish creature did not vary");
  assert.ok(packs.every(option => option.creatureCount <= 4));
  assert.ok(hordes.every(option => option.creatureCount === 10 && option.members.length === 1 && option.totalXp <= 3200));
  assert.ok(new Set(hordes.map(option => option.members[0].name)).size > 1, "Horde creature did not vary");
});

test("the horde is ten of one creature, or a warning when ten do not fit", () => {
  const party = levelFiveParty();
  const catalog = [
    { id: "rat", name: "Giant Rat", cr: 0.25, xp: 50, sourceId: "beasts" },
    { id: "wolf", name: "Wolf", cr: 0.5, xp: 100, sourceId: "beasts" },
    { id: "orc", name: "Orc", cr: 1, xp: 200, sourceId: "humanoids" },
    { id: "ogre", name: "Ogre", cr: 2, xp: 450, sourceId: "giants" },
    seaHag
  ];
  const names = new Set();
  const ratings = new Set();
  for (let seed = 1; seed <= 30; seed++) {
    let state = seed;
    const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
    const options = generateEncounterOptions({ monsters: catalog, party, difficulty: "medium", random });
    const horde = options.find(option => option.id === "horde");
    assert.equal(horde.members.length, 1);
    assert.equal(horde.members[0].count, 10);
    assert.equal(horde.creatureCount, 10);
    assert.equal(horde.totalXp, horde.members[0].xp * 10);
    assert.ok(horde.totalXp <= horde.budget);
    assert.notEqual(horde.members[0].name, "Ogre");
    assert.notEqual(horde.members[0].name, "Sea Hag");
    assert.equal(horde.warnings.length, 0);
    names.add(horde.members[0].name);
    ratings.add(horde.members[0].cr);
    const pack = options.find(option => option.id === "pack");
    assert.ok(pack.creatureCount <= 4);
    assert.ok(pack.creatureCount !== 10);
  }
  assert.ok(names.size > 1, "Horde rolls should change which creature is chosen");
  assert.ok(ratings.size > 1, "Any creature that fits ten times stays eligible");

  let state = 3;
  const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
  const blocked = generateEncounterOptions({
    monsters: [seaHag, { id: "ogre", name: "Ogre", cr: 2, xp: 450 }],
    party,
    difficulty: "medium",
    random
  }).find(option => option.id === "horde");
  assert.equal(blocked.members.length, 0);
  assert.equal(blocked.creatureCount, 0);
  assert.equal(blocked.warnings.length, 1);
  assert.equal(blocked.warnings[0].code, "horde-unfilled");
  assert.match(formatEncounterWarning(blocked.warnings[0]), /ten of one creature/);
});

test("elite team matches the selected characters and keeps that count when XP runs over", () => {
  const heroes = [
    { level: 3, name: "Bufoma" },
    { level: 5, name: "Daludriel" },
    { level: 5, name: "Rhyndor" },
    { level: 7, name: "Joeb" }
  ];
  const party = [...heroes, { type: "npc", name: "Jasper", cr: 1, xp: 200 }];
  const catalog = [1, 3, 5, 7, 9].flatMap(cr => ["Knight", "Mage", "Captain"].map((name, index) => ({
    id: `${name}-${cr}`,
    name: `${name} ${cr}`,
    cr,
    xp: { 1: 200, 3: 700, 5: 1800, 7: 2900, 9: 5000 }[cr],
    sourceId: `book-${index}`
  })));
  const names = new Set();
  for (let seed = 1; seed <= 20; seed++) {
    let state = seed;
    const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
    const elite = generateEncounterOptions({ monsters: catalog, party, difficulty: "medium", random })
      .find(option => option.id === "elite");
    assert.equal(elite.creatureCount, 4);
    assert.equal(elite.members.length, 4);
    assert.deepEqual(elite.members.map(member => member.cr).sort((a, b) => a - b), [3, 5, 5, 7]);
    assert.equal(new Set(elite.members.map(member => member.name)).size, 4);
    assert.ok(elite.totalXp > elite.budget);
    assert.ok(elite.warnings.some(warning => warning.code === "elite-budget"));
    names.add(elite.members.map(member => member.name).join("|"));
  }
  assert.ok(names.size > 1, "Elite rolls should change which rivals are chosen");

  const affordable = generateEncounterOptions({
    monsters: catalog.filter(monster => monster.cr === 1),
    party: [{ level: 5 }, { level: 5 }, { type: "npc", cr: 1, xp: 200 }],
    difficulty: "medium",
    random: () => 0.2
  }).find(option => option.id === "elite");
  assert.equal(affordable.creatureCount, 2);
  assert.ok(affordable.members.every(member => member.cr === 1));
  assert.ok(affordable.totalXp <= affordable.budget);
  assert.equal(affordable.warnings.some(warning => warning.code === "elite-budget"), false);
});

test("seven sea hags are not generated, and a custom roster of them is warned", () => {
  const party = levelFiveParty();
  const options = [];
  for (let seed = 1; seed <= 25; seed++) {
    let state = seed;
    const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
    options.push(...generateEncounterOptions({
      monsters: [seaHag, { id: "ogre", name: "Ogre", cr: 2 }, { id: "ettin", name: "Ettin", cr: 4 }],
      party,
      difficulty: "medium",
      random
    }));
  }
  assert.ok(options.every(option => !(option.members.some(member => member.name === "Sea Hag" && member.count >= 3))));
  assert.ok(options.filter(option => option.id === "pack").every(option => option.members[0].name !== "Sea Hag"));
  const custom = buildCustomEncounter([{ ...seaHag, count: 7 }], party);
  assert.equal(custom.totalXp, 3150);
  assert.ok(custom.warnings.some(warning => warning.code === "creature-count"));
  assert.ok(custom.warnings.some(warning => warning.code === "coven"));
  assert.ok(custom.warnings.some(warning => warning.code === "group-synergy" && warning.ability === "Death Glare"));
  assert.match(formatEncounterWarning(custom.warnings[0]), /harder than its XP/);
  assert.equal(encounterWarnings({ partySize: 4, members: [{ name: "Wolf", count: 2, features: [{ name: "Pack Tactics", description: "Advantage on an attack roll against a creature if at least one of the wolf's allies is within 5 feet of the creature." }] }] })[0].ability, "Pack Tactics");
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

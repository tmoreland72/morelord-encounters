const XP_BY_CR = new Map([
  [0, 10], [0.125, 25], [0.25, 50], [0.5, 100], [1, 200], [2, 450], [3, 700], [4, 1100],
  [5, 1800], [6, 2300], [7, 2900], [8, 3900], [9, 5000], [10, 5900], [11, 7200], [12, 8400],
  [13, 10000], [14, 11500], [15, 13000], [16, 15000], [17, 18000], [18, 20000], [19, 22000],
  [20, 25000], [21, 33000], [22, 41000], [23, 50000], [24, 62000], [25, 75000], [26, 90000],
  [27, 105000], [28, 120000], [29, 135000], [30, 155000]
]);

// 2024 DMG / Free Rules XP Budget per Character: Low, Moderate, High.
const XP_BUDGETS_2024 = [
  null,
  [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500],
  [500, 750, 1100], [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100],
  [1300, 2000, 2600], [1600, 2300, 3100], [1900, 2900, 4100], [2200, 3700, 4700],
  [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800], [3800, 6100, 9800],
  [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000]
];

export const ENCOUNTER_ARCHETYPES = Object.freeze([
  { id: "pack", name: "Pack Skirmish", description: "A coordinated pack of enemies that fight best together." },
  { id: "boss", name: "Boss Battle", description: "A high-stakes clash with one powerful solo enemy." },
  { id: "boss-minions", name: "Boss and Minions", description: "A strong leader supported by appropriate lesser creatures." },
  { id: "horde", name: "The Horde", description: "A massive wave of weak enemies where area effects shine." },
  { id: "elite", name: "Elite Team / Mirror Team", description: "A distinct, specialized group that mirrors adventuring roles." },
  { id: "random", name: "Random", description: "A deliberately unpredictable mix of opponents." }
]);
export const MAX_ENCOUNTER_CREATURES = 10;

export function monsterXp(monster) {
  const explicit = Number(monster.xp);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return XP_BY_CR.get(Number(monster.cr)) ?? 10;
}

export function encounterBudget(party, difficulty = "medium") {
  const index = { easy: 0, medium: 1, hard: 2, deadly: 2, killer: 2 }[difficulty] ?? 1;
  const total = party.reduce((sum, member) => {
    const level = Math.max(1, Math.min(20, Number(member.level) || 1));
    return sum + XP_BUDGETS_2024[level][index];
  }, 0);
  return difficulty === "deadly" ? Math.round(total * 1.5) : total;
}

const monsterKey = monster => monster.uuid ?? monster.id;
const monsterIdentity = monster => String(monster.name ?? monsterKey(monster) ?? "")
  .trim().toLocaleLowerCase();
const sourceKey = monster => monster.sourceSelectorId ?? monster.sourceId ?? monster.sourceLabel ?? "unknown";

function variedClosest(monsters, target, random, {
  predicate = () => true,
  excluded = new Set(),
  sourceUse = new Map(),
  monsterUse = new Map()
} = {}) {
  const ranked = monsters
    .filter(monster => predicate(monster)
      && !excluded.has(monsterKey(monster))
      && !excluded.has(monsterIdentity(monster)))
    .toSorted((left, right) => Math.abs(monsterXp(left) - target) - Math.abs(monsterXp(right) - target));
  if (!ranked.length) return null;

  // XP values are highly repetitive across challenge ratings. Keep every
  // comparably suitable creature in contention instead of allowing the first
  // compendium in index order to win every tie.
  const bestDifference = Math.abs(monsterXp(ranked[0]) - target);
  const tolerance = bestDifference + Math.max(25, target * 0.35);
  const comparable = ranked.filter(monster => Math.abs(monsterXp(monster) - target) <= tolerance);
  const leastMonsterUse = Math.min(...comparable.map(monster => monsterUse.get(monsterIdentity(monster)) ?? 0));
  const freshMonsters = comparable.filter(monster => (monsterUse.get(monsterIdentity(monster)) ?? 0) === leastMonsterUse);
  const leastSourceUse = Math.min(...freshMonsters.map(monster => sourceUse.get(sourceKey(monster)) ?? 0));
  const sourceBalanced = freshMonsters.filter(monster => (sourceUse.get(sourceKey(monster)) ?? 0) === leastSourceUse);
  const choice = sourceBalanced[Math.floor(random() * sourceBalanced.length)] ?? sourceBalanced[0] ?? ranked[0];
  sourceUse.set(sourceKey(choice), (sourceUse.get(sourceKey(choice)) ?? 0) + 1);
  monsterUse.set(monsterIdentity(choice), (monsterUse.get(monsterIdentity(choice)) ?? 0) + 1);
  return choice;
}

const roster = entries => entries.filter(entry => entry.monster && entry.count > 0)
  .map(entry => ({ ...entry.monster, count: Math.min(MAX_ENCOUNTER_CREATURES, entry.count), totalXp: monsterXp(entry.monster) * Math.min(MAX_ENCOUNTER_CREATURES, entry.count) }));

export function encounterDifficulty(party, totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  if (xp >= encounterBudget(party, "deadly")) return "deadly";
  if (xp >= encounterBudget(party, "hard")) return "hard";
  if (xp >= encounterBudget(party, "medium")) return "medium";
  return "easy";
}

export function buildCustomEncounter(members, party) {
  let remaining = MAX_ENCOUNTER_CREATURES;
  const normalizedMembers = [];
  for (const member of members) {
    if (!member || Number(member.count) <= 0 || remaining <= 0) continue;
    const count = Math.max(1, Math.min(remaining, Math.floor(Number(member.count))));
    normalizedMembers.push({ ...member, count, totalXp: monsterXp(member) * count });
    remaining -= count;
  }
  const totalXp = normalizedMembers.reduce((sum, member) => sum + member.totalXp, 0);
  return {
    name: "Custom Encounter",
    description: "A custom encounter assembled by the GM.",
    difficulty: encounterDifficulty(party, totalXp),
    budget: encounterBudget(party, "medium"),
    members: normalizedMembers,
    totalXp,
    creatureCount: normalizedMembers.reduce((sum, member) => sum + member.count, 0)
  };
}

export function rerollEncounterMember(option, memberIndex, monsters, random = Math.random) {
  const current = option.members[memberIndex];
  if (!current) return option;
  const targetXp = monsterXp(current);
  const currentKey = current.uuid ?? current.id;
  const usedIdentities = new Set(option.members
    .filter((_, index) => index !== memberIndex)
    .map(monsterIdentity));
  const alternatives = monsters
    .filter(monster => (monster.uuid ?? monster.id) !== currentKey && !usedIdentities.has(monsterIdentity(monster)))
    .toSorted((left, right) => Math.abs(monsterXp(left) - targetXp) - Math.abs(monsterXp(right) - targetXp));
  if (!alternatives.length) return option;
  const bestDifference = Math.abs(monsterXp(alternatives[0]) - targetXp);
  const shortlist = alternatives
    .filter(monster => Math.abs(monsterXp(monster) - targetXp) <= bestDifference + Math.max(25, targetXp * 0.35));
  const replacement = shortlist[Math.floor(random() * shortlist.length)] ?? shortlist[0];
  option.members[memberIndex] = {
    ...replacement,
    count: current.count,
    totalXp: monsterXp(replacement) * current.count
  };
  option.totalXp = option.members.reduce((sum, member) => sum + member.totalXp, 0);
  option.creatureCount = option.members.reduce((sum, member) => sum + member.count, 0);
  return option;
}

function build(archetype, monsters, budget, random, sourceUse, monsterUse) {
  const sorted = monsters.toSorted((a, b) => monsterXp(a) - monsterXp(b));
  if (!sorted.length) return [];
  const choose = (target, options = {}) => variedClosest(sorted, target, random, { sourceUse, monsterUse, ...options });
  if (archetype === "boss") return roster([{ monster: choose(budget * (0.8 + random() * 0.4)), count: 1 }]);
  if (archetype === "pack") {
    const desired = 4 + Math.floor(random() * 4);
    const targetPerCreature = budget / desired;
    const monster = choose(targetPerCreature) ?? sorted[0];
    return roster([{ monster, count: desired }]);
  }
  if (archetype === "boss-minions") {
    const minionCount = 3 + Math.floor(random() * 3);
    const rawBudget = budget;
    const leader = choose(rawBudget * (0.55 + random() * 0.15)) ?? sorted.at(-1);
    const remaining = Math.max(10, rawBudget - monsterXp(leader));
    const leaderExcluded = new Set([monsterKey(leader), monsterIdentity(leader)]);
    const minion = choose(remaining / minionCount, {
      predicate: candidate => monsterXp(candidate) < monsterXp(leader),
      excluded: leaderExcluded
    }) ?? choose(remaining / minionCount, { excluded: leaderExcluded }) ?? sorted[0];
    return roster([{ monster: leader, count: 1 }, { monster: minion, count: minionCount }]);
  }
  if (archetype === "horde") {
    const count = MAX_ENCOUNTER_CREATURES;
    const targetPerCreature = budget / count;
    const monster = choose(targetPerCreature) ?? sorted[0];
    return roster([{ monster, count }]);
  }
  if (archetype === "elite") {
    const desired = Math.min(5, Math.max(3, sorted.length));
    const rawTarget = budget / desired;
    const candidates = sorted.filter(monster => monsterXp(monster) <= rawTarget * 2.5);
    const distinct = [];
    for (let index = 0; index < desired; index += 1) {
      const target = rawTarget * (0.7 + index * 0.15 + random() * 0.2);
      const choice = variedClosest(candidates, target, random, {
        sourceUse,
        monsterUse,
        excluded: new Set(distinct.flatMap(monster => [monsterKey(monster), monsterIdentity(monster)]))
      });
      if (choice) distinct.push(choice);
    }
    return roster(distinct.map(monster => ({ monster, count: 1 })));
  }
  const count = Math.max(2, Math.min(6, Math.ceil(random() * 6)));
  const choices = [];
  const selected = new Set();
  const rawTarget = budget / count;
  for (let index = 0; index < count; index += 1) {
    const monster = choose(rawTarget * (0.75 + random() * 0.5), { excluded: selected })
      ?? choose(rawTarget * (0.75 + random() * 0.5))
      ?? sorted[0];
    selected.add(monsterKey(monster));
    selected.add(monsterIdentity(monster));
    choices.push({ monster, count: 1 });
  }
  return roster(choices);
}

export function generateEncounterOptions({ monsters, party, difficulty, random = Math.random }) {
  const budget = encounterBudget(party, difficulty);
  const sourceUse = new Map();
  const monsterUse = new Map();
  return ENCOUNTER_ARCHETYPES.map(archetype => {
    const members = build(archetype.id, monsters, budget, random, sourceUse, monsterUse);
    const totalXp = members.reduce((sum, member) => sum + member.totalXp, 0);
    return {
      ...archetype,
      difficulty,
      budget,
      members,
      totalXp,
      creatureCount: members.reduce((sum, member) => sum + member.count, 0)
    };
  });
}

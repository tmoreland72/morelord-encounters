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
    // NPC allies contribute XP rather than a character-level conversion.
    if (member.type === "npc") return sum;
    const level = Math.max(1, Math.min(20, Number(member.level) || 1));
    return sum + XP_BUDGETS_2024[level][index];
  }, 0);
  const allyXp = party.reduce((sum, member) => sum + (member.type === "npc" ? monsterXp(member) : 0), 0);
  return (difficulty === "deadly" ? Math.round(total * 1.5) : total) + allyXp;
}

const monsterKey = monster => monster.uuid ?? monster.id;
const monsterIdentity = monster => String(monster.name ?? monsterKey(monster) ?? "")
  .trim().toLocaleLowerCase();
const sourceKey = monster => monster.sourceSelectorId ?? monster.sourceId ?? monster.sourceLabel ?? "unknown";

// Keep strength stable; break equally close XP tiers toward the lower tier.
function closestXpTier(monsters, target) {
  const xp = monsters.reduce((best, monster) => {
    const value = monsterXp(monster);
    const difference = Math.abs(value - target) - Math.abs(best - target);
    return difference < 0 || (difference === 0 && value < best) ? value : best;
  }, Infinity);
  return monsters.filter(monster => monsterXp(monster) === xp);
}

function variedClosest(monsters, target, random, {
  predicate = () => true,
  excluded = new Set(),
  sourceUse = new Map(),
  monsterUse = new Map()
} = {}) {
  // Variety and source balancing apply only within the best-fitting XP tier.
  const comparable = closestXpTier(monsters.filter(predicate), target)
    .filter(monster => !excluded.has(monsterKey(monster)) && !excluded.has(monsterIdentity(monster)));
  if (!comparable.length) return null;
  const leastMonsterUse = Math.min(...comparable.map(monster => monsterUse.get(monsterIdentity(monster)) ?? 0));
  const freshMonsters = comparable.filter(monster => (monsterUse.get(monsterIdentity(monster)) ?? 0) === leastMonsterUse);
  const leastSourceUse = Math.min(...freshMonsters.map(monster => sourceUse.get(sourceKey(monster)) ?? 0));
  const sourceBalanced = freshMonsters.filter(monster => (sourceUse.get(sourceKey(monster)) ?? 0) === leastSourceUse);
  const choice = sourceBalanced[Math.floor(random() * sourceBalanced.length)] ?? sourceBalanced[0];
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
  const normalizedMembers = [];
  for (const member of members) {
    if (!member) continue;
    const count = Math.floor(Number(member.count));
    if (!Number.isSafeInteger(count) || count <= 0) continue;
    normalizedMembers.push({ ...member, count, totalXp: monsterXp(member) * count });
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
  const alternatives = monsters.filter(monster => monsterXp(monster) === targetXp
    && (monster.uuid ?? monster.id) !== currentKey && !usedIdentities.has(monsterIdentity(monster)));
  if (!alternatives.length) return option;
  const replacement = alternatives[Math.floor(random() * alternatives.length)] ?? alternatives[0];
  option.members[memberIndex] = {
    ...replacement,
    count: current.count,
    totalXp: monsterXp(replacement) * current.count
  };
  option.totalXp = option.members.reduce((sum, member) => sum + member.totalXp, 0);
  option.creatureCount = option.members.reduce((sum, member) => sum + member.count, 0);
  return option;
}

// Compare the total group XP, rather than choosing a random count first.
function groupCount(monsters, budget, counts) {
  return counts.toSorted((a, b) => {
    const difference = count => Math.abs(monsterXp(closestXpTier(monsters, budget / count)[0]) * count - budget);
    return difference(a) - difference(b) || a - b;
  })[0];
}

function build(archetype, monsters, budget, random, sourceUse, monsterUse) {
  const sorted = monsters.toSorted((a, b) => monsterXp(a) - monsterXp(b));
  if (!sorted.length) return [];
  const choose = (target, options = {}) => variedClosest(sorted, target, random, { sourceUse, monsterUse, ...options });
  if (archetype === "boss") return roster([{ monster: choose(budget), count: 1 }]);
  if (archetype === "pack") {
    const desired = groupCount(sorted, budget, [4, 5, 6, 7]);
    const targetPerCreature = budget / desired;
    const monster = choose(targetPerCreature) ?? sorted[0];
    return roster([{ monster, count: desired }]);
  }
  if (archetype === "boss-minions") {
    const rawBudget = budget;
    const leader = choose(rawBudget * 0.65);
    const remaining = Math.max(10, rawBudget - monsterXp(leader));
    const leaderExcluded = new Set([monsterKey(leader), monsterIdentity(leader)]);
    const weaker = sorted.filter(candidate => monsterXp(candidate) < monsterXp(leader));
    const minionPool = weaker.length ? weaker : sorted;
    const minionCount = groupCount(minionPool, remaining, [3, 4, 5]);
    const minion = variedClosest(minionPool, remaining / minionCount, random, { sourceUse, monsterUse, excluded: leaderExcluded })
      ?? variedClosest(minionPool, remaining / minionCount, random, { sourceUse, monsterUse });
    return roster([{ monster: leader, count: 1 }, { monster: minion, count: minionCount }]);
  }
  if (archetype === "horde") {
    const count = groupCount(sorted, budget, [8, 9, MAX_ENCOUNTER_CREATURES]);
    const targetPerCreature = budget / count;
    const monster = choose(targetPerCreature) ?? sorted[0];
    return roster([{ monster, count }]);
  }
  if (archetype === "elite") {
    const desired = Math.min(5, Math.max(3, sorted.length));
    const distinct = [];
    let remaining = budget;
    for (let index = 0; index < desired; index += 1) {
      const target = remaining / (desired - index);
      const choice = choose(target, {
        excluded: new Set(distinct.flatMap(monster => [monsterKey(monster), monsterIdentity(monster)]))
      }) ?? choose(target);
      distinct.push(choice);
      remaining -= monsterXp(choice);
    }
    return roster(distinct.map(monster => ({ monster, count: 1 })));
  }
  const count = groupCount(sorted, budget, [2, 3, 4, 5, 6]);
  const choices = [];
  const selected = new Set();
  let remaining = budget;
  for (let index = 0; index < count; index += 1) {
    const target = remaining / (count - index);
    const monster = choose(target, { excluded: selected }) ?? choose(target);
    selected.add(monsterKey(monster));
    selected.add(monsterIdentity(monster));
    choices.push({ monster, count: 1 });
    remaining -= monsterXp(monster);
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

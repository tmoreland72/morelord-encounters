const XP_BY_CR = new Map([
  [0, 10], [0.125, 25], [0.25, 50], [0.5, 100], [1, 200], [2, 450], [3, 700], [4, 1100],
  [5, 1800], [6, 2300], [7, 2900], [8, 3900], [9, 5000], [10, 5900], [11, 7200], [12, 8400],
  [13, 10000], [14, 11500], [15, 13000], [16, 15000], [17, 18000], [18, 20000], [19, 22000],
  [20, 25000], [21, 33000], [22, 41000], [23, 50000], [24, 62000], [25, 75000], [26, 90000],
  [27, 105000], [28, 120000], [29, 135000], [30, 155000]
]);

const THRESHOLDS = [
  null,
  [25, 50, 75, 100], [50, 100, 150, 200], [75, 150, 225, 400], [125, 250, 375, 500],
  [250, 500, 750, 1100], [300, 600, 900, 1400], [350, 750, 1100, 1700], [450, 900, 1400, 2100],
  [550, 1100, 1600, 2400], [600, 1200, 1900, 2800], [800, 1600, 2400, 3600], [1000, 2000, 3000, 4500],
  [1100, 2200, 3400, 5100], [1250, 2500, 3800, 5700], [1400, 2800, 4300, 6400], [1600, 3200, 4800, 7200],
  [2000, 3900, 5900, 8800], [2100, 4200, 6300, 9500], [2400, 4900, 7300, 10900], [2800, 5700, 8500, 12700]
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
  const index = { easy: 0, medium: 1, hard: 2, killer: 3 }[difficulty] ?? 1;
  const total = party.reduce((sum, member) => {
    const level = Math.max(1, Math.min(20, Number(member.level) || 1));
    return sum + THRESHOLDS[level][index];
  }, 0);
  return difficulty === "killer" ? Math.round(total * 1.15) : total;
}

const monsterKey = monster => monster.uuid ?? monster.id;
const sourceKey = monster => monster.sourceSelectorId ?? monster.sourceId ?? monster.sourceLabel ?? "unknown";

function variedClosest(monsters, target, random, {
  predicate = () => true,
  preferred = () => false,
  excluded = new Set(),
  sourceUse = new Map()
} = {}) {
  const ranked = monsters
    .filter(monster => predicate(monster) && !excluded.has(monsterKey(monster)))
    .toSorted((left, right) => Math.abs(monsterXp(left) - target) - Math.abs(monsterXp(right) - target));
  if (!ranked.length) return null;

  // XP values are highly repetitive across challenge ratings. Keep every
  // comparably suitable creature in contention instead of allowing the first
  // compendium in index order to win every tie.
  const bestDifference = Math.abs(monsterXp(ranked[0]) - target);
  const tolerance = bestDifference + Math.max(25, target * 0.35);
  const comparable = ranked.filter(monster => Math.abs(monsterXp(monster) - target) <= tolerance).slice(0, 48);
  const preferredComparable = comparable.filter(preferred);
  const eligible = preferredComparable.length ? preferredComparable : comparable;
  const leastUsed = Math.min(...eligible.map(monster => sourceUse.get(sourceKey(monster)) ?? 0));
  const sourceBalanced = eligible.filter(monster => (sourceUse.get(sourceKey(monster)) ?? 0) === leastUsed);
  const choice = sourceBalanced[Math.floor(random() * sourceBalanced.length)] ?? sourceBalanced[0] ?? ranked[0];
  sourceUse.set(sourceKey(choice), (sourceUse.get(sourceKey(choice)) ?? 0) + 1);
  return choice;
}

const roster = entries => entries.filter(entry => entry.monster && entry.count > 0)
  .map(entry => ({ ...entry.monster, count: Math.min(MAX_ENCOUNTER_CREATURES, entry.count), totalXp: monsterXp(entry.monster) * Math.min(MAX_ENCOUNTER_CREATURES, entry.count) }));

export function encounterMultiplier(creatureCount) {
  if (creatureCount <= 1) return 1;
  if (creatureCount === 2) return 1.5;
  if (creatureCount <= 6) return 2;
  return 2.5;
}

export function adjustedEncounterXp(members) {
  const creatureCount = members.reduce((sum, member) => sum + member.count, 0);
  const rawXp = members.reduce((sum, member) => sum + member.totalXp, 0);
  return Math.round(rawXp * encounterMultiplier(creatureCount));
}

export function rerollEncounterMember(option, memberIndex, monsters, random = Math.random) {
  const current = option.members[memberIndex];
  if (!current) return option;
  const targetXp = monsterXp(current);
  const currentKey = current.uuid ?? current.id;
  const alternatives = monsters
    .filter(monster => (monster.uuid ?? monster.id) !== currentKey)
    .toSorted((left, right) => Math.abs(monsterXp(left) - targetXp) - Math.abs(monsterXp(right) - targetXp));
  if (!alternatives.length) return option;
  const bestDifference = Math.abs(monsterXp(alternatives[0]) - targetXp);
  const shortlist = alternatives
    .filter(monster => Math.abs(monsterXp(monster) - targetXp) <= bestDifference + Math.max(25, targetXp * 0.35))
    .slice(0, Math.min(48, alternatives.length));
  const replacement = shortlist[Math.floor(random() * shortlist.length)] ?? shortlist[0];
  option.members[memberIndex] = {
    ...replacement,
    count: current.count,
    totalXp: monsterXp(replacement) * current.count
  };
  option.totalXp = option.members.reduce((sum, member) => sum + member.totalXp, 0);
  option.adjustedXp = adjustedEncounterXp(option.members);
  option.creatureCount = option.members.reduce((sum, member) => sum + member.count, 0);
  return option;
}

function build(archetype, monsters, budget, random, sourceUse, preferred) {
  const sorted = monsters.toSorted((a, b) => monsterXp(a) - monsterXp(b));
  if (!sorted.length) return [];
  const choose = (target, options = {}) => variedClosest(sorted, target, random, { sourceUse, preferred, ...options });
  if (archetype === "boss") return roster([{ monster: choose(budget * (0.8 + random() * 0.4)), count: 1 }]);
  if (archetype === "pack") {
    const desired = 4 + Math.floor(random() * 4);
    const targetPerCreature = budget / (desired * encounterMultiplier(desired));
    const monster = choose(targetPerCreature) ?? sorted[0];
    return roster([{ monster, count: desired }]);
  }
  if (archetype === "boss-minions") {
    const minionCount = 3 + Math.floor(random() * 3);
    const multiplier = encounterMultiplier(minionCount + 1);
    const rawBudget = budget / multiplier;
    const leader = choose(rawBudget * (0.55 + random() * 0.15)) ?? sorted.at(-1);
    const remaining = Math.max(10, rawBudget - monsterXp(leader));
    const minion = choose(remaining / minionCount, {
      predicate: candidate => monsterXp(candidate) < monsterXp(leader),
      excluded: new Set([monsterKey(leader)])
    }) ?? sorted[0];
    return roster([{ monster: leader, count: 1 }, { monster: minion, count: minionCount }]);
  }
  if (archetype === "horde") {
    const count = MAX_ENCOUNTER_CREATURES;
    const targetPerCreature = budget / (count * encounterMultiplier(count));
    const monster = choose(targetPerCreature) ?? sorted[0];
    return roster([{ monster, count }]);
  }
  if (archetype === "elite") {
    const desired = Math.min(5, Math.max(3, sorted.length));
    const rawTarget = budget / (desired * encounterMultiplier(desired));
    const candidates = sorted.filter(monster => monsterXp(monster) <= rawTarget * 2.5);
    const distinct = [];
    for (let index = 0; index < desired; index += 1) {
      const target = rawTarget * (0.7 + index * 0.15 + random() * 0.2);
      const choice = variedClosest(candidates, target, random, {
        sourceUse,
        preferred,
        excluded: new Set(distinct.map(monsterKey))
      });
      if (choice) distinct.push(choice);
    }
    return roster(distinct.map(monster => ({ monster, count: 1 })));
  }
  const count = Math.max(2, Math.min(6, Math.ceil(random() * 6)));
  const choices = [];
  const selected = new Set();
  const rawTarget = budget / (count * encounterMultiplier(count));
  for (let index = 0; index < count; index += 1) {
    const monster = choose(rawTarget * (0.75 + random() * 0.5), { excluded: selected })
      ?? choose(rawTarget * (0.75 + random() * 0.5))
      ?? sorted[0];
    selected.add(monsterKey(monster));
    choices.push({ monster, count: 1 });
  }
  return roster(choices);
}

export function monsterMatchesTerrain(monster, terrain) {
  if (!terrain || terrain === "any") return true;
  const habitats = Array.isArray(monster.habitats) ? monster.habitats : [];
  if (habitats.some(habitat => ["any", terrain].includes(String(habitat?.type ?? habitat).toLowerCase()))) return true;
  return String(monster.customHabitat ?? "").toLowerCase().includes(terrain);
}

export function generateEncounterOptions({ monsters, party, difficulty, terrain = "any", random = Math.random }) {
  const budget = encounterBudget(party, difficulty);
  const sourceUse = new Map();
  const preferred = monster => monsterMatchesTerrain(monster, terrain);
  return ENCOUNTER_ARCHETYPES.map(archetype => {
    const members = build(archetype.id, monsters, budget, random, sourceUse, preferred);
    const totalXp = members.reduce((sum, member) => sum + member.totalXp, 0);
    return {
      ...archetype,
      difficulty,
      terrain,
      budget,
      members,
      totalXp,
      adjustedXp: adjustedEncounterXp(members),
      creatureCount: members.reduce((sum, member) => sum + member.count, 0)
    };
  });
}

import { isGroupSynergy, synergyProfile } from "./monster-synergy.mjs";

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
export const HORDE_CREATURE_COUNT = 10;

export function monsterXp(monster) {
  const explicit = Number(monster.xp);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return XP_BY_CR.get(Number(monster.cr)) ?? 10;
}

/**
 * Player characters only. NPC companions such as a ranger's beast add their
 * XP to the budget, but they do not take an independent turn, so they do not
 * raise the creature-count cap.
 */
export function partyCharacterCount(party) {
  const characters = (party ?? []).filter(member => member?.type !== "npc").length;
  return Math.max(1, characters);
}

/**
 * Action-economy cap. This is not an XP multiplier. Moderate stays at the
 * character count; High and Deadly may run a few creatures past it.
 */
export function maxEncounterCreatures(party, difficulty = "medium") {
  const extra = { easy: 0, medium: 0, hard: 2, deadly: 4 }[difficulty] ?? 0;
  return Math.min(MAX_ENCOUNTER_CREATURES, partyCharacterCount(party) + extra);
}

export function encounterWarnings({ partySize, members }) {
  const warnings = [];
  const roster = (members ?? []).filter(member => member && member.count > 0);
  const count = roster.reduce((sum, member) => sum + member.count, 0);
  const size = Math.max(1, Number(partySize) || 1);
  if (count > size) warnings.push({ code: "creature-count", count, partySize: size });
  let coven = 0;
  const covenNames = [];
  const stacking = new Map();
  for (const member of roster) {
    const profile = synergyProfile(member);
    if (!profile) continue;
    if (profile.coven) {
      coven += member.count;
      covenNames.push(member.name);
    }
    for (const ability of profile.abilities) {
      if (ability === "Coven") continue;
      const current = stacking.get(ability) ?? { count: 0, names: [] };
      current.count += member.count;
      current.names.push(member.name);
      stacking.set(ability, current);
    }
  }
  if (coven >= 3) warnings.push({ code: "coven", count: coven, names: [...new Set(covenNames)].filter(Boolean).join(", ") });
  for (const [ability, info] of stacking) {
    if (info.count >= 2) warnings.push({
      code: "group-synergy",
      ability,
      count: info.count,
      name: [...new Set(info.names)].filter(Boolean).join(", ")
    });
  }
  return warnings;
}

export function formatEncounterWarning(warning) {
  if (warning?.code === "creature-count") {
    return `This roster has ${warning.count} creatures against ${warning.partySize} characters. Extra turns make it harder than its XP total suggests.`;
  }
  if (warning?.code === "coven") {
    return `${warning.count} of these creatures can form a coven and share spells${warning.names ? ` (${warning.names})` : ""}. That is harder than their XP total.`;
  }
  if (warning?.code === "group-synergy") {
    return `${warning.name || "These creatures"} ${warning.count === 1 ? "has" : "have"} ${warning.ability}, which gets stronger as more of them fight together. That is harder than XP alone suggests.`;
  }
  if (warning?.code === "horde-unfilled") {
    return "The Horde is ten of one creature. None of the enabled creatures fit ten times inside the XP budget.";
  }
  return "This encounter may be harder than its XP total suggests.";
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
  const partySize = partyCharacterCount(party);
  return {
    name: "Custom Encounter",
    description: "A custom encounter assembled by the GM.",
    difficulty: encounterDifficulty(party, totalXp),
    budget: encounterBudget(party, "medium"),
    members: normalizedMembers,
    totalXp,
    partySize,
    creatureCount: normalizedMembers.reduce((sum, member) => sum + member.count, 0),
    warnings: encounterWarnings({ partySize, members: normalizedMembers })
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
    && (monster.uuid ?? monster.id) !== currentKey
    && !usedIdentities.has(monsterIdentity(monster))
    && (current.count <= 1 || !isGroupSynergy(monster)));
  if (!alternatives.length) return option;
  const replacement = alternatives[Math.floor(random() * alternatives.length)] ?? alternatives[0];
  option.members[memberIndex] = {
    ...replacement,
    count: current.count,
    totalXp: monsterXp(replacement) * current.count
  };
  option.totalXp = option.members.reduce((sum, member) => sum + member.totalXp, 0);
  option.creatureCount = option.members.reduce((sum, member) => sum + member.count, 0);
  if (option.partySize) option.warnings = encounterWarnings({ partySize: option.partySize, members: option.members });
  return option;
}

function acceptsGroupMember(monster, roster, addCount) {
  const profile = synergyProfile(monster);
  if (!profile) return true;
  if (profile.coven) {
    const existing = roster.reduce((sum, entry) => sum + (synergyProfile(entry.monster)?.coven ? entry.count : 0), 0);
    return existing + addCount < 3;
  }
  if (addCount > 1) return false;
  return !roster.some(entry => {
    const other = synergyProfile(entry.monster);
    return other?.abilities.some(ability => ability !== "Coven" && profile.abilities.includes(ability));
  });
}

function countsBetween(minCount, maxCount, cap) {
  const hi = Math.max(1, Math.min(maxCount, cap));
  const lo = Math.max(1, Math.min(minCount, hi));
  return Array.from({ length: hi - lo + 1 }, (_, index) => lo + index);
}

// Legal count/CR pairs at or under the XP budget, near the best fit, and never past the cap.
function groupOptions(monsters, budget, counts) {
  const options = [];
  const seen = new Set();
  for (const count of counts) {
    for (const monster of monsters) {
      const xp = monsterXp(monster);
      const total = xp * count;
      if (total <= 0 || total > budget) continue;
      const key = `${count}:${xp}`;
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({ count, xp, total });
    }
  }
  if (!options.length) return [];
  const best = Math.max(...options.map(option => option.total));
  const near = options.filter(option => option.total >= best * 0.6);
  return near.length ? near : options;
}

function pickHomogeneousGroup(sorted, budget, random, choose, { cap, minCount, maxCount, blockSynergy, preferWeak }) {
  const pool = blockSynergy ? sorted.filter(monster => !isGroupSynergy(monster)) : sorted;
  const options = groupOptions(pool, budget, countsBetween(minCount, maxCount, cap));
  let candidates = options;
  if (preferWeak && candidates.length > 1) {
    const strengths = candidates.map(option => option.xp).toSorted((left, right) => left - right);
    const midpoint = strengths[Math.floor((strengths.length - 1) / 2)];
    const weaker = candidates.filter(option => option.xp <= midpoint);
    if (weaker.length) candidates = weaker;
  }
  if (!candidates.length) {
    const soloPool = pool.length ? pool : sorted;
    const monster = choose(budget, { predicate: candidate => soloPool.includes(candidate) }) ?? soloPool[0] ?? sorted[0];
    return monster ? [{ monster, count: 1 }] : [];
  }
  const choice = candidates[Math.floor(random() * candidates.length)] ?? candidates[0];
  const monster = choose(choice.xp, {
    predicate: candidate => monsterXp(candidate) === choice.xp && (!blockSynergy || !isGroupSynergy(candidate))
  }) ?? pool.find(candidate => monsterXp(candidate) === choice.xp) ?? pool[0];
  return monster ? [{ monster, count: choice.count }] : [];
}

function pickDistinct(sorted, budget, random, choose, { count, cap }) {
  const desired = Math.max(1, Math.min(count, cap));
  const distinct = [];
  let remaining = budget;
  for (let index = 0; index < desired; index += 1) {
    const slotsLeft = desired - index;
    const target = Math.max(10, remaining / slotsLeft);
    const excluded = new Set(distinct.flatMap(entry => [monsterKey(entry.monster), monsterIdentity(entry.monster)]));
    const choice = choose(target, {
      excluded,
      predicate: monster => acceptsGroupMember(monster, distinct, 1)
        && (distinct.length === 0 || monsterXp(monster) <= remaining)
    }) ?? (distinct.length === 0 ? choose(target, { predicate: monster => acceptsGroupMember(monster, distinct, 1) }) : null);
    if (!choice) break;
    if (distinct.length && monsterXp(choice) > remaining) break;
    distinct.push({ monster: choice, count: 1 });
    remaining -= monsterXp(choice);
  }
  return distinct;
}

function pickAny(monsters, random, sourceUse, monsterUse) {
  if (!monsters.length) return null;
  const leastMonsterUse = Math.min(...monsters.map(monster => monsterUse.get(monsterIdentity(monster)) ?? 0));
  const fresh = monsters.filter(monster => (monsterUse.get(monsterIdentity(monster)) ?? 0) === leastMonsterUse);
  const leastSourceUse = Math.min(...fresh.map(monster => sourceUse.get(sourceKey(monster)) ?? 0));
  const balanced = fresh.filter(monster => (sourceUse.get(sourceKey(monster)) ?? 0) === leastSourceUse);
  const choice = balanced[Math.floor(random() * balanced.length)] ?? balanced[0];
  sourceUse.set(sourceKey(choice), (sourceUse.get(sourceKey(choice)) ?? 0) + 1);
  monsterUse.set(monsterIdentity(choice), (monsterUse.get(monsterIdentity(choice)) ?? 0) + 1);
  return choice;
}

// The Horde is always ten copies of one stat block, outside the party-size cap.
function buildHorde(monsters, budget, random, sourceUse, monsterUse) {
  const eligible = monsters.filter(monster => !isGroupSynergy(monster)
    && monsterXp(monster) > 0
    && monsterXp(monster) * HORDE_CREATURE_COUNT <= budget);
  const monster = pickAny(eligible, random, sourceUse, monsterUse);
  if (!monster) return { members: [], unfilled: true };
  return { members: roster([{ monster, count: HORDE_CREATURE_COUNT }]), unfilled: false };
}

function build(archetype, monsters, budget, random, sourceUse, monsterUse, cap) {
  const sorted = monsters.toSorted((a, b) => monsterXp(a) - monsterXp(b));
  if (!sorted.length) return [];
  const choose = (target, options = {}) => variedClosest(sorted, target, random, { sourceUse, monsterUse, ...options });
  if (archetype === "boss") return roster([{ monster: choose(budget), count: 1 }]);
  if (archetype === "pack") {
    return roster(pickHomogeneousGroup(sorted, budget, random, choose, {
      cap,
      minCount: 2,
      maxCount: cap,
      blockSynergy: true,
      preferWeak: false
    }));
  }
  if (archetype === "boss-minions") {
    const affordable = sorted.filter(monster => monsterXp(monster) <= budget);
    const leader = (affordable.length ? choose(budget * 0.65, { predicate: monster => monsterXp(monster) <= budget }) : null)
      ?? choose(budget);
    const leaderXp = monsterXp(leader);
    const remaining = budget - leaderXp;
    const maxMinions = Math.max(0, cap - 1);
    if (maxMinions < 1 || remaining <= 0) return roster([{ monster: leader, count: 1 }]);
    const leaderExcluded = new Set([monsterKey(leader), monsterIdentity(leader)]);
    const minionPool = sorted.filter(candidate => monsterXp(candidate) < leaderXp
      && !leaderExcluded.has(monsterKey(candidate))
      && !leaderExcluded.has(monsterIdentity(candidate))
      && acceptsGroupMember(candidate, [{ monster: leader, count: 1 }], 1));
    const pool = minionPool.length ? minionPool : sorted.filter(candidate => !leaderExcluded.has(monsterIdentity(candidate))
      && acceptsGroupMember(candidate, [{ monster: leader, count: 1 }], 1));
    const minions = pickHomogeneousGroup(pool.length ? pool : sorted, remaining, random, (target, options = {}) => variedClosest(pool.length ? pool : sorted, target, random, { sourceUse, monsterUse, ...options }), {
      cap: maxMinions,
      minCount: 1,
      maxCount: Math.min(4, maxMinions),
      blockSynergy: true,
      preferWeak: false
    });
    const minion = minions[0];
    const minionXp = minion ? monsterXp(minion.monster) * minion.count : Infinity;
    if (!minion || minionXp > remaining || !acceptsGroupMember(minion.monster, [{ monster: leader, count: 1 }], minion.count)) {
      return roster([{ monster: leader, count: 1 }]);
    }
    return roster([{ monster: leader, count: 1 }, minion]);
  }
  const span = archetype === "elite" ? Math.min(5, cap) : Math.min(6, cap);
  const count = span <= 1 ? 1 : (archetype === "elite"
    ? 2 + Math.floor(random() * Math.max(1, span - 1))
    : 2 + Math.floor(random() * Math.max(1, span - 1)));
  return roster(pickDistinct(sorted, budget, random, choose, { count: Math.min(count, cap), cap }));
}

export function generateEncounterOptions({ monsters, party, difficulty, random = Math.random }) {
  const budget = encounterBudget(party, difficulty);
  const partySize = partyCharacterCount(party);
  const cap = maxEncounterCreatures(party, difficulty);
  const sourceUse = new Map();
  const monsterUse = new Map();
  return ENCOUNTER_ARCHETYPES.map(archetype => {
    const horde = archetype.id === "horde"
      ? buildHorde(monsters, budget, random, sourceUse, monsterUse)
      : null;
    const members = horde ? horde.members : build(archetype.id, monsters, budget, random, sourceUse, monsterUse, cap);
    const totalXp = members.reduce((sum, member) => sum + member.totalXp, 0);
    const warnings = encounterWarnings({ partySize, members })
      .filter(warning => archetype.id !== "horde" || warning.code !== "creature-count");
    if (horde?.unfilled) warnings.push({ code: "horde-unfilled" });
    return {
      ...archetype,
      difficulty,
      budget,
      partySize,
      creatureCap: cap,
      members,
      totalXp,
      creatureCount: members.reduce((sum, member) => sum + member.count, 0),
      warnings
    };
  });
}

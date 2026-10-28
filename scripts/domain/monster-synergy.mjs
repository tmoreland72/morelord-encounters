const textOf = value => String(value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function featureEntries(monster) {
  const entries = [];
  const push = (name, description) => {
    const title = textOf(name);
    const body = textOf(description);
    if (title || body) entries.push({ name: title, text: [title, body].filter(Boolean).join("\n") });
  };
  const listed = monster?.features ?? monster?.traits ?? [];
  const list = typeof listed === "string" ? [listed] : listed;
  for (const feature of list ?? []) {
    if (typeof feature === "string") push(feature, "");
    else push(feature?.name, feature?.description?.value ?? feature?.description ?? feature?.text ?? feature?.system?.description?.value);
  }
  const items = monster?.items;
  if (items) {
    for (const item of Array.isArray(items) ? items : Object.values(items)) {
      if (!item || typeof item === "string") {
        push(item, "");
        continue;
      }
      push(item.name, item.system?.description?.value ?? item.description);
    }
  }
  return entries;
}

/**
 * Group abilities that make several copies harder than their XP.
 * Detection uses trait names and text carried on the monster, not a
 * creature-name list. 2024 encounter budgets are not multiplied.
 */
export function synergyProfile(monster) {
  const entries = featureEntries(monster);
  const abilities = [];
  const blob = entries.map(entry => entry.text).join("\n");
  if (/\bcoven\b/i.test(blob) || /at least two hag allies/i.test(blob) || /two other hags/i.test(blob)) {
    abilities.push("Coven");
  }
  if (/\bpack tactics\b/i.test(blob) || /advantage on (?:an |a )?attack roll against a creature if at least one of[\s\S]{0,160}allies is within 5 feet/i.test(blob)) {
    abilities.push("Pack Tactics");
  }
  if (/\bdeath glare\b/i.test(blob) || (/if the target is already/i.test(blob) && /0 hit points/i.test(blob))) {
    abilities.push("Death Glare");
  }
  if (entries.some(entry => /\baura\b/i.test(entry.name))) abilities.push("Aura");
  const unique = [...new Set(abilities)];
  if (!unique.length) return null;
  return {
    coven: unique.includes("Coven"),
    abilities: unique,
    excludedFromGroups: true
  };
}

export function isGroupSynergy(monster) {
  return Boolean(synergyProfile(monster));
}

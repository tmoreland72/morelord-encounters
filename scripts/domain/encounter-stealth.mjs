export function monsterStealthModifier(system = {}) {
  const explicit = Number(system.skills?.ste?.mod);
  if (Number.isFinite(explicit)) return explicit;

  const dexterity = Number(system.abilities?.dex?.value);
  const dexterityModifier = Number.isFinite(dexterity) ? Math.floor((dexterity - 10) / 2) : 0;
  const proficiency = Number(system.attributes?.prof);
  const multiplier = Number(system.skills?.ste?.value ?? system.skills?.ste?.proficient ?? 0);
  return dexterityModifier + (Number.isFinite(proficiency) && Number.isFinite(multiplier)
    ? Math.floor(proficiency * multiplier)
    : 0);
}

export function lowestEncounterStealth(encounter) {
  return encounter.members.reduce((lowest, member) => {
    const modifier = Number(member.stealthModifier);
    if (!Number.isFinite(modifier)) return lowest;
    return !lowest || modifier < lowest.modifier ? { modifier, name: member.name } : lowest;
  }, null);
}

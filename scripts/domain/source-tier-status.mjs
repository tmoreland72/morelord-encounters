export function sourceIdentityIds(source) {
  return [source?.id, source?.packId, ...(source?.packIds ?? [])].filter(Boolean);
}

/** Ids the GM has actually saved. Packs that are not currently available are dropped. */
export function explicitSelectedSourceIds(available, remembered) {
  const allowed = new Set((available ?? []).flatMap(sourceIdentityIds));
  return [...new Set((remembered ?? []).filter(id => allowed.has(id)))];
}

/**
 * Checkbox state for Encounter Source. A remembered id that is no longer
 * available (for example a system pack dnd5e Configure Sources turned off)
 * is not reintroduced. Content tier never adds packs by itself.
 */
export function initialSelectedSourceIds(available, remembered) {
  const explicit = explicitSelectedSourceIds(available, remembered);
  return explicit.length ? explicit : (available ?? []).map(source => source.id).filter(Boolean);
}

export function sourceIsSelected(source, selectedIds) {
  const selected = new Set(selectedIds ?? []);
  return sourceIdentityIds(source).some(id => selected.has(id));
}

/**
 * Monster Sources badges.
 * Available = licensed. Enabled = at least one of that tier's books is
 * selected in Encounter Source. Access Required = the tier is not licensed.
 */
export function sourceTierBadges({ licensed, sources, selectedIds }) {
  if (!licensed) return [{ text: "Access Required", tone: "warning" }];
  const enabled = (sources ?? []).some(source => sourceIsSelected(source, selectedIds));
  if (enabled) return [{ text: "Enabled", tone: "enabled" }];
  return [
    { text: "Available", tone: "success" },
    { text: "Not enabled", tone: "muted" }
  ];
}

export const CUSTOM_MONSTER_FACETS = Object.freeze(["type", "size", "terrain", "source"]);

export function createFacetState(groups = CUSTOM_MONSTER_FACETS) {
  return Object.fromEntries(groups.map(group => [group, { include: new Set(), exclude: new Set() }]));
}

export function cycleFacetState(state, value) {
  if (!state || !value) return "none";
  if (state.include.has(value)) {
    state.include.delete(value);
    state.exclude.add(value);
    return "exclude";
  }
  if (state.exclude.has(value)) {
    state.exclude.delete(value);
    return "none";
  }
  state.include.add(value);
  return "include";
}

export function matchesFacet(state, values = []) {
  if (!state) return true;
  const normalized = new Set(values.filter(Boolean));
  if ([...state.exclude].some(value => normalized.has(value))) return false;
  return !state.include.size || [...state.include].some(value => normalized.has(value));
}

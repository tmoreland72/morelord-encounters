import { DIFFICULTIES } from "./constants.mjs";

export const ENCOUNTER_TERRAINS = Object.freeze([
  "any", "arctic", "coastal", "desert", "forest", "grassland", "hill",
  "mountain", "planar", "swamp", "underdark", "underwater", "urban"
]);

export function normalizeEncounterConfiguration(value = {}) {
  const difficulty = DIFFICULTIES.includes(value.difficulty) ? value.difficulty : "medium";
  const terrain = ENCOUNTER_TERRAINS.includes(value.terrain) ? value.terrain : "any";
  const sourceIds = [...new Set(Array.isArray(value.sourceIds)
    ? value.sourceIds.map(String).map(id => id.trim()).filter(Boolean)
    : [])];
  const partyUuids = [...new Set(Array.isArray(value.partyUuids)
    ? value.partyUuids.map(String).map(uuid => uuid.trim()).filter(Boolean)
    : [])];
  return { difficulty, terrain, sourceIds, partyUuids };
}

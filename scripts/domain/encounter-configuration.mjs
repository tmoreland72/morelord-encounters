import { DIFFICULTIES } from "./constants.mjs";

export function normalizeEncounterConfiguration(value = {}) {
  const difficulty = DIFFICULTIES.includes(value.difficulty) ? value.difficulty : "medium";
  const sourceIds = [...new Set(Array.isArray(value.sourceIds)
    ? value.sourceIds.map(String).map(id => id.trim()).filter(Boolean)
    : [])];
  const partyUuids = [...new Set(Array.isArray(value.partyUuids)
    ? value.partyUuids.map(String).map(uuid => uuid.trim()).filter(Boolean)
    : [])];
  return { difficulty, sourceIds, partyUuids };
}

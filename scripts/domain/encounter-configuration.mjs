import { DIFFICULTIES, ENCOUNTER_SOURCES } from "./constants.mjs";

export function normalizeEncounterConfiguration(value = {}) {
  const requestedDifficulty = value.difficulty === "killer" ? "hard" : value.difficulty;
  const difficulty = DIFFICULTIES.includes(requestedDifficulty) ? requestedDifficulty : "medium";
  const sourceIds = [...new Set(Array.isArray(value.sourceIds)
    ? value.sourceIds.map(String).map(id => id.trim()).filter(Boolean)
    : [])];
  const partyUuids = [...new Set(Array.isArray(value.partyUuids)
    ? value.partyUuids.map(String).map(uuid => uuid.trim()).filter(Boolean)
    : [])];
  const drakkenheimTableId = String(value.drakkenheimTableId ?? "").trim();
  const requestedSource = String(value.encounterSource ?? "").trim();
  const encounterSource = ENCOUNTER_SOURCES.includes(requestedSource)
    ? requestedSource
    : (drakkenheimTableId ? "drakkenheim" : "monster-compendiums");
  return { difficulty, sourceIds, partyUuids, encounterSource, drakkenheimTableId };
}

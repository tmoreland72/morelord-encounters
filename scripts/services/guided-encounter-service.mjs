import { MODULE_ID } from "../domain/constants.mjs";
import { generateGuidedEncounter, GUIDED_SITUATIONS } from "../domain/guided-encounters.mjs";

export const GUIDED_HISTORY_SETTING = "recentGuidedSituations";

// Only original template IDs are stored; edited scenes remain private journal snapshots.
export async function generateRememberedGuidedEncounter(guidance, options = {}) {
  const stored = game.settings.get(MODULE_ID, GUIDED_HISTORY_SETTING);
  const validIds = new Set(GUIDED_SITUATIONS.map(seed => seed.id));
  const recentIds = Array.isArray(stored) ? [...new Set(stored.filter(id => validIds.has(id)))] : [];
  const encounter = generateGuidedEncounter(guidance, { ...options, recentIds });
  await game.settings.set(MODULE_ID, GUIDED_HISTORY_SETTING,
    [encounter.seedId, ...recentIds.filter(id => id !== encounter.seedId)]);
  return encounter;
}

import { getCoreApi } from "../core/core-api.mjs";

/**
 * Primary pack filter for every Encounters lookup.
 *
 * dnd5e's Configure Sources setting decides which compendiums exist for this
 * world. Encounter Source selection is a second filter applied by callers
 * inside that set. A pack rejected here must not be listed, offered by a
 * content tier, loaded, or used as a fallback.
 *
 * TODO: Morelord Core is adding the shared dnd5e 6.x helper
 * (`sources.isPackEnabled`) in its own PR. That helper owns
 * `packSourceConfiguration` and the Compendium Browser rules. Call it here
 * and delete the interim boolean check once Core exports it. Do not grow a
 * second parser of that setting in Encounters.
 */
export function isSystemPackEnabled(pack) {
  const helper = getCoreApi()?.sources?.isPackEnabled;
  if (typeof helper === "function") return helper(pack) !== false;
  try {
    const config = globalThis.game?.settings?.get?.("dnd5e", "packSourceConfiguration") ?? {};
    const id = pack?.collection ?? pack?.metadata?.id ?? "";
    return config?.[id] !== false;
  } catch {
    return true;
  }
}

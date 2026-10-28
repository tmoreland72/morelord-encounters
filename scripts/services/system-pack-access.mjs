import { getCoreApi } from "../core/core-api.mjs";
import { packIdFromCompendiumUuid } from "./encounter-monster-pool.mjs";

/** Fired by Morelord Core when Configure Sources or the rules version changes. */
export const CONFIGURE_SOURCES_CHANGED = "morelordCoreConfigureSourcesChanged";

function coreSources() {
  return getCoreApi()?.sources ?? null;
}

/**
 * Primary pack filter for every Encounters lookup.
 *
 * Prefer Core's Configure Sources API (`sources.isSourceAllowed`). The boolean
 * `packSourceConfiguration` check is only the fallback when that API is absent.
 * Encounter Source selection is a second filter applied by callers. A pack
 * rejected here must not be listed, offered by a content tier, loaded, or
 * used as a fallback.
 */
export function isSystemPackEnabled(pack) {
  const allowed = coreSources()?.isSourceAllowed;
  if (typeof allowed === "function") return allowed(pack) !== false;
  try {
    const config = globalThis.game?.settings?.get?.("dnd5e", "packSourceConfiguration") ?? {};
    const id = pack?.collection ?? pack?.metadata?.id ?? (typeof pack === "string" ? pack : "");
    return config?.[id] !== false;
  } catch {
    return true;
  }
}

/** Compendium UUIDs follow Core's pack rule. Other UUIDs stay allowed. */
export function isEncounterUuidAllowed(uuid) {
  const allowed = coreSources()?.isUuidAllowed;
  if (typeof allowed === "function") return allowed(uuid) !== false;
  const packId = packIdFromCompendiumUuid(uuid);
  if (!packId) return Boolean(String(uuid ?? "").trim());
  const pack = globalThis.game?.packs?.get?.(packId) ?? { collection: packId };
  return isSystemPackEnabled(pack);
}

/** Actor packs Core allows, or every Actor pack that passes the fallback filter. */
export function allowedActorPacks(packs = globalThis.game?.packs) {
  const list = coreSources()?.getAllowedPacks;
  if (typeof list === "function") return list({ documentName: "Actor" }) ?? [];
  return [...new Map(Array.from(packs ?? [])
    .filter(pack => pack?.documentName === "Actor" && isSystemPackEnabled(pack))
    .map(pack => [pack.collection, pack])).values()];
}

const refreshBinding = Symbol.for("morelord-encounters.configureSourcesRefresh");

export function registerConfigureSourcesRefresh(hooks = globalThis.Hooks, refresh = () => {}) {
  if (!hooks?.on || hooks[refreshBinding]) return false;
  hooks[refreshBinding] = true;
  hooks.on(CONFIGURE_SOURCES_CHANGED, () => { void refresh(); });
  return true;
}

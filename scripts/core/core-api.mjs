export const CORE_MODULE_ID = "morelord-core";

export function getCoreApi() {
  const coreModule = globalThis.game?.modules?.get?.(CORE_MODULE_ID);
  if (coreModule?.active === false) return null;
  return coreModule?.api ?? globalThis.MorelordCore ?? null;
}

export function resolveCoreBookLabel({ book = "", pack = null } = {}) {
  return getCoreApi()?.sources?.resolveBookLabel?.({ book, pack }) ?? String(book ?? "").trim();
}

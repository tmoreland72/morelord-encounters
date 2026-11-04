import { MODULE_ID } from "../domain/constants.mjs";

export function publishEncounterApi(open, game = globalThis.game) {
  const api = { open };
  game.modules.get(MODULE_ID).api = api;
  globalThis.MorelordEncounters = api;
  return api;
}

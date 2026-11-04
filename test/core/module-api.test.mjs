import assert from "node:assert/strict";
import test from "node:test";
import { publishEncounterApi } from "../../scripts/core/module-api.mjs";

test("api.open is the encounter builder opener", () => {
  const calls = [];
  const configureEncounter = options => {
    calls.push(options);
    return "configure-encounter";
  };
  const module = {};
  const game = { modules: new Map([["morelord-encounters", module]]) };
  const previous = globalThis.MorelordEncounters;
  try {
    const api = publishEncounterApi(configureEncounter, game);
    assert.equal(typeof api.open, "function");
    assert.equal(api.open, configureEncounter);
    assert.equal(module.api, api);
    assert.equal(globalThis.MorelordEncounters, api);
    assert.equal(api.open(), "configure-encounter");
    assert.deepEqual(calls, [undefined]);
  } finally {
    if (previous === undefined) delete globalThis.MorelordEncounters;
    else globalThis.MorelordEncounters = previous;
  }
});

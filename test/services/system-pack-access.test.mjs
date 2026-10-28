import assert from "node:assert/strict";
import test from "node:test";
import {
  CONFIGURE_SOURCES_CHANGED,
  allowedActorPacks,
  isEncounterUuidAllowed,
  isSystemPackEnabled,
  registerConfigureSourcesRefresh
} from "../../scripts/services/system-pack-access.mjs";

test("prefers Core isSourceAllowed over the boolean Configure Sources setting", () => {
  const srd = { collection: "dnd5e.monsters", documentName: "Actor" };
  const book = { collection: "faerun.actors", documentName: "Actor" };
  globalThis.game = {
    modules: new Map([["morelord-core", { active: true, api: { sources: {
      isSourceAllowed: pack => (pack?.collection ?? pack) !== "dnd5e.monsters",
      isUuidAllowed: uuid => !String(uuid).includes("dnd5e.monsters"),
      getAllowedPacks: () => [book]
    } } }]]),
    settings: { get: () => ({ "dnd5e.monsters": true, "faerun.actors": false }) },
    packs: [srd, book]
  };
  try {
    assert.equal(isSystemPackEnabled(srd), false);
    assert.equal(isSystemPackEnabled(book), true);
    assert.equal(isEncounterUuidAllowed("Compendium.dnd5e.monsters.Actor.srdMage"), false);
    assert.equal(isEncounterUuidAllowed("Compendium.faerun.actors.ogre-zombie"), true);
    assert.equal(isEncounterUuidAllowed("Actor.jasper"), true);
    assert.deepEqual(allowedActorPacks().map(pack => pack.collection), ["faerun.actors"]);
  } finally {
    delete globalThis.game;
  }
});

test("falls back to the boolean setting only when Core's source API is absent", () => {
  const srd = { collection: "dnd5e.monsters", documentName: "Actor" };
  const book = { collection: "faerun.actors", documentName: "Actor" };
  globalThis.MorelordCore = { sources: { resolveBookLabel: () => "" } };
  globalThis.game = {
    modules: new Map(),
    settings: { get: () => ({ "dnd5e.monsters": false }) },
    packs: [srd, book]
  };
  try {
    assert.equal(isSystemPackEnabled(srd), false);
    assert.equal(isSystemPackEnabled(book), true);
    assert.equal(isEncounterUuidAllowed("Compendium.dnd5e.monsters.Actor.srdMage"), false);
    assert.equal(isEncounterUuidAllowed("Actor.jasper"), true);
    game.settings.get = () => ({});
    assert.equal(isSystemPackEnabled(srd), true);
    assert.deepEqual(allowedActorPacks().map(pack => pack.collection), ["dnd5e.monsters", "faerun.actors"]);
  } finally {
    delete globalThis.game;
    delete globalThis.MorelordCore;
  }
});

test("refreshes open lists when Core fires the Configure Sources hook", () => {
  const hooks = { handlers: [], on(name, handler) { this.handlers.push([name, handler]); } };
  let refreshes = 0;
  assert.equal(registerConfigureSourcesRefresh(hooks, () => { refreshes += 1; }), true);
  assert.equal(registerConfigureSourcesRefresh(hooks, () => { refreshes += 1; }), false);
  assert.deepEqual(hooks.handlers.map(([name]) => name), [CONFIGURE_SOURCES_CHANGED]);
  hooks.handlers[0][1]();
  assert.equal(refreshes, 1);
});

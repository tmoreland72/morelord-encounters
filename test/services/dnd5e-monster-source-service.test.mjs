import assert from "node:assert/strict";
import test from "node:test";
import { Dnd5eMonsterSourceService } from "../../scripts/services/dnd5e-monster-source-service.mjs";

test("monster sources tolerate null source-book metadata", async () => {
  globalThis.CONFIG = { DND5E: { sourceBooks: { thirdparty: null } } };
  globalThis.game = {
    packs: [{
      collection: "example.monsters",
      documentName: "Actor",
      title: "Example Monsters",
      metadata: { sourceBook: "thirdparty", label: "Example Monsters", packageName: "example" },
      getIndex: async () => []
    }],
    settings: { get: () => ({}) },
    system: { id: "dnd5e", title: "D&D 5e", config: { sourceBooks: { thirdparty: null } } },
    modules: new Map(),
    i18n: { localize: value => value }
  };
  assert.deepEqual(await new Dnd5eMonsterSourceService().availableSources(), [
    { id: "example.monsters", packId: "example.monsters", book: "", label: "Example Monsters", packLabel: "Example Monsters", packageName: "example", img: "" }
  ]);
  delete globalThis.CONFIG;
  delete globalThis.game;
});

test("source selectors expose their localized compendium names", async () => {
  globalThis.CONFIG = { DND5E: { sourceBooks: { RAVEN: "Ravenloft: The Horrors Within" } } };
  const bestiary = {
    collection: "ravenloft.actors",
    documentName: "Actor",
    title: "Actors",
    metadata: { label: "Bestiary", packageName: "ravenloft" },
    getIndex: async () => [{ system: { source: { book: "RAVEN" } } }]
  };
  const fallback = {
    collection: "ravenloft.fallback-actors",
    documentName: "Actor",
    title: "Actors",
    metadata: { label: "Adventure Bestiary", packageName: "ravenloft" },
    getIndex: async () => [{ system: { source: { book: "RAVEN" } } }]
  };
  globalThis.game = {
    packs: [bestiary, fallback],
    settings: { get: () => ({}) },
    system: { id: "dnd5e", title: "D&D 5e", config: { sourceBooks: {} } },
    modules: new Map([["ravenloft", { title: "Ravenloft: The Horrors Within" }]]),
    i18n: { localize: value => value }
  };
  const sources = await new Dnd5eMonsterSourceService().availableSources();
  assert.deepEqual(sources.map(source => source.packLabel).sort(), ["Adventure Bestiary", "Bestiary"]);
  delete globalThis.CONFIG;
  delete globalThis.game;
});

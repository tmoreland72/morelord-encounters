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

test("consolidates inconsistent creature book aliases when a module declares one source book", async () => {
  globalThis.CONFIG = { DND5E: { sourceBooks: {} } };
  const creatures = {
    collection: "kp-tome-of-beasts-1-2023.tob-1-2023-creatures",
    documentName: "Actor",
    title: "Creatures",
    metadata: { label: "Creatures", packageName: "kp-tome-of-beasts-1-2023" },
    getIndex: async () => [
      { system: { source: { book: "Tome of Beasts" } } },
      { system: { source: { book: "Tome of Beasts 1 2023" } } },
      { system: { source: { book: "ToB1-2023" } } }
    ]
  };
  globalThis.game = {
    packs: [creatures],
    settings: { get: () => ({}) },
    system: { id: "dnd5e", title: "D&D 5e", config: { sourceBooks: {} } },
    modules: new Map([["kp-tome-of-beasts-1-2023", {
      title: "Tome of Beasts I (2023 Edition)",
      flags: { dnd5e: { sourceBooks: { "ToB1-2023": "Tome of Beasts 1 2023 Edition" } } }
    }]]),
    i18n: { localize: value => value }
  };
  assert.deepEqual(await new Dnd5eMonsterSourceService().availableSources(), [{
    id: creatures.collection,
    packId: creatures.collection,
    book: "",
    label: "Tome of Beasts I (2023 Edition)",
    packLabel: "Creatures",
    packageName: "kp-tome-of-beasts-1-2023",
    img: ""
  }]);
  delete globalThis.CONFIG;
  delete globalThis.game;
});

test("preserves book-level selectors for modules declaring multiple source books", async () => {
  globalThis.CONFIG = { DND5E: { sourceBooks: { ONE: "Book One", TWO: "Book Two" } } };
  const creatures = {
    collection: "anthology.creatures",
    documentName: "Actor",
    title: "Creatures",
    metadata: { label: "Creatures", packageName: "anthology" },
    getIndex: async () => [
      { system: { source: { book: "ONE" } } },
      { system: { source: { book: "TWO" } } }
    ]
  };
  globalThis.game = {
    packs: [creatures],
    settings: { get: () => ({}) },
    system: { id: "dnd5e", title: "D&D 5e", config: { sourceBooks: {} } },
    modules: new Map([["anthology", {
      title: "Anthology",
      flags: { dnd5e: { sourceBooks: { ONE: "Book One", TWO: "Book Two" } } }
    }]]),
    i18n: { localize: value => value }
  };
  const sources = await new Dnd5eMonsterSourceService().availableSources();
  assert.deepEqual(sources.map(source => source.label), ["Book One", "Book Two"]);
  delete globalThis.CONFIG;
  delete globalThis.game;
});

test("collapses book aliases that render as one source into one compendium selector", async () => {
  globalThis.CONFIG = { DND5E: { sourceBooks: { MM: "Monster Manual", PHB: "Player's Handbook" } } };
  const bestiary = {
    collection: "heliannas.bestiary",
    documentName: "Actor",
    title: "Bestiary",
    metadata: { label: "Bestiary", packageName: "heliannas" },
    getIndex: async () => [
      { system: { source: { book: "MM" } } },
      { system: { source: { book: "PHB" } } }
    ]
  };
  globalThis.game = {
    packs: [bestiary, bestiary],
    settings: { get: () => ({}) },
    system: { id: "dnd5e", title: "D&D 5e", config: { sourceBooks: {} } },
    modules: new Map([["heliannas", { title: "Heliana's Guide to Monster Hunting" }]]),
    i18n: { localize: value => value }
  };
  const sources = await new Dnd5eMonsterSourceService().availableSources();
  assert.equal(sources.length, 1);
  assert.equal(sources[0].id, bestiary.collection);
  assert.equal(sources[0].label, "Heliana's Guide to Monster Hunting");
  delete globalThis.CONFIG;
  delete globalThis.game;
});

test("excludes actor compendiums disabled in dnd5e source settings", async () => {
  globalThis.CONFIG = { DND5E: { sourceBooks: {} } };
  const srd = {
    collection: "dnd5e.monsters",
    documentName: "Actor",
    metadata: { label: "SRD 5.1", packageName: "dnd5e" },
    getIndex: async () => []
  };
  globalThis.game = {
    packs: [srd],
    settings: { get: () => ({ "dnd5e.monsters": false }) },
    system: { id: "dnd5e", title: "D&D 5e", config: { sourceBooks: {} } },
    modules: new Map(),
    i18n: { localize: value => value }
  };
  assert.deepEqual(await new Dnd5eMonsterSourceService().availableSources(), []);
  delete globalThis.CONFIG;
  delete globalThis.game;
});

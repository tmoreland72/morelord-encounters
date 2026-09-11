import assert from "node:assert/strict";
import test from "node:test";
import { Dnd5eMonsterSourceService } from "../../scripts/services/dnd5e-monster-source-service.mjs";
import { Dnd5eMonsterCatalogService } from "../../scripts/services/dnd5e-monster-catalog-service.mjs";
import { CoreAccessService } from "../../scripts/services/core-access-service.mjs";

globalThis.MorelordCore = { sources: { resolveBookLabel: ({ book = "", pack = null }) => {
  const configured = globalThis.CONFIG?.DND5E?.sourceBooks?.[book]
    ?? globalThis.game?.system?.config?.sourceBooks?.[book];
  const label = configured && typeof configured === "object"
    ? configured.label ?? configured.name ?? configured.title
    : configured;
  return globalThis.game?.i18n?.localize?.(label ?? book)
    || String(pack?.metadata?.label ?? pack?.title ?? pack?.collection ?? "");
} } };

test("Standard mode selects both complete SRD packs with consistent catalog labels", async () => {
  const previousCore = globalThis.MorelordCore;
  const labels = {
    "dnd5e.monsters": "System Reference Document 5.1",
    "dnd5e.actors24": "System Reference Document 5.2"
  };
  // Match Core's pack-aware resolver; legacy actor metadata must not decide the edition.
  globalThis.MorelordCore = { sources: { resolveBookLabel: ({ book, pack }) => labels[pack?.collection] || book } };
  const packs = Object.keys(labels).map(collection => ({
    collection,
    documentName: "Actor",
    metadata: { packageName: "dnd5e", label: collection.endsWith("actors24") ? "Actors" : "Monsters (SRD)" },
    getIndex: async () => [
      { _id: "wolf", name: "Wolf", type: "npc", system: { details: { cr: 0.25 } } },
      { _id: "legacy", name: "Legacy", type: "npc", system: { source: { book: "Free Rules" }, details: { cr: 1 } } }
    ]
  }));
  globalThis.game = {
    packs: { [Symbol.iterator]: () => packs.values(), get: id => packs.find(pack => pack.collection === id) },
    modules: new Map(),
    system: { id: "dnd5e", title: "D&D" },
    settings: { get: () => ({}) },
    i18n: { localize: value => value }
  };
  try {
    const sources = await new Dnd5eMonsterSourceService().availableSources();
    assert.deepEqual(sources.map(source => source.label), Object.values(labels));
    assert.ok(sources.every(source => !source.book && new CoreAccessService().canUseSource(source, { standard: true, premium: false })));
    const monsters = await new Dnd5eMonsterCatalogService().monsters(sources.map(source => source.id));
    assert.equal(monsters.length, 4);
    for (const monster of monsters) assert.equal(monster.sourceLabel, labels[monster.sourceId]);
  } finally {
    globalThis.MorelordCore = previousCore;
    delete globalThis.game;
  }
});

test("omits empty, unreadable, and non-monster sources before accepting their SRD labels", async () => {
  const makePack = (collection, entries) => ({
    collection, documentName: "Actor",
    metadata: { label: "Actors", packageName: "dnd5e", flags: { dnd5e: { sourceBook: "SRD 5.1" } } },
    getIndex: async () => entries
  });
  const friendly = { type: "npc", system: { details: { type: { value: "humanoid" } } }, prototypeToken: { disposition: 1 } };
  globalThis.game = {
    packs: [
      makePack("dnd5e.heroes", [{ type: "character" }]),
      makePack("empty.actors", []),
      makePack("vehicles.actors", [{ type: "vehicle" }]),
      makePack("friendly.actors", [friendly]),
      { ...makePack("unreadable.actors", []), getIndex: async () => { throw new Error("Unavailable pack"); } },
      makePack("dnd5e.monsters", [{ type: "npc" }])
    ],
    modules: new Map(), system: { id: "dnd5e" },
    settings: { get: () => ({}) }, i18n: { localize: value => value }
  };
  try {
    const sources = await new Dnd5eMonsterSourceService().availableSources();
    assert.deepEqual(sources.map(source => source.id), ["dnd5e.monsters"]);
  } finally { delete globalThis.game; }
});

test("monster sources tolerate null source-book metadata", async () => {
  globalThis.CONFIG = { DND5E: { sourceBooks: { thirdparty: null } } };
  globalThis.game = {
    packs: [{
      collection: "example.monsters",
      documentName: "Actor",
      title: "Example Monsters",
      metadata: { sourceBook: "thirdparty", label: "Example Monsters", packageName: "example" },
      getIndex: async () => [{ type: "npc" }]
    }],
    settings: { get: () => ({}) },
    system: { id: "dnd5e", title: "D&D 5e", config: { sourceBooks: { thirdparty: null } } },
    modules: new Map(),
    i18n: { localize: value => value }
  };
  assert.deepEqual(await new Dnd5eMonsterSourceService().availableSources(), [
    { id: "example.monsters", packId: "example.monsters", book: "", label: "thirdparty", packLabel: "Example Monsters", packageName: "example", img: "" }
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
    getIndex: async () => [{ type: "npc", system: { source: { book: "RAVEN" } } }]
  };
  const fallback = {
    collection: "ravenloft.fallback-actors",
    documentName: "Actor",
    title: "Actors",
    metadata: { label: "Adventure Bestiary", packageName: "ravenloft" },
    getIndex: async () => [{ type: "npc", system: { source: { book: "RAVEN" } } }]
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
      { type: "npc", system: { source: { book: "Tome of Beasts" } } },
      { type: "npc", system: { source: { book: "Tome of Beasts 1 2023" } } },
      { type: "npc", system: { source: { book: "ToB1-2023" } } }
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
      { type: "npc", system: { source: { book: "ONE" } } },
      { type: "npc", system: { source: { book: "TWO" } } }
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
      { type: "npc", system: { source: { book: "MM" } } },
      { type: "npc", system: { source: { book: "PHB" } } }
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
    getIndex: async () => [{ type: "npc" }]
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

test("consolidates a package's generic protected bestiaries into one selectable source", async () => {
  globalThis.CONFIG = { DND5E: { sourceBooks: {} } };
  const packs = Array.from({ length: 12 }, (_, index) => ({
    collection: `heliana-core.actors-${index}`,
    documentName: "Actor",
    metadata: { label: "Bestiary", packageName: "heliana-core" },
    getIndex: async () => [{ type: "npc" }]
  }));
  globalThis.game = {
    packs,
    settings: { get: () => ({}) },
    system: { id: "dnd5e", title: "D&D 5e", config: { sourceBooks: {} } },
    modules: new Map([["heliana-core", { title: "Heliana's Guide to Monster Hunting" }]]),
    i18n: { localize: value => value }
  };
  const sources = await new Dnd5eMonsterSourceService().availableSources();
  assert.equal(sources.length, 1);
  assert.equal(sources[0].label, "Heliana's Guide to Monster Hunting");
  assert.equal(sources[0].packLabel, "Bestiary");
  assert.deepEqual(sources[0].packIds, packs.map(pack => pack.collection));
  delete globalThis.CONFIG;
  delete globalThis.game;
});

import assert from "node:assert/strict";
import test from "node:test";
import { Dnd5eMonsterCatalogService } from "../../scripts/services/dnd5e-monster-catalog-service.mjs";

test("catalog only indexes explicitly selected monster packs", async () => {
  const standard = {
    collection: "dnd5e.monsters",
    title: "Monsters",
    metadata: { label: "D&D Monsters" },
    getIndex: async () => [{ _id: "goblin", name: "Goblin", type: "npc", system: { details: { cr: 0.25 } } }]
  };
  const drakkenheim = {
    collection: "drakkenheim.monsters",
    title: "Monsters of Drakkenheim",
    metadata: { label: "Monsters of Drakkenheim" },
    getIndex: async () => [{ _id: "dreg", name: "Delerium Dreg", type: "npc", system: { details: { cr: 1 }, source: { book: "DRAK" } } }]
  };
  globalThis.CONFIG = { DND5E: { sourceBooks: { DRAK: "Monsters of Drakkenheim" } } };
  globalThis.game = {
    packs: new Map([[standard.collection, standard], [drakkenheim.collection, drakkenheim]]),
    i18n: { localize: value => value }
  };
  const monsters = await new Dnd5eMonsterCatalogService().monsters([drakkenheim.collection]);
  assert.deepEqual(monsters.map(monster => monster.name), ["Delerium Dreg"]);
  assert.equal(monsters[0].sourceId, drakkenheim.collection);
  assert.equal(monsters[0].sourceLabel, "Monsters of Drakkenheim");
  delete globalThis.CONFIG;
  delete globalThis.game;
});

test("party candidates include unowned character actors", () => {
  globalThis.game = {
    actors: [
      { type: "character", name: "Owned", uuid: "Actor.owned", img: "owned.png", hasPlayerOwner: true, system: { details: { level: 4 } } },
      { type: "character", name: "Unowned", uuid: "Actor.unowned", img: "unowned.png", hasPlayerOwner: false, system: { details: { level: 7 } } },
      { type: "npc", name: "Monster", uuid: "Actor.monster", system: { details: { level: 10 } } }
    ]
  };
  const party = new Dnd5eMonsterCatalogService().partyCandidates();
  assert.deepEqual(party.map(actor => actor.name), ["Owned", "Unowned"]);
  delete globalThis.game;
});

test("catalog filters mixed constructed indexes by selected source book", async () => {
  const mixed = {
    collection: "constructed.actors",
    title: "Actors",
    metadata: { label: "Actors" },
    getIndex: async () => [
      { _id: "dreg", name: "Delerium Dreg", type: "npc", system: { details: { cr: 1 }, source: { book: "DRAK" } } },
      { _id: "goblin", name: "Goblin", type: "npc", system: { details: { cr: 0.25 }, source: { book: "MM" } } }
    ]
  };
  globalThis.CONFIG = { DND5E: { sourceBooks: { DRAK: "Monsters of Drakkenheim", MM: "Monster Manual" } } };
  globalThis.game = {
    packs: new Map([[mixed.collection, mixed]]),
    modules: new Map(),
    system: { id: "dnd5e", title: "D&D 5e" },
    i18n: { localize: value => value }
  };
  const monsters = await new Dnd5eMonsterCatalogService().monsters([`${mixed.collection}::DRAK`]);
  assert.deepEqual(monsters.map(monster => monster.name), ["Delerium Dreg"]);
  delete globalThis.CONFIG;
  delete globalThis.game;
});

test("catalog excludes non-hostile humanoid NPCs but retains hostile humanoids", async () => {
  const pack = {
    collection: "example.humanoids",
    title: "Humanoids",
    metadata: { label: "Humanoids" },
    getIndex: async () => [
      { _id: "apprentice", name: "Academy Apprentice", type: "npc", prototypeToken: { disposition: 0 }, system: { details: { cr: 0.5, type: { value: "humanoid" } } } },
      { _id: "goblin", name: "Goblin", type: "npc", prototypeToken: { disposition: -1 }, system: { details: { cr: 0.25, type: { value: "humanoid" } } } },
      { _id: "wolf", name: "Wolf", type: "npc", prototypeToken: { disposition: 0 }, system: { details: { cr: 0.25, type: { value: "beast" } } } }
    ]
  };
  globalThis.game = {
    packs: new Map([[pack.collection, pack]]), modules: new Map(),
    system: { id: "dnd5e", title: "D&D 5e" }, i18n: { localize: value => value }
  };
  const monsters = await new Dnd5eMonsterCatalogService().monsters([pack.collection]);
  assert.deepEqual(monsters.map(monster => monster.name), ["Goblin", "Wolf"]);
  delete globalThis.game;
});

test("catalog expands a consolidated source selection to every underlying compendium", async () => {
  const makePack = (collection, id, name) => ({
    collection,
    metadata: { label: "Bestiary", packageName: "heliana-core" },
    getIndex: async () => [{ _id: id, name, type: "npc", system: { details: { cr: 1 } } }]
  });
  const packs = [
    makePack("heliana-core.actors", "main", "Main Bestiary Creature"),
    makePack("heliana-core.actors-hunt", "hunt", "Hunt Creature")
  ];
  globalThis.CONFIG = { DND5E: { sourceBooks: {} } };
  globalThis.game = {
    packs: new Map(packs.map(pack => [pack.collection, pack])),
    modules: new Map([["heliana-core", { title: "Heliana's Guide to Monster Hunting" }]]),
    system: { id: "dnd5e", title: "D&D 5e", config: { sourceBooks: {} } },
    i18n: { localize: value => value }
  };
  const sourceId = `packs::${encodeURIComponent(JSON.stringify(packs.map(pack => pack.collection)))}`;
  const monsters = await new Dnd5eMonsterCatalogService().monsters([sourceId]);
  assert.deepEqual(monsters.map(monster => monster.name), ["Main Bestiary Creature", "Hunt Creature"]);
  delete globalThis.CONFIG;
  delete globalThis.game;
});

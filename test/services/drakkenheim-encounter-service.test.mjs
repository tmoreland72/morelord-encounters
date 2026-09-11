import assert from "node:assert/strict";
import test from "node:test";
import { DrakkenheimEncounterService } from "../../scripts/services/drakkenheim-encounter-service.mjs";

class FoundryCollection extends Map {
  [Symbol.iterator]() { return this.values(); }
}

function installGlobals({ tier = "champion" } = {}) {
  const preferredActor = {
    _id: "preferred-husk",
    name: "Haze Husk",
    img: "husk.webp",
    type: "npc",
    system: { details: { cr: 1, xp: { value: 200 } }, attributes: { ac: { value: 12 }, hp: { max: 18 } } }
  };
  const primaryPack = {
    collection: "drakkenheim-monsters.monsters",
    documentName: "Actor",
    metadata: { type: "Actor", label: "Monsters of Drakkenheim", packageName: "drakkenheim-monsters" },
    getIndex: async () => [preferredActor]
  };
  const tableResult = {
    name: "",
    type: "text",
    uuid: "RollTable.inner-city.TableResult.husks",
    toObject: () => ({
      type: "text",
      description: "2d1 @UUID[Actor.core-husk]{Haze Husks} emerge from the haze.",
      range: [1, 1]
    })
  };
  const table = {
    id: "inner-city",
    name: "Inner City",
    results: [tableResult]
  };
  const tablePack = {
    collection: "drakkenheim-core.tables",
    documentName: "RollTable",
    getIndex: async () => [
      { _id: "inner-city", name: "Inner City" },
      { _id: "sewers", name: "Sewers" },
      { _id: "gates", name: "Gates Random Encounters" },
      { _id: "irrelevant", name: "Treasure" }
    ],
    getDocument: async id => id === table.id ? table : null
  };
  const packs = new FoundryCollection([
    [tablePack.collection, tablePack],
    [primaryPack.collection, primaryPack]
  ]);
  globalThis.game = {
    user: { isGM: true },
    modules: new Map([
      ["drakkenheim-core", { active: true }],
      ["drakkenheim-monsters", { active: true }],
      ["morelord-core", { active: true, api: { sources: {
        resolveBookLabel: ({ book, pack }) => pack.collection === "drakkenheim-monsters.monsters"
          ? "Monsters of Drakkenheim"
          : book || pack.metadata?.label || pack.collection
      } } }]
    ]),
    packs,
    i18n: { localize: value => value }
  };
  globalThis.fromUuid = async uuid => uuid === "Actor.core-husk"
    ? { id: "core-husk", uuid, name: "Haze Husk", documentName: "Actor", system: {} }
    : null;
  globalThis.Roll = class {
    constructor(formula) { this.formula = formula; }
    async evaluate() { this.total = 2; return this; }
  };
  return new DrakkenheimEncounterService({ coreAccess: { tier } });
}

test("only exposes published Drakkenheim tables to an eligible Champion GM", async () => {
  const service = installGlobals();
  assert.equal(service.isAvailable, true);
  const tables = await service.availableTables();
  assert.deepEqual(tables.map(table => table.name), ["Inner City", "Sewers", "Gates Random Encounters"]);
  assert.deepEqual(tables.find(table => table.id === "sewers"), {
    id: "sewers",
    uuid: "Compendium.drakkenheim-core.tables.sewers",
    name: "Sewers",
    label: "Sewers",
    groupId: "sewers"
  });
  assert.equal(installGlobals({ tier: "premium" }).isAvailable, false);
});

test("rolls quantities privately and prefers the Monsters of Drakkenheim Actor", async () => {
  const encounter = await installGlobals().roll("inner-city");
  assert.equal(encounter.members.length, 1);
  assert.equal(encounter.members[0].uuid, "Compendium.drakkenheim-monsters.monsters.Actor.preferred-husk");
  assert.equal(encounter.members[0].count, 1);
  assert.equal(encounter.members[0].rolledQuantity, 2);
  assert.equal(encounter.showCraftworksSourceNotice, false);
  assert.match(encounter.notes[0].text, /emerge from the haze/);
});

test("never returns non-MoD Actors by name, alias, or stats", async () => {
  const service = installGlobals();
  const outsider = { _id: "outsider", name: "Ratling Warrior", type: "npc", system: { details: { cr: 20 } } };
  game.packs.set("dnd5e.monsters", {
    collection: "dnd5e.monsters", documentName: "Actor", getIndex: async () => [outsider]
  });
  const catalogs = await service.actorCatalog();
  assert.equal(await service.preferredActor("Ratling Warrior", catalogs), null);
  assert.equal(await service.preferredActor("Ratling", catalogs), null);
  assert.equal(await service.preferredActorByStats(outsider, catalogs), null);
  globalThis.fromUuid = async () => ({ ...outsider, documentName: "Actor" });
  game.packs.get("drakkenheim-core.tables").getDocument = async () => ({
    id: "inner-city", name: "Inner City",
    results: [{ toObject: () => ({ type: "text", description: "@UUID[Actor.outsider]{Ratling Warrior}", range: [1, 1] }) }]
  });
  const encounter = await service.roll("inner-city");
  assert.deepEqual(encounter.members, []);
  assert.ok(encounter.notes.some(note => note.title === "Unresolved creature"
    && note.text.includes("No Monsters of Drakkenheim Actor")));
});

test("explicit MoD replacements win over old actors and inferred stat matches", async () => {
  const service = installGlobals();
  const primary = game.packs.get("drakkenheim-monsters.monsters");
  const names = ["Ratling", "Ratling Warrior", "Aquatic Delerium Dregs", "Deep Dreg Warrior"];
  primary.getIndex = async () => names.map((name, index) => ({ _id: `mod-${index}`, name, type: "npc", system: { details: { cr: index + 1 } } }));
  const catalogs = await service.actorCatalog();
  catalogs.aliases.set("ratling", "aquatic delerium dregs");
  for (const [oldName, newName] of [["Ratling", "Ratling Warrior"], ["Aquatic Delerium Dregs", "Deep Dreg Warrior"], ["Delerium Dreg (Aquatic)", "Deep Dreg Warrior"]]) {
    const member = await service.preferredActor(oldName, catalogs);
    assert.equal(member.name, newName);
    assert.match(member.uuid, /^Compendium\.drakkenheim-monsters\.monsters\.Actor\./);
  }
});

test("translates uniquely matching Dungeons of Drakkenheim actor names to Monsters of Drakkenheim", async () => {
  const service = installGlobals();
  const stats = {
    details: { cr: 8, xp: { value: 3900 }, type: { value: "aberration" } },
    attributes: { ac: { value: 16 }, hp: { max: 136 } },
    abilities: Object.fromEntries(["str", "dex", "con", "int", "wis", "cha"].map(key => [key, { value: 12 }])),
    traits: { size: "huge" },
    source: { book: "DoD" }
  };
  const primary = game.packs.get("drakkenheim-monsters.monsters");
  const originalGetIndex = primary.getIndex;
  primary.getIndex = async () => [
    ...await originalGetIndex(),
    { _id: "gargantuan", name: "Grotesque Gargantuan", type: "npc", system: stats }
  ];
  game.packs.set("test.dod-actors", {
    collection: "test.dod-actors",
    documentName: "Actor",
    metadata: { type: "Actor", label: "Dungeons of Drakkenheim" },
    getIndex: async () => [{ _id: "gargant", name: "Grotesque Gargant", type: "npc", system: stats }]
  });

  const actor = await service.preferredActor("Grotesque Gargant", await service.actorCatalog());
  assert.equal(actor.name, "Grotesque Gargantuan");
  assert.equal(actor.uuid, "Compendium.drakkenheim-monsters.monsters.Actor.gargantuan");
});

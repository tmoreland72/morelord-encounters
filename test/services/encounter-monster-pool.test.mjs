import assert from "node:assert/strict";
import test from "node:test";
import { assembleMonsterPool, NO_ENABLED_MONSTERS_WARNING, isExternalMonsterReference } from "../../scripts/services/encounter-monster-pool.mjs";
import { isSystemPackEnabled } from "../../scripts/services/system-pack-access.mjs";

const resolveBookLabel = ({ book }) => book === "SRD 5.1" ? "System Reference Document 5.1" : (book || "");

test("disabled SRD packs are not indexed and references to them are skipped", async () => {
  let srdReads = 0;
  const srd = {
    collection: "dnd5e.monsters",
    metadata: { packageName: "dnd5e", label: "Monsters (SRD)" },
    getIndex: async () => {
      srdReads += 1;
      return [{ _id: "srd-mage", name: "Mage", type: "npc", system: { details: { cr: 6 }, source: { book: "SRD 5.1" } } }];
    }
  };
  const actors24 = {
    collection: "dnd5e.actors24",
    metadata: { packageName: "dnd5e", label: "Actors" },
    getIndex: async () => [{ _id: "srd-guard", name: "Guard", type: "npc", system: { details: { cr: 0.125 } } }]
  };
  const adventure = {
    collection: "faerun.actors",
    metadata: { packageName: "faerun", label: "Forgotten Realms: Adventures in Faerûn" },
    getIndex: async () => [
      {
        _id: "mage-link",
        name: "Mage",
        type: "npc",
        uuid: "Compendium.dnd5e.monsters.Actor.srdMage000000",
        flags: { core: { sourceId: "Compendium.dnd5e.monsters.Actor.srdMage000000" } }
      },
      {
        _id: "cult-link",
        name: "Cult Fanatic",
        type: "npc",
        flags: { dnd5e: { sourceUuid: "Compendium.dnd5e.monsters.Actor.cultFanatic000" } }
      },
      {
        _id: "ogre-zombie",
        name: "Ogre Zombie",
        type: "npc",
        system: { details: { cr: 2, xp: { value: 450 }, type: { value: "undead" } }, source: { book: "SRD 5.1", rules: "2014" } },
        _stats: { compendiumSource: "Compendium.dnd5e.monsters.Actor.ogreZombie0000" }
      }
    ]
  };
  const packs = new Map([[srd.collection, srd], [actors24.collection, actors24], [adventure.collection, adventure]]);
  globalThis.game = {
    modules: new Map([["morelord-core", { active: true, api: { sources: {
      isPackEnabled: pack => pack.collection !== "dnd5e.monsters" && pack.collection !== "dnd5e.actors24"
    } } }]]),
    settings: { get: () => ({ "dnd5e.monsters": true, "dnd5e.actors24": true }) }
  };
  try {
    assert.equal(isSystemPackEnabled(srd), false);
    assert.equal(isSystemPackEnabled(adventure), true);
    assert.equal(isExternalMonsterReference(adventure.getIndex && {
      uuid: "Compendium.dnd5e.monsters.Actor.srdMage000000"
    }, adventure.collection), true);
    const monsters = await assembleMonsterPool({
      sourceIds: [adventure.collection, srd.collection, actors24.collection],
      getPack: id => packs.get(id),
      isEnabled: isSystemPackEnabled,
      resolveBookLabel,
      packageLabelFor: pack => pack.metadata.label
    });
    assert.deepEqual(monsters.map(monster => monster.name), ["Ogre Zombie"]);
    assert.equal(monsters[0].uuid, "Compendium.faerun.actors.ogre-zombie");
    assert.equal(monsters[0].sourceLabel, "Forgotten Realms: Adventures in Faerûn");
    assert.ok(monsters.every(monster => !String(monster.uuid).includes("dnd5e.monsters") && !String(monster.uuid).includes("dnd5e.actors24")));
    assert.equal(srdReads, 0);
    const empty = await assembleMonsterPool({
      sourceIds: [srd.collection],
      getPack: id => packs.get(id),
      isEnabled: isSystemPackEnabled,
      resolveBookLabel,
      packageLabelFor: pack => pack.metadata.label
    });
    assert.deepEqual(empty, []);
    assert.equal(NO_ENABLED_MONSTERS_WARNING.length > 0, true);
  } finally {
    delete globalThis.game;
  }
});

test("an enabled selected pack is the only pool, even when SRD is installed", async () => {
  const manual = {
    collection: "dnd-monster-manual.actors",
    metadata: { packageName: "dnd-monster-manual", label: "Monster Manual" },
    getIndex: async () => [{ _id: "dragon", name: "Adult Gold Dragon", type: "npc", system: { details: { cr: 17 } } }]
  };
  let srdReads = 0;
  const srd = {
    collection: "dnd5e.monsters",
    metadata: { packageName: "dnd5e", label: "Monsters (SRD)" },
    getIndex: async () => {
      srdReads += 1;
      return [{ _id: "cult", name: "Cult Fanatic", type: "npc", system: { details: { cr: 2 }, source: { book: "SRD 5.1" } } }];
    }
  };
  const packs = new Map([[manual.collection, manual], [srd.collection, srd]]);
  const monsters = await assembleMonsterPool({
    sourceIds: [manual.collection],
    getPack: id => packs.get(id),
    isEnabled: () => true,
    resolveBookLabel: ({ book }) => book || "Monster Manual",
    packageLabelFor: pack => pack.metadata.label
  });
  assert.deepEqual(monsters.map(monster => monster.name), ["Adult Gold Dragon"]);
  assert.ok(monsters.every(monster => monster.uuid.startsWith("Compendium.dnd-monster-manual.actors.")));
  assert.equal(srdReads, 0);
});

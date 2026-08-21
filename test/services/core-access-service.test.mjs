import assert from "node:assert/strict";
import test from "node:test";
import { CoreAccessService } from "../../scripts/services/core-access-service.mjs";

const withFeatures = (...features) => {
  globalThis.game = { modules: new Map([["morelord-core", { active: true, api: {
    getTier: () => "standard",
    isConnected: () => true,
    hasFeature: feature => features.includes(feature)
  } }]]) };
  return new CoreAccessService();
};

test("standard access only includes SRD sources", () => {
  const access = withFeatures("encounters.standard");
  assert.equal(access.canUseSource({ label: "System Reference Document 5.1" }), true);
  assert.equal(access.canUseSource({ label: "Monster Manual" }), false);
  assert.equal(access.canUseSource({ label: "Monsters of Drakkenheim" }), false);
  delete globalThis.game;
});

test("premium access includes every installed source", () => {
  assert.equal(withFeatures("encounters.premium").canUseSource({ label: "Dungeon Master's Guide" }), true);
  assert.equal(withFeatures("encounters.premium").canUseSource({ label: "Monsters of Drakkenheim" }), true);
  assert.equal(withFeatures("encounters.premium").canUseSource({ label: "Tome of Beasts" }), true);
  assert.equal(withFeatures("encounters.premium").canUseSource({ label: "Monster Manual" }), true);
  assert.equal(withFeatures("encounters.premium").canUseSource({ label: "System Reference Document 5.1" }), true);
  assert.equal(withFeatures("encounters.premium").canUseSource({
    label: "Monsters of Drakkenheim: Pluto Jackson's Monster Slaying Guide",
    book: "DRAK",
    id: "dnd-monster-manual.actors::DRAK",
    packLabel: "Dungeons & Dragons Monster Manual"
  }), true);
  delete globalThis.game;
});

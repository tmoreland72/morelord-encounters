import assert from "node:assert/strict";
import test from "node:test";
import { generateGuidedEncounter, GUIDED_CHOICES, GUIDED_FIELDS, normalizeGuidance } from "../../scripts/domain/guided-encounters.mjs";
import { normalizeEncounterConfiguration } from "../../scripts/domain/encounter-configuration.mjs";

test("guided scenes honor each setting and interaction without actors or unresolved placeholders", () => {
  for (const setting of Object.keys(GUIDED_CHOICES.setting)) {
    for (const interaction of Object.keys(GUIDED_CHOICES.interaction)) {
      for (const roll of [0, 0.999]) {
        const scene = generateGuidedEncounter({ setting, interaction, connection: "the Lantern Guild" }, { random: () => roll });
        assert.deepEqual(scene.members, []);
        assert.equal(scene.kind, "guided");
        if (setting !== "any") assert.equal(scene.setting, setting);
        if (interaction !== "any") assert.equal(scene.interaction, interaction);
        assert.notEqual(scene.setting, "any");
        for (const key of Object.keys(GUIDED_FIELDS)) assert.ok(scene.scene[key]?.length > 20, key);
        assert.doesNotMatch(JSON.stringify(scene.scene), /\{place\}|undefined/);
        assert.match(scene.scene.reward, /the Lantern Guild/);
        const next = generateGuidedEncounter(scene.guidance, { random: () => roll, previousId: scene.seedId });
        assert.notEqual(next.seedId, scene.seedId);
      }
    }
  }
});

test("story purpose and pressure change actual guidance; saved answers survive normalization", () => {
  const rewards = new Set();
  for (const purpose of ["clue", "connection", "aid", "dilemma"]) {
    rewards.add(generateGuidedEncounter({ purpose }).scene.reward);
  }
  assert.equal(rewards.size, 4);
  const low = generateGuidedEncounter({ stakes: "low" }, { random: () => 0 });
  const high = generateGuidedEncounter({ stakes: "high" }, { random: () => 0 });
  assert.match(low.scene.checks, /DC 10/);
  assert.match(high.scene.checks, /DC 16/);
  assert.notEqual(low.scene.pressure, high.scene.pressure);
  const configuration = normalizeEncounterConfiguration({ encounterSource: "guided", guidance: high.guidance });
  assert.deepEqual(configuration.guidance, high.guidance);
  assert.deepEqual(configuration.partyUuids, []);
  assert.deepEqual(configuration.sourceIds, []);
  assert.deepEqual(normalizeGuidance(null), normalizeGuidance());
  assert.equal(normalizeGuidance({ setting: "toString", stakes: "unknown", connection: "x".repeat(500) }).connection.length, 240);
  assert.equal(normalizeGuidance({ setting: "toString" }).setting, "any");
});

import { GUIDED_SITUATIONS } from "../../scripts/domain/guided-encounters.mjs";
import { generateRememberedGuidedEncounter, GUIDED_HISTORY_SETTING } from "../../scripts/services/guided-encounter-service.mjs";

test("all 40 stories are complete, uniquely identified, and balanced across interactions", () => {
  assert.equal(GUIDED_SITUATIONS.length, 40);
  assert.equal(new Set(GUIDED_SITUATIONS.map(seed => seed.id)).size, 40);
  for (const kind of Object.keys(GUIDED_CHOICES.interaction).filter(key => key !== "any")) {
    assert.equal(GUIDED_SITUATIONS.filter(seed => seed.kind === kind).length, 8);
  }
  for (const seed of GUIDED_SITUATIONS) {
    for (const key of ["name", "opening", "truth", "motivation", "approaches", "success", "setback", "ignored"]) {
      assert.ok(typeof seed[key] === "string" && seed[key].length > 10, `${seed.id}: ${key}`);
    }
    assert.equal(seed.skills.length, 2);
    if (seed.hook) assert.ok(seed.urgency?.length > 20, seed.id);
  }
});

test("every setting and interaction exhausts its eligible library before repeating oldest", () => {
  for (const setting of Object.keys(GUIDED_CHOICES.setting)) {
    for (const interaction of Object.keys(GUIDED_CHOICES.interaction)) {
      const count = interaction === "any" ? 40 : 8;
      let recentIds = [];
      const generated = [];
      for (let index = 0; index < count * 2; index++) {
        const encounter = generateGuidedEncounter({ setting, interaction }, { recentIds, random: () => 0 });
        if (index < count) assert.ok(!generated.includes(encounter.seedId), `${setting}/${interaction} repeated early`);
        else assert.equal(encounter.seedId, generated[index - count], "Exhausted pool must reuse oldest first");
        generated.push(encounter.seedId);
        recentIds = [encounter.seedId, ...recentIds.filter(id => id !== encounter.seedId)];
      }
    }
  }
});

test("switching filters retains history; previous scene and malformed histories are safe", () => {
  const first = generateGuidedEncounter({ interaction: "rescue", setting: "city" }, { random: () => 0 });
  const next = generateGuidedEncounter({ interaction: "any", setting: "forest" }, { random: () => 0, recentIds: [first.seedId] });
  assert.notEqual(next.seedId, first.seedId);
  const ids = GUIDED_SITUATIONS.map(seed => seed.id);
  const previousId = ids.at(-1);
  const result = generateGuidedEncounter({}, { recentIds: ids, previousId, random: () => 0 });
  assert.notEqual(result.seedId, previousId);
  assert.ok(generateGuidedEncounter({}, { recentIds: null }).seedId);
});

test("new stories retain individual hooks and deadlines alongside the selected campaign purpose", () => {
  for (let index = 0; index < 30; index++) {
    const seed = GUIDED_SITUATIONS[index];
    const encounter = generateGuidedEncounter({ stakes: "high", purpose: "clue", connection: "the Brass Company" }, { random: () => index / 40 });
    assert.equal(encounter.seedId, seed.id);
    assert.ok(encounter.scene.pressure.includes(seed.urgency));
    assert.ok(encounter.scene.reward.includes(seed.hook));
    assert.match(encounter.scene.reward, /the Brass Company/);
  }
});

test("generation persists only valid distinct IDs and uses them on the next call", async () => {
  const originalGame = globalThis.game;
  let stored = ["obsolete-template", GUIDED_SITUATIONS[0].id, GUIDED_SITUATIONS[0].id];
  globalThis.game = { settings: {
    get(namespace, key) { assert.equal(key, GUIDED_HISTORY_SETTING); return structuredClone(stored); },
    async set(namespace, key, value) { stored = structuredClone(value); }
  } };
  try {
    const first = await generateRememberedGuidedEncounter({ interaction: "social" }, { random: () => 0 });
    assert.notEqual(first.seedId, GUIDED_SITUATIONS[0].id);
    assert.deepEqual(stored, [first.seedId, GUIDED_SITUATIONS[0].id]);
    const second = await generateRememberedGuidedEncounter({ interaction: "social" }, { random: () => 0 });
    assert.notEqual(second.seedId, first.seedId);
    assert.equal(stored[0], second.seedId);
    assert.equal(new Set(stored).size, stored.length);
  } finally {
    if (originalGame === undefined) delete globalThis.game;
    else globalThis.game = originalGame;
  }
});

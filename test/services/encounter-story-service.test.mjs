import test from "node:test";
import assert from "node:assert/strict";
import { createStory, duplicateStory, saveStoryDetails, saveStoryCombat, resolveBrothersRoster, getStory, openStoryHoard, canAuthorStories } from "../../scripts/services/encounter-story-service.mjs";

const NS = "morelord-encounters";
import { STORY_TEMPLATES } from "../../scripts/stories/story-library.mjs";
function environment() {
  let premium = true;
  const hoardCalls = [];
  const core = { active: true, api: { getTier: () => premium ? "premium" : "standard", hasFeature: () => premium, isConnected: () => true } };
  const modules = new Map([
    ["morelord-core", core], ["dnd-monster-manual", { active: true }],
    ["morelord-craftworks", { active: true, api: { openHoard: options => { hoardCalls.push(options); return options; } } }]
  ]);
  const pack = { collection: "dnd-monster-manual.actors", documentName: "Actor", metadata: { packageName: "dnd-monster-manual" },
    getIndex: async () => [{ _id: "mmHillGiant00000", type: "npc", name: "Hill Giant", system: { details: { cr: 5 }, source: { book: "Monster Manual" } } }] };
  const created = [];
  globalThis.game = { user: { isGM: true }, modules, packs: new Map([[pack.collection, pack]]), system: { id: "dnd5e" } };
  globalThis.foundry = { utils: { randomID: () => "freshCopy1234567" }, applications: { instances: new Map() } };
  globalThis.JournalEntry = { async create(data) { created.push(structuredClone(data)); return data; } };
  return { created, modules, hoardCalls, setPremium: value => { premium = value; } };
}
function journal(data) {
  const stored = structuredClone(data.flags[NS].encounterStory);
  return { name: data.name, uuid: "JournalEntry.original12345678", pages: data.pages.map(page => ({ toObject: () => structuredClone(page) })),
    getFlag: () => stored,
    updates: [],
    async update(update) {
      this.updates.push(structuredClone(update));
      if (update.name) this.name = update.name;
      for (const [key, value] of Object.entries(update)) if (key.startsWith(`flags.${NS}.encounterStory.`)) stored[key.split('.').at(-1)] = structuredClone(value);
      return this;
    }
  };
}

test("additional templates create distinct private stories without Monster Manual; invalid IDs do not write", async () => {
  const env = environment();
  env.modules.get("dnd-monster-manual").active = false;
  game.packs.clear();
  assert.equal(new Set(STORY_TEMPLATES.map(seed => seed.id)).size, 4);
  for (const seed of STORY_TEMPLATES.filter(seed => !seed.sourceModule)) {
    const result = await createStory({ template: seed.id });
    assert.equal(result.name, seed.name);
    assert.equal(result.flags[NS].encounterStory.templateId, seed.id);
    assert.equal(result.flags[NS].encounterStory.hoardProfile, "0-4");
    assert.deepEqual(result.flags[NS].encounterStory.encounters, []);
    assert.equal(result.ownership.default, 0);
    assert.equal(result.pages.length, 6);
    assert.ok(result.pages.every(page => page.ownership.default === -1 && page.text.content.length > 100));
    assert.ok(result.pages.some(page => page.text.content.includes("Read aloud")));
    const copy = await duplicateStory(journal(result));
    copy.pages[0].text.content = "Edited independently";
    assert.notEqual(result.pages[0].text.content, copy.pages[0].text.content);
  }
  const before = env.created.length;
  await assert.rejects(createStory({ template: "missing-story" }), /unavailable/);
  assert.equal(env.created.length, before);
  env.setPremium(false);
  await assert.rejects(createStory({ template: "the-ninth-bell" }), /Premium/);
});

test("premium template references only Monster Manual and creates private pages with an independent roster", async () => {
  environment();
  const result = await createStory({ template: true });
  assert.equal(result.ownership.default, 0);
  assert.equal(result.pages.length, 7);
  const roster = result.flags[NS].encounterStory.encounters[0].roster;
  assert.equal(roster.members[0].count, 2);
  assert.equal(roster.members[0].uuid, "Compendium.dnd-monster-manual.actors.mmHillGiant00000");
  assert.equal(roster.members[0].xp, 1800);
  assert.ok(result.pages.every(page => page.ownership.default === -1));
});

test("missing Monster Manual blocks template rather than substituting SRD; blank authoring remains possible", async () => {
  const env = environment();
  env.modules.get("dnd-monster-manual").active = false;
  await assert.rejects(resolveBrothersRoster(), /No SRD/);
  const blank = await createStory({ name: "My notes", details: { campaignSetting: "drakkenheim" } });
  assert.equal(blank.flags[NS].encounterStory.campaignSetting, "drakkenheim");
  assert.deepEqual(blank.flags[NS].encounterStory.encounters, []);
});

test("saving details and custom combat never rewrites journal pages or another copy", async () => {
  environment();
  const data = await createStory({ template: true });
  const original = journal(data);
  const copy = journal(data);
  await saveStoryDetails(copy, { name: "Different brothers", campaignSetting: "general-fantasy", durationMinutes: 180 });
  assert.ok(!copy.updates[0].pages);
  const roster = getStory(copy).encounters[0].roster;
  roster.members[0].count = 1;
  await saveStoryCombat(copy, "brothers", roster);
  roster.members[0].count = 99;
  assert.equal(getStory(copy).encounters[0].roster.members[0].count, 1);
  assert.equal(getStory(original).encounters[0].roster.members[0].count, 2);
  await assert.rejects(saveStoryCombat(copy, "removed", roster), /no longer exists/);
});

test("duplicate copies edited pages and rewrites internal links while resetting permissions", async () => {
  const env = environment();
  const data = await createStory({ template: true });
  data.pages[0].text.content = '@UUID[JournalEntry.original12345678.JournalEntryPage.page123]{Clue} @UUID[JournalEntry.someOtherJournal]{External}';
  data.pages[0].ownership = { default: 3, player: 3 };
  const duplicate = await duplicateStory(journal(data));
  assert.equal(duplicate._id, "freshCopy1234567");
  assert.match(duplicate.pages[0].text.content, /JournalEntry.freshCopy1234567.JournalEntryPage/);
  assert.match(duplicate.pages[0].text.content, /JournalEntry.someOtherJournal/);
  assert.deepEqual(duplicate.pages[0].ownership, { default: -1 });
  duplicate.flags[NS].encounterStory.encounters[0].roster.members[0].count = 3;
  assert.equal(data.flags[NS].encounterStory.encounters[0].roster.members[0].count, 2);
  assert.equal(env.created.length, 2);
});

test("premium expiration blocks authoring but preserves access to saved story data", async () => {
  const env = environment();
  const saved = journal(await createStory({ template: true }));
  env.setPremium(false);
  assert.equal(canAuthorStories(), false);
  assert.equal(getStory(saved).templateId, "brothers-keeper");
  await assert.rejects(createStory(), /Premium/);
  await assert.rejects(duplicateStory(saved), /Premium/);
  await assert.rejects(saveStoryCombat(saved, "brothers", { members: [] }), /Premium/);
  game.user.isGM = false;
  assert.throws(() => getStory(saved), /Only GMs/);
});

test("hoard action delegates its profile to Craftworks without rolling or awarding", async () => {
  const env = environment();
  const saved = journal(await createStory({ template: true }));
  await openStoryHoard(saved);
  assert.deepEqual(env.hoardCalls, [{ profileId: "5-10" }]);
  env.modules.get("morelord-craftworks").active = false;
  await assert.rejects(openStoryHoard(saved), /Enable Morelord Craftworks/);
  assert.equal(env.hoardCalls.length, 1);
});

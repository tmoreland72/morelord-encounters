import { BROTHERS_KEEPER_REVISIONS } from "../../scripts/stories/brothers-keeper-revisions.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { BROTHERS_KEEPER } from "../../scripts/stories/brothers-keeper.mjs";
import { normalizeStoryDetails, rateStoryEncounter, customEncounterSelection, storyPageContent, upgradeStoryPageContent, CAMPAIGN_SETTINGS } from "../../scripts/domain/encounter-stories.mjs";
import { normalizeEncounterConfiguration } from "../../scripts/domain/encounter-configuration.mjs";

test("first story is a bounded fantasy adventure using core Monster Manual and one Craftworks hoard", () => {
  assert.deepEqual(Object.keys(CAMPAIGN_SETTINGS).sort(), ["drakkenheim", "faerun", "general-fantasy"]);
  assert.equal(BROTHERS_KEEPER.genre, "fantasy");
  assert.doesNotMatch(JSON.stringify(BROTHERS_KEEPER.pages), /Faerûn|Sword Coast|Tyranny of Dragons|Material Plane/);
  assert.equal(BROTHERS_KEEPER.sourcePack, "dnd-monster-manual.actors");
  assert.equal(BROTHERS_KEEPER.actorName, "Hill Giant");
  assert.equal(BROTHERS_KEEPER.hoardProfile, "5-10");
  assert.ok(BROTHERS_KEEPER.durationMinutes <= 240);
  assert.equal(BROTHERS_KEEPER.pages.length, 7);
  assert.equal(normalizeEncounterConfiguration({ encounterSource: "stories" }).encounterSource, "stories");
});

test("story details normalize choices and label longer adventures without changing prose", () => {
  const details = normalizeStoryDetails({ campaignSetting: "toString", genre: "science-fiction", durationMinutes: 300, continuation: false });
  assert.equal(details.campaignSetting, "general-fantasy");
  assert.equal(details.genre, "fantasy");
  assert.equal(details.plane, "material");
  assert.equal(details.continuation, true);
  assert.equal(normalizeStoryDetails({ durationMinutes: "bad" }).durationMinutes, 180);
  assert.equal(normalizeStoryDetails({ durationMinutes: 180 }).continuation, false);
});

test("story difficulty follows the selected party without rescaling the two giants", () => {
  const roster = { name: "The brothers", members: [{ uuid: "giant", name: "Hill Giant", cr: 5, xp: 1800, count: 2 }] };
  const low = rateStoryEncounter(roster, Array.from({ length: 4 }, () => ({ level: 3 })));
  const high = rateStoryEncounter(roster, Array.from({ length: 4 }, () => ({ level: 10 })));
  assert.equal(low.totalXp, 3600);
  assert.equal(low.difficulty, "deadly");
  assert.equal(high.difficulty, "easy");
  assert.equal(low.creatureCount, high.creatureCount);
  assert.equal(rateStoryEncounter(roster, []).difficulty, null);
  assert.equal(rateStoryEncounter({ members: [] }, [{ level: 5 }]).difficulty, null);
});

test("custom editing seeds independent quantities and retains unavailable members for explicit removal", () => {
  const members = [{ uuid: "giant", name: "Old giant", count: 2 }, { uuid: "missing", name: "Missing source", count: 1 }];
  const selection = customEncounterSelection(members, [{ uuid: "giant", name: "Hill Giant", xp: 1800 }]);
  assert.equal(selection.get("giant").count, 2);
  assert.equal(selection.get("giant").name, "Hill Giant");
  assert.equal(selection.get("missing").count, 1);
  selection.get("giant").count = 5;
  assert.equal(members[0].count, 2);
  assert.equal(customEncounterSelection([{ uuid: "giant", count: -2 }], []).size, 0);
});

test("authored journal scaffolding escapes text before creating HTML", () => {
  const html = storyPageContent({ name: '<script>alert(1)</script>', paragraphs: ['<img src=x onerror=alert(1)>', 'A & B'] });
  assert.doesNotMatch(html, /<script>|<img/);
  assert.match(html, /A &amp; B/);
});

test("journal callouts contain only read-aloud text and native headings are not duplicated", () => {
  const page = BROTHERS_KEEPER.pages[2];
  const html = storyPageContent(page);
  assert.doesNotMatch(html, /<h[1-6]>/);
  const callouts = [...html.matchAll(/<aside.*?<\/aside>/g)].map(match => match[0]);
  assert.equal(callouts.length, 2);
  assert.ok(callouts.every(callout => callout.includes("Read aloud")));
  assert.ok(callouts.every(callout => !/Essential clues|DC 13|unreliable/.test(callout)));
  assert.match(html, /Essential clues/);
  assert.doesNotMatch(storyPageContent({ paragraphs: [{ readAloud: '<script>secret</script>' }] }), /<script>/);
});

test("presentation repair preserves custom text and page count, and is idempotent", () => {
  const page = { name: '3. Roadside Argument', text: { content: '<div class="ml-section-heading"><div><h2>3. Roadside Argument</h2><p>Private GM preparation</p></div></div><p>My edited opening.</p><h2>My custom heading</h2>' } };
  const result = upgradeStoryPageContent(page, "brothers-keeper");
  assert.equal(result, '<p>My edited opening.</p><h2>My custom heading</h2>');
  assert.equal(upgradeStoryPageContent({ ...page, text: { content: result } }, "brothers-keeper"), result);
  for (const authored of BROTHERS_KEEPER.pages) {
    const content = storyPageContent(authored);
    assert.equal(upgradeStoryPageContent({ ...authored, text: { content } }, "brothers-keeper"), content);
  }
});

test("presentation repair recognizes Foundry's persisted quote normalization", () => {
  for (const [before, after] of BROTHERS_KEEPER_REVISIONS) {
    const quotes = html => html.replaceAll("&#39;", "'").replaceAll("&quot;", '"');
    const page = { name: "Existing scene", text: { content: quotes(before) + "<p>My custom note.</p>" } };
    const upgraded = upgradeStoryPageContent(page, "brothers-keeper");
    assert.equal(upgraded, after + "<p>My custom note.</p>");
    assert.equal(upgradeStoryPageContent({ ...page, text: { content: quotes(upgraded) } }, "brothers-keeper"), quotes(upgraded));
  }
});

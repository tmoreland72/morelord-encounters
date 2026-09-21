import { BROTHERS_KEEPER_REVISIONS } from "../stories/brothers-keeper-revisions.mjs";
import { openEncounterStories } from "../apps/encounter-stories-dialog.mjs";
import { runInGameTests, assert } from "../../../morelord-core/scripts/testing/in-game.js";
import { configureEncounter } from "../apps/encounter-builder-dialog.mjs";
import { createStory, getStory, canAuthorStories, monsterManualAvailable, craftworksHoardAvailable } from "../services/encounter-story-service.mjs";
import { Dnd5eMonsterCatalogService } from "../services/dnd5e-monster-catalog-service.mjs";

const NS = "morelord-encounters";
const ids = ["morelord-encounters-configure", "morelord-encounters-stories", "morelord-encounters-custom", "morelord-encounters-roster", "morelord-craftworks-hoard"];
async function until(read, message) {
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    const value = read(); if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 40));
  }
  throw new Error(message);
}
const control = selector => until(() => document.querySelector(selector), `Missing test control: ${selector}`);
const storiesApp = () => [...foundry.applications.instances.values()].find(app => app.id === "morelord-encounters-stories");
const click = async selector => (await control(selector)).click();
const settled = () => until(() => storiesApp() && !storiesApp().busy, "Story action did not finish.");
function change(input, value) {
  if (input.type === "checkbox") input.checked = value; else input.value = value;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export async function runEncounterStoryTests() {
  return runInGameTests({ checks: [{
    id: "encounters.story-create-edit-duplicate-custom-combat-hoard",
    skip: !game.user.isGM ? "GM-only story authoring" : undefined,
    async run() {
      assert(canAuthorStories(), "Premium access is required for this test.");
      assert(monsterManualAvailable(), "The core Monster Manual is required for this test.");
      assert(craftworksHoardAvailable(), "Wait for Craftworks to finish loading before testing.");
      assert(!ids.some(id => document.getElementById(id)), "Close Encounters and Craftworks Hoard windows first.");
      const party = new Dnd5eMonsterCatalogService().partyCandidates();
      assert(party.length, "An eligible party is required.");
      const sources = structuredClone(game.settings.get(NS, "lastEncounterSources"));
      const fixtures = [];
      const initialActors = new Set(game.actors.map(actor => actor.id));
      const initialTokens = canvas.scene?.tokens.size ?? 0;
      let pending;
      try {
        pending = configureEncounter({ initial: { encounterSource: "stories", partyUuids: party.map(actor => actor.uuid) } });
        await control("#morelord-encounters-configure [name='encounterMode'][value='stories']");
        const titles = [...document.querySelectorAll("#morelord-encounters-configure .ml-choice-card strong")].map(el => el.textContent);
        assert(titles.includes("Combat Encounters") && titles.includes("Guide Me Encounters") && titles.includes("Encounter Stories"), "Builder mode names are incorrect.");
        await click("#morelord-encounters-configure [data-action='generate']");
        await pending; pending = null;
        assert(!document.querySelector("#morelord-encounters-stories").textContent.includes("Start a story"), "Redundant Start a Story section remains.");
        const create = await control("#morelord-encounters-stories .ml-list-toolbar [data-story-action='new']");
        assert(create.textContent.trim() === "Create a Story", "Create action does not follow the library toolbar convention.");
        const original = await createStory({ template: true });
        fixtures.push(original);
        // Reproduce the old duplicate heading while preserving an independent GM edit.
        const opening = original.pages.contents[2];
        const header = `<div class="ml-section-heading"><div><h2>${opening.name}</h2><p>Private GM preparation</p></div></div>`;
        await opening.update({ "text.content": header + opening.text.content.replace(/<aside.*?<\/aside>/, BROTHERS_KEEPER_REVISIONS[1][0].replaceAll("&#39;", "'")) + "<p>Custom GM note survives repair.</p>" });
        await original.update({ "flags.morelord-encounters.encounterStory.presentationVersion": 1 });
        await storiesApp().render({ force: true });
        await click(`#morelord-encounters-stories a[data-story-action='open'][data-story-id='${original.id}']`);
        await settled();
        assert(original.ownership.default === 0 && original.pages.size === 7, "Template journal is incomplete or not private.");
        assert(openEncounterStories({}) === storiesApp(), "Reopening Stories did not reuse the existing ApplicationV2 window.");
        document.querySelector("#morelord-encounters-stories [data-story-action='journal']").focus();
        assert(game.keyboard.hasFocus, "Story controls allow Foundry canvas keybindings to intercept keyboard navigation.");
        assert(!document.querySelector("#morelord-encounters-stories [data-story-action='duplicate']") && !document.querySelector("#morelord-encounters-stories [data-story-field]"), "Reading view contains redundant authoring controls.");
        assert(!opening.text.content.includes(header) && opening.text.content.includes("Custom GM note survives repair."), "Journal heading repair lost GM edits or failed to remove the duplicate.");
        assert(opening.text.content.includes('class="ml-callout"') && opening.text.content.includes("Read aloud"), "Player-safe callouts are missing.");
        const initial = getStory(original).encounters[0].roster;
        assert(initial.members.length === 1 && initial.members[0].count === 2, "The first roster does not contain two giants.");
        assert(initial.members[0].sourceId === "dnd-monster-manual.actors", "The story substituted another monster source.");
        const page = original.pages.contents[0];
        await page.update({ "text.content": `${page.text.content}<p>Story regression: independent narrative edit.</p>` });
        await click("#morelord-encounters-stories [data-story-action='journal']");
        await until(() => original.sheet.rendered, "The native journal did not open.");
        await original.sheet.close();
        await settled();
        await click("#morelord-encounters-stories [data-story-action='library']");
        await settled();
        await click(`#morelord-encounters-stories .ml-icon-button[data-story-action='duplicate'][data-story-id='${original.id}']`);
        const copy = await until(() => storiesApp()?.journal?.id !== original.id && storiesApp()?.journal, "Story duplication failed.");
        fixtures.push(copy);
        await settled();
        assert(copy.pages.contents.some(page => page.text.content.includes("independent narrative edit")), "Duplication lost edited prose.");
        const details = await control("#morelord-encounters-stories [data-story-field='name']");
        change(details, `Encounter story regression ${foundry.utils.randomID()}`);
        change(await control("#morelord-encounters-stories [data-story-field='genre']"), "eldritch-horror");
        change(await control("#morelord-encounters-stories [data-story-field='durationMinutes']"), "300");
        await click("#morelord-encounters-stories [data-story-action='save-details']");
        await settled();
        assert(getStory(copy).genre === "eldritch-horror" && getStory(copy).continuation, "Editable metadata did not save.");
        assert(getStory(original).genre === "fantasy", "Editing the copy altered the original.");
        const selection = [...document.querySelectorAll("#morelord-encounters-stories [name='storyPartyUuid']")];
        selection.forEach(input => change(input, false));
        assert(document.querySelector("[data-story-rating='brothers']").textContent === "Select a participating party", "Empty party still displays a difficulty.");
        selection.forEach(input => change(input, true));
        assert(document.querySelector("[data-story-rating='brothers']").textContent !== "Select a participating party", "Difficulty did not update after party selection.");
        for (const accept of [false, true]) {
          await click("#morelord-encounters-stories [data-story-action='edit-combat']");
          await click("#morelord-encounters-configure [data-action='generate']");
          await control("#morelord-encounters-custom .ml-encounters-custom-member");
          assert(document.querySelector("#morelord-encounters-custom .ml-stepper strong").textContent === "2", "Custom builder did not start with the saved quantity.");
          await click("#morelord-encounters-custom [data-custom-action='decrease']");
          if (accept) await click("#morelord-encounters-custom .form-footer [data-action='generate']");
          else await [...foundry.applications.instances.values()].find(app => app.id === "morelord-encounters-custom").close();
          await settled();
          assert(getStory(copy).encounters[0].roster.members[0].count === (accept ? 1 : 2), "Cancel/save did not preserve the correct roster.");
        }
        assert(getStory(original).encounters[0].roster.members[0].count === 2, "Editing a duplicate changed the original roster.");
        assert(copy.pages.contents.some(page => page.text.content.includes("independent narrative edit")), "Combat editing rewrote the journal prose.");
        await click("#morelord-encounters-stories [data-story-action='hoard']");
        const profile = await control("#morelord-craftworks-hoard [name='profile']");
        assert(profile.value === "5-10", "Story hoard opened with the wrong challenge range.");
        const hoard = [...foundry.applications.instances.values()].find(app => app.id === "morelord-craftworks-hoard");
        assert(hoard.result === null, "Opening the story hoard rolled or awarded treasure.");
        await settled();
        change(profile, "11-16");
        await click("#morelord-encounters-stories [data-story-action='hoard']");
        await settled();
        assert(hoard.rendered && hoard.profileId === "11-16" && hoard.result === null, "Reopening the hoard discarded existing work.");
        await hoard.close();
        await settled();
        assert(game.actors.size === initialActors.size && game.actors.every(actor => initialActors.has(actor.id)), "Story preparation created Actors unexpectedly.");
        assert((canvas.scene?.tokens.size ?? 0) === initialTokens, "Story preparation deployed tokens unexpectedly.");
      } finally {
        for (const app of [...foundry.applications.instances.values()]) if (ids.includes(app.id)) await app.close();
        if (pending) await pending;
        for (const journal of fixtures.reverse()) {
          if (journal.sheet?.rendered) await journal.sheet.close();
          if (game.journal.has(journal.id)) await journal.delete();
        }
        if (JSON.stringify(game.settings.get(NS, "lastEncounterSources")) !== JSON.stringify(sources)) await game.settings.set(NS, "lastEncounterSources", sources);
      }
    }
  }] });
}

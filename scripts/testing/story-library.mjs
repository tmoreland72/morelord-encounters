import { assert } from "../../../morelord-core/scripts/testing/in-game.js";
import { EncounterStoriesApp } from "../apps/encounter-stories-dialog.mjs";
import { ADDITIONAL_STORIES } from "../stories/additional-stories.mjs";
import { canAuthorStories, getStory } from "../services/encounter-story-service.mjs";

export const storyLibraryCheck = {
  id: "encounters.expanded-story-library",
  async run() {
    assert(game.user.isGM && canAuthorStories(), "Premium GM required.");
    assert(!document.getElementById("morelord-encounters-stories"), "Close the Stories window first.");
    const initial = new Set(game.journal.map(entry => entry.id));
    const fixtures = [];
    const app = new EncounterStoriesApp();
    try {
      for (const seed of ADDITIONAL_STORIES) {
        app.journalId = null;
        await app.render({ force: true });
        const button = app.element.querySelector(`[data-story-action="template"][data-story-id="${seed.id}"]`);
        assert(button && !button.disabled, `Missing available template: ${seed.id}. Run before creating permanent copies.`);
        button.click();
        const deadline = Date.now() + 15000;
        while (app.busy && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 30));
        assert(!app.busy && app.journal && !initial.has(app.journal.id), "Template action did not create a new journal.");
        const journal = app.journal;
        fixtures.push(journal);
        assert(getStory(journal).templateId === seed.id, "Copy action selected the wrong story.");
        assert(journal.ownership.default === 0 && journal.pages.size === 6, "Story pages or privacy incorrect.");
        assert(journal.pages.contents.some(page => page.text.content.includes("Read aloud")), "Read-aloud callouts missing.");
        assert(getStory(journal).encounters.length === 0, "Unexpected automatic combat roster.");
        assert(app.element.querySelector('[data-story-action="add-combat"]'), "Optional combat action missing.");
        await journal.delete();
      }
    } finally {
      await app.close();
      for (const journal of fixtures) if (game.journal.has(journal.id)) await journal.delete();
    }
  }
};

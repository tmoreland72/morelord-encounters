import { Dnd5eMonsterCatalogService } from "../services/dnd5e-monster-catalog-service.mjs";
import { STORY_TEMPLATES } from "../stories/story-library.mjs";
import { STORY_GENRES, STORY_HOARD_PROFILES, rateStoryEncounter } from "../domain/encounter-stories.mjs";
import { canAuthorStories, requireStoryGM, listStories, getStory, createStory, duplicateStory, saveStoryDetails, saveStoryCombat, validateStoryRoster, monsterManualAvailable, craftworksHoardAvailable, openStoryHoard, upgradeStoryJournal } from "../services/encounter-story-service.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const labelDifficulty = value => value === "medium" ? "Standard" : value ? value[0].toUpperCase() + value.slice(1) : "Select a participating party";
const options = (choices, selected) => Object.entries(choices).map(([value, label]) => ({ value, label, selected: selected === value }));

export class EncounterStoriesApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor({ partyUuids = [], configureCombat, showRoster, journalId = null } = {}) {
    super();
    requireStoryGM();
    this.partyUuids = new Set(partyUuids);
    this.configureCombat = configureCombat;
    this.showRoster = showRoster;
    this.journalId = journalId;
    this.editing = false;
    this.busy = false;
  }
  static DEFAULT_OPTIONS = {
    id: "morelord-encounters-stories", tag: "form", classes: ["ml-window", "ml-encounters-module"],
    position: { width: 850, height: 800 }, window: { title: "Encounter Stories", icon: "fa-solid fa-book-open", resizable: true }
  };
  static PARTS = { content: { template: "modules/morelord-encounters/templates/encounter-stories.hbs" } };
  get journal() { return game.journal.get(this.journalId); }
  party() { return new Dnd5eMonsterCatalogService().partyCandidates().filter(actor => this.partyUuids.has(actor.uuid)); }

  async _prepareContext() {
    const premium = canAuthorStories();
    const journal = this.journal;
    if (journal) await upgradeStoryJournal(journal);
    const story = journal ? getStory(journal) : null;
    const party = this.party();
    const candidates = new Dnd5eMonsterCatalogService().partyCandidates();
    return {
      premium, canCreateTemplate: premium && monsterManualAvailable(), monsterManualAvailable: monsterManualAvailable(),
      craftworksAvailable: craftworksHoardAvailable(), canOpenHoard: premium && craftworksHoardAvailable(),
      journalId: journal?.id, name: journal?.name, story, editing: this.editing,
      templates: STORY_TEMPLATES.filter(seed => !listStories().some(entry => getStory(entry).templateId === seed.id))
        .map(seed => ({ ...seed, genreLabel: STORY_GENRES[seed.genre], canCreate: premium && (!seed.sourceModule || monsterManualAvailable()),
          requirement: seed.sourceModule ? "Requires the core D&D Monster Manual." : "No creature pack required. Complete non-combat resolution included." })),
      stories: listStories().map(entry => {
        const data = getStory(entry);
        return { id: entry.id, name: entry.name, summary: data.summary, genre: STORY_GENRES[data.genre], durationMinutes: data.durationMinutes, continuation: data.continuation };
      }),
      parties: candidates.map(actor => ({ ...actor, selected: this.partyUuids.has(actor.uuid), detail: actor.type === "npc" ? `CR ${actor.cr} · +${actor.xp} XP budget (estimate)` : `Level ${actor.level}` })),
      genres: options(STORY_GENRES, story?.genre),
      hoardProfiles: options(STORY_HOARD_PROFILES, story?.hoardProfile),
      genreLabel: STORY_GENRES[story?.genre], hoardLabel: STORY_HOARD_PROFILES[story?.hoardProfile],
      pages: journal?.pages.contents.slice().sort((a, b) => a.sort - b.sort).map(page => ({ id: page.id, name: page.name })) ?? [],
      encounters: (story?.encounters ?? []).map(entry => {
        const rated = rateStoryEncounter(entry.roster, party);
        return { id: entry.id, name: entry.name, description: entry.roster.description, rating: labelDifficulty(rated.difficulty), xp: rated.totalXp, count: rated.creatureCount,
          members: rated.members.map(member => ({ ...member, source: member.sourceLabel ?? member.packLabel ?? member.sourceId })) };
      })
    };
  }
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.querySelectorAll("[data-story-action]").forEach(button => button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      void this.#act(button.dataset.storyAction, button.dataset.storyId ?? button.dataset.encounterId ?? button.dataset.pageId);
    }));
    this.element.querySelectorAll("[name='storyPartyUuid']").forEach(input => input.addEventListener("change", () => {
      if (input.checked) this.partyUuids.add(input.value); else this.partyUuids.delete(input.value);
      if (!this.journal) return;
      for (const entry of getStory(this.journal).encounters ?? []) {
        const label = this.element.querySelector(`[data-story-rating='${entry.id}']`);
        if (label) label.textContent = labelDifficulty(rateStoryEncounter(entry.roster, this.party()).difficulty);
      }
    }));
  }
  async #act(action, id) {
    if (this.busy) return;
    this.busy = true;
    try {
      if (action === "close") { await this.close(); return; }
      if (action === "library") { this.journalId = null; this.editing = false; }
      if (action === "open" || action === "edit") { this.journalId = id; this.editing = action === "edit"; }
      if (action === "done") this.editing = false;
      if (action === "template" || action === "new") { this.journalId = (await createStory({ template: action === "template" ? (id ?? true) : false })).id; this.editing = true; }
      if (action === "duplicate") { this.journalId = (await duplicateStory(game.journal.get(id))).id; this.editing = true; }
      if (action === "journal" || action === "page") {
        await this.journal.sheet.render(true, action === "page" ? { pageId: id } : {});
        return;
      }
      if (action === "save-details") {
        const values = Object.fromEntries([...this.element.querySelectorAll("[data-story-field]")].map(input => [input.dataset.storyField, input.type === "checkbox" ? input.checked : input.value]));
        await saveStoryDetails(this.journal, values);
        ui.notifications.info("Story details saved. Journal pages and combat rosters are preserved.");
      }
      if (action === "hoard") { await openStoryHoard(this.journal); return; }
      if (action === "roster") {
        const entry = getStory(this.journal).encounters.find(entry => entry.id === id);
        if (!this.party().length) throw new Error("Select the participating party before preparing combat.");
        await validateStoryRoster(entry.roster);
        await this.showRoster(rateStoryEncounter(entry.roster, this.party()));
      }
      if (action === "edit-combat" || action === "add-combat") {
        if (!canAuthorStories()) throw new Error("Editing story combat requires Morelord Premium.");
        if (!this.party().length) throw new Error("Select the participating party before editing combat.");
        const journal = this.journal;
        const entry = action === "edit-combat" ? getStory(journal).encounters.find(entry => entry.id === id) : null;
        const sourceIds = [...new Set((entry?.roster.members ?? []).map(member => member.sourceSelectorId ?? member.sourceId).filter(Boolean))];
        const roster = await this.configureCombat({ initial: { encounterSource: "custom", partyUuids: [...this.partyUuids], sourceIds }, initialMembers: entry?.roster.members ?? [], customOnly: true });
        if (roster?.members?.length) {
          await validateStoryRoster(roster);
          await saveStoryCombat(journal, entry?.id, roster);
          if (roster.partyUuids) this.partyUuids = new Set(roster.partyUuids);
          ui.notifications.info("Combat encounter saved to this story copy. Review its narrative and hoard profile if you changed the creatures.");
        }
      }
      await this.render({ force: true });
    } catch (error) {
      console.error("Morelord Encounters | Encounter Story action failed", error);
      ui.notifications.error(error.message);
    } finally { this.busy = false; }
  }
}

export function openEncounterStories(options) {
  requireStoryGM();
  const existing = [...foundry.applications.instances.values()].find(app => app.id === "morelord-encounters-stories");
  if (existing) { existing.bringToFront(); return existing; }
  return new EncounterStoriesApp(options).render({ force: true });
}

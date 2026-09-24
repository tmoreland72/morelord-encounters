import { MODULE_ID } from "../domain/constants.mjs";
import { STORY_FLAG, normalizeStoryDetails, storyPageContent, blankStoryPages, upgradeStoryPageContent } from "../domain/encounter-stories.mjs";
import { BROTHERS_KEEPER } from "../stories/brothers-keeper.mjs";
import { STORY_TEMPLATES } from "../stories/story-library.mjs";
import { CoreAccessService } from "./core-access-service.mjs";
import { Dnd5eMonsterCatalogService } from "./dnd5e-monster-catalog-service.mjs";

export function requireStoryGM() {
  if (!game.user?.isGM) throw new Error("Only GMs can access Encounter Stories.");
}
export function canAuthorStories() { return Boolean(game.user?.isGM && new CoreAccessService().access.premium); }
export function requireStoryPremium() {
  requireStoryGM();
  if (!canAuthorStories()) throw new Error("Encounter Story creation and combat preparation require Morelord Premium. Existing journals remain available.");
}
export function getStory(journal) {
  requireStoryGM();
  const data = journal?.getFlag(MODULE_ID, STORY_FLAG);
  if (!data || data.schemaVersion !== 1) throw new Error("This Encounter Story is unavailable or uses an unsupported format.");
  return structuredClone(data);
}
export function listStories() {
  requireStoryGM();
  return [...(game.journal ?? [])].filter(journal => journal.getFlag(MODULE_ID, STORY_FLAG)?.schemaVersion === 1)
    .sort((left, right) => left.name.localeCompare(right.name));
}
export function monsterManualAvailable() {
  const pack = game.packs?.get(BROTHERS_KEEPER.sourcePack);
  return Boolean(game.modules?.get(BROTHERS_KEEPER.sourceModule)?.active && pack?.documentName === "Actor"
    && pack.metadata?.packageName === BROTHERS_KEEPER.sourceModule);
}
export async function resolveBrothersRoster() {
  requireStoryPremium();
  if (!monsterManualAvailable()) throw new Error("Brother's Keeper requires the installed D&D Monster Manual Actor compendium. No SRD or third-party substitute will be used.");
  const monsters = await new Dnd5eMonsterCatalogService().monsters([BROTHERS_KEEPER.sourcePack]);
  const giant = monsters.find(monster => monster.id === BROTHERS_KEEPER.actorId && monster.name === BROTHERS_KEEPER.actorName)
    ?? monsters.find(monster => monster.name === BROTHERS_KEEPER.actorName);
  if (!giant) throw new Error("The Monster Manual compendium does not contain a readable Hill Giant Actor.");
  return { name: BROTHERS_KEEPER.combatName, description: "Two hill giant brothers. Mogg guards the entrance while Brugg confronts intruders. Review confined terrain and escape routes.", members: [{ ...giant, count: 2 }] };
}
export async function createStory({ template = false, name, details = {} } = {}) {
  requireStoryPremium();
  // Preserve the original boolean API for existing callers and saved workflows.
  const seed = template ? STORY_TEMPLATES.find(entry => entry.id === (template === true ? BROTHERS_KEEPER.id : template)) : null;
  if (template && !seed) throw new Error("This Encounter Story template is unavailable.");
  const roster = seed?.id === BROTHERS_KEEPER.id ? await resolveBrothersRoster() : null;
  const title = String(name ?? seed?.name ?? "New Encounter Story").trim().slice(0, 200);
  if (!title) throw new Error("Enter a story name.");
  const pages = seed?.pages ?? blankStoryPages();
  return JournalEntry.create({
    name: title, ownership: { default: 0 },
    pages: pages.map((page, index) => ({ name: page.name, type: "text", sort: (index + 1) * 100000,
      ownership: { default: -1 }, text: { format: 1, content: storyPageContent(page) } })),
    flags: { [MODULE_ID]: { [STORY_FLAG]: {
      schemaVersion: 1, presentationVersion: 3, templateId: seed?.id ?? null,
      ...normalizeStoryDetails({ ...(seed ?? {}), ...details }),
      encounters: roster ? [{ id: "brothers", name: roster.name, roster }] : []
    } } }
  });
}
export async function duplicateStory(journal) {
  requireStoryPremium();
  await upgradeStoryJournal(journal);
  const story = getStory(journal);
  const newId = foundry.utils.randomID();
  const pages = journal.pages.map(page => {
    const data = page.toObject();
    // Retain page IDs within the new parent, and retarget links internal to this journal.
    if (data.text?.content) data.text.content = data.text.content.replaceAll(journal.uuid, `JournalEntry.${newId}`);
    data.ownership = { default: -1 };
    return data;
  });
  return JournalEntry.create({ _id: newId, name: `${journal.name} (Copy)`, ownership: { default: 0 }, pages,
    flags: { [MODULE_ID]: { [STORY_FLAG]: story } } }, { keepId: true });
}
export async function saveStoryDetails(journal, { name, ...details }) {
  requireStoryPremium();
  getStory(journal);
  name = String(name ?? "").trim().slice(0, 200);
  if (!name) throw new Error("Enter a story name.");
  const updates = Object.fromEntries(Object.entries(normalizeStoryDetails({ ...getStory(journal), ...details }))
    .map(([key, value]) => [`flags.${MODULE_ID}.${STORY_FLAG}.${key}`, value]));
  // Narrative pages are deliberately excluded: the native journal editor owns their text.
  return journal.update({ name, ...updates });
}
export async function saveStoryCombat(journal, encounterId, roster) {
  requireStoryPremium();
  if (!roster?.members?.length) throw new Error("Add at least one creature before saving the combat encounter.");
  const encounters = getStory(journal).encounters ?? [];
  const existing = encounterId ? encounters.find(entry => entry.id === encounterId) : null;
  if (encounterId && !existing) throw new Error("This story encounter no longer exists. Reopen the story.");
  const saved = { id: existing?.id ?? foundry.utils.randomID(), name: existing?.name ?? roster.name ?? "Prepared Combat", roster: structuredClone(roster) };
  saved.roster.name = saved.name;
  if (existing) encounters[encounters.indexOf(existing)] = saved;
  else encounters.push(saved);
  await journal.update({ [`flags.${MODULE_ID}.${STORY_FLAG}.encounters`]: encounters });
  return saved;
}
export async function validateStoryRoster(roster) {
  requireStoryPremium();
  for (const member of roster?.members ?? []) {
    const actor = await fromUuid(member.uuid);
    if (actor?.documentName !== "Actor") throw new Error(`The source Actor for ${member.name} is unavailable. Enable its compendium or replace it in Edit Combat Encounter.`);
  }
}
export function craftworksHoardAvailable() {
  const module = game.modules?.get("morelord-craftworks");
  return Boolean(module?.active && typeof module.api?.openHoard === "function");
}
export async function openStoryHoard(journal) {
  requireStoryPremium();
  const story = getStory(journal);
  if (!craftworksHoardAvailable()) throw new Error("Enable Morelord Craftworks and wait for it to finish loading to prepare this treasure hoard.");
  const current = [...foundry.applications.instances.values()].find(app => app.id === "morelord-craftworks-hoard" && app.rendered);
  if (current) { current.bringToFront(); ui.notifications.info("Your existing Craftworks hoard remains open. Finish or close it before preparing this story's hoard."); return current; }
  return game.modules.get("morelord-craftworks").api.openHoard({ profileId: story.hoardProfile });
}

export async function upgradeStoryJournal(journal) {
  requireStoryGM();
  const story = getStory(journal);
  if (story.presentationVersion >= 3) return;
  const updates = journal.pages.contents.flatMap(page => {
    if (page.type !== "text" || !page.text?.content) return [];
    const content = upgradeStoryPageContent(page, story.templateId);
    return content === page.text.content ? [] : [{ _id: page.id, "text.content": content }];
  });
  if (updates.length) await journal.updateEmbeddedDocuments("JournalEntryPage", updates);
  await journal.update({ "flags.morelord-encounters.encounterStory.presentationVersion": 3 });
}

import { BROTHERS_KEEPER_REVISIONS } from "../stories/brothers-keeper-revisions.mjs";
import { buildCustomEncounter } from "./encounter-generator.mjs";

export const STORY_FLAG = "encounterStory";
export const CAMPAIGN_SETTINGS = { "general-fantasy": "General Fantasy", faerun: "Faerûn", drakkenheim: "Drakkenheim" };
export const STORY_GENRES = { fantasy: "Fantasy", "eldritch-horror": "Eldritch Horror" };
export const STORY_PLANES = { material: "Material Plane", excursion: "Planar excursion", mixed: "Material Plane with planar intrusion" };
export const STORY_HOARD_PROFILES = { "0-4": "Challenge 0–4", "5-10": "Challenge 5–10", "11-16": "Challenge 11–16", "17+": "Challenge 17+" };
const text = (value, max) => String(value ?? "").trim().slice(0, max);
const choice = (value, choices, fallback) => Object.hasOwn(choices, value) ? value : fallback;

export function normalizeStoryDetails(value = {}) {
  const duration = Number(value.durationMinutes);
  return {
    campaignSetting: choice(value.campaignSetting, CAMPAIGN_SETTINGS, "general-fantasy"),
    genre: choice(value.genre, STORY_GENRES, "fantasy"),
    environment: text(value.environment, 240),
    plane: choice(value.plane, STORY_PLANES, "material"),
    durationMinutes: Number.isFinite(duration) && duration > 0 ? Math.min(1440, Math.max(30, Math.round(duration))) : 180,
    continuation: Boolean(value.continuation) || duration > 240,
    summary: text(value.summary, 2000),
    hoardProfile: choice(value.hoardProfile, STORY_HOARD_PROFILES, "5-10")
  };
}

export function rateStoryEncounter(encounter, party) {
  const rated = buildCustomEncounter(encounter?.members ?? [], party);
  return { ...rated, name: encounter?.name || "Prepared Combat", description: encounter?.description || "A prepared story encounter.",
    difficulty: party.length && rated.members.length ? rated.difficulty : null };
}

// Seed the existing custom builder without retaining references to the story snapshot.
export function customEncounterSelection(members, monsters) {
  const selected = new Map();
  for (const member of members ?? []) {
    const monster = monsters.find(candidate => candidate.uuid === member.uuid) ?? member;
    const count = Math.floor(Number(member.count));
    if (!monster.uuid || !Number.isSafeInteger(count) || count <= 0) continue;
    selected.set(monster.uuid, { ...structuredClone(monster), count: (selected.get(monster.uuid)?.count ?? 0) + count });
  }
  return selected;
}

const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
export function storyParagraphContent(paragraph) {
  if (typeof paragraph === "string") return `<p>${escape(paragraph)}</p>`;
  return `<aside class="ml-callout" data-tone="info"><i class="fa-solid fa-volume-high" aria-hidden="true"></i><div><strong>Read aloud</strong><p>${escape(paragraph.readAloud)}</p></div></aside>`;
}
export function storyPageContent(page) {
  return `<div class="ml-app ml-stack"><section class="ml-surface ml-stack" data-gap="3">${page.paragraphs.map(storyParagraphContent).join("")}</section></div>`;
}

export function blankStoryPages() {
  return [
    { name: "1. Premise and GM Secret", paragraphs: ["What brings the party here? What is really happening? Add your existing notes and document links here."] },
    { name: "2. People and Motives", paragraphs: ["Who wants what? What could change their mind? What happens if the party ignores the situation?"] },
    { name: "3. Opening and Clues", paragraphs: ["Describe the opening and clues available through engagement. Add optional checks and alternative ways forward."] },
    { name: "4. Locations and Confrontation", paragraphs: ["Link maps and references. Describe player choices, optional combat triggers, escape routes, and ways to resolve the situation without fighting."] },
    { name: "5. Hoard and Aftermath", paragraphs: ["Describe when the party gains access to the Craftworks hoard. Record its recipient and award once resolved. Finish the immediate story within four hours unless deliberately marked for continuation."] },
    { name: "6. GM Notes and References", paragraphs: ["Collect scattered ideas, paste notes, and drag Foundry document links into the journal editor. Record promises, changes, and follow-up hooks here. Keep player handouts in separate documents."] }
  ];
}

// Native page titles already appear in the journal navigation. Remove only our
// original wrapper and exact seed paragraphs, leaving custom GM text untouched.
export function upgradeStoryPageContent(page, templateId) {
  let content = page.text.content;
  const heading = `<div class="ml-section-heading"><div><h2>${escape(page.name)}</h2><p>Private GM preparation</p></div></div>`;
  content = content.replace(heading, "");
  if (templateId === "brothers-keeper") for (const [before, after] of BROTHERS_KEEPER_REVISIONS) {
    // Foundry's HTML field canonicalizes quote entities when persisting pages.
    const quotes = html => html.replaceAll("&#39;", "'").replaceAll("&quot;", '"');
    if (!content.includes(after) && !content.includes(quotes(after))) {
      content = content.replace(content.includes(before) ? before : quotes(before), after);
    }
  }
  return content;
}

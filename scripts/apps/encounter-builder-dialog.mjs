import {
  getDefaultEncounterConfiguration,
  getLastEncounterSources,
  setDefaultEncounterConfiguration,
  setLastEncounterSources
} from "../core/settings.mjs";
import { normalizeEncounterConfiguration } from "../domain/encounter-configuration.mjs";
import { generateEncounterOptions, rerollEncounterMember } from "../domain/encounter-generator.mjs";
import { Dnd5eMonsterCatalogService } from "../services/dnd5e-monster-catalog-service.mjs";
import { Dnd5eMonsterSourceService } from "../services/dnd5e-monster-source-service.mjs";
import { CoreAccessService } from "../services/core-access-service.mjs";

const sourceService = new Dnd5eMonsterSourceService();
const catalogService = new Dnd5eMonsterCatalogService();
const coreAccess = new CoreAccessService();
const localize = key => game.i18n.localize(`MORELORD_ENCOUNTERS.${key}`);
const rerollContexts = new Map();

function configurationFromForm(form) {
  return normalizeEncounterConfiguration({
    difficulty: form.querySelector("[name='difficulty']")?.value ?? "medium",
    sourceIds: Array.from(form.querySelectorAll("[name='sourceId']:checked"), input => input.value),
    partyUuids: Array.from(form.querySelectorAll("[name='partyUuid']:checked"), input => input.value)
  });
}

function validateConfiguration(result) {
  if (!result.sourceIds.length) throw new Error(localize("NoSources"));
  if (!result.partyUuids.length) throw new Error(localize("NoParty"));
  return result;
}

export async function saveEncounterDefaultsFromButton(button) {
  const form = button.closest(".ml-encounters-source-form");
  if (!form) throw new Error("The encounter setup form is unavailable.");
  const result = validateConfiguration(configurationFromForm(form));
  button.disabled = true;
  try {
    await setDefaultEncounterConfiguration(result);
    await setLastEncounterSources(result.sourceIds);
    ui.notifications.info(localize("DefaultSaved"));
    button.innerHTML = `<i class="fa-solid fa-check"></i> ${localize("DefaultSavedShort")}`;
  } finally {
    button.disabled = false;
    setTimeout(() => {
      if (button.isConnected) button.innerHTML = `<i class="fa-solid fa-bookmark"></i> ${localize("SaveDefault")}`;
    }, 2000);
  }
  return result;
}

export async function showEncounterLearnMore() {
  const content = document.createElement("div");
  const wrapper = document.createElement("div");
  wrapper.className = "ml-encounters-learn-more";
  const intro = document.createElement("p");
  intro.textContent = "Morelord Encounters builds several encounter approaches from the party, selected monster books, and difficulty. The results are suggestions for the GM—not automatic combat balance guarantees.";
  wrapper.append(intro);

  const sections = [
    ["Party and difficulty", "The selected characters and their levels establish the D&D 5e XP target. Easy, Standard, Hard, and Deadly progressively increase that target."],
    ["Monster sources", "Only the source books selected on this page are indexed. Morelord Core determines which installed sources your account can use."],
    ["Encounter styles", "Each result applies a different composition: coordinated packs, a solo boss, a leader with minions, a horde, a distinct elite team, or an unpredictable random mix."],
    ["Variety", "Equally suitable creatures are randomized and balanced across selected source books. Regenerating all encounters creates new compositions; the rotate button on a creature replaces only that creature with a similarly rated alternative."],
    ["Final review", "Adjusted XP includes the D&D 5e multiple-creature multiplier. Always review the creatures and situation before play—battlefield conditions, tactics, surprise, magic items, and party resources can make the actual fight easier or harder."],
    ["Using the encounter", "After selecting an encounter, click a monster link to inspect its Actor or drag the link onto the scene. Repeat the drag for the displayed quantity."]
  ];
  for (const [title, explanation] of sections) {
    const section = document.createElement("section");
    const heading = document.createElement("h3");
    heading.textContent = title;
    const copy = document.createElement("p");
    copy.textContent = explanation;
    section.append(heading, copy);
    wrapper.append(section);
  }
  content.append(wrapper);

  return waitForEncounterDialog({
    id: "morelord-encounters-learn-more",
    classes: ["ml-window", "ml-encounters-module", "ml-encounters-dialog"],
    window: { title: localize("LearnMoreTitle"), icon: "fa-solid fa-circle-info" },
    position: { width: 680, height: Math.max(480, Math.min(window.innerHeight - 100, 760)) },
    modal: false,
    content,
    buttons: [{ action: "close", label: localize("Close"), default: true }]
  }, { rejectClose: false });
}

function waitForEncounterDialog(config, options = {}) {
  config.classes = [...new Set([...(config.classes ?? []), "ml-encounters-dialog"])];
  if (config.content instanceof HTMLElement && !config.content.querySelector(":scope > .ml-dialog-shell")) {
    const shell = document.createElement("div");
    shell.className = "ml-app ml-app-shell ml-dialog-shell";
    while (config.content.firstChild) shell.append(config.content.firstChild);
    config.content.append(shell);
  }
  config.window = { ...(config.window ?? {}), resizable: true };
  const promise = foundry.applications.api.DialogV2.wait(config, options);
  const resetScroll = (attempt = 0) => requestAnimationFrame(() => {
    const windowElement = (config.id ? document.getElementById(config.id) : null)
      ?? config.content?.closest?.(".application");
    const scrollElement = windowElement?.querySelector?.(".window-content") ?? config.content?.parentElement;
    if (scrollElement && windowElement) {
      let element = config.content;
      while (element && element !== windowElement) {
        element.scrollTop = 0;
        element = element.parentElement;
      }
      scrollElement.scrollTop = 0;
      return;
    }
    if (attempt < 60) resetScroll(attempt + 1);
  });
  resetScroll();
  return promise;
}

async function configure(initial, title) {
  const defaults = getDefaultEncounterConfiguration();
  const saved = normalizeEncounterConfiguration(initial ?? defaults);
  const discovered = await sourceService.availableSources();
  const access = coreAccess.access;
  const available = discovered.filter(source => coreAccess.canUseSource(source, access));
  console.info("morelord-encounters | Monster source access", {
    tier: coreAccess.tier,
    access,
    rawFeatures: coreAccess.rawFeatures,
    discovered: discovered.length,
    visible: available.length,
    hidden: discovered.filter(source => !coreAccess.canUseSource(source, access)).map(source => source.label)
  });
  const partyCandidates = catalogService.partyCandidates();
  const remembered = saved.sourceIds.length ? saved.sourceIds : getLastEncounterSources();
  const selected = new Set(remembered.length ? remembered : available.map(source => source.id));
  const selectedParty = new Set(saved.partyUuids.length
    ? saved.partyUuids
    : partyCandidates.map(actor => actor.uuid));
  const content = document.createElement("div");
  const form = document.createElement("div");
  form.className = "ml-section ml-encounters-source-form";
  const settingsHeading = document.createElement("h2");
  settingsHeading.className = "ml-page-title";
  settingsHeading.textContent = localize("EncounterSettings");
  const difficultyLabel = document.createElement("label");
  const difficultyText = document.createElement("span");
  difficultyText.textContent = localize("Difficulty");
  const difficulty = document.createElement("select");
  difficulty.name = "difficulty";
  for (const value of ["easy", "medium", "hard", "deadly"]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value === "medium" ? "Standard" : value[0].toUpperCase() + value.slice(1);
    option.selected = value === saved.difficulty;
    if (option.selected) option.setAttribute("selected", "selected");
    difficulty.append(option);
  }
  difficulty.value = saved.difficulty;
  difficultyLabel.append(difficultyText, difficulty);
  const partyHeading = document.createElement("h3");
  partyHeading.className = "ml-section-heading";
  partyHeading.textContent = localize("VerifyParty");
  const partyHelp = document.createElement("p");
  partyHelp.textContent = localize("PartyHelp");
  const partyList = document.createElement("div");
  partyList.className = "ml-grid ml-encounters-party-list";
  partyList.dataset.columns = "2";
  for (const actor of partyCandidates) {
    const label = document.createElement("label");
    label.className = "ml-choice-card ml-encounters-party-card";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "partyUuid";
    checkbox.value = actor.uuid;
    checkbox.checked = selectedParty.has(actor.uuid);
    checkbox.defaultChecked = checkbox.checked;
    if (checkbox.checked) checkbox.setAttribute("checked", "checked");
    const image = document.createElement("img");
    image.src = actor.img || "icons/svg/mystery-man.svg";
    image.alt = "";
    const text = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = actor.name;
    const detail = document.createElement("small");
    detail.textContent = `Level ${actor.level}${actor.hasPlayerOwner ? " · Player-owned" : ""}`;
    text.append(name, detail);
    label.append(checkbox, image, text);
    partyList.append(label);
  }
  if (!partyCandidates.length) {
    const empty = document.createElement("p");
    empty.textContent = localize("NoCharacters");
    partyList.append(empty);
  }
  const sourceHeading = document.createElement("h3");
  sourceHeading.className = "ml-section-heading";
  sourceHeading.textContent = localize("MonsterSources");
  const sourceList = document.createElement("div");
  sourceList.className = "ml-grid ml-encounters-source-list";
  sourceList.dataset.columns = "2";
  for (const source of available) {
    const label = document.createElement("label");
    label.className = "ml-choice-card ml-encounters-source-card";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "sourceId";
    checkbox.value = source.id;
    checkbox.checked = selected.has(source.id) || selected.has(source.packId);
    checkbox.defaultChecked = checkbox.checked;
    if (checkbox.checked) checkbox.setAttribute("checked", "checked");
    const icon = document.createElement("i");
    icon.className = "fa-solid fa-book-open ml-encounters-source-card__icon";
    label.append(checkbox, icon);
    const text = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = source.label;
    const detail = document.createElement("small");
    detail.textContent = source.packLabel || source.packId;
    text.append(name, detail);
    label.append(text);
    const open = document.createElement("button");
    open.type = "button";
    open.className = "ml-icon-button ml-encounters-source-open";
    open.dataset.morelordAction = "open-monster-compendium";
    open.dataset.packId = source.packId;
    open.title = `Open ${source.label} compendium`;
    open.setAttribute("aria-label", open.title);
    open.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i>';
    label.append(open);
    sourceList.append(label);
  }
  form.append(settingsHeading, difficultyLabel);
  form.append(partyHeading, partyHelp, partyList, sourceHeading, sourceList);
  const defaultControls = document.createElement("div");
  defaultControls.className = "ml-actions ml-encounters-default-controls";
  const saveDefault = document.createElement("button");
  saveDefault.type = "button";
  saveDefault.className = "ml-encounters-save-default";
  saveDefault.dataset.morelordAction = "save-encounter-defaults";
  saveDefault.innerHTML = `<i class="fa-solid fa-bookmark"></i> ${localize("SaveDefault")}`;
  const learnMore = document.createElement("button");
  learnMore.type = "button";
  learnMore.className = "ml-encounters-learn-more-button";
  learnMore.dataset.morelordAction = "learn-more-encounters";
  learnMore.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${localize("LearnMore")}`;
  defaultControls.append(learnMore, saveDefault);
  form.append(defaultControls);
  content.append(form);
  const renderedForm = () => document.getElementById("morelord-encounters-configure")
    ?.querySelector(".ml-encounters-source-form")
    ?? document.querySelector(".ml-encounters-dialog .ml-encounters-source-form")
    ?? form;
  let submittedConfiguration = null;
  const result = await waitForEncounterDialog({
    id: "morelord-encounters-configure",
    classes: ["ml-window", "ml-encounters-module", "ml-encounters-dialog"],
    window: { title: title ?? localize("Configure"), icon: "fa-solid fa-hydra" },
    position: { width: 720, height: Math.max(480, Math.min(window.innerHeight - 80, 900)) },
    content,
    buttons: [
      { action: "cancel", label: localize("Cancel"), callback: () => null },
      { action: "generate", label: localize("Generate"), icon: "fa-solid fa-dice", default: true, callback: async () => {
        submittedConfiguration = validateConfiguration(configurationFromForm(renderedForm()));
        await setLastEncounterSources(submittedConfiguration.sourceIds);
        return submittedConfiguration;
      } }
    ]
  }, { rejectClose: false });
  if (result && typeof result === "object" && Array.isArray(result.sourceIds) && Array.isArray(result.partyUuids)) {
    return normalizeEncounterConfiguration(result);
  }
  if (result === "generate") return submittedConfiguration;
  return null;
}

function encounterXpLabel(option) {
  return `${option.adjustedXp.toLocaleString()} adjusted XP · target ${option.budget.toLocaleString()} XP · ${option.creatureCount} creature${option.creatureCount === 1 ? "" : "s"} (${option.totalXp.toLocaleString()} base XP)`;
}

function simpleMonsterCard(option, member, memberIndex, monsters) {
  const rerollId = crypto.randomUUID();
  rerollContexts.set(rerollId, { option, memberIndex, monsters });
  const card = document.createElement("article");
  card.className = "ml-encounters-simple-monster-card";
  const image = document.createElement("img");
  image.src = member.img || "icons/svg/mystery-man.svg";
  image.alt = "";
  const copy = document.createElement("span");
  const name = document.createElement("strong");
  name.textContent = `${member.count}× ${member.name}`;
  const detail = document.createElement("small");
  detail.textContent = `CR ${member.cr} · ${member.sourceLabel ?? member.packLabel ?? member.sourceId}`;
  copy.append(name, detail);
  const actions = document.createElement("span");
  actions.className = "ml-actions ml-encounters-simple-monster-actions";
  const reroll = document.createElement("button");
  reroll.type = "button";
  reroll.className = "ml-icon-button ml-encounters-creature-reroll-button";
  reroll.dataset.morelordAction = "reroll-generated-creature";
  reroll.dataset.rerollId = rerollId;
  reroll.title = `Regenerate ${member.name}`;
  reroll.setAttribute("aria-label", reroll.title);
  reroll.innerHTML = '<i class="fa-solid fa-rotate"></i>';
  const open = document.createElement("button");
  open.type = "button";
  open.className = "ml-icon-button ml-encounters-creature-open-button";
  open.dataset.morelordAction = "open-encounter-actor";
  open.dataset.uuid = member.uuid;
  open.title = `Open ${member.name} Actor sheet`;
  open.setAttribute("aria-label", open.title);
  open.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i>';
  actions.append(reroll, open);
  card.append(image, copy, actions);
  return card;
}

export function rerollCreatureFromButton(button) {
  const context = rerollContexts.get(button.dataset.rerollId);
  if (!context) throw new Error("That generated creature is no longer available.");
  rerollEncounterMember(context.option, context.memberIndex, context.monsters);
  const member = context.option.members[context.memberIndex];
  const group = button.closest(".ml-encounters-option");
  button.closest(".ml-encounters-simple-monster-card")?.replaceWith(
    simpleMonsterCard(context.option, member, context.memberIndex, context.monsters)
  );
  const xp = group?.querySelector(".ml-encounters-xp");
  if (xp) xp.textContent = encounterXpLabel(context.option);
  return member;
}

async function optionContent(options, party, monsters) {
  const content = document.createElement("div");
  const summary = document.createElement("p");
  const fallback = party.some(member => member.fallback) ? ` ${localize("PartyFallback")}` : "";
  const difficulty = options[0]?.difficulty === "medium" ? "Standard" : `${options[0]?.difficulty?.[0]?.toUpperCase() ?? ""}${options[0]?.difficulty?.slice(1) ?? ""}`;
  summary.textContent = `${difficulty} difficulty · ${localize("Party")}: ${party.map(member => `${member.name} (${member.level})`).join(", ")}.${fallback}`;
  const list = document.createElement("div");
  list.className = "ml-encounters-options";
  for (const [index, option] of options.entries()) {
    const group = document.createElement("section");
    group.className = "ml-encounters-option";
    group.dataset.encounterIndex = String(index);
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "encounterOption";
    radio.value = String(index);
    radio.checked = index === 0;
    if (index === 0) radio.setAttribute("checked", "checked");
    const body = document.createElement("div");
    body.className = "ml-encounters-option-body";
    const heading = document.createElement("strong");
    heading.textContent = option.name;
    const description = document.createElement("small");
    description.textContent = option.description;
    const roster = document.createElement("div");
    roster.className = "morelord-option-monsters";
    if (option.members.length) {
      option.members.forEach((member, memberIndex) => roster.append(simpleMonsterCard(option, member, memberIndex, monsters)));
    } else {
      roster.textContent = localize("NoMonsters");
    }
    const xp = document.createElement("small");
    xp.className = "ml-encounters-xp";
    xp.textContent = encounterXpLabel(option);
    body.append(heading, description, roster, xp);
    group.append(radio, body);
    list.append(group);
  }
  content.append(summary, list);
  return content;
}

async function choose(options, party, monsters) {
  const content = await optionContent(options, party, monsters);
  const result = await waitForEncounterDialog({
    id: "morelord-encounters-generated",
    classes: ["ml-window", "ml-encounters-module", "ml-encounters-dialog"],
    window: { title: localize("GeneratedTitle"), icon: "fa-solid fa-hydra" },
    position: { width: 900, height: Math.max(480, Math.min(window.innerHeight - 80, 900)) },
    content,
    buttons: [
      { action: "back", label: localize("Back"), icon: "fa-solid fa-arrow-left", callback: () => ({ action: "back" }) },
      { action: "regenerate", label: localize("Regenerate"), icon: "fa-solid fa-rotate", callback: () => ({ action: "regenerate" }) },
      { action: "select", label: localize("Select"), icon: "fa-solid fa-check", default: true, callback: () => {
        const selected = document.querySelector(".ml-encounters-dialog [name='encounterOption']:checked")
          ?? content.querySelector("[name='encounterOption']:checked");
        return { action: "select", encounter: options[Number(selected?.value ?? 0)] };
      } }
    ]
  }, { rejectClose: false });
  if (result && typeof result === "object" && typeof result.action === "string") return result;
  if (["back", "cancel", "regenerate", "select"].includes(result)) {
    if (result === "select") {
      const selected = document.querySelector(".ml-encounters-dialog [name='encounterOption']:checked")
        ?? content.querySelector("[name='encounterOption']:checked");
      return { action: "select", encounter: options[Number(selected?.value ?? 0)] };
    }
    return { action: result };
  }
  return { action: "cancel" };
}

function rosterContent(encounter) {
  const content = document.createElement("div");
  const wrapper = document.createElement("div");
  wrapper.className = "ml-encounters-roster";
  const intro = document.createElement("p");
  intro.textContent = localize("DragHelp");
  const list = document.createElement("div");
  list.className = "ml-encounters-monsters";
  for (const member of encounter.members) {
    const row = document.createElement("div");
    row.className = "ml-encounters-monster";
    if (member.img) {
      const image = document.createElement("img");
      image.src = member.img;
      image.alt = "";
      row.append(image);
    }
    const link = document.createElement("a");
    link.className = "content-link ml-encounters-actor-link";
    link.dataset.uuid = member.uuid;
    link.dataset.type = "Actor";
    link.dataset.morelordAction = "open-encounter-actor";
    link.dataset.morelordDragActor = member.uuid;
    link.draggable = true;
    link.title = `Drag ${member.name} onto the scene, or click to open its sheet`;
    link.innerHTML = `<i class="fa-solid fa-arrows-up-down-left-right"></i> ${member.count}× ${foundry.utils.escapeHTML(member.name)}`;
    const detail = document.createElement("span");
    detail.textContent = `CR ${member.cr} · AC ${member.ac || "—"} · HP ${member.hp || "—"} · ${member.totalXp.toLocaleString()} XP · ${localize("Source")}: ${member.sourceLabel ?? member.packLabel ?? member.sourceId}`;
    row.append(link, detail);
    list.append(row);
  }
  const total = document.createElement("strong");
  total.textContent = `${encounter.adjustedXp.toLocaleString()} adjusted XP · ${encounter.totalXp.toLocaleString()} base XP`;
  wrapper.append(intro, list, total);
  content.append(wrapper);
  return content;
}

async function showRoster(encounter) {
  await waitForEncounterDialog({
    id: "morelord-encounters-roster",
    classes: ["ml-window", "ml-encounters-module", "ml-encounters-dialog"],
    window: { title: `${encounter.name} — ${localize("Roster")}`, icon: "fa-solid fa-hydra" },
    position: { width: 560 },
    modal: false,
    content: rosterContent(encounter),
    buttons: [{ action: "close", label: localize("Close"), default: true }]
  }, { rejectClose: false });
}

export async function configureEncounter({ initial = null, title = null } = {}) {
  try {
    let currentConfiguration = initial;
    configurationLoop: while (true) {
      const configuration = await configure(currentConfiguration, title);
      if (!configuration?.sourceIds?.length || !configuration?.partyUuids?.length) return null;
      currentConfiguration = configuration;
      const monsters = await catalogService.monsters(configuration.sourceIds);
      if (!monsters.length) throw new Error(localize("NoMonstersFound"));
      const catalogCoverage = Object.fromEntries([...monsters.reduce((counts, monster) => {
        const source = monster.sourceLabel ?? monster.packLabel ?? monster.sourceId;
        counts.set(source, (counts.get(source) ?? 0) + 1);
        return counts;
      }, new Map())].sort(([left], [right]) => left.localeCompare(right)));
      console.info("morelord-encounters | Eligible monster catalog", {
        selectedSources: configuration.sourceIds.length,
        eligibleMonsters: monsters.length,
        bySource: catalogCoverage
      });
      const partyCandidates = catalogService.partyCandidates();
      const selectedParty = new Set(configuration.partyUuids);
      const party = partyCandidates.filter(actor => selectedParty.has(actor.uuid));
      while (true) {
        const options = generateEncounterOptions({ monsters, party, difficulty: configuration.difficulty });
        const choice = await choose(options, party, monsters);
        if (choice.action === "cancel") return null;
        if (choice.action === "back") continue configurationLoop;
        if (choice.action === "regenerate") continue;
        await showRoster(choice.encounter);
        return choice.encounter;
      }
    }
  } catch (error) {
    console.error("morelord-encounters | Encounter generation failed", error);
    ui.notifications.error(error.message);
    return null;
  }
}

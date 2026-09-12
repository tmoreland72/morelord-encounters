import { actorIdentity } from "../../../morelord-core/scripts/ui/actor-identity.js";
import {
  getDefaultEncounterConfiguration,
  getLastEncounterSources,
  setDefaultEncounterConfiguration,
  setLastEncounterSources
} from "../core/settings.mjs";
import { normalizeEncounterConfiguration } from "../domain/encounter-configuration.mjs";
import { createFacetState, cycleFacetState, matchesFacet } from "../domain/custom-encounter-filters.mjs";
import {
  buildCustomEncounter,
  encounterBudget,
  generateEncounterOptions,
  rerollEncounterMember
} from "../domain/encounter-generator.mjs";
import { lowestEncounterStealth } from "../domain/encounter-stealth.mjs";
import { Dnd5eMonsterCatalogService } from "../services/dnd5e-monster-catalog-service.mjs";
import { Dnd5eMonsterSourceService } from "../services/dnd5e-monster-source-service.mjs";
import { CoreAccessService } from "../services/core-access-service.mjs";
import { DrakkenheimEncounterService } from "../services/drakkenheim-encounter-service.mjs";
import { getSavedEncounters, saveEncounter } from "../services/saved-encounter-service.mjs";
import { withEncounterProgress } from "../services/encounter-progress.mjs";

const sourceService = new Dnd5eMonsterSourceService();
const catalogService = new Dnd5eMonsterCatalogService();
const coreAccess = new CoreAccessService();
const drakkenheimService = new DrakkenheimEncounterService({ coreAccess });
const localize = key => game.i18n.localize(`MORELORD_ENCOUNTERS.${key}`);
const rerollContexts = new Map();
const customBuilderContexts = new Map();
const rosterContexts = new Map();

function sectionHeading(titleKey, subtitleKey) {
  const header = document.createElement("div");
  header.className = "ml-section-heading";
  const body = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = localize(titleKey);
  const subtitle = document.createElement("p");
  subtitle.textContent = localize(subtitleKey);
  body.append(title, subtitle);
  header.append(body);
  return header;
}

function selectionToolbar(group, label) {
  const toolbar = document.createElement("div");
  toolbar.className = "ml-toolbar";
  toolbar.setAttribute("role", "group");
  toolbar.setAttribute("aria-label", label);
  for (const [checked, key, icon] of [[true, "SelectAll", "fa-check-double"], [false, "UnselectAll", "fa-xmark"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.morelordAction = "select-encounter-checkboxes";
    button.dataset.selectionGroup = group;
    button.dataset.checked = String(checked);
    button.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i> ${foundry.utils.escapeHTML(localize(key))}`;
    toolbar.append(button);
  }
  return toolbar;
}

export async function saveEncounterFromButton(button) {
  const roster = button.closest(".application")?.querySelector(".ml-encounters-roster");
  const encounter = rosterContexts.get(roster?.dataset.encounterId);
  if (!encounter) throw new Error("The encounter roster is unavailable.");
  button.disabled = true;
  try {
    const content = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = localize("EncounterName");
    const input = document.createElement("input");
    input.name = "encounterName";
    input.type = "text";
    input.required = true;
    input.value = encounter.name;
    input.setAttribute("value", encounter.name);
    label.append(input);
    content.append(label);
    while (true) {
      const result = await waitForEncounterDialog({
        id: "morelord-encounters-save",
        classes: ["ml-window", "ml-encounters-module"],
        window: { title: localize("SaveEncounter"), icon: "fa-solid fa-floppy-disk" },
        position: { width: 440 },
        content,
        buttons: [
          { action: "cancel", label: localize("Cancel") },
          { action: "save", label: localize("Save"), default: true, callback: (_event, _button, dialog) => ({
            name: dialog.element.querySelector("[name='encounterName']").value.trim()
          }) }
        ]
      }, { rejectClose: false });
      if (!result || typeof result !== "object") return;
      if (!result.name) {
        ui.notifications.warn(localize("EnterEncounterName"));
        continue;
      }
      await saveEncounter(result.name, encounter);
      ui.notifications.info(localize("EncounterSaved"));
      return;
    }
  } finally {
    button.disabled = false;
  }
}

export function updateEncounterSourcePanels(form) {
  const source = form.querySelector("[name='encounterSource']")?.value;
  const saved = source === "saved";
  for (const [selector, visible] of [
    [".ml-encounters-monster-panel", source === "monster-compendiums" || source === "custom"],
    [".ml-encounters-drakkenheim-panel", source === "drakkenheim"],
    [".ml-encounters-saved-panel", saved],
    [".ml-encounters-party-section", !saved]
  ]) {
    const panel = form.querySelector(selector);
    if (panel) panel.hidden = !visible;
  }
  const difficulty = form.querySelector("[name='difficulty']");
  difficulty.disabled = source !== "monster-compendiums";
  difficulty.closest("label").hidden = difficulty.disabled;
  const footer = form.closest(".application")?.querySelector(".form-footer");
  for (const button of footer?.querySelectorAll("[data-morelord-action='save-encounter-defaults']") ?? []) {
    button.hidden = saved;
    button.disabled = saved;
  }
  const generate = footer?.querySelector("[data-action='generate']");
  if (generate) {
    generate.disabled = saved && !form.querySelector("[name='savedEncounterId']:checked");
    (generate.querySelector("span") ?? generate).textContent = localize(saved ? "GenerateCustom" : "Generate");
  }
}

function configurationFromForm(form) {
  const encounterSource = form.querySelector("[name='encounterSource']")?.value ?? "monster-compendiums";
  return normalizeEncounterConfiguration({
    difficulty: form.querySelector("[name='difficulty']")?.value ?? "medium",
    sourceIds: Array.from(form.querySelectorAll("[name='sourceId']:checked"), input => input.value),
    partyUuids: Array.from(form.querySelectorAll("[name='partyUuid']:checked"), input => input.value),
    encounterSource,
    savedEncounterId: form.querySelector("[name='savedEncounterId']:checked")?.value,
    drakkenheimTableId: encounterSource === "drakkenheim"
      ? form.querySelector("[name='drakkenheimTableId']:checked")?.value
      : ""
  });
}

function validateConfiguration(result) {
  if (!result.sourceIds.length) throw new Error(localize("NoSources"));
  if (!result.partyUuids.length) throw new Error(localize("NoParty"));
  return result;
}

export async function saveEncounterDefaultsFromButton(button) {
  const form = button.closest(".ml-encounters-source-form")
    ?? button.closest(".application")?.querySelector(".ml-encounters-source-form");
  if (!form) throw new Error("The encounter setup form is unavailable.");
  let result = configurationFromForm(form);
  if (["monster-compendiums", "custom"].includes(result.encounterSource)) result = validateConfiguration(result);
  else if (result.encounterSource === "drakkenheim" && !result.drakkenheimTableId) throw new Error(localize("NoDrakkenheimLocation"));
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
    ["Encounter setup", "Choose Random Encounters, Custom Encounters, Drakkenheim Encounters (when eligible), or Saved Encounters. Type appears on the left, with difficulty on the right for Random Encounters. Save as Default preserves the setup."],
    ["Party and difficulty", "Select the participating characters, including any without player owners. Select All and Unselect All affect only the party list. Random encounters use the 2024 Low, Moderate, and High XP budgets for Easy, Standard, and Hard; Deadly uses 150 percent of High."],
    ["Monster sources", "Source discovery checks enabled Actor packs for eligible monsters, omitting character-only, vehicle-only, empty, and unreadable packs. Non-hostile humanoids are excluded. System Monsters (SRD) is SRD 5.1; system Actors is SRD 5.2. Core determines account access. Only selected sources supply the encounter; Select All and Unselect All affect only this list."],
    ["Custom encounters", "Choose Custom Encounters to browse eligible monsters by name, source, creature type, or challenge rating. The encounter's total XP and difficulty update whenever its roster changes."],
    ["Encounter styles", "Each result applies a different composition: coordinated packs, a solo boss, a leader with minions, a horde, a distinct elite team, or an unpredictable random mix."],
    ["Saved encounters", "Select Save on any final roster, enter a name, then Save or Cancel. Saving keeps the roster open. Choose Saved Encounters to review cards, select one, and Generate Encounter. Preview monster buttons open sheets, but dragging is available only on the final roster. Private Journal Entries store the saved quantities and GM notes; GMs can rename or delete them in the Journal directory. Source Actors must remain available."],
    ["Drakkenheim encounters", "Eligible Champion GMs with Dungeons of Drakkenheim and Monsters of Drakkenheim active can roll published location tables, including Sewers. Rival Adventurers randomly chooses among four documented rival parties and five Queen's Men gangs. Gangs suggest a leader and 1d6-bandit escort. Actors come exclusively from Monsters of Drakkenheim: Ratling Warrior replaces old ratlings and Deep Dreg Warrior replaces aquatic delerium dregs. Missing matches are reported rather than substituted from other books."],
    ["Variety", "Equally suitable creatures are randomized and balanced across selected source books. Regenerating all encounters creates new compositions; the rotate button on a creature replaces only that creature with a similarly rated alternative."],
    ["Final review", "The 2024 encounter budget uses the monsters' total XP without a creature-count multiplier. Always review the creatures and situation before play—battlefield conditions, tactics, surprise, magic items, and party resources can make the actual fight easier or harder."],
    ["Using the encounter", "After selecting an encounter, click a monster link to inspect its Actor or drag the link onto the scene. Repeat the drag for the displayed quantity. Roll Encounter Stealth uses the lowest creature modifier. The footer is Start Over, Save, Close. A working notification stays visible during loading and generation. Core remembers window position and size for this world and user."]
  ];
  const documentation = coreAccess.api?.ui?.documentation;
  if (documentation) {
    documentation.register({
      id: "morelord-encounters", title: localize("Name"), subtitle: localize("Subtitle"), icon: "fa-solid fa-hydra",
      sections: sections.map(([title, introduction], index) => ({ id: `section-${index}`, title, introduction, icon: "fa-solid fa-book-open" }))
    });
    return documentation.open("morelord-encounters");
  }
  for (const [title, explanation] of sections) {
    const section = document.createElement("section");
    section.className = "ml-surface";
    section.dataset.depth = "sunken";
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
    buttons: []
  }, { rejectClose: false });
}

function waitForEncounterDialog(config, options = {}) {
  const footerControls = config.footerControls ?? [];
  delete config.footerControls;
  if (!config.buttons?.length) {
    config.buttons = [{ action: "dismiss", label: "Dismiss" }];
    config.classes = [...(config.classes ?? []), "ml-encounters-titlebar-dismiss-only"];
  }
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
      const footer = windowElement.querySelector(".form-footer");
      if (footer && footerControls.length && !footer.querySelector("[data-morelord-footer-control]")) {
        for (const control of footerControls.toReversed()) {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.morelordFooterControl = "true";
          button.dataset.morelordAction = control.action;
          button.innerHTML = `<i class="${control.icon}"></i> ${foundry.utils.escapeHTML(control.label)}`;
          footer.insertBefore(button, control.beforeAction
            ? footer.querySelector(`[data-action="${control.beforeAction}"]`)
            : footer.firstChild);
        }
      }
      const sourceForm = windowElement.querySelector(".ml-encounters-source-form");
      if (sourceForm) updateEncounterSourcePanels(sourceForm);
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
  const drakkenheimTables = await drakkenheimService.availableTables();
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
  const settingsHeading = document.createElement("h1");
  settingsHeading.textContent = localize("Name");
  const pageHeader = document.createElement("header");
  pageHeader.className = "ml-hero";
  const headerIcon = document.createElement("i");
  headerIcon.className = "fa-solid fa-hydra ml-hero__icon";
  const headerBody = document.createElement("div");
  headerBody.className = "ml-hero__body";
  const subtitle = document.createElement("p");
  subtitle.textContent = localize("Subtitle");
  headerBody.append(settingsHeading, subtitle);
  const headerActions = document.createElement("div");
  headerActions.className = "ml-actions";
  const learnMore = document.createElement("button");
  learnMore.type = "button";
  learnMore.dataset.morelordAction = "learn-more-encounters";
  learnMore.innerHTML = `<i class="fa-solid fa-book-open"></i> ${foundry.utils.escapeHTML(localize("Documentation"))}`;
  headerActions.append(learnMore);
  pageHeader.append(headerIcon, headerBody, headerActions);
  const encounterSettingsHeading = sectionHeading("EncounterSettings", "EncounterSettingsHelp");
  const encounterSourceHeading = sectionHeading("EncounterSource", "EncounterSourceHelp");
  const encounterSourceLabel = document.createElement("label");
  encounterSourceLabel.className = "ml-encounters-source-mode";
  const encounterSourceText = document.createElement("span");
  encounterSourceText.textContent = localize("TypeOfEncounter");
  const encounterSource = document.createElement("select");
  encounterSource.name = "encounterSource";
  const monsterSourceOption = document.createElement("option");
  monsterSourceOption.value = "monster-compendiums";
  monsterSourceOption.textContent = localize("MonsterCompendiums");
  monsterSourceOption.selected = saved.encounterSource === "monster-compendiums"
    || (saved.encounterSource === "drakkenheim" && !drakkenheimTables.length);
  if (monsterSourceOption.selected) monsterSourceOption.setAttribute("selected", "selected");
  encounterSource.append(monsterSourceOption);
  if (drakkenheimTables.length) {
    const drakkenheimSourceOption = document.createElement("option");
    drakkenheimSourceOption.value = "drakkenheim";
    drakkenheimSourceOption.textContent = localize("DrakkenheimEncounters");
    drakkenheimSourceOption.selected = saved.encounterSource === "drakkenheim";
    if (drakkenheimSourceOption.selected) drakkenheimSourceOption.setAttribute("selected", "selected");
    encounterSource.append(drakkenheimSourceOption);
  }
  const customSourceOption = document.createElement("option");
  customSourceOption.value = "custom";
  customSourceOption.textContent = localize("Custom");
  customSourceOption.selected = saved.encounterSource === "custom";
  if (customSourceOption.selected) customSourceOption.setAttribute("selected", "selected");
  encounterSource.append(customSourceOption);
  const savedSourceOption = document.createElement("option");
  savedSourceOption.value = "saved";
  savedSourceOption.textContent = localize("SavedEncounters");
  savedSourceOption.selected = saved.encounterSource === "saved";
  if (savedSourceOption.selected) savedSourceOption.setAttribute("selected", "selected");
  encounterSource.append(savedSourceOption);
  encounterSource.value = saved.encounterSource === "drakkenheim" && drakkenheimTables.length
    ? "drakkenheim"
    : (["custom", "saved"].includes(saved.encounterSource) ? saved.encounterSource : "monster-compendiums");
  encounterSourceLabel.append(encounterSourceText, encounterSource);
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
  const partyHeading = sectionHeading("VerifyParty", "PartyHelp");
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
    const text = document.createElement("span");
    const name = document.createElement("strong");
    name.innerHTML = actorIdentity(actor);
    const detail = document.createElement("small");
    detail.textContent = `Level ${actor.level}${actor.hasPlayerOwner ? " · Player-owned" : ""}`;
    text.append(name, detail);
    label.append(checkbox, text);
    partyList.append(label);
  }
  if (!partyCandidates.length) {
    const empty = document.createElement("p");
    empty.textContent = localize("NoCharacters");
    partyList.append(empty);
  }
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
    checkbox.checked = selected.has(source.id) || selected.has(source.packId)
      || source.packIds?.some(packId => selected.has(packId));
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
    open.className = "ml-icon-button";
    open.dataset.morelordAction = "open-monster-compendium";
    open.dataset.packId = source.packId;
    open.title = `Open ${source.label} compendium`;
    open.setAttribute("aria-label", open.title);
    open.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i>';
    label.append(open);
    sourceList.append(label);
  }
  const monsterPanel = document.createElement("section");
  monsterPanel.className = "ml-encounters-source-panel ml-encounters-monster-panel";
  monsterPanel.append(selectionToolbar("sourceId", localize("EncounterSource")), sourceList);
  const drakkenheimPanel = document.createElement("section");
  drakkenheimPanel.className = "ml-encounters-source-panel ml-encounters-drakkenheim-panel";
  if (drakkenheimTables.length) {
    const drakkenheimHelp = document.createElement("p");
    drakkenheimHelp.className = "ml-encounters-drakkenheim-help";
    drakkenheimHelp.textContent = localize("DrakkenheimHelp");
    const locationList = document.createElement("div");
    locationList.className = "ml-grid ml-encounters-drakkenheim-locations";
    locationList.dataset.columns = "2";
    for (const [index, table] of drakkenheimTables.entries()) {
      const card = document.createElement("label");
      card.className = "ml-choice-card ml-encounters-drakkenheim-location";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "drakkenheimTableId";
      radio.value = table.id;
      radio.checked = table.id === saved.drakkenheimTableId || (!saved.drakkenheimTableId && index === 0);
      radio.defaultChecked = radio.checked;
      if (radio.checked) radio.setAttribute("checked", "checked");
      const icon = document.createElement("i");
      icon.className = "fa-solid fa-location-dot";
      const name = document.createElement("strong");
      name.textContent = table.label;
      card.append(radio, icon, name);
      locationList.append(card);
    }
    drakkenheimPanel.append(drakkenheimHelp, locationList);
  }
  const savedPanel = document.createElement("section");
  savedPanel.className = "ml-encounters-source-panel ml-encounters-saved-panel";
  const savedEncounters = getSavedEncounters().sort((left, right) => left.name.localeCompare(right.name));
  const savedHelp = document.createElement("p");
  savedHelp.textContent = localize(savedEncounters.length ? "SavedEncountersHelp" : "NoSavedEncounters");
  savedPanel.append(savedHelp);
  const savedList = document.createElement("div");
  savedList.className = "ml-encounters-options";
  const selectedSavedId = savedEncounters.some(entry => entry.id === saved.savedEncounterId)
    ? saved.savedEncounterId : savedEncounters[0]?.id;
  for (const entry of savedEncounters) {
    const card = document.createElement("section");
    card.className = "ml-card ml-encounters-option ml-encounters-saved-option";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "savedEncounterId";
    radio.value = entry.id;
    radio.setAttribute("aria-label", entry.name);
    radio.checked = entry.id === selectedSavedId;
    if (radio.checked) radio.setAttribute("checked", "checked");
    const body = encounterOptionBody(entry.encounter);
    card.append(radio, body);
    savedList.append(card);
  }
  savedPanel.append(savedList);
  const partySection = document.createElement("section");
  partySection.className = "ml-surface ml-stack ml-encounters-party-section";
  partySection.dataset.gap = "3";
  partySection.append(partyHeading, selectionToolbar("partyUuid", localize("VerifyParty")), partyList);
  const settingsControls = document.createElement("div");
  settingsControls.className = "ml-encounters-settings-controls";
  settingsControls.append(encounterSourceLabel, difficultyLabel);
  const settingsSection = document.createElement("section");
  settingsSection.className = "ml-surface ml-stack";
  settingsSection.dataset.gap = "3";
  settingsSection.append(encounterSettingsHeading, settingsControls);
  const sourceSection = document.createElement("section");
  sourceSection.className = "ml-surface ml-stack";
  sourceSection.dataset.gap = "3";
  sourceSection.append(encounterSourceHeading, monsterPanel, drakkenheimPanel, savedPanel);
  form.append(
    pageHeader,
    settingsSection,
    partySection,
    sourceSection
  );
  updateEncounterSourcePanels(form);
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
    footerControls: [
      { action: "save-encounter-defaults", label: localize("SaveDefault"), icon: "fa-solid fa-bookmark" }
    ],
    buttons: [
      { action: "generate", label: localize("Generate"), icon: "fa-solid fa-dice", default: true, callback: async () => {
        submittedConfiguration = configurationFromForm(renderedForm());
        if (submittedConfiguration.encounterSource === "saved") {
          if (!submittedConfiguration.savedEncounterId) throw new Error(localize("SelectSavedEncounter"));
          return submittedConfiguration;
        }
        if (["monster-compendiums", "custom"].includes(submittedConfiguration.encounterSource)) {
          submittedConfiguration = validateConfiguration(submittedConfiguration);
          await setLastEncounterSources(submittedConfiguration.sourceIds);
        } else if (!submittedConfiguration.drakkenheimTableId) throw new Error(localize("NoDrakkenheimLocation"));
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
  return `${option.totalXp.toLocaleString()} total XP · target ${option.budget.toLocaleString()} XP · ${option.creatureCount} creature${option.creatureCount === 1 ? "" : "s"}`;
}

const formatDifficulty = difficulty => difficulty === "medium"
  ? "Standard"
  : `${difficulty?.[0]?.toUpperCase() ?? ""}${difficulty?.slice(1) ?? ""}`;

async function buildCustomEncounterDialog(monsters, party) {
  const builderId = crypto.randomUUID();
  const content = document.createElement("div");
  const wrapper = document.createElement("div");
  wrapper.className = "ml-encounters-custom";
  const help = document.createElement("p");
  help.textContent = localize("CustomHelp");

  const filters = document.createElement("fieldset");
  filters.className = "ml-field-group ml-encounters-custom-filters";
  const filterLegend = document.createElement("legend");
  filterLegend.textContent = localize("MonsterFilters");
  const filterControls = document.createElement("div");
  filterControls.className = "ml-field-group__controls ml-encounters-custom-filter-controls";
  const filterField = (labelText, control) => {
    const label = document.createElement("label");
    const text = document.createElement("span");
    text.textContent = labelText;
    label.append(text, control);
    return label;
  };
  const search = document.createElement("input");
  search.type = "search";
  search.dataset.customFilter = "search";
  search.dataset.customBuilderId = builderId;
  search.placeholder = localize("SearchMonsters");
  search.setAttribute("aria-label", localize("SearchMonsters"));
  const sourceValues = [...new Set(monsters.map(monster => monster.sourceLabel ?? monster.packLabel ?? monster.sourceId))].sort();
  const typeValues = [...new Set(monsters.map(monster => monster.creatureType).filter(Boolean))].sort();
  const sizeValues = [...new Set(monsters.map(monster => monster.size).filter(Boolean))]
    .sort((left, right) => String(CONFIG.DND5E.actorSizes?.[left]?.label ?? left)
      .localeCompare(String(CONFIG.DND5E.actorSizes?.[right]?.label ?? right)));
  const terrainTypes = [...new Set(monsters.flatMap(monster => monster.habitats ?? []).filter(type => type && type !== "any"))]
    .sort((left, right) => String(CONFIG.DND5E.habitats?.[left]?.label ?? left)
      .localeCompare(String(CONFIG.DND5E.habitats?.[right]?.label ?? right)));
  const facetState = createFacetState();
  const facetValues = {
    type: typeValues.map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) })),
    size: sizeValues.map(value => ({ value, label: CONFIG.DND5E.actorSizes?.[value]?.label ?? value })),
    terrain: terrainTypes.map(value => ({ value, label: CONFIG.DND5E.habitats?.[value]?.label ?? value })),
    source: sourceValues.map(value => ({ value, label: value }))
  };
  const minCr = document.createElement("input");
  minCr.type = "number";
  minCr.dataset.customFilter = "minCr";
  minCr.dataset.customBuilderId = builderId;
  minCr.min = "0";
  minCr.max = "30";
  minCr.step = "0.125";
  minCr.placeholder = localize("MinCr");
  minCr.setAttribute("aria-label", localize("MinCr"));
  const maxCr = document.createElement("input");
  maxCr.type = "number";
  maxCr.dataset.customFilter = "maxCr";
  maxCr.dataset.customBuilderId = builderId;
  maxCr.min = "0";
  maxCr.max = "30";
  maxCr.step = "0.125";
  maxCr.placeholder = localize("MaxCr");
  maxCr.setAttribute("aria-label", localize("MaxCr"));
  const minAc = document.createElement("input");
  minAc.type = "number";
  minAc.dataset.customFilter = "minAc";
  minAc.dataset.customBuilderId = builderId;
  minAc.min = "0";
  minAc.placeholder = localize("MinAc");
  const minHp = document.createElement("input");
  minHp.type = "number";
  minHp.dataset.customFilter = "minHp";
  minHp.dataset.customBuilderId = builderId;
  minHp.min = "0";
  minHp.placeholder = localize("MinHp");
  const searchGroup = document.createElement("div");
  searchGroup.className = "ml-encounters-filter-search";
  searchGroup.append(filterField(localize("SearchMonsters"), search));
  const crRange = document.createElement("div");
  crRange.className = "ml-field-group__controls ml-encounters-filter-range";
  crRange.append(filterField(localize("MinCr"), minCr), filterField(localize("MaxCr"), maxCr));
  const defenseRange = document.createElement("div");
  defenseRange.className = "ml-field-group__controls ml-encounters-filter-range";
  defenseRange.append(filterField(localize("MinAc"), minAc), filterField(localize("MinHp"), minHp));
  filterControls.append(searchGroup, crRange, defenseRange);

  const filterKey = document.createElement("div");
  filterKey.className = "ml-encounters-filter-key";
  filterKey.setAttribute("aria-label", localize("FilterStateKey"));
  filterKey.innerHTML = `<span><i class="fa-regular fa-square"></i> ${localize("Any")}</span><span><i class="fa-solid fa-square-check"></i> ${localize("Include")}</span><span><i class="fa-solid fa-square-minus"></i> ${localize("Exclude")}</span>`;
  const facetSection = (title, group) => {
    const section = document.createElement("section");
    section.className = "ml-encounters-filter-group";
    const heading = document.createElement("h4");
    heading.textContent = title;
    const options = document.createElement("div");
    options.className = "ml-encounters-filter-options";
    for (const option of facetValues[group]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ml-list-button ml-encounters-tristate-filter state-none";
      button.dataset.customAction = "cycle-filter";
      button.dataset.customBuilderId = builderId;
      button.dataset.customFilterGroup = group;
      button.dataset.customFilterValue = option.value;
      button.title = `${localize("NoFilter")}: ${option.label}`;
      const count = monsters.filter(monster => {
        const values = group === "terrain" ? (monster.habitats ?? []) : [group === "source"
          ? (monster.sourceLabel ?? monster.packLabel ?? monster.sourceId)
          : monster[group === "type" ? "creatureType" : group]];
        return values.includes(option.value) || (group === "terrain" && values.includes("any"));
      }).length;
      button.innerHTML = `<i class="fa-regular fa-square"></i><span>${foundry.utils.escapeHTML(String(option.label))}</span><small>${count}</small>`;
      options.append(button);
    }
    section.append(heading, options);
    return section;
  };
  filters.append(
    filterLegend,
    filterControls,
    filterKey,
    facetSection(localize("CreatureType"), "type"),
    facetSection(localize("Size"), "size"),
    ...(terrainTypes.length ? [facetSection(localize("Terrain"), "terrain")] : []),
    facetSection(localize("Source"), "source")
  );

  const workspace = document.createElement("div");
  workspace.className = "ml-encounters-custom-workspace";
  const results = document.createElement("div");
  results.className = "ml-resource-list ml-encounters-browser-results";
  const resultsPanel = document.createElement("section");
  resultsPanel.className = "ml-section ml-encounters-browser-panel";
  const resultsHeading = document.createElement("div");
  resultsHeading.className = "ml-list-toolbar";
  const resultsTitle = document.createElement("h3");
  resultsTitle.textContent = localize("MatchingMonsters");
  const resultsCount = document.createElement("span");
  resultsCount.className = "ml-badge";
  resultsHeading.append(resultsTitle, resultsCount);
  resultsPanel.append(help, resultsHeading, results);
  const rosterPanel = document.createElement("section");
  rosterPanel.className = "ml-card ml-encounters-custom-roster";
  const rosterHeading = document.createElement("h3");
  rosterHeading.textContent = localize("CustomRoster");
  const difficulty = document.createElement("strong");
  difficulty.className = "ml-badge ml-encounters-custom-difficulty";
  const xpBreakdown = document.createElement("small");
  xpBreakdown.className = "ml-encounters-custom-xp-breakdown";
  const roster = document.createElement("div");
  roster.className = "ml-encounters-custom-members";
  const selected = new Map();

  const currentEncounter = () => buildCustomEncounter([...selected.values()], party);
  const renderRoster = () => {
    const renderedRoster = document.getElementById("morelord-encounters-custom")
      ?.querySelector(".ml-encounters-custom-members") ?? roster;
    const renderedDifficulty = document.getElementById("morelord-encounters-custom")
      ?.querySelector(".ml-encounters-custom-difficulty") ?? difficulty;
    const renderedBreakdown = document.getElementById("morelord-encounters-custom")
      ?.querySelector(".ml-encounters-custom-xp-breakdown") ?? xpBreakdown;
    renderedRoster.replaceChildren();
    const encounter = currentEncounter();
    renderedDifficulty.dataset.tone = encounter.difficulty === "deadly"
      ? "danger"
      : (encounter.difficulty === "hard" ? "warning" : (encounter.difficulty === "medium" ? "info" : "success"));
    const nextDifficulty = { easy: "medium", medium: "hard", hard: "deadly" }[encounter.difficulty];
    const nextThreshold = nextDifficulty ? encounterBudget(party, nextDifficulty) : null;
    renderedDifficulty.textContent = nextThreshold
      ? `${formatDifficulty(encounter.difficulty)} · ${encounter.totalXp.toLocaleString()} / ${nextThreshold.toLocaleString()} XP`
      : `${formatDifficulty(encounter.difficulty)} · ${encounter.totalXp.toLocaleString()} XP`;
    renderedBreakdown.textContent = `${encounter.totalXp.toLocaleString()} total XP from ${encounter.creatureCount} creature${encounter.creatureCount === 1 ? "" : "s"} · 2024 rules apply no creature-count multiplier`;
    if (!encounter.members.length) {
      const empty = document.createElement("p");
      empty.className = "ml-empty-message ml-encounters-custom-empty";
      empty.textContent = localize("EmptyCustomRoster");
      renderedRoster.append(empty);
      return;
    }
    for (const member of encounter.members) {
      const row = document.createElement("article");
      row.className = "ml-card ml-list-button ml-encounters-custom-member";
      row.dataset.morelordAction = "open-encounter-actor";
      row.dataset.uuid = member.uuid;
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", `${localize("OpenMonsterDetails")}: ${member.name}`);
      const copy = document.createElement("span");
      copy.innerHTML = `<strong>${actorIdentity(member)}</strong><small>CR ${member.cr} · ${member.xp.toLocaleString()} XP each</small>`;
      const controls = document.createElement("span");
      controls.className = "ml-stepper ml-encounters-custom-quantity";
      for (const [action, icon, label] of [["decrease", "fa-minus", "Remove one"], ["increase", "fa-plus", "Add one"]]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ml-icon-button";
        button.dataset.customAction = action;
        button.dataset.customBuilderId = builderId;
        button.dataset.uuid = member.uuid;
        button.title = `${label} ${member.name}`;
        button.setAttribute("aria-label", button.title);
        button.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        controls.append(button);
        if (action === "decrease") {
          const count = document.createElement("strong");
          count.textContent = String(member.count);
          controls.append(count);
        }
      }
      row.append(copy, controls);
      renderedRoster.append(row);
    }
  };

  const renderResults = () => {
    const query = search.value.trim().toLocaleLowerCase();
    const minimum = minCr.value === "" ? -Infinity : Number(minCr.value);
    const maximum = maxCr.value === "" ? Infinity : Number(maxCr.value);
    const minimumAc = minAc.value === "" ? -Infinity : Number(minAc.value);
    const minimumHp = minHp.value === "" ? -Infinity : Number(minHp.value);
    const matches = monsters.filter(monster => (!query || monster.name.toLocaleLowerCase().includes(query))
      && matchesFacet(facetState.source, [monster.sourceLabel ?? monster.packLabel ?? monster.sourceId])
      && matchesFacet(facetState.type, [monster.creatureType])
      && matchesFacet(facetState.size, [monster.size])
      && matchesFacet(facetState.terrain, monster.habitats?.includes("any") ? [...terrainTypes, "any"] : (monster.habitats ?? []))
      && monster.cr >= minimum && monster.cr <= maximum
      && monster.ac >= minimumAc && monster.hp >= minimumHp);
    const renderedResults = document.getElementById("morelord-encounters-custom")
      ?.querySelector(".ml-encounters-browser-results") ?? results;
    const renderedCount = document.getElementById("morelord-encounters-custom")
      ?.querySelector(".ml-encounters-browser-panel .ml-badge") ?? resultsCount;
    renderedCount.textContent = `${matches.length} ${matches.length === 1 ? localize("Monster") : localize("Monsters")}`;
    renderedResults.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "ml-empty-message ml-encounters-custom-empty";
      empty.textContent = localize("NoMonsters");
      renderedResults.append(empty);
      return;
    }
    for (const monster of matches.slice(0, 200)) {
      const row = document.createElement("article");
      row.className = "ml-card ml-list-button ml-resource-item ml-encounters-browser-monster";
      row.dataset.morelordAction = "open-encounter-actor";
      row.dataset.uuid = monster.uuid;
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", `${localize("OpenMonsterDetails")}: ${monster.name}`);
      const copy = document.createElement("span");
      copy.innerHTML = `<strong>${actorIdentity(monster)}</strong><small>CR ${monster.cr} · AC ${monster.ac} · ${monster.hp} HP · ${foundry.utils.escapeHTML(monster.creatureType || localize("UnknownType"))}</small><small>${foundry.utils.escapeHTML(monster.sourceLabel ?? monster.packLabel ?? monster.sourceId)} · ${monster.xp.toLocaleString()} XP</small>`;
      const add = document.createElement("button");
      add.type = "button";
      add.className = "ml-icon-button";
      add.dataset.customAction = "add";
      add.dataset.customBuilderId = builderId;
      add.dataset.uuid = monster.uuid;
      add.title = `Add ${monster.name}`;
      add.setAttribute("aria-label", add.title);
      add.innerHTML = '<i class="fa-solid fa-plus"></i>';
      row.append(copy, add);
      renderedResults.append(row);
    }
  };

  const updateSelection = button => {
    if (button.dataset.customAction === "cycle-filter") {
      const state = facetState[button.dataset.customFilterGroup];
      const value = button.dataset.customFilterValue;
      if (!state || !value) return;
      const next = cycleFacetState(state, value);
      button.classList.remove("state-none", "state-include", "state-exclude");
      button.classList.add(`state-${next}`);
      const icon = button.querySelector("i");
      if (icon) icon.className = next === "include"
        ? "fa-solid fa-square-check"
        : (next === "exclude" ? "fa-solid fa-square-minus" : "fa-regular fa-square");
      button.title = `${localize(next === "include" ? "Include" : (next === "exclude" ? "Exclude" : "NoFilter"))}: ${button.querySelector("span")?.textContent ?? value}`;
      renderResults();
      return;
    }
    const monster = monsters.find(candidate => candidate.uuid === button.dataset.uuid);
    if (!monster) return;
    const existing = selected.get(monster.uuid);
    if (button.dataset.customAction === "add" || button.dataset.customAction === "increase") {
      selected.set(monster.uuid, { ...monster, count: (existing?.count ?? 0) + 1 });
    } else if ((existing?.count ?? 0) <= 1) selected.delete(monster.uuid);
    else selected.set(monster.uuid, { ...existing, count: existing.count - 1 });
    renderRoster();
  };
  const updateFilter = input => {
    const controls = { search, minCr, maxCr, minAc, minHp };
    const control = controls[input.dataset.customFilter];
    if (control) control.value = input.value;
    renderResults();
  };
  customBuilderContexts.set(builderId, { updateSelection, updateFilter });
  rosterPanel.append(rosterHeading, difficulty, xpBreakdown, roster);
  workspace.append(filters, resultsPanel);
  wrapper.append(rosterPanel, workspace);
  content.append(wrapper);
  renderResults();
  renderRoster();

  let submittedEncounter = null;
  let result;
  try {
    result = await waitForEncounterDialog({
      id: "morelord-encounters-custom",
      classes: ["ml-window", "ml-encounters-module", "ml-encounters-dialog"],
      window: { title: localize("CustomTitle"), icon: "fa-solid fa-hydra" },
      position: { width: Math.max(900, Math.min(window.innerWidth - 100, 1200)), height: Math.max(600, Math.min(window.innerHeight - 80, 900)) },
      content,
      buttons: [
        { action: "start-over", label: localize("StartOver"), icon: "fa-solid fa-rotate-left" },
        { action: "generate", label: localize("GenerateCustom"), icon: "fa-solid fa-check", default: true, callback: () => {
          submittedEncounter = currentEncounter();
          if (!submittedEncounter.members.length) throw new Error(localize("EmptyCustomRoster"));
          return submittedEncounter;
        } }
      ]
    }, { rejectClose: false });
  } finally {
    customBuilderContexts.delete(builderId);
  }
  if (result && typeof result === "object" && Array.isArray(result.members)) return { action: "generate", encounter: result };
  if (result === "generate" && submittedEncounter) return { action: "generate", encounter: submittedEncounter };
  return { action: result ?? "cancel" };
}

export function updateCustomEncounterFromButton(button) {
  const context = customBuilderContexts.get(button.dataset.customBuilderId);
  if (!context) throw new Error("That custom encounter is no longer available.");
  context.updateSelection(button);
}

export function updateCustomEncounterFilter(input) {
  customBuilderContexts.get(input.dataset.customBuilderId)?.updateFilter(input);
}

function simpleMonsterCard(option, member, memberIndex, monsters) {
  const card = document.createElement("article");
  card.className = "ml-card ml-encounters-simple-monster-card";
  const copy = document.createElement("span");
  const name = document.createElement("strong");
  name.innerHTML = `${Number(option.published ? member.rolledQuantity ?? member.count : member.count)}× ${actorIdentity(member)}`;
  const detail = document.createElement("small");
  detail.textContent = `CR ${member.cr} · ${member.sourceLabel ?? member.packLabel ?? member.sourceId}`;
  copy.append(name, detail);
  const actions = document.createElement("span");
  actions.className = "ml-actions ml-encounters-simple-monster-actions";
  if (monsters) {
    const rerollId = crypto.randomUUID();
    rerollContexts.set(rerollId, { option, memberIndex, monsters });
    const reroll = document.createElement("button");
    reroll.type = "button";
    reroll.className = "ml-icon-button";
    reroll.dataset.morelordAction = "reroll-generated-creature";
    reroll.dataset.rerollId = rerollId;
    reroll.title = `Regenerate ${member.name}`;
    reroll.setAttribute("aria-label", reroll.title);
    reroll.innerHTML = '<i class="fa-solid fa-rotate"></i>';
    actions.append(reroll);
  }
  const open = document.createElement("button");
  open.type = "button";
  open.className = "ml-icon-button";
  open.dataset.morelordAction = "open-encounter-actor";
  open.dataset.uuid = member.uuid;
  open.title = `Open ${member.name} Actor sheet`;
  open.setAttribute("aria-label", open.title);
  open.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i>';
  actions.append(open);
  card.append(copy, actions);
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

function encounterOptionBody(option, monsters = null) {
  const body = document.createElement("div");
  body.className = "ml-encounters-option-body";
  const heading = document.createElement("strong");
  heading.textContent = option.name;
  const description = document.createElement("small");
  description.textContent = option.description;
  const roster = document.createElement("div");
  roster.className = "ml-encounters-option-monsters";
  if (option.members.length) {
    option.members.forEach((member, memberIndex) => roster.append(simpleMonsterCard(option, member, memberIndex, monsters)));
  } else {
    roster.textContent = localize("NoMonsters");
  }
  body.append(heading, description, roster);
  if (!option.published) {
    const xp = document.createElement("small");
    xp.className = "ml-encounters-xp";
    xp.textContent = encounterXpLabel(option);
    body.append(xp);
  }
  const notes = encounterNotes(option);
  if (notes) {
    const details = document.createElement("details");
    details.className = "ml-details";
    const summary = document.createElement("summary");
    summary.textContent = localize("EncounterDetails");
    notes.classList.add("ml-details__body");
    details.append(summary, notes);
    body.append(details);
  }
  return body;
}

async function optionContent(options, party, monsters) {
  const content = document.createElement("div");
  const summary = document.createElement("p");
  const fallback = party.some(member => member.fallback) ? ` ${localize("PartyFallback")}` : "";
  const difficulty = options[0]?.difficulty === "medium" ? "Standard" : `${options[0]?.difficulty?.[0]?.toUpperCase() ?? ""}${options[0]?.difficulty?.slice(1) ?? ""}`;
  summary.innerHTML = `${foundry.utils.escapeHTML(difficulty)} difficulty · ${foundry.utils.escapeHTML(localize("Party"))}: ${party.map(member => `${actorIdentity(member)} (${Number(member.level)})`).join(", ")}.${foundry.utils.escapeHTML(fallback)}`;
  const list = document.createElement("div");
  list.className = "ml-encounters-options";
  for (const [index, option] of options.entries()) {
    const group = document.createElement("section");
    group.className = "ml-card ml-encounters-option";
    group.dataset.encounterIndex = String(index);
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "encounterOption";
    radio.value = String(index);
    radio.checked = index === 0;
    if (index === 0) radio.setAttribute("checked", "checked");
    const body = encounterOptionBody(option, monsters);
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
      { action: "start-over", label: localize("StartOver"), icon: "fa-solid fa-rotate-left", callback: () => ({ action: "start-over" }) },
      { action: "regenerate", label: localize("Regenerate"), icon: "fa-solid fa-rotate", callback: () => ({ action: "regenerate" }) },
      { action: "select", label: localize("Select"), icon: "fa-solid fa-check", default: true, callback: () => {
        const selected = document.querySelector(".ml-encounters-dialog [name='encounterOption']:checked")
          ?? content.querySelector("[name='encounterOption']:checked");
        return { action: "select", encounter: options[Number(selected?.value ?? 0)] };
      } }
    ]
  }, { rejectClose: false });
  if (result && typeof result === "object" && typeof result.action === "string") return result;
  if (["start-over", "cancel", "regenerate", "select"].includes(result)) {
    if (result === "select") {
      const selected = document.querySelector(".ml-encounters-dialog [name='encounterOption']:checked")
        ?? content.querySelector("[name='encounterOption']:checked");
      return { action: "select", encounter: options[Number(selected?.value ?? 0)] };
    }
    return { action: result };
  }
  return { action: "cancel" };
}

function encounterNotes(encounter) {
  if (encounter.notes?.length) {
    const notes = document.createElement("section");
    notes.className = "ml-surface ml-encounters-published-notes";
    notes.dataset.depth = "sunken";
    const notesHeading = document.createElement("h3");
    notesHeading.textContent = localize("EncounterDetails");
    notes.append(notesHeading);
    for (const note of encounter.notes) {
      const entry = document.createElement("article");
      const title = document.createElement("strong");
      title.textContent = note.title;
      const text = document.createElement("p");
      const source = String(note.text ?? "")
        .replace(/@UUID\[[^\]]+]\{([^}]+)}/g, "$1")
        .replace(/@Compendium\[[^\]]+]\{([^}]+)}/g, "$1")
        .replace(/<(?:br\s*\/?|\/p|\/li|\/div)>/gi, "function rosterContent(encounter, encounterStealthRoll = null, { preview = false } = {}) {\n");
      const parsed = document.createElement("template");
      parsed.innerHTML = source;
      let readableText = (parsed.content.textContent ?? "")
        .replace(/[ \t]+/g, " ")
        .replace(/\s*\n\s*/g, "\n")
        .replace(/^\s*[.]\s+/, "")
        .trim();
      const escapedTitle = String(note.title ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\function rosterContent(encounter, encounterStealthRoll = null, { preview = false } = {}) {");
      if (escapedTitle) readableText = readableText
        .replace(new RegExp(`^\\s*${escapedTitle}\\s*(?:[.:—–-]\\s*)?`, "i"), "")
        .trim();
      const rollPattern = /\[\[\/r\s+([^\]]+)]]/gi;
      let cursor = 0;
      for (const match of readableText.matchAll(rollPattern)) {
        text.append(document.createTextNode(readableText.slice(cursor, match.index)));
        const formula = match[1].trim();
        const rollLink = document.createElement("a");
        rollLink.className = "inline-roll roll";
        rollLink.dataset.mode = "roll";
        rollLink.dataset.formula = formula;
        rollLink.innerHTML = `<i class="fa-solid fa-dice-d20"></i> ${foundry.utils.escapeHTML(formula)}`;
        text.append(rollLink);
        cursor = match.index + match[0].length;
      }
      text.append(document.createTextNode(readableText.slice(cursor)));
      entry.append(title, text);
      notes.append(entry);
    }
    return notes;
  }
  return null;
}

function rosterContent(encounter, encounterStealthRoll = null) {
  const content = document.createElement("div");
  const wrapper = document.createElement("div");
  wrapper.className = "ml-encounters-roster";
  const card = document.createElement("section");
  card.className = "ml-surface ml-encounters-roster-card";
  card.dataset.depth = "raised";
  const intro = document.createElement("p");
  intro.className = "ml-encounters-drag-help";
  intro.textContent = localize("DragHelp");
  const notes = encounterNotes(encounter);
  if (notes) card.append(notes);
  const list = document.createElement("table");
  list.className = "ml-encounters-monsters";
  const listBody = document.createElement("tbody");
  for (const member of encounter.members) {
    const row = document.createElement("tr");
    row.className = "ml-encounters-monster";
    const linkCell = document.createElement("td");
    const link = document.createElement("a");
    link.className = "content-link ml-encounters-actor-link";
    link.dataset.uuid = member.uuid;
    link.dataset.type = "Actor";
    link.dataset.morelordAction = "open-encounter-actor";
    link.dataset.morelordDragActor = member.uuid;
    link.draggable = true;
    link.title = `Drag ${member.name} onto the scene, or click to open its sheet`;
    const actorLabel = encounter.published
      ? actorIdentity(member)
      : `${Number(member.count)}× ${actorIdentity(member)}`;
    link.innerHTML = `<i class="fa-solid fa-arrows-up-down-left-right"></i> ${actorLabel}`;
    linkCell.append(link);
    const detail = document.createElement("td");
    detail.className = "ml-encounters-monster-detail";
    detail.textContent = `CR ${member.cr} · ${member.sourceLabel ?? member.packLabel ?? member.sourceId}`;
    row.append(linkCell, detail);
    listBody.append(row);
  }
  list.append(listBody);
  card.append(intro, list);
  wrapper.append(card);
  if (encounter.showCraftworksSourceNotice) {
    const sourceNotice = document.createElement("aside");
    sourceNotice.className = "ml-callout ml-encounters-craftworks-notice";
    sourceNotice.dataset.tone = "warning";
    sourceNotice.innerHTML = `<p><i class="fa-solid fa-triangle-exclamation"></i> ${foundry.utils.escapeHTML(localize("CraftworksSourceNotice"))}</p>`;
    wrapper.append(sourceNotice);
  }
  const stealth = lowestEncounterStealth(encounter);
  if (stealth && encounterStealthRoll) {
    const stealthResult = document.createElement("aside");
    stealthResult.className = "ml-callout ml-encounters-stealth-result";
    stealthResult.dataset.tone = "success";
    stealthResult.innerHTML = `<p><i class="fa-solid fa-eye-slash"></i> <strong>${localize("EncounterStealth")}: ${encounterStealthRoll.total}</strong> <span>(${actorIdentity(encounter.members.find(member => member.name === stealth.name) ?? stealth)}: ${stealth.modifier >= 0 ? "+" : ""}${stealth.modifier})</span></p>`;
    wrapper.append(stealthResult);
  }
  if (!encounter.published) {
    const total = document.createElement("strong");
    total.className = "ml-encounters-roster-total";
    total.textContent = `${encounter.totalXp.toLocaleString()} total XP`;
    wrapper.append(total);
  }
  content.append(wrapper);
  return content;
}

async function showRoster(encounter) {
  const content = await withEncounterProgress(localize("PreparingEncounter"), async () => {
    const stealth = lowestEncounterStealth(encounter);
    let encounterStealthRoll = null;
    if (stealth) {
      const sign = stealth.modifier >= 0 ? "+" : "-";
      encounterStealthRoll = await new Roll(`1d20 ${sign} ${Math.abs(stealth.modifier)}`).evaluate();
    }
    return rosterContent(encounter, encounterStealthRoll);
  });
  const rosterId = crypto.randomUUID();
  rosterContexts.set(rosterId, encounter);
  content.querySelector(".ml-encounters-roster").dataset.encounterId = rosterId;
  try {
    return await waitForEncounterDialog({
      id: "morelord-encounters-roster",
      classes: ["ml-window", "ml-encounters-module", "ml-encounters-dialog"],
      window: { title: `${encounter.name} — ${localize("Roster")}`, icon: "fa-solid fa-hydra" },
      position: {
        width: Math.max(760, Math.min(window.innerWidth - 100, 960)),
        height: Math.max(600, Math.min(window.innerHeight - 80, 900))
      },
      modal: false,
      content,
      footerControls: [
        { action: "save-encounter", label: localize("Save"), icon: "fa-solid fa-floppy-disk", beforeAction: "close" }
      ],
      buttons: [
        { action: "start-over", label: localize("StartOver"), icon: "fa-solid fa-rotate-left" },
        { action: "close", label: localize("Close"), icon: "fa-solid fa-xmark" }
      ]
    }, { rejectClose: false });
  } finally {
    rosterContexts.delete(rosterId);
  }
}

export async function configureEncounter({ initial = null, title = null } = {}) {
  try {
    let currentConfiguration = initial;
    configurationLoop: while (true) {
      const configuration = await configure(currentConfiguration, title);
      if (!configuration) return null;
      currentConfiguration = configuration;
      if (configuration.encounterSource === "saved") {
        const saved = getSavedEncounters().find(entry => entry.id === configuration.savedEncounterId);
        if (!saved) throw new Error(localize("SavedEncounterUnavailable"));
        const rosterAction = await showRoster(saved.encounter);
        if (rosterAction === "start-over") continue configurationLoop;
        return saved.encounter;
      }
      if (configuration.encounterSource === "drakkenheim") {
        const encounter = await withEncounterProgress(localize("GeneratingEncounter"),
          () => drakkenheimService.roll(configuration.drakkenheimTableId));
        const rosterAction = await showRoster(encounter);
        if (rosterAction === "start-over") continue configurationLoop;
        return encounter;
      }
      if (!configuration.sourceIds?.length || !configuration.partyUuids?.length) return null;
      const monsters = await withEncounterProgress(localize("LoadingMonsters"),
        () => catalogService.monsters(configuration.sourceIds));
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
      if (configuration.encounterSource === "custom") {
        const custom = await buildCustomEncounterDialog(monsters, party);
        if (custom.action === "start-over") continue configurationLoop;
        if (custom.action === "cancel") return null;
        const rosterAction = await showRoster(custom.encounter);
        if (rosterAction === "start-over") continue configurationLoop;
        return custom.encounter;
      }
      while (true) {
        const options = await withEncounterProgress(localize("GeneratingEncounter"),
          () => generateEncounterOptions({ monsters, party, difficulty: configuration.difficulty }));
        const choice = await choose(options, party, monsters);
        if (choice.action === "cancel") return null;
        if (choice.action === "start-over") continue configurationLoop;
        if (choice.action === "regenerate") continue;
        const rosterAction = await showRoster(choice.encounter);
        if (rosterAction === "start-over") continue configurationLoop;
        return choice.encounter;
      }
    }
  } catch (error) {
    console.error("morelord-encounters | Encounter generation failed", error);
    ui.notifications.error(error.message);
    return null;
  }
}

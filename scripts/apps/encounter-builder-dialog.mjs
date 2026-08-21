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
const previewMembers = new Map();
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
  const form = button.closest(".morelord-encounter-source-form");
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

function waitForEncounterDialog(config, options = {}) {
  config.classes = [...new Set([...(config.classes ?? []), "morelord-encounters-dialog"])];
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
  form.className = "morelord-encounter-source-form";
  const help = document.createElement("p");
  help.textContent = localize("SourceHelp");
  const difficultyLabel = document.createElement("label");
  const difficultyText = document.createElement("span");
  difficultyText.textContent = localize("Difficulty");
  const difficulty = document.createElement("select");
  difficulty.name = "difficulty";
  for (const value of ["easy", "medium", "hard", "killer"]) {
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
  partyHeading.textContent = localize("VerifyParty");
  const partyHelp = document.createElement("p");
  partyHelp.textContent = localize("PartyHelp");
  const partyList = document.createElement("div");
  partyList.className = "morelord-encounter-party-list";
  for (const actor of partyCandidates) {
    const label = document.createElement("label");
    label.className = "morelord-party-card";
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
  sourceHeading.textContent = localize("MonsterSources");
  const sourceList = document.createElement("div");
  sourceList.className = "morelord-encounter-source-list";
  for (const source of available) {
    const label = document.createElement("label");
    label.className = "morelord-source-card";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "sourceId";
    checkbox.value = source.id;
    checkbox.checked = selected.has(source.id) || selected.has(source.packId);
    checkbox.defaultChecked = checkbox.checked;
    if (checkbox.checked) checkbox.setAttribute("checked", "checked");
    const icon = document.createElement("i");
    icon.className = "fa-solid fa-book-open morelord-source-card-icon";
    label.append(checkbox, icon);
    const text = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = source.label;
    const detail = document.createElement("small");
    detail.textContent = source.packageName || source.packId;
    text.append(name, detail);
    label.append(text);
    const open = document.createElement("button");
    open.type = "button";
    open.className = "morelord-source-open";
    open.dataset.morelordAction = "open-monster-compendium";
    open.dataset.packId = source.packId;
    open.title = `Open ${source.label} compendium`;
    open.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i>';
    label.append(open);
    sourceList.append(label);
  }
  form.append(help, difficultyLabel, partyHeading, partyHelp, partyList, sourceHeading, sourceList);
  const defaultControls = document.createElement("div");
  defaultControls.className = "morelord-encounter-default-controls";
  const saveDefault = document.createElement("button");
  saveDefault.type = "button";
  saveDefault.className = "morelord-encounter-save-default";
  saveDefault.dataset.morelordAction = "save-encounter-defaults";
  saveDefault.innerHTML = `<i class="fa-solid fa-bookmark"></i> ${localize("SaveDefault")}`;
  defaultControls.append(saveDefault);
  form.append(defaultControls);
  content.append(form);
  const renderedForm = () => document.getElementById("morelord-encounters-configure")
    ?.querySelector(".morelord-encounter-source-form")
    ?? document.querySelector(".morelord-encounters-dialog .morelord-encounter-source-form")
    ?? form;
  let submittedConfiguration = null;
  const result = await waitForEncounterDialog({
    id: "morelord-encounters-configure",
    classes: ["morelord-encounters-dialog"],
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

const numericValue = value => {
  const candidate = value && typeof value === "object"
    ? value.total ?? value.value ?? value.mod ?? value.bonus
    : value;
  const number = Number(candidate);
  return Number.isFinite(number) ? number : 0;
};
const signed = value => numericValue(value) >= 0 ? `+${numericValue(value)}` : String(numericValue(value));

function creatureTitle(member) {
  const title = document.createElement("strong");
  title.className = "morelord-encounter-creature-title";
  title.textContent = `${member.count}× ${member.name}`;
  return title;
}

function cleanUnresolvedReferences(html) {
  return String(html ?? "")
    .replace(/\[\[\/attack[^\]]*\]\]/gi, "Attack roll")
    .replace(/\[\[\/damage[^\]]*\]\]/gi, "Damage")
    .replace(/\[\[lookup\s+@target\.effects\.special[^\]]*\]\]/gi, "affected")
    .replace(/\[\[lookup\s+@activation\.condition[^\]]*\]\]/gi, "the listed condition")
    .replace(/\[\[lookup\s+[^\]]*\]\]/gi, "the listed value");
}

async function fullMonsterCard(member) {
  const actor = member.actor ?? await fromUuid(member.uuid);
  member.actor = actor;
  const system = actor?.system ?? {};
  const card = document.createElement("article");
  card.className = "morelord-full-monster-card";
  const header = document.createElement("header");
  header.append(creatureTitle(member));
  const identity = document.createElement("em");
  const type = system.details?.type?.value ?? member.creatureType;
  const alignment = system.details?.alignment ?? member.alignment;
  identity.textContent = [system.traits?.size ?? member.size, type, alignment].filter(Boolean).join(" · ") || localize("UnknownType");
  header.append(identity);

  const vitals = document.createElement("div");
  vitals.className = "morelord-monster-vitals";
  const ac = system.attributes?.ac?.value ?? member.ac ?? "—";
  const hp = system.attributes?.hp?.max ?? member.hp ?? "—";
  const formula = system.attributes?.hp?.formula ? ` (${system.attributes.hp.formula})` : "";
  const init = system.attributes?.init?.total;
  const movement = system.attributes?.movement ?? {};
  const speeds = Object.entries(movement).filter(([, value]) => Number(value) > 0).map(([key, value]) => `${key === "walk" ? "Speed" : key} ${value} ft.`).join(", ");
  vitals.innerHTML = `<span><b>AC</b> ${ac}</span><span><b>Initiative</b> ${init == null ? "—" : signed(init)}</span><span><b>HP</b> ${hp}${foundry.utils.escapeHTML(formula)}</span><span>${foundry.utils.escapeHTML(speeds || "Speed —")}</span>`;

  const abilities = document.createElement("div");
  abilities.className = "morelord-monster-abilities";
  for (const [key, ability] of Object.entries(system.abilities ?? {})) {
    const cell = document.createElement("div");
    cell.innerHTML = `<b>${key.toUpperCase()}</b><span>${ability.value ?? "—"}</span><span>${signed(ability.mod)}</span><span>${signed(ability.save ?? ability.mod)}</span>`;
    abilities.append(cell);
  }

  const facts = document.createElement("div");
  facts.className = "morelord-monster-facts";
  const skills = Object.entries(system.skills ?? {}).filter(([, skill]) => Number(skill.value ?? skill.proficient) > 0)
    .map(([key, skill]) => `${CONFIG.DND5E?.skills?.[key]?.label ? game.i18n.localize(CONFIG.DND5E.skills[key].label) : key} ${signed(skill.total)}`);
  const senses = system.attributes?.senses ?? {};
  const senseText = Object.entries(senses).filter(([key, value]) => key !== "special" && Number(value) > 0).map(([key, value]) => `${key} ${value} ft.`);
  if (senses.special) senseText.push(senses.special);
  const languages = Object.keys(system.traits?.languages?.value ?? {}).length
    ? Object.keys(system.traits.languages.value).join(", ")
    : Array.from(system.traits?.languages?.value ?? []).join(", ");
  const factRows = [
    skills.length ? ["Skills", skills.join(", ")] : null,
    senseText.length ? ["Senses", senseText.join(", ")] : null,
    languages ? ["Languages", languages] : null,
    ["CR", `${system.details?.cr ?? member.cr} (XP ${member.xp.toLocaleString()}; PB ${signed(system.attributes?.prof ?? 0)})`],
    [localize("Source"), member.sourceLabel ?? member.packLabel ?? member.sourceId]
  ].filter(Boolean);
  for (const [label, value] of factRows) {
    const row = document.createElement("div");
    const name = document.createElement("b");
    name.textContent = label;
    row.append(name, ` ${value}`);
    facts.append(row);
  }

  const features = document.createElement("div");
  features.className = "morelord-monster-features";
  const items = Array.from(actor?.items ?? []).filter(item => ["weapon", "feat", "spell"].includes(item.type));
  const groups = [
    ["Actions", items.filter(item => item.system?.activation?.type !== "reaction")],
    ["Reactions", items.filter(item => item.system?.activation?.type === "reaction")]
  ];
  for (const [label, entries] of groups) {
    if (!entries.length) continue;
    const heading = document.createElement("h4");
    heading.textContent = label;
    features.append(heading);
    for (const item of entries) {
      const entry = document.createElement("div");
      entry.className = "morelord-monster-feature";
      const name = document.createElement("b");
      name.textContent = `${item.name}. `;
      const description = document.createElement("span");
      const enriched = await TextEditor.enrichHTML(item.system?.description?.value ?? "", {
        async: true,
        secrets: false,
        documents: true,
        relativeTo: item,
        rollData: actor?.getRollData?.() ?? {}
      });
      description.innerHTML = cleanUnresolvedReferences(enriched);
      entry.append(name, description);
      features.append(entry);
    }
  }
  card.append(header, vitals, abilities, facts, features);
  return card;
}

export async function showCreaturePreviewFromButton(button) {
  const member = previewMembers.get(button.dataset.previewId);
  if (!member) throw new Error("That generated creature is no longer available.");
  const content = document.createElement("div");
  const wrapper = document.createElement("div");
  wrapper.append(await fullMonsterCard(member));
  content.append(wrapper);
  return waitForEncounterDialog({
    id: "morelord-encounters-creature-preview",
    classes: ["morelord-encounters-dialog"],
    window: { title: member.name, icon: "fa-solid fa-paw" },
    position: { width: 820, height: Math.max(480, Math.min(window.innerHeight - 100, 840)) },
    modal: false,
    content,
    buttons: [{ action: "close", label: localize("Close"), default: true }]
  }, { rejectClose: false });
}

function encounterXpLabel(option) {
  return `${option.adjustedXp.toLocaleString()} adjusted XP · target ${option.budget.toLocaleString()} XP · ${option.creatureCount} creature${option.creatureCount === 1 ? "" : "s"} (${option.totalXp.toLocaleString()} base XP)`;
}

function simpleMonsterCard(option, member, memberIndex, monsters) {
  const previewId = `${option.id}:${member.uuid}:${crypto.randomUUID()}`;
  previewMembers.set(previewId, member);
  const rerollId = crypto.randomUUID();
  rerollContexts.set(rerollId, { option, memberIndex, monsters });
  const card = document.createElement("article");
  card.className = "morelord-simple-monster-card";
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
  actions.className = "morelord-simple-monster-actions";
  const reroll = document.createElement("button");
  reroll.type = "button";
  reroll.className = "morelord-creature-reroll-button";
  reroll.dataset.morelordAction = "reroll-generated-creature";
  reroll.dataset.rerollId = rerollId;
  reroll.title = `Regenerate ${member.name}`;
  reroll.innerHTML = '<i class="fa-solid fa-rotate"></i>';
  const open = document.createElement("button");
  open.type = "button";
  open.className = "morelord-creature-preview-button";
  open.dataset.morelordAction = "preview-generated-creature";
  open.dataset.previewId = previewId;
  open.title = `View ${member.name} stat block`;
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
  const group = button.closest(".morelord-encounter-option");
  button.closest(".morelord-simple-monster-card")?.replaceWith(
    simpleMonsterCard(context.option, member, context.memberIndex, context.monsters)
  );
  const xp = group?.querySelector(".morelord-encounter-xp");
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
  list.className = "morelord-encounter-options";
  for (const [index, option] of options.entries()) {
    const group = document.createElement("section");
    group.className = "morelord-encounter-option";
    group.dataset.encounterIndex = String(index);
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "encounterOption";
    radio.value = String(index);
    radio.checked = index === 0;
    if (index === 0) radio.setAttribute("checked", "checked");
    const body = document.createElement("div");
    body.className = "morelord-encounter-option-body";
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
    xp.className = "morelord-encounter-xp";
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
    classes: ["morelord-encounters-dialog"],
    window: { title: localize("GeneratedTitle"), icon: "fa-solid fa-hydra" },
    position: { width: 900, height: Math.max(480, Math.min(window.innerHeight - 80, 900)) },
    content,
    buttons: [
      { action: "cancel", label: localize("Cancel"), callback: () => ({ action: "cancel" }) },
      { action: "regenerate", label: localize("Regenerate"), icon: "fa-solid fa-rotate", callback: () => ({ action: "regenerate" }) },
      { action: "select", label: localize("Select"), icon: "fa-solid fa-check", default: true, callback: () => {
        const selected = document.querySelector(".morelord-encounters-dialog [name='encounterOption']:checked")
          ?? content.querySelector("[name='encounterOption']:checked");
        return { action: "select", encounter: options[Number(selected?.value ?? 0)] };
      } }
    ]
  }, { rejectClose: false });
  if (result && typeof result === "object" && typeof result.action === "string") return result;
  if (["cancel", "regenerate", "select"].includes(result)) {
    if (result === "select") {
      const selected = document.querySelector(".morelord-encounters-dialog [name='encounterOption']:checked")
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
  wrapper.className = "morelord-encounter-roster";
  const intro = document.createElement("p");
  intro.textContent = localize("DragHelp");
  const list = document.createElement("div");
  list.className = "morelord-encounter-monsters";
  for (const member of encounter.members) {
    const row = document.createElement("div");
    row.className = "morelord-encounter-monster";
    if (member.img) {
      const image = document.createElement("img");
      image.src = member.img;
      image.alt = "";
      row.append(image);
    }
    const link = document.createElement("a");
    link.className = "content-link morelord-encounter-actor-link";
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
    classes: ["morelord-encounters-dialog"],
    window: { title: `${encounter.name} — ${localize("Roster")}`, icon: "fa-solid fa-hydra" },
    position: { width: 560 },
    modal: false,
    content: rosterContent(encounter),
    buttons: [{ action: "close", label: localize("Close"), default: true }]
  }, { rejectClose: false });
}

export async function configureEncounter({ initial = null, title = null } = {}) {
  try {
    const configuration = await configure(initial, title);
    if (!configuration?.sourceIds?.length || !configuration?.partyUuids?.length) return null;
    const monsters = await catalogService.monsters(configuration.sourceIds);
    if (!monsters.length) throw new Error(localize("NoMonstersFound"));
    const partyCandidates = catalogService.partyCandidates();
    const selectedParty = new Set(configuration.partyUuids);
    const party = partyCandidates.filter(actor => selectedParty.has(actor.uuid));
    while (true) {
      const options = generateEncounterOptions({ monsters, party, difficulty: configuration.difficulty });
      const choice = await choose(options, party, monsters);
      if (choice.action === "cancel") return null;
      if (choice.action === "regenerate") continue;
      await showRoster(choice.encounter);
      return choice.encounter;
    }
  } catch (error) {
    console.error("morelord-encounters | Encounter generation failed", error);
    ui.notifications.error(error.message);
    return null;
  }
}

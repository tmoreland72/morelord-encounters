import { MODULE_ID } from "../domain/constants.mjs";
import { EncounterSettingsApplication } from "../apps/encounter-settings-app.mjs";

export const LAST_SOURCES_SETTING = "lastEncounterSources";
export const DEFAULT_CONFIGURATION_SETTING = "defaultEncounterConfiguration";
export const DEFAULT_CONFIGURATION_V2_SETTING = "defaultEncounterConfigurationV2";
export const DEFAULTS_CONFIGURED_SETTING = "defaultsConfigured";
export const DEFAULT_DIFFICULTY_SETTING = "defaultDifficulty";
export const DEFAULT_PARTY_SETTING = "defaultPartyUuids";
export const DEFAULT_SOURCES_SETTING = "defaultSourceIds";
export const DEFAULT_ENCOUNTER_SOURCE_SETTING = "defaultEncounterSource";
export const DEFAULT_DRAKKENHEIM_TABLE_SETTING = "defaultDrakkenheimTableId";

export function registerSettings() {
  game.settings.registerMenu(MODULE_ID, "configure", {
    name: "Encounters Settings",
    label: "Configure Encounters",
    hint: "Connect Morelord Core and review encounter-source access.",
    icon: "fa-solid fa-hydra",
    type: EncounterSettingsApplication,
    restricted: true
  });
  game.settings.register(MODULE_ID, LAST_SOURCES_SETTING, {
    name: "Last Encounter Sources",
    hint: "The source selections most recently used by the encounter builder.",
    scope: "world",
    config: false,
    type: Object,
    default: [],
    restricted: true
  });
  game.settings.register(MODULE_ID, DEFAULT_CONFIGURATION_SETTING, {
    name: "Default Encounter Configuration",
    hint: "The difficulty, party, and monster sources used when the encounter builder opens.",
    scope: "world",
    config: false,
    type: Object,
    default: {},
    restricted: true
  });
  game.settings.register(MODULE_ID, DEFAULT_CONFIGURATION_V2_SETTING, {
    name: "Default Encounter Configuration V2",
    hint: "The serialized difficulty, party, and source defaults used by the encounter builder.",
    scope: "world",
    config: false,
    type: String,
    default: "",
    restricted: true
  });
  game.settings.register(MODULE_ID, DEFAULTS_CONFIGURED_SETTING, {
    name: "Encounter Defaults Configured", scope: "world", config: false, type: Boolean, default: false, restricted: true
  });
  game.settings.register(MODULE_ID, DEFAULT_DIFFICULTY_SETTING, {
    name: "Default Encounter Difficulty", scope: "world", config: false, type: String, default: "medium", restricted: true
  });
  game.settings.register(MODULE_ID, DEFAULT_PARTY_SETTING, {
    name: "Default Encounter Party", scope: "world", config: false, type: Object, default: [], restricted: true
  });
  game.settings.register(MODULE_ID, DEFAULT_SOURCES_SETTING, {
    name: "Default Monster Sources", scope: "world", config: false, type: Object, default: [], restricted: true
  });
  game.settings.register(MODULE_ID, DEFAULT_ENCOUNTER_SOURCE_SETTING, {
    name: "Default Encounter Source", scope: "world", config: false, type: String, default: "monster-compendiums", restricted: true
  });
  game.settings.register(MODULE_ID, DEFAULT_DRAKKENHEIM_TABLE_SETTING, {
    name: "Default Drakkenheim Encounter Table", scope: "world", config: false, type: String, default: "", restricted: true
  });
}

export function getLastEncounterSources() {
  const value = game.settings.get(MODULE_ID, LAST_SOURCES_SETTING);
  return Array.isArray(value) ? value : [];
}

export async function setLastEncounterSources(sources) {
  return game.settings.set(MODULE_ID, LAST_SOURCES_SETTING, [...new Set(sources)]);
}

export function getDefaultEncounterConfiguration() {
  if (game.settings.get(MODULE_ID, DEFAULTS_CONFIGURED_SETTING)) {
    return {
      difficulty: game.settings.get(MODULE_ID, DEFAULT_DIFFICULTY_SETTING) || "medium",
      partyUuids: game.settings.get(MODULE_ID, DEFAULT_PARTY_SETTING) ?? [],
      sourceIds: game.settings.get(MODULE_ID, DEFAULT_SOURCES_SETTING) ?? [],
      encounterSource: game.settings.get(MODULE_ID, DEFAULT_ENCOUNTER_SOURCE_SETTING) || "monster-compendiums",
      drakkenheimTableId: game.settings.get(MODULE_ID, DEFAULT_DRAKKENHEIM_TABLE_SETTING) || ""
    };
  }
  return { difficulty: "medium", partyUuids: [], sourceIds: [], encounterSource: "monster-compendiums", drakkenheimTableId: "" };
}

export async function setDefaultEncounterConfiguration(configuration) {
  await game.settings.set(MODULE_ID, DEFAULT_DIFFICULTY_SETTING, configuration.difficulty || "medium");
  await game.settings.set(MODULE_ID, DEFAULT_PARTY_SETTING, [...configuration.partyUuids]);
  await game.settings.set(MODULE_ID, DEFAULT_SOURCES_SETTING, [...configuration.sourceIds]);
  await game.settings.set(MODULE_ID, DEFAULT_ENCOUNTER_SOURCE_SETTING, configuration.encounterSource || "monster-compendiums");
  await game.settings.set(MODULE_ID, DEFAULT_DRAKKENHEIM_TABLE_SETTING, configuration.drakkenheimTableId || "");
  await game.settings.set(MODULE_ID, DEFAULTS_CONFIGURED_SETTING, true);
  return configuration;
}

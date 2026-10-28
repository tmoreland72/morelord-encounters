import { MODULE_ID } from "../domain/constants.mjs";
import { explicitSelectedSourceIds, sourceTierBadges } from "../domain/source-tier-status.mjs";
import { getDefaultEncounterConfiguration, getLastEncounterSources } from "../core/settings.mjs";
import { CoreAccessService } from "../services/core-access-service.mjs";
import { Dnd5eMonsterSourceService } from "../services/dnd5e-monster-source-service.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class EncounterSettingsApplication extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "morelord-encounters-settings",
    classes: ["ml-window", "ml-encounters-module", "ml-encounters-window"],
    tag: "section",
    window: { title: "Morelord Encounters Settings", icon: "fa-solid fa-hydra", resizable: true },
    position: { width: 980, height: 860 },
    actions: {
      manageAccount: this.manageAccount,
      refreshAccess: this.refreshAccess,
      closeSettings: this.closeSettings
    }
  };

  static PARTS = { content: { template: `modules/${MODULE_ID}/templates/encounter-settings.hbs` } };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const accessService = new CoreAccessService();
    await accessService.refresh({ quiet: true });
    const access = accessService.status();
    let sources = [];
    try { sources = await new Dnd5eMonsterSourceService().availableSources(); }
    catch { sources = []; }
    const standardAccess = { standard: true, premium: false };
    const standardSources = sources.filter(source => accessService.canUseSource(source, standardAccess));
    const premiumSources = sources.filter(source => !accessService.canUseSource(source, standardAccess));
    const remembered = getLastEncounterSources();
    const selectedIds = explicitSelectedSourceIds(sources, remembered.length
      ? remembered
      : (getDefaultEncounterConfiguration().sourceIds ?? []));
    const tierLabel = ["champion", "tools-champion", "tools_champion"].includes(access.tier)
      ? "Tools Champion"
      : ["premium", "tools-premium", "tools_premium"].includes(access.tier)
        ? "Tools Premium"
        : "Standard";
    return {
      ...context,
      access: {
        ...access,
        tierLabel,
        validatedAtLabel: access.validatedAt ? new Date(access.validatedAt).toLocaleString() : null,
        expiresAtLabel: access.expiresAt ? new Date(access.expiresAt).toLocaleString() : null,
        standard: tierLabel === "Standard",
        premium: tierLabel === "Tools Premium",
        champion: tierLabel === "Tools Champion"
      },
      standardBadges: sourceTierBadges({
        licensed: access.features.standard,
        sources: standardSources,
        selectedIds
      }),
      premiumBadges: sourceTierBadges({
        licensed: access.features.premium,
        sources: premiumSources,
        selectedIds
      })
    };
  }

  static async closeSettings(event) {
    event.preventDefault();
    await this.close();
  }

  static manageAccount(event) {
    event.preventDefault();
    new CoreAccessService().openAccount();
  }

  static async refreshAccess(event, target) {
    event.preventDefault();
    target.disabled = true;
    try {
      await new CoreAccessService().refresh({ quiet: false });
      ui.notifications.info("Morelord Encounters access refreshed.");
      await this.render({ force: true });
    } finally {
      target.disabled = false;
    }
  }
}

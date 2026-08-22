import {
  configureEncounter,
  rerollCreatureFromButton,
  saveEncounterDefaultsFromButton,
  showEncounterLearnMore,
  showCreaturePreviewFromButton
} from "./apps/encounter-builder-dialog.mjs";
import { registerSettings } from "./core/settings.mjs";
import { MODULE_ID, PRODUCT_SLUG } from "./domain/constants.mjs";
import { CoreAccessService } from "./services/core-access-service.mjs";

Hooks.once("init", registerSettings);

document.addEventListener("click", event => {
  const encounter = event.target.closest?.(".ml-encounters-option");
  if (encounter && !event.target.closest("button")) {
    const radio = encounter.querySelector("[name='encounterOption']");
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  const target = event.target.closest?.("[data-morelord-action]");
  if (!target) return;
  if (target.dataset.morelordAction === "save-encounter-defaults") {
    event.preventDefault();
    event.stopPropagation();
    void saveEncounterDefaultsFromButton(target).catch(error => {
      console.error(`${MODULE_ID} | Could not save encounter defaults`, error);
      ui.notifications.error(error.message);
    });
  }
  if (target.dataset.morelordAction === "learn-more-encounters") {
    event.preventDefault();
    event.stopPropagation();
    void showEncounterLearnMore().catch(error => {
      console.error(`${MODULE_ID} | Could not show encounter explanation`, error);
      ui.notifications.error(error.message);
    });
  }
  if (target.dataset.morelordAction === "open-monster-compendium") {
    event.preventDefault();
    event.stopPropagation();
    const pack = game.packs.get(target.dataset.packId);
    if (!pack) return ui.notifications.warn("That monster compendium is no longer available.");
    pack.render(true);
  }
  if (target.dataset.morelordAction === "preview-generated-creature") {
    event.preventDefault();
    event.stopPropagation();
    void showCreaturePreviewFromButton(target).catch(error => {
      console.error(`${MODULE_ID} | Could not show creature preview`, error);
      ui.notifications.error(error.message);
    });
  }
  if (target.dataset.morelordAction === "reroll-generated-creature") {
    event.preventDefault();
    event.stopPropagation();
    try { rerollCreatureFromButton(target); }
    catch (error) {
      console.error(`${MODULE_ID} | Could not regenerate creature`, error);
      ui.notifications.error(error.message);
    }
  }
  if (target.dataset.morelordAction === "open-encounter-actor") {
    event.preventDefault();
    event.stopPropagation();
    void fromUuid(target.dataset.uuid).then(actor => actor?.sheet?.render(true));
  }
}, true);

document.addEventListener("dragstart", event => {
  const target = event.target.closest?.("[data-morelord-drag-actor]");
  if (!target || !event.dataTransfer) return;
  const payload = JSON.stringify({ type: "Actor", uuid: target.dataset.morelordDragActor });
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData("text/plain", payload);
  event.dataTransfer.setData("application/json", payload);
}, true);

Hooks.on("getSceneControlButtons", controls => {
  const tokenTools = controls?.tokens?.tools;
  if (!tokenTools) return;
  tokenTools.morelordEncounters = {
    name: "morelordEncounters",
    title: "Morelord Encounters",
    icon: "fa-solid fa-hydra",
    order: Object.keys(tokenTools).length,
    button: true,
    visible: game.user.isGM,
    onChange: () => void configureEncounter()
  };
});

Hooks.once("ready", async () => {
  const coreAccess = new CoreAccessService();
  await coreAccess.api?.refresh?.(PRODUCT_SLUG, { quiet: true });
  console.info(`${MODULE_ID} | Ready for Foundry v14 · ${coreAccess.tier}`);
});

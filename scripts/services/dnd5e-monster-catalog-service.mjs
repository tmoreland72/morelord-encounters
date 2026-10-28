import { listCharacterActors } from "../../../morelord-core/scripts/ui/actor-participation.js";
import { monsterXp } from "../domain/encounter-generator.mjs";
import { resolveCoreBookLabel } from "../core/core-api.mjs";
import { isSystemPackEnabled } from "./system-pack-access.mjs";
import {
  NO_ENABLED_MONSTERS_WARNING,
  assembleMonsterPool,
  isEncounterMonster,
  isExternalMonsterReference,
  packIdFromCompendiumUuid
} from "./encounter-monster-pool.mjs";

export {
  NO_ENABLED_MONSTERS_WARNING,
  isEncounterMonster,
  isExternalMonsterReference,
  packIdFromCompendiumUuid
};

export class Dnd5eMonsterCatalogService {
  async monsterPool(sourceIds) {
    const monsters = await this.monsters(sourceIds);
    return { monsters, warning: monsters.length ? null : NO_ENABLED_MONSTERS_WARNING };
  }

  monsters(sourceIds) {
    return assembleMonsterPool({
      sourceIds,
      getPack: id => game.packs.get(id),
      isEnabled: isSystemPackEnabled,
      resolveBookLabel: resolveCoreBookLabel,
      packageLabelFor: pack => {
        const packageName = pack.metadata?.packageName ?? pack.metadata?.package ?? "";
        return game.modules?.get?.(packageName)?.title
          ?? (game.system?.id === packageName ? game.system.title : "")
          ?? game.i18n.localize(pack.metadata?.label ?? pack.title ?? pack.collection);
      }
    });
  }

  partyCandidates() {
    return listCharacterActors({ includePartyNpcs: true }).map(actor => ({
      name: actor.name,
      type: actor.type,
      ...(actor.type === "npc" ? { cr: Number(actor.system?.details?.cr ?? 0), xp: monsterXp({ cr: actor.system?.details?.cr, xp: actor.system?.details?.xp?.value }) } : {}),
      level: Number(actor.system?.details?.level ?? 1),
      uuid: actor.uuid,
      img: actor.img,
      hasPlayerOwner: actor.hasPlayerOwner
    })).sort((left, right) => left.name.localeCompare(right.name));
  }
}

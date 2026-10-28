import { monsterXp } from "../domain/encounter-generator.mjs";
import { monsterStealthModifier } from "../domain/encounter-stealth.mjs";

export const NO_ENABLED_MONSTERS_WARNING = "No monsters are available from the enabled sources. Encounters will not substitute a disabled compendium.";
const SYSTEM_SRD_PACKS = new Set(["dnd5e.monsters", "dnd5e.actors24"]);
const INDEX_FIELDS = [
  "type", "system.details.cr", "system.details.xp.value", "system.details.type.value",
  "system.details.habitat", "system.source.book", "system.source.uuid", "system.traits.size",
  "system.attributes.ac.value", "system.attributes.hp.max", "system.attributes.prof",
  "system.abilities.dex.value", "system.skills.ste.mod", "system.skills.ste.value",
  "system.skills.ste.proficient", "prototypeToken.disposition", "img", "uuid", "items", "flags"
];

export function packIdFromCompendiumUuid(value) {
  const parts = String(value ?? "").match(/^Compendium\.([^.]+)\.([^.]+)\./);
  return parts ? `${parts[1]}.${parts[2]}` : null;
}

/** A pointer at another compendium, not a full stat block stored in this pack. */
export function isExternalMonsterReference(entry, packCollection) {
  if (!entry || entry.reference === true || entry.flags?.dnd5e?.isReference === true) return true;
  const pointers = [
    entry.uuid,
    entry.flags?.core?.sourceId,
    entry.flags?.dnd5e?.reference,
    entry.flags?.dnd5e?.sourceUuid,
    entry.system?.source?.uuid
  ];
  const pointsElsewhere = pointers.some(value => {
    const packId = packIdFromCompendiumUuid(value);
    return packId && packId !== packCollection;
  });
  if (!pointsElsewhere) return false;
  const hasOwnStatBlock = entry.system?.details?.cr !== undefined
    || entry.system?.details?.xp !== undefined
    || entry.system?.attributes?.hp !== undefined
    || entry.system?.attributes?.ac !== undefined;
  return !hasOwnStatBlock;
}

export function isEncounterMonster(entry) {
  if (entry.type !== "npc") return false;
  const creatureType = String(entry.system?.details?.type?.value ?? "").toLowerCase();
  const disposition = Number(entry.prototypeToken?.disposition);
  return creatureType !== "humanoid" || !Number.isFinite(disposition) || disposition < 0;
}

function featureList(entry) {
  const items = entry.items;
  if (!items) return [];
  return (Array.isArray(items) ? items : Object.values(items)).map(item => ({
    name: item?.name ?? "",
    description: item?.system?.description?.value ?? item?.description ?? ""
  })).filter(feature => feature.name || feature.description);
}

function displaySourceLabel(resolved, pack, packageLabel) {
  const looksLikeSrd = /system reference document\s*5\.[12]|\bsrd\s*5\.[12]\b/i.test(resolved ?? "");
  if (looksLikeSrd && !SYSTEM_SRD_PACKS.has(pack.collection)) return packageLabel || pack.metadata?.label || pack.collection;
  return resolved || packageLabel || pack.collection;
}

function selectionsFor(sourceIds) {
  const selections = new Map();
  for (const id of sourceIds ?? []) {
    if (String(id).startsWith("packs::")) {
      let packIds = [];
      try { packIds = JSON.parse(decodeURIComponent(String(id).slice(7))); }
      catch { packIds = []; }
      for (const packId of packIds) {
        const books = selections.get(packId) ?? new Set();
        books.add(null);
        selections.set(packId, books);
      }
      continue;
    }
    const [packId, encodedBook] = String(id).split("::");
    const books = selections.get(packId) ?? new Set();
    books.add(encodedBook === undefined ? null : decodeURIComponent(encodedBook));
    selections.set(packId, books);
  }
  return selections;
}

/**
 * Actors from the requested packs only. `isEnabled` is dnd5e Configure Sources
 * (Core's helper when present). Packs that fail it are not indexed and nothing
 * is substituted. References to another pack are skipped; full stat blocks
 * stay, including 2014 copies stored in a selected compendium.
 */
export async function assembleMonsterPool({ sourceIds, getPack, isEnabled, resolveBookLabel, packageLabelFor }) {
  const selections = selectionsFor(sourceIds);
  const packs = [...selections.keys()].map(id => getPack(id)).filter(pack => pack && isEnabled(pack));
  const groups = await Promise.all(packs.map(async pack => {
    const index = await pack.getIndex({ fields: INDEX_FIELDS });
    const packageLabel = packageLabelFor(pack);
    const packageName = pack.metadata?.packageName ?? pack.metadata?.package ?? "";
    const selectedBooks = selections.get(pack.collection) ?? new Set([null]);
    return index.filter(isEncounterMonster).filter(entry => !isExternalMonsterReference(entry, pack.collection)).filter(entry => {
      if (selectedBooks.has(null)) return true;
      return selectedBooks.has(String(entry.system?.source?.book ?? "").trim());
    }).map(entry => {
      const book = entry.system?.source?.book;
      let sourceBook = resolveBookLabel({ book, pack });
      const officialPackages = new Set(["dnd5e", "dnd-players-handbook", "dnd-dungeon-masters-guide", "dnd-monster-manual"]);
      if (/player.?s handbook|dungeon master.?s guide|monster manual/i.test(sourceBook) && !officialPackages.has(packageName)) {
        sourceBook = packageLabel || sourceBook;
      }
      sourceBook = displaySourceLabel(sourceBook, pack, packageLabel);
      const monster = {
        id: entry._id,
        uuid: `Compendium.${pack.collection}.${entry._id}`,
        name: entry.name,
        features: featureList(entry),
        img: entry.img,
        cr: Number(entry.system?.details?.cr ?? 0),
        xp: Number(entry.system?.details?.xp?.value ?? 0),
        creatureType: entry.system?.details?.type?.value ?? "",
        habitats: Array.from(entry.system?.details?.habitat?.value ?? [], habitat => habitat?.type)
          .filter(Boolean),
        size: entry.system?.traits?.size ?? "",
        ac: Number(entry.system?.attributes?.ac?.value ?? 0),
        hp: Number(entry.system?.attributes?.hp?.max ?? 0),
        stealthModifier: monsterStealthModifier(entry.system),
        disposition: Number(entry.prototypeToken?.disposition),
        sourceId: pack.collection,
        sourceSelectorId: book ? `${pack.collection}::${encodeURIComponent(book)}` : pack.collection,
        sourceBook: book,
        sourceLabel: sourceBook || packageLabel || pack.collection,
        packLabel: packageLabel || pack.collection
      };
      return { ...monster, xp: monsterXp(monster) };
    });
  }));
  return groups.flat();
}

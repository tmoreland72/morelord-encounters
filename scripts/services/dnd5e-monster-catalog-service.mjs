import { monsterXp } from "../domain/encounter-generator.mjs";

export class Dnd5eMonsterCatalogService {
  async monsters(sourceIds) {
    const selections = new Map();
    for (const id of sourceIds) {
      const [packId, encodedBook] = String(id).split("::");
      const books = selections.get(packId) ?? new Set();
      books.add(encodedBook === undefined ? null : decodeURIComponent(encodedBook));
      selections.set(packId, books);
    }
    const packs = Array.from(selections.keys(), id => game.packs.get(id)).filter(Boolean);
    const groups = await Promise.all(packs.map(async pack => {
      const index = await pack.getIndex({ fields: [
        "type", "system.details.cr", "system.details.xp.value", "system.details.type.value",
        "system.details.alignment", "system.source.book", "system.traits.size",
        "system.details.habitat.value", "system.details.habitat.custom",
        "system.attributes.ac.value", "system.attributes.hp.max", "prototypeToken.disposition", "img"
      ] });
      const packageName = pack.metadata?.packageName ?? pack.metadata?.package ?? "";
      const packageLabel = game.modules?.get?.(packageName)?.title
        ?? (game.system?.id === packageName ? game.system.title : "")
        ?? game.i18n.localize(pack.metadata?.label ?? pack.title ?? pack.collection);
      const selectedBooks = selections.get(pack.collection) ?? new Set([null]);
      return index.filter(entry => entry.type === "npc").filter(entry => {
        if (selectedBooks.has(null)) return true;
        return selectedBooks.has(String(entry.system?.source?.book ?? "").trim());
      }).filter(entry => {
        const creatureType = String(entry.system?.details?.type?.value ?? "").toLowerCase();
        const disposition = Number(entry.prototypeToken?.disposition);
        return creatureType !== "humanoid" || !Number.isFinite(disposition) || disposition < 0;
      }).map(entry => {
        const book = entry.system?.source?.book;
        const configuredBook = globalThis.CONFIG?.DND5E?.sourceBooks?.[book] ?? game.system?.config?.sourceBooks?.[book];
        const bookValue = configuredBook && typeof configuredBook === "object"
          ? configuredBook.label ?? configuredBook.name ?? configuredBook.title
          : configuredBook;
        let sourceBook = bookValue ? game.i18n.localize(bookValue) : String(book ?? "").trim();
        const officialPackages = new Set(["dnd5e", "dnd-players-handbook", "dnd-dungeon-masters-guide", "dnd-monster-manual"]);
        if (/player.?s handbook|dungeon master.?s guide|monster manual/i.test(sourceBook) && !officialPackages.has(packageName)) {
          sourceBook = packageLabel || sourceBook;
        }
        const monster = {
          id: entry._id,
          uuid: `Compendium.${pack.collection}.${entry._id}`,
          name: entry.name,
          img: entry.img,
          cr: Number(entry.system?.details?.cr ?? 0),
          xp: Number(entry.system?.details?.xp?.value ?? 0),
          creatureType: entry.system?.details?.type?.value ?? "",
          alignment: entry.system?.details?.alignment ?? "",
          size: entry.system?.traits?.size ?? "",
          ac: Number(entry.system?.attributes?.ac?.value ?? 0),
          hp: Number(entry.system?.attributes?.hp?.max ?? 0),
          disposition: Number(entry.prototypeToken?.disposition),
          habitats: Array.from(entry.system?.details?.habitat?.value ?? [], habitat => ({
            type: String(habitat?.type ?? habitat ?? "").trim().toLowerCase(),
            subtype: String(habitat?.subtype ?? "").trim()
          })).filter(habitat => habitat.type),
          customHabitat: String(entry.system?.details?.habitat?.custom ?? "").trim(),
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

  partyCandidates() {
    return Array.from(game.actors ?? []).filter(actor => actor.type === "character").map(actor => ({
      name: actor.name,
      level: Number(actor.system?.details?.level ?? 1),
      uuid: actor.uuid,
      img: actor.img,
      hasPlayerOwner: actor.hasPlayerOwner
    })).sort((left, right) => left.name.localeCompare(right.name));
  }
}

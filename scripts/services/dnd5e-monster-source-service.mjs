import { MODULE_ID } from "../domain/constants.mjs";

export class Dnd5eMonsterSourceService {
  async availableSources() {
    const configuration = this.#configuration();
    const packs = [...new Map(Array.from(game.packs ?? [])
      .filter(pack => pack.documentName === "Actor")
      .filter(pack => this.#enabled(pack, configuration))
      .map(pack => [pack.collection, pack])).values()];
    const groups = await Promise.all(packs.map(pack => this.#sources(pack)));
    return this.#consolidateCompendiums([...new Map(groups.flat().map(source => [source.id, source])).values()])
      .sort((left, right) => left.label.localeCompare(right.label));
  }

  #consolidateCompendiums(sources) {
    const consolidated = [];
    const genericGroups = new Map();
    for (const source of sources) {
      if (source.book || !source.packageName || !this.#isGeneric(source.packLabel)) {
        consolidated.push(source);
        continue;
      }
      const key = `${source.packageName}\u0000${source.label}\u0000${source.packLabel}`;
      const group = genericGroups.get(key) ?? [];
      group.push(source);
      genericGroups.set(key, group);
    }
    for (const group of genericGroups.values()) {
      if (group.length === 1) {
        consolidated.push(group[0]);
        continue;
      }
      const packIds = group.map(source => source.packId);
      consolidated.push({
        ...group[0],
        id: `packs::${encodeURIComponent(JSON.stringify(packIds))}`,
        packIds
      });
    }
    return consolidated;
  }

  async #sources(pack) {
    const packageName = pack.metadata?.packageName ?? pack.metadata?.package ?? "";
    const img = this.#image(pack, packageName);
    const packLabel = this.#packLabel(pack);
    const declaredBooks = this.#declaredSourceBooks(packageName);
    if (declaredBooks.length === 1) {
      const packageTitle = this.#localize(game.modules?.get?.(packageName)?.title ?? "");
      return [{
        id: pack.collection,
        packId: pack.collection,
        book: "",
        label: packageTitle || declaredBooks[0].label || packLabel,
        packLabel,
        packageName,
        img
      }];
    }
    try {
      const index = await pack.getIndex({ fields: ["system.source.book"] });
      const books = [...new Set(index.map(entry => String(entry.system?.source?.book ?? "").trim()).filter(Boolean))];
      if (books.length) {
        const sources = books.map(book => ({
          id: `${pack.collection}::${encodeURIComponent(book)}`,
          packId: pack.collection,
          book,
          label: this.#bookLabel(pack, packageName, book),
          packLabel,
          packageName,
          img
        }));
        // Some third-party packs use many aliases (often core-book IDs) which
        // all resolve to the same package title. Present that compendium once;
        // selecting the pack still includes every creature in it.
        const labels = new Set(sources.map(source => source.label));
        if (labels.size === 1) return [{ ...sources[0], id: pack.collection, book: "" }];
        return sources;
      }
    } catch (error) {
      console.warn(`${MODULE_ID} | Could not inspect source books`, pack.collection, error);
    }
    return [{ id: pack.collection, packId: pack.collection, book: "", label: await this.#label(pack), packLabel, packageName, img }];
  }

  #packLabel(pack) {
    return this.#localize(pack.metadata?.label ?? pack.title ?? pack.collection ?? "Unknown Compendium");
  }

  #declaredSourceBooks(packageName) {
    const configured = game.modules?.get?.(packageName)?.flags?.dnd5e?.sourceBooks;
    if (!configured || typeof configured !== "object") return [];
    return Object.entries(configured).map(([id, value]) => ({
      id,
      label: this.#localize(value && typeof value === "object"
        ? value.label ?? value.name ?? value.title ?? id
        : value ?? id)
    }));
  }

  #bookLabel(pack, packageName, book) {
    const resolved = this.#sourceBookLabel(book) || book;
    const isCoreLabel = /player.?s handbook|dungeon master.?s guide|monster manual/i.test(resolved);
    const officialPackages = new Set(["dnd5e", "dnd-players-handbook", "dnd-dungeon-masters-guide", "dnd-monster-manual"]);
    if (!isCoreLabel || officialPackages.has(packageName)) return resolved;
    const packageTitle = game.modules.get(packageName)?.title;
    const packTitle = this.#localize(pack.metadata?.label ?? pack.title ?? "");
    return packageTitle || (!this.#isGeneric(packTitle) ? packTitle : "") || resolved;
  }

  #image(pack, packageName) {
    const pkg = game.modules.get(packageName) ?? (game.system?.id === packageName ? game.system : null);
    const media = Array.from(pkg?.media ?? []);
    const preferred = media.find(entry => ["cover", "banner"].includes(entry.type))
      ?? media.find(entry => entry.type === "icon")
      ?? media[0];
    return pack.banner ?? pack.img ?? pack.metadata?.banner ?? pack.metadata?.img ?? preferred?.url ?? pkg?.icon ?? "";
  }

  #configuration() {
    try { return game.settings.get("dnd5e", "packSourceConfiguration") ?? {}; }
    catch { return {}; }
  }

  #enabled(pack, config) {
    const collection = pack.collection;
    // This is the same rule used by dnd5e's CompendiumBrowser.collateSources.
    return config?.[collection] !== false;
  }

  async #label(pack) {
    const sourceBook = pack.metadata?.sourceBook;
    const explicitBook = sourceBook ? this.#sourceBookLabel(sourceBook) : "";
    if (explicitBook) return explicitBook;
    try {
      const index = await pack.getIndex({ fields: ["system.source.book"] });
      const books = [...new Set(index.map(entry => entry.system?.source?.book).filter(Boolean)
        .map(book => this.#sourceBookLabel(book) || String(book)))].sort((a, b) => a.localeCompare(b));
      if (books.length === 1) return books[0];
      if (books.length > 1) return books.join(" / ");
    } catch (error) {
      console.warn(`${MODULE_ID} | Could not inspect monster source metadata`, pack.collection, error);
    }
    const packageName = pack.metadata?.packageName ?? pack.metadata?.package ?? "";
    const packageTitle = game.modules.get(packageName)?.title
      ?? (game.system.id === packageName ? game.system.title : "")
      ?? game.worlds?.get?.(packageName)?.title
      ?? "";
    const packTitle = this.#localize(pack.metadata?.label ?? pack.title ?? "");
    if (packageTitle && !this.#isGeneric(packTitle)) return `${packageTitle} — ${packTitle}`;
    return packageTitle || packTitle || pack.collection || "Unknown Source";
  }

  #sourceBookLabel(book) {
    return globalThis.MorelordCore.sources.resolveBookLabel({ book });
  }

  #localize(value) {
    const candidate = String(value ?? "").trim();
    if (!candidate) return "";
    try { return game.i18n.localize(candidate) || candidate; }
    catch { return candidate; }
  }

  #isGeneric(label) { return /^(actors?|monsters?|bestiary|adventure bestiary)$/i.test(String(label).trim()); }
}

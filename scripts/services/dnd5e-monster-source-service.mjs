import { MODULE_ID } from "../domain/constants.mjs";

export class Dnd5eMonsterSourceService {
  async availableSources() {
    const configuration = this.#configuration();
    const packs = Array.from(game.packs ?? [])
      .filter(pack => pack.documentName === "Actor")
      .filter(pack => this.#enabled(pack, configuration));
    const groups = await Promise.all(packs.map(pack => this.#sources(pack)));
    return groups.flat().sort((left, right) => left.label.localeCompare(right.label));
  }

  async #sources(pack) {
    const packageName = pack.metadata?.packageName ?? pack.metadata?.package ?? "";
    const img = this.#image(pack, packageName);
    try {
      const index = await pack.getIndex({ fields: ["system.source.book"] });
      const books = [...new Set(index.map(entry => String(entry.system?.source?.book ?? "").trim()).filter(Boolean))];
      if (books.length) return books.map(book => ({
        id: `${pack.collection}::${encodeURIComponent(book)}`,
        packId: pack.collection,
        book,
        label: this.#bookLabel(pack, packageName, book),
        packageName,
        img
      }));
    } catch (error) {
      console.warn(`${MODULE_ID} | Could not inspect source books`, pack.collection, error);
    }
    return [{ id: pack.collection, packId: pack.collection, book: "", label: await this.#label(pack), packageName, img }];
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
    const short = collection.split(".").at(-1);
    const packageName = pack.metadata?.packageName ?? pack.metadata?.package;
    if (config?.[collection] === false || config?.[short] === false) return false;
    if (packageName && config?.[packageName]?.[collection] === false) return false;
    if (Array.isArray(config?.disabled) && config.disabled.includes(collection)) return false;
    return true;
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
    const configured = CONFIG.DND5E?.sourceBooks?.[book] ?? game.system.config?.sourceBooks?.[book];
    const label = configured && typeof configured === "object"
      ? configured.label ?? configured.name ?? configured.title
      : configured;
    return this.#localize(label ?? "");
  }

  #localize(value) {
    const candidate = String(value ?? "").trim();
    if (!candidate) return "";
    try { return game.i18n.localize(candidate) || candidate; }
    catch { return candidate; }
  }

  #isGeneric(label) { return /^(actors?|monsters?|bestiary|adventure bestiary)$/i.test(String(label).trim()); }
}

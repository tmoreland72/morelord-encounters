const CORE_MODULE_ID = "drakkenheim-core";
const MONSTERS_MODULE_ID = "drakkenheim-monsters";
const TABLE_PACK_ID = `${CORE_MODULE_ID}.tables`;
const JOURNAL_PACK_ID = `${CORE_MODULE_ID}.journals`;
const ADVENTURE_PACK_ID = `${CORE_MODULE_ID}.adventures`;
const PRIMARY_ACTOR_PACK_ID = `${MONSTERS_MODULE_ID}.monsters`;
const MAX_TABLE_DEPTH = 8;
const CHAMPION_TIERS = new Set(["champion", "tools-champion", "tools_champion"]);
const BOOK_BACKED_TABLE = /\b(?:inner city|outer city|sewers?)\b/i;
const LOCATION_TITLE_TABLES = new Set(["crater-basin", "gates", "special-outlaw"]);
const CONFIRMED_MONSTER_ALIASES = new Map([
  ["grotesque gargant", "grotesque gargantuan"],
  ["bugbear", "bugbear warrior"],
  ["hedge mage", "academy outcast"]
]);

const normalize = value => String(value ?? "").trim().toLocaleLowerCase()
  .replace(/[’]/g, "'")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const TABLE_GROUPS = Object.freeze([
  { id: "inner-city", label: "Inner City", matches: name => /\binner city\b/i.test(name) },
  { id: "outer-city", label: "Outer City", matches: name => /\bouter city\b/i.test(name) },
  { id: "sewers", label: "Sewers", matches: name => /\bsewers?\b/i.test(name) && /encounter|monster/i.test(name) },
  { id: "crater-basin", label: "Crater Basin", matches: name => /\bcrater basin\b/i.test(name) },
  { id: "gates", label: "Gates", matches: name => /\bgates?\b/i.test(name) && /encounter/i.test(name) },
  { id: "interactions", label: "Interactions", matches: name => /\binteractions?\b/i.test(name) },
  { id: "queens-park", label: "Queen's Park", matches: name => /\bqueen'?s park\b/i.test(name) },
  { id: "special-outlaw", label: "Special Outlaw Members", matches: name => /\bspecial outlaw member/i.test(name) }
]);

function packType(pack) {
  return pack?.documentName ?? pack?.metadata?.type ?? "";
}

function packLabel(pack) {
  return game.i18n?.localize?.(pack?.metadata?.label ?? pack?.title ?? pack?.collection) ?? pack?.collection;
}

function sourceBookLabel(book, pack) {
  const resolver = game.modules.get("morelord-core")?.api?.sources?.resolveBookLabel;
  if (!resolver) throw new Error("Morelord Core source-book services are unavailable.");
  return resolver({ book, pack });
}

function resultData(result) {
  return result.toObject();
}

function resultText(result, data = resultData(result)) {
  return [data.name, data.description].filter(Boolean).join("\n").trim();
}

function resultUuid(data) {
  if (data.type !== "document") return null;
  if (data.uuid) return String(data.uuid).trim() || null;
  const collection = String(data.documentCollection ?? "").trim();
  const id = String(data.documentId ?? "").trim();
  if (!collection || !id) return null;
  const pack = game.packs.get(collection);
  if (!pack) return `${collection}.${id}`;
  const documentName = pack.documentName ?? pack.metadata?.type;
  return `Compendium.${collection}.${documentName}.${id}`;
}

function inlineUuids(text) {
  const uuids = [
    ...[...String(text).matchAll(/@UUID\[([^\]]+)]/g)].map(match => match[1]),
    ...[...String(text).matchAll(/data-uuid=["']([^"']+)["']/gi)].map(match => match[1]),
    ...[...String(text).matchAll(/@Compendium\[([^\]]+)]/g)].map(match => `Compendium.${match[1]}`)
  ];
  return [...new Set(uuids)];
}

async function resolveUuidNames(text, fallbackName) {
  let resolvedText = String(text ?? "");
  const references = [...resolvedText.matchAll(/@(UUID|Compendium)\[([^\]]+)](?:\{([^}]+)})?/g)];
  for (const match of references) {
    const uuid = match[1] === "Compendium" ? `Compendium.${match[2]}` : match[2];
    const document = match[3] ? null : await fromUuid(uuid);
    const name = match[3] || document?.name || await fallbackName?.(uuid) || "Unknown reference";
    resolvedText = resolvedText.replaceAll(match[0], name);
  }
  return resolvedText;
}

function plainResultText(text) {
  return String(text ?? "")
    .replace(/@UUID\[[^\]]+\]\{([^}]+)}/g, "$1")
    .replace(/@Compendium\[[^\]]+\]\{([^}]+)}/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function encounterResultTitle(data, tableName) {
  const explicitName = plainResultText(data.name);
  if (explicitName) return explicitName;
  const group = TABLE_GROUPS.find(candidate => candidate.matches(tableName));
  if (LOCATION_TITLE_TABLES.has(group?.id)) return `${group.label} Encounter`;
  const formattedTitle = String(data.description ?? "").match(/<(?:strong|b|em)\b[^>]*>([\s\S]*?)<\/(?:strong|b|em)>/i)?.[1];
  return plainResultText(formattedTitle || data.description);
}

function rollFormulaBeforeName(text, name) {
  const escaped = String(name ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flexibleName = /y$/i.test(escaped)
    ? `${escaped.slice(0, -1)}(?:y|ies)`
    : `${escaped}(?:e?s)?`;
  const patterns = escaped ? [
    new RegExp(`(?:^|\\b)(\\d*d\\d+(?:\\s*[+\\-]\\s*\\d+)?|\\d+)\\s*(?:[x×]\\s*)?(?:[^.\\n]{0,40}\\s+)?${flexibleName}`, "i")
  ] : [];
  patterns.push(/(?:^|\b)(\d*d\d+(?:\s*[+\-]\s*\d+)?|\d+)\s*[x×]\b/i);
  return patterns.map(pattern => String(text ?? "").match(pattern)?.[1]).find(Boolean) ?? null;
}

function encounterQuantityFormula(text, name, area) {
  const base = rollFormulaBeforeName(text, name);
  if (!/\binner city\b/i.test(area)) return base;

  const innerCityText = String(text).match(/\bin (?:the )?inner city\b[^.]{0,180}/i)?.[0] ?? "";
  const explicit = innerCityText.match(/(\d*d\d+(?:\s*[+\-]\s*\d+)?|\d+)/i)?.[1];
  if (explicit) return explicit;

  if (/double the number encountered in (?:the )?inner city/i.test(text) && base) {
    return `2 * (${base})`;
  }

  const additional = String(text).match(/add(?: an)? additional\s+(\d*d\d+(?:\s*[+\-]\s*\d+)?|\d+)[^.]{0,100}in (?:the )?inner city/i)?.[1];
  if (additional && base) return `(${base}) + (${additional})`;
  return base;
}

async function hiddenQuantity(formula) {
  if (!formula) return 1;
  if (/^\d+$/.test(formula.trim())) return Math.max(1, Number(formula));
  try {
    const roll = await new Roll(formula).evaluate();
    return Math.max(1, Math.floor(Number(roll.total) || 1));
  } catch {
    return 1;
  }
}

function randomFraction() {
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return value[0] / 0x1_0000_0000;
}

function resultWeight(result) {
  const data = resultData(result);
  const lower = Number(data.range?.[0]);
  const upper = Number(data.range?.[1]);
  if (Number.isFinite(lower) && Number.isFinite(upper) && upper >= lower) return upper - lower + 1;
  return Math.max(1, Number(data.weight) || 1);
}

function actorStatSignature(entry) {
  const system = entry.system ?? {};
  const abilities = system.abilities ?? {};
  return JSON.stringify([
    Number(system.details?.cr ?? 0),
    Number(system.details?.xp?.value ?? 0),
    Number(system.attributes?.ac?.value ?? 0),
    Number(system.attributes?.hp?.max ?? 0),
    ...["str", "dex", "con", "int", "wis", "cha"].map(key => Number(abilities[key]?.value ?? 0)),
    normalize(system.traits?.size),
    normalize(system.details?.type?.value)
  ]);
}

export class DrakkenheimEncounterService {
  constructor({ coreAccess } = {}) {
    this.coreAccess = coreAccess;
    this.bookSources = null;
    this.bookEncounterTitles = null;
    this.embeddedActorNames = null;
  }

  get isAvailable() {
    return Boolean(game.user?.isGM
      && CHAMPION_TIERS.has(this.coreAccess?.tier)
      && game.modules.get(CORE_MODULE_ID)?.active
      && game.modules.get(MONSTERS_MODULE_ID)?.active
      && game.packs.get(TABLE_PACK_ID)
      && game.packs.get(PRIMARY_ACTOR_PACK_ID));
  }

  async availableTables() {
    if (!this.isAvailable) return [];
    const pack = game.packs.get(TABLE_PACK_ID);
    const index = await pack.getIndex({ fields: ["name", "folder"] });
    const matches = [];
    for (const group of TABLE_GROUPS) {
      for (const entry of index.filter(candidate => group.matches(candidate.name ?? ""))) {
        matches.push({
          id: entry._id,
          uuid: `Compendium.${TABLE_PACK_ID}.${entry._id}`,
          name: entry.name,
          label: group.label,
          groupId: group.id
        });
      }
    }
    return matches.sort((left, right) => {
      const groupDifference = TABLE_GROUPS.findIndex(group => group.id === left.groupId)
        - TABLE_GROUPS.findIndex(group => group.id === right.groupId);
      return groupDifference || left.name.localeCompare(right.name);
    });
  }

  async actorCatalog() {
    const catalogs = [];
    const addedPacks = new Set();
    const indexCache = new Map();
    const addPack = async (pack, { bucket = "all", predicate = () => true } = {}) => {
      const cacheKey = `${pack?.collection}:${bucket}`;
      if (!pack || addedPacks.has(cacheKey)) return;
      addedPacks.add(cacheKey);
      let index = indexCache.get(pack.collection);
      if (!index) {
        index = await pack.getIndex({ fields: [
        "name", "img", "type", "system.details.cr", "system.details.xp.value",
        "system.attributes.ac.value", "system.attributes.hp.max", "system.abilities.dex.value",
        "system.abilities", "system.traits.size", "system.details.type.value",
        "system.skills.ste.mod", "system.skills.ste.value", "system.skills.ste.proficient",
        "system.source.book"
        ] });
        indexCache.set(pack.collection, index);
      }
      const actors = index.filter(entry => (!entry.type || entry.type === "npc") && predicate(entry));
      if (!actors.length) return;
      catalogs.push({
        bucket,
        index: actors,
        byName: new Map(actors.map(entry => [normalize(entry.name), entry])),
        member: entry => this.#actorMember(entry, pack)
      });
    };

    await addPack(game.packs.get(PRIMARY_ACTOR_PACK_ID));
    const srdPackIds = new Set(["dnd5e.actors24", "dnd5e.monsters"]);
    const otherActorPacks = Array.from(game.packs ?? [])
      .filter(pack => packType(pack) === "Actor"
        && pack.collection !== PRIMARY_ACTOR_PACK_ID
        && !srdPackIds.has(pack.collection))
      .sort((left, right) => packLabel(left).localeCompare(packLabel(right)));
    const sourceBook = entry => normalize(entry.system?.source?.book);
    const isDungeonsOfDrakkenheim = entry => sourceBook(entry) === "dod"
      || /dungeons? of drakkenheim/i.test(sourceBook(entry));

    for (const pack of otherActorPacks) {
      await addPack(pack, { bucket: "dungeons-of-drakkenheim", predicate: isDungeonsOfDrakkenheim });
    }
    for (const pack of otherActorPacks) {
      await addPack(pack, { bucket: "other", predicate: entry => !isDungeonsOfDrakkenheim(entry) });
    }

    await addPack(game.packs.get("dnd5e.actors24"), { bucket: "srd-5.2" });
    await addPack(game.packs.get("dnd5e.monsters"), { bucket: "srd-5.1" });
    const primary = catalogs.find(catalog => catalog.bucket === "all");
    const primaryBySignature = new Map();
    for (const entry of primary?.index ?? []) {
      const signature = actorStatSignature(entry);
      const matches = primaryBySignature.get(signature) ?? [];
      matches.push(entry);
      primaryBySignature.set(signature, matches);
    }
    catalogs.aliases = new Map(CONFIRMED_MONSTER_ALIASES);
    for (const catalog of catalogs.filter(candidate => candidate.bucket === "dungeons-of-drakkenheim")) {
      for (const entry of catalog.index) {
        const matches = primaryBySignature.get(actorStatSignature(entry)) ?? [];
        if (matches.length === 1 && normalize(matches[0].name) !== normalize(entry.name)) {
          catalogs.aliases.set(normalize(entry.name), normalize(matches[0].name));
        }
      }
    }
    return catalogs;
  }

  async preferredActor(name, catalogs) {
    const key = normalize(name);
    const primary = catalogs.find(catalog => catalog.bucket === "all");
    const primaryExact = primary?.byName.get(key);
    if (primaryExact) return primary.member(primaryExact);
    const translatedKey = catalogs.aliases?.get(key);
    if (translatedKey) {
      for (const catalog of catalogs) {
        const translated = catalog.byName.get(translatedKey);
        if (translated) return catalog.member(translated);
      }
    }
    for (const catalog of catalogs.filter(candidate => candidate !== primary)) {
      const entry = catalog.byName.get(key);
      if (!entry) continue;
      return await catalog.member(entry);
    }
    return null;
  }

  async preferredActorByStats(actor, catalogs) {
    if (!actor) return null;
    const signature = actorStatSignature(actor);
    for (const catalog of catalogs) {
      const matches = catalog.index.filter(entry => actorStatSignature(entry) === signature);
      if (matches.length === 1) return catalog.member(matches[0]);
    }
    return null;
  }

  #actorMember(entry, pack, { uuid = null, label = null } = {}) {
    const system = entry.system ?? {};
    const stealth = Number(system.skills?.ste?.total ?? system.skills?.ste?.mod ?? system.skills?.ste?.value);
    const sourceLabel = label ?? sourceBookLabel(system.source?.book, pack);
    const sourceBook = normalize(system.source?.book);
    return {
      id: entry.id ?? entry._id,
      uuid: uuid ?? entry.uuid ?? `Compendium.${pack.collection}.${pack.documentName ?? pack.metadata?.type}.${entry.id ?? entry._id}`,
      name: entry.name,
      img: entry.img,
      cr: Number(system.details?.cr ?? 0),
      xp: Number(system.details?.xp?.value ?? 0),
      ac: Number(system.attributes?.ac?.value ?? 0),
      hp: Number(system.attributes?.hp?.max ?? 0),
      stealthModifier: Number.isFinite(stealth) ? stealth : null,
      isDrakkenheimCreature: pack?.collection === PRIMARY_ACTOR_PACK_ID
        || sourceBook === "dod"
        || /dungeons? of drakkenheim/.test(sourceBook),
      sourceId: pack?.collection ?? CORE_MODULE_ID,
      sourceLabel,
      packLabel: sourceLabel
    };
  }

  async roll(tableId) {
    if (!this.isAvailable) throw new Error("Drakkenheim Encounters requires Champion access and both official Drakkenheim modules.");
    const table = await game.packs.get(TABLE_PACK_ID).getDocument(tableId);
    if (!table) throw new Error("That Drakkenheim encounter table is unavailable.");
    const catalogs = await this.actorCatalog();
    const state = { members: [], notes: [], catalogs, diagnostics: [], actorCandidateCount: 0, area: table.name };
    await this.#drawTable(table, state, 0);
    const combined = new Map();
    for (const member of state.members) {
      const existing = combined.get(member.uuid);
      if (existing) existing.rolledQuantity = (existing.rolledQuantity ?? 1) + (member.rolledQuantity ?? 1);
      else combined.set(member.uuid, { ...member });
    }
    const members = Array.from(combined.values(), member => ({
      ...member,
      totalXp: (Number(member.xp) || 0) * member.count
    }));
    if (!members.length && state.actorCandidateCount > 0) {
      console.warn("morelord-encounters | Drakkenheim table produced no resolvable Actors", {
        table: table.name,
        tableId: table.id,
        results: state.diagnostics
      });
    }
    return {
      id: `drakkenheim-${table.id}`,
      name: table.name,
      description: "Published Drakkenheim random encounter",
      published: true,
      showCraftworksSourceNotice: Boolean(game.modules.get(MONSTERS_MODULE_ID)?.active
        && members.some(member => member.isDrakkenheimCreature)),
      notes: state.notes,
      members,
      totalXp: members.reduce((sum, member) => sum + member.totalXp, 0),
      creatureCount: members.reduce((sum, member) => sum + member.count, 0)
    };
  }

  async #drawTable(table, state, depth) {
    if (depth >= MAX_TABLE_DEPTH) throw new Error("The Drakkenheim encounter table nesting is too deep to resolve safely.");
    const results = Array.from(table.results ?? []);
    if (!results.length) throw new Error(`The Drakkenheim table ${table.name} has no results.`);
    const weightedResults = results.map(result => ({ result, weight: resultWeight(result) }));
    const totalWeight = weightedResults.reduce((sum, entry) => sum + entry.weight, 0);
    let selection = randomFraction() * totalWeight;
    const selected = weightedResults.find(entry => ((selection -= entry.weight) < 0))?.result
      ?? weightedResults.at(-1).result;
    for (const result of [selected]) {
      const data = resultData(result);
      const text = resultText(result, data);
      const encounterTitle = encounterResultTitle(data, table.name);
      const bookSection = BOOK_BACKED_TABLE.test(table.name) && data.type === "text" && encounterTitle
        ? await this.#findBookSection(encounterTitle)
        : null;
      const referenceText = bookSection?.content || data.description || data.name || text;
      if (referenceText) state.notes.push({
        title: encounterTitle || result.name || table.name,
        text: await resolveUuidNames(referenceText, uuid => this.#embeddedActorName(uuid))
      });
      const uuid = resultUuid(data);
      const referenced = uuid ? await fromUuid(uuid) : null;
      const linkedUuids = inlineUuids(referenceText);
      const memberCountBeforeResult = state.members.length;
      state.diagnostics.push({
        name: result.name,
        type: result.type,
        resultUuid: result.uuid,
        referencedUuid: uuid,
        referencedDocument: referenced?.documentName ?? null,
        textLength: referenceText.length,
        referenceText: plainResultText(referenceText),
        bookSection: Boolean(bookSection),
        inlineUuidCount: linkedUuids.length
      });
      if (referenced?.documentName === "RollTable") {
        await this.#drawTable(referenced, state, depth + 1);
        continue;
      }
      if (referenced?.documentName === "Actor") {
        await this.#addActor(referenced.name, referenceText, state, referenced);
      }
      for (const linkedUuid of linkedUuids) {
        if (linkedUuid === uuid) continue;
        const linked = await fromUuid(linkedUuid);
        if (linked?.documentName === "RollTable") await this.#drawTable(linked, state, depth + 1);
        else if (linked?.documentName === "Actor") await this.#addActor(linked.name, referenceText, state, linked);
      }
      if (state.members.length === memberCountBeforeResult) {
        await this.#addNamedActorsFromText(referenceText, state);
      }
    }
  }

  async #addNamedActorsFromText(text, state) {
    const plainText = plainResultText(text);
    const normalizedText = normalize(plainText);
    const seen = new Set();
    const names = state.catalogs.flatMap(catalog => Array.from(catalog.index, entry => entry.name))
      .filter(name => {
        const key = normalize(name);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((left, right) => right.length - left.length);
    for (const name of names) {
      const normalizedName = normalize(name);
      const escaped = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const flexibleName = /y$/i.test(escaped)
        ? `${escaped.slice(0, -1)}(?:y|ies)`
        : `${escaped}(?:e?s)?`;
      if (!new RegExp(`\\b${flexibleName}\\b`, "i").test(normalizedText)) continue;
      await this.#addActor(name, plainText, state);
    }
  }

  async #embeddedActorName(uuid) {
    if (!this.embeddedActorNames) {
      this.embeddedActorNames = new Map();
      const adventurePack = game.packs.get(ADVENTURE_PACK_ID);
      if (adventurePack) {
        for (const adventure of await adventurePack.getDocuments()) {
          for (const actor of adventure.toObject().actors ?? []) {
            if (actor._id && actor.name) this.embeddedActorNames.set(actor._id, actor.name);
          }
        }
      }
    }
    return this.embeddedActorNames.get(String(uuid).split(".").at(-1)) ?? null;
  }

  async #findBookSection(title) {
    const key = normalize(title);
    const [sources, encounterTitles] = await Promise.all([
      this.#loadBookSources(),
      this.#loadBookEncounterTitles()
    ]);
    for (const source of sources) {
      const section = this.#extractBookSection(source.content, key, encounterTitles);
      if (section) return { ...section, pageUuid: source.pageUuid };
    }
    return null;
  }

  async #loadBookSources() {
    if (!this.bookSources) this.bookSources = this.#collectBookSources();
    return this.bookSources;
  }

  async #collectBookSources() {
    const sources = [];
    const addSource = (content, pageUuid = null) => {
      if (!content) return;
      const priority = /random encounter descriptions/i.test(plainResultText(content)) ? 0 : 1;
      sources.push({ content, pageUuid, priority });
    };
    const addJournal = journal => {
      for (const page of journal.pages ?? []) {
        const content = page.text?.content ?? "";
        addSource(content, page.uuid ?? null);
      }
    };

    for (const journal of game.journal ?? []) addJournal(journal);

    const journalPack = game.packs.get(JOURNAL_PACK_ID);
    if (journalPack) {
      for (const journal of await journalPack.getDocuments()) addJournal(journal);
    }

    const adventurePack = game.packs.get(ADVENTURE_PACK_ID);
    if (adventurePack) {
      for (const adventure of await adventurePack.getDocuments()) {
        const data = adventure.toObject();
        for (const journal of data.journal ?? []) {
          for (const page of journal.pages ?? []) {
            const content = page.text?.content ?? "";
            addSource(content);
          }
        }
      }
    }
    const randomEncounterDescriptions = sources.filter(source => source.priority === 0);
    return randomEncounterDescriptions;
  }

  async #loadBookEncounterTitles() {
    if (!this.bookEncounterTitles) this.bookEncounterTitles = this.#collectBookEncounterTitles();
    return this.bookEncounterTitles;
  }

  async #collectBookEncounterTitles() {
    const titles = new Set();
    const tables = await this.availableTables();
    const pack = game.packs.get(TABLE_PACK_ID);
    for (const tableIndex of tables.filter(table => ["inner-city", "outer-city", "sewers"].includes(table.groupId))) {
      const table = await pack.getDocument(tableIndex.id);
      for (const result of table?.results ?? []) {
        const title = normalize(plainResultText(result.description || result.name));
        if (title) titles.add(title);
      }
    }
    return titles;
  }

  #extractBookSection(content, title, encounterTitles) {
    const document = new DOMParser().parseFromString(content, "text/html");
    const candidates = Array.from(document.body.querySelectorAll("h1, h2, h3, h4, h5, h6, strong, b, em"));
    const match = candidates.find(element => normalize(element.textContent) === title);
    if (!match) return null;

    let titleNode = match;
    while (/^(STRONG|B|EM)$/.test(titleNode.parentElement?.tagName)
      && normalize(titleNode.parentElement.textContent) === title) {
      titleNode = titleNode.parentElement;
    }
    const nextTitle = candidates.find(candidate => {
      if (candidate === titleNode || titleNode.contains(candidate) || candidate.contains(titleNode)) return false;
      if (!encounterTitles.has(normalize(candidate.textContent))) return false;
      return Boolean(titleNode.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    let endNode = nextTitle;
    while (endNode && /^(STRONG|B|EM)$/.test(endNode.parentElement?.tagName)
      && normalize(endNode.parentElement.textContent) === normalize(endNode.textContent)) {
      endNode = endNode.parentElement;
    }

    const range = document.createRange();
    range.setStartAfter(titleNode);
    if (endNode) range.setEndBefore(endNode);
    else range.setEndAfter(document.body.lastChild);
    const container = document.createElement("div");
    container.append(range.cloneContents());
    const extracted = container.innerHTML.trim();
    if (!extracted) return null;
    return { title: match.textContent.trim(), content: extracted };
  }

  async #addActor(name, text, state, referencedActor = null) {
    // A linked Actor is useful only for its published name. The draggable
    // document must always come from the prioritized Actor compendium catalog,
    // never from an Actor embedded in an Adventure.
    state.actorCandidateCount += 1;
    const actor = await this.preferredActor(name, state.catalogs)
      ?? await this.preferredActorByStats(referencedActor, state.catalogs);
    if (!actor) {
      state.notes.push({ title: "Unresolved creature", text: `No preferred Drakkenheim Actor was found for ${name}.` });
      return;
    }
    const count = await hiddenQuantity(encounterQuantityFormula(plainResultText(text), name, state.area));
    state.members.push({ ...actor, count: 1, rolledQuantity: count });
  }

}

export const DRAKKENHEIM_TABLE_GROUPS = TABLE_GROUPS;

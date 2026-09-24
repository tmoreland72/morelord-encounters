import { assert } from "../../../morelord-core/scripts/testing/in-game.js";
import { CoreAccessService } from "../services/core-access-service.mjs";
import { DrakkenheimEncounterService } from "../services/drakkenheim-encounter-service.mjs";
import { encounterNotes, showRoster, updateEncounterSourcePanels } from "../apps/encounter-builder-dialog.mjs";

export const drakkenheimChecks = [{
  id: "morelord-encounters.published-notes-and-typography",
  async run() {
    const fixture = document.createElement("div");
    fixture.className = "ml-window";
    fixture.innerHTML = '<div class="window-content"><div class="ml-app"></div></div>';
    const notes = encounterNotes({notes:[{title:"Manticore (test)",text:'<p>Manticore (test). First paragraph.</p><p>Second paragraph.<br>[[/r 2d4]] creatures.</p>'}]});
    fixture.querySelector('.ml-app').append(notes);
    document.body.append(fixture);
    try {
      assert(!notes.textContent.includes("function rosterContent"), "Result text contains no injected source code.");
      assert(notes.querySelector('p').textContent.startsWith('First paragraph.'), "Punctuation in the title is escaped correctly.");
      assert(notes.querySelector('[data-formula="2d4"]'), "Inline quantity remains clickable.");
      assert(getComputedStyle(notes.querySelector('p')).fontWeight === '400', "Standard paragraphs use normal weight with Foundry and Core loaded.");
      const form = document.createElement('form');
      form.innerHTML = '<select name="encounterSource"><option value="drakkenheim">Drakkenheim</option><option value="monster-compendiums">Monsters</option></select><label><select name="difficulty"></select></label><section class="ml-encounters-source-section"><div class="ml-section-heading"><h2></h2><p></p></div></section>';
      updateEncounterSourcePanels(form);
      assert(form.querySelector('h2').textContent === game.i18n.localize('MORELORD_ENCOUNTERS.EncounterLocation'), "Drakkenheim uses Encounter Location.");
      form.querySelector('[name="encounterSource"]').value = 'monster-compendiums';
      updateEncounterSourcePanels(form);
      assert(form.querySelector('h2').textContent === game.i18n.localize('MORELORD_ENCOUNTERS.EncounterSource'), "Other encounters retain Encounter Source.");
    } finally { fixture.remove(); }
  }
}, {
  id: "morelord-encounters.all-drakkenheim-results",
  async run() {
    const service = new DrakkenheimEncounterService({coreAccess:new CoreAccessService()});
    assert(service.isAvailable, "Champion access and official source modules are required for this regression.");
    const report = await service.audit();
    assert(report.length === 117 && new Set(report.map(row => row.table)).size === 8, "All 117 results across eight installed tables were traversed.");
    assert(!report.some(row => row.unresolved.length), "Every referenced creature resolves from the supported sources.");
    assert(!report.some(row => row.missingDescriptions.length), "Every encounter has a description beyond its title.");
    const noCreatureTitles = new Set(["Horribly Lost", "Executioner's Summons", "Going in Circles", "Uninvited Guests",
      "Wandered into the Garden", "Double Trouble", "Run out of Town", "Wrong Turn", "Turned Around"]);
    const empty = report.filter(row => !row.actors.length);
    assert(empty.length === 16 && empty.every(row => noCreatureTitles.has(row.title)
      || (row.table === "Special Outlaw Members" && row.resultId === "VvU3TWqKbbtr0000")),
    "Only source-confirmed travel events, follow-up instructions, and the explicit None result omit creatures.");
    for (const row of report.filter(row => row.title === "Haze Haunt")) {
      assert(row.actors.length === 1 && row.actors[0] === "Warp Witch", "Haze Haunt must not include the following patrol encounter.");
    }
    for (const row of report.filter(row => ["Living Ruin", "Living Ruins"].includes(row.title))) {
      assert(JSON.stringify([...row.actors].sort()) === JSON.stringify([
        "Animated Delerium Sludge", "Entropic Flame", "Living Deep Haze", "Walking Delerium Geode"
      ]), "Both Living Ruin results offer the four adventure elementals, not a summon template.");
    }
    for (const row of report.filter(row => row.title === "Hooded Lanterns Scouts")) {
      assert(row.descriptions[0].fromBook && row.actors.includes("Scout") && row.actors.includes("Urban Ranger"),
        "Both Scout results include the patrol description and its Urban Ranger leader.");
    }
    for (const [id, expected] of [["F4feZkCCrpVC0000", ["Tower Dragon", "Wall Gargoyle"]],
      ["F4feZkCCrpVC0004", ["Haze Husk", "Haze Wight"]]]) {
      const row = report.find(row => row.resultId === id);
      assert(JSON.stringify([...row.actors].sort()) === JSON.stringify(expected), "Gates rosters contain only the named stat blocks.");
    }
    const actor = await service.preferredActor("Manticore", await service.actorCatalog());
    assert(actor && /^(dnd-monster-manual\.|dnd5e\.)/.test(actor.sourceId), "Manticore resolves from the Monster Manual or SRD.");
    return {results:report.length, tables:8, intentionalNoCreatureResults:empty.length,
      missingDescriptions:0, unresolvedCreatures:0};
  }
}];

export const livingRuinCheck = {
  id: "morelord-encounters.living-ruin-roster",
  async run(capture) {
    assert(game.world?.id === "dev1", "Dev1 is required.");
    const service = new DrakkenheimEncounterService({coreAccess:new CoreAccessService()});
    const pack = game.packs.get("drakkenheim-core.tables");
    const entry = (await service.availableTables()).find(table => table.groupId === "inner-city");
    const table = await pack.getDocument(entry.id);
    const result = table.results.get("EAU3MbAP8uiG0024");
    assert(result, "The official Living Ruin result exists.");
    // Restrict the draw in this test client only; never update the installed table or world.
    const original = pack.getDocument;
    const ownDescriptor = Object.getOwnPropertyDescriptor(pack, "getDocument");
    let encounter;
    let restrictNextDraw = true;
    try {
      pack.getDocument = async function(id, ...args) {
        if (id === table.id && restrictNextDraw) {
          restrictNextDraw = false;
          return {id:table.id, name:table.name, results:[result]};
        }
        return original.call(this, id, ...args);
      };
      encounter = await service.roll(table.id);
    } finally {
      if (ownDescriptor) Object.defineProperty(pack, "getDocument", ownDescriptor);
      else delete pack.getDocument;
    }
    assert(encounter.notes[0].text.includes("spring to life"), "The singular table title resolves to the plural book heading.");
    assert(encounter.members.length === 4 && encounter.members.every(member => member.cr === 5
      && member.sourceId === "drakkenheim-monsters.monsters"), "Living Ruin offers the four CR 5 MoD elementals, not a summon template.");
    for (const member of encounter.members) assert((await fromUuid(member.uuid))?.documentName === "Actor", "Every monster link opens a real Actor.");
    assert(!foundry.applications.instances.get("morelord-encounters-roster"), "Close the existing roster before testing.");
    const dialog = showRoster(encounter);
    let app;
    try {
      for (let attempts = 0; attempts < 200; attempts++) {
        app = foundry.applications.instances.get("morelord-encounters-roster");
        if (app?.rendered) break;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      assert(app?.rendered, "The real Core roster dialog rendered.");
      const notes = app.element.querySelector(".ml-encounters-published-notes");
      assert(notes?.textContent.includes("spring to life"), "The source description is visible in GM Encounter Details.");
      const link = app.element.querySelector(".ml-encounters-actor-link");
      assert(link?.draggable && link.dataset.uuid === encounter.members[0].uuid, "The elemental sheet link is draggable onto the scene.");
      if (capture) await capture(app.id);
    } finally {
      if (app) await app.close();
      await dialog;
    }
    return {title:encounter.notes[0].title, actors:encounter.members.map(member => member.name)};
  }
};

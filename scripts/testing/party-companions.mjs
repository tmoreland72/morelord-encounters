// Run as GM in a development world whose primary party includes an NPC companion.
// Reads party data and opens/closes setup without saving or changing world data.
import { runInGameTests, assert } from "../../../morelord-core/scripts/testing/in-game.js";
import { listCharacterActors } from "../../../morelord-core/scripts/ui/actor-participation.js";
import { Dnd5eMonsterCatalogService } from "../services/dnd5e-monster-catalog-service.mjs";
import { encounterBudget, buildCustomEncounter } from "../domain/encounter-generator.mjs";
import { configureEncounter } from "../apps/encounter-builder-dialog.mjs";

export function runPartyCompanionTests() {
  return runInGameTests({ checks: [{
    id: "encounters.party-npc-selection-and-budget",
    skip: !game.user.isGM ? "GM-only encounter setup" : undefined,
    async run() {
      const id = "morelord-encounters-configure";
      assert(!document.getElementById(id), "Close encounter setup before running this test.");
      const party = new Dnd5eMonsterCatalogService().partyCandidates();
      const npcs = party.filter(actor => actor.type === "npc");
      assert(npcs.length, "Add an NPC companion to the primary party in this test world.");
      assert(listCharacterActors().every(actor => actor.type === "character"), "Default character selectors changed.");
      assert(new Set(party.map(actor => actor.uuid)).size === party.length, "Party contains duplicate actors.");
      const heroes = party.filter(actor => actor.type !== "npc");
      const xp = npcs.reduce((sum, actor) => sum + actor.xp, 0);
      for (const difficulty of ["easy", "medium", "hard", "deadly"]) {
        assert(encounterBudget(party, difficulty) === encounterBudget(heroes, difficulty) + xp, "NPC XP missing from difficulty budget.");
      }
      assert(buildCustomEncounter([], party).budget === encounterBudget(party), "Custom encounter budget lost NPC allies.");
      let pending;
      try {
        pending = configureEncounter({ initial: { encounterSource: "custom", partyUuids: party.map(actor => actor.uuid) } });
        const deadline = Date.now() + 15000;
        while (!document.querySelector(`#${id} [name='partyUuid']`) && Date.now() < deadline) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        const root = document.getElementById(id);
        assert(root, "Encounter setup did not render.");
        for (const npc of npcs) {
          const input = [...root.querySelectorAll("[name='partyUuid']")].find(input => input.value === npc.uuid);
          assert(input?.checked, "Selected NPC missing from rendered party.");
          assert(input.closest(".ml-actor-choice").textContent.includes(`+${npc.xp} XP`), "NPC card lacks XP estimate.");
          input.click();
          assert(!input.checked, "NPC cannot be deselected.");
          input.click();
          assert(input.checked, "NPC cannot be reselected.");
        }
      } finally {
        const app = Object.values(ui.windows).find(app => app.id === id)
          ?? [...foundry.applications.instances.values()].find(app => app.id === id);
        await app?.close();
        if (pending) await pending;
      }
    }
  }] });
}

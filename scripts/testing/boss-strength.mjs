// Run in Foundry after selecting monster sources in Encounters. No world writes.
import { runInGameTests, assert } from "../../../morelord-core/scripts/testing/in-game.js";
import { getLastEncounterSources } from "../core/settings.mjs";
import { Dnd5eMonsterCatalogService } from "../services/dnd5e-monster-catalog-service.mjs";
import { generateEncounterOptions, rerollEncounterMember, monsterXp } from "../domain/encounter-generator.mjs";

export function runEncounterStrengthTests() {
  return runInGameTests({ checks: [{
    id: "encounters.all-styles-stable-on-regenerate-and-reroll",
    async run() {
      const monsters = await new Dnd5eMonsterCatalogService().monsters(getLastEncounterSources());
      assert(monsters.some(monster => monsterXp(monster) === 1800)
        && monsters.some(monster => monsterXp(monster) === 1100),
      "Select monster sources containing CR 4 and CR 5 creatures before running this test.");
      const party = [...Array.from({ length: 4 }, () => ({ level: 3 })), { type: "npc", cr: 0.25 }];
      const expectedXp = monsters.map(monsterXp).sort((a, b) => Math.abs(a - 1650) - Math.abs(b - 1650) || a - b)[0];
      let baseline;
      for (let index = 0; index < 100; index++) {
        let state = index + 1;
        const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
        const options = generateEncounterOptions({ monsters, party, difficulty: "hard", random });
        const totals = options.map(option => option.totalXp);
        baseline ??= totals;
        assert(JSON.stringify(totals) === JSON.stringify(baseline), "Regeneration changed encounter strength with unchanged parameters.");
        const boss = options.find(option => option.id === "boss");
        assert(boss.budget === 1650, "Hard party budget changed.");
        assert(boss.creatureCount === 1 && boss.totalXp === expectedXp, "Boss regeneration changed the closest XP tier.");
        for (const option of options) {
          const xp = option.totalXp;
          const count = option.creatureCount;
          for (let repeat = 0; repeat < 3; repeat++) {
            for (let member = 0; member < option.members.length; member++) rerollEncounterMember(option, member, monsters, random);
            assert(option.totalXp === xp && option.creatureCount === count, "Creature rerolls changed encounter strength or count.");
          }
        }
      }
    }
  }] });
}

export const runBossStrengthTests = runEncounterStrengthTests;

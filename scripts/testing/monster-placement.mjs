import { assert, runInGameTests } from "../../../morelord-core/scripts/testing/in-game.js";
import { showRoster } from "../apps/encounter-builder-dialog.mjs";

async function until(read, message) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const value = read();
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  throw new Error(message);
}

export const monsterPlacementCheck = {
  id: "encounters.place-monsters-native-group-flow",
  get skip() { return !game.user.isGM ? "GM-only scene placement" : undefined; },
  async run() {
    assert(!foundry.applications.instances.has("morelord-encounters-roster"), "Close the encounter roster first.");
    const originalScene = canvas.scene?.id;
    const actors = [];
    let scene, pending, finishPlacement, originalPlaceTokens;
    try {
      scene = await Scene.create({ name: "Monster placement regression", width: 2000, height: 2000, grid: { type: 1, size: 100 } });
      await scene.view();
      for (const name of ["Placement A", "Placement B"]) actors.push(await Actor.create({ name, type: "npc" }));
      const encounter = { name: "Placement regression", kind: "roster", members: actors.map((actor, i) => ({
        uuid: actor.uuid, name: actor.name, img: actor.img, count: i + 1
      })) };
      pending = showRoster(encounter);
      const button = await until(() => document.querySelector('#morelord-encounters-roster [data-morelord-action="place-encounter-monsters"]'), "Missing Place Monsters button.");
      originalPlaceTokens = canvas.tokens.placeTokens;
      let calls = 0;
      // Drive native placement confirmation while leaving actor/token creation to D&D 5e.
      canvas.tokens.placeTokens = async (tokens, options) => {
        calls++;
        assert(tokens.length === 3, "Native preview received the wrong quantities.");
        assert(options.create === false, "Native placement should defer token creation.");
        await new Promise(resolve => { finishPlacement = resolve; });
        for (const [index, token] of tokens.entries()) options.preConfirm({
          document: { ...token, x: 400 + index * 100, y: 400 }, index
        });
      };
      button.click();
      await until(() => finishPlacement, "Native group placement did not start.");
      assert(button.disabled && button.dataset.tooltip, "Pending placement must explain its disabled action.");
      button.click();
      assert(calls === 1, "A second click started duplicate placement.");
      finishPlacement();
      await until(() => !button.disabled, "Place Monsters did not re-enable.");
      assert(scene.tokens.size === 3, "Native placement did not create every monster.");
      assert(scene.tokens.filter(token => token.actorId === actors[1].id).length === 2, "Repeated monsters were lost.");
      assert(!game.actors.some(actor => actor.name === encounter.name), "Placement saved an unwanted group Actor.");
      canvas.tokens.placeTokens = async () => {};
      button.click();
      await until(() => !button.disabled, "Cancelled placement did not complete.");
      assert(scene.tokens.size === 3, "Cancelled placement added monsters.");
      assert(document.getElementById("morelord-encounters-roster"), "Placement closed the roster.");
    } finally {
      finishPlacement?.();
      if (originalPlaceTokens) canvas.tokens.placeTokens = originalPlaceTokens;
      await foundry.applications.instances.get("morelord-encounters-roster")?.close();
      if (pending) await pending;
      if (originalScene && game.scenes.has(originalScene)) await game.scenes.get(originalScene).view();
      await scene?.delete();
      for (const actor of actors) await actor.delete();
    }
  }
};

export function runMonsterPlacementTests() {
  return runInGameTests({ checks: [monsterPlacementCheck] });
}

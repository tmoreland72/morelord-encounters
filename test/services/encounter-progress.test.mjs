import assert from "node:assert/strict";
import test from "node:test";
import { withEncounterProgress } from "../../scripts/services/encounter-progress.mjs";

test("shows progress before work, keeps it while pending, and removes it on success or failure", async () => {
  let visible = false;
  globalThis.foundry = { utils: { escapeHTML: value => value } };
  globalThis.ui = { notifications: { info: (message, options) => {
    assert.match(message, /fa-spinner/);
    assert.equal(options.permanent, true);
    visible = true;
    return { remove: () => { visible = false; } };
  } } };
  let finish;
  let started;
  const start = new Promise(resolve => { started = resolve; });
  const pending = withEncounterProgress("Generating", () => {
    assert.equal(visible, true);
    started();
    return new Promise(resolve => { finish = resolve; });
  });
  assert.equal(visible, true);
  await start;
  assert.equal(visible, true);
  finish("encounter");
  assert.equal(await pending, "encounter");
  assert.equal(visible, false);
  await assert.rejects(withEncounterProgress("Generating", () => { throw new Error("Load failed"); }), /Load failed/);
  assert.equal(visible, false);
});

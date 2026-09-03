import assert from "node:assert/strict";
import test from "node:test";
import { getCoreApi, resolveCoreBookLabel } from "../../scripts/core/core-api.mjs";

test("uses the active Morelord Core module API as the canonical integration", () => {
  const api = { sources: { resolveBookLabel: ({ book }) => `Core: ${book}` } };
  globalThis.game = { modules: new Map([["morelord-core", { active: true, api }]]) };
  globalThis.MorelordCore = { sources: { resolveBookLabel: () => "Legacy global" } };
  assert.equal(getCoreApi(), api);
  assert.equal(resolveCoreBookLabel({ book: "MM" }), "Core: MM");
  delete globalThis.game;
  delete globalThis.MorelordCore;
});

test("falls back safely when Core has not exposed a source resolver", () => {
  globalThis.game = { modules: new Map() };
  assert.equal(resolveCoreBookLabel({ book: "Third Party Bestiary" }), "Third Party Bestiary");
  delete globalThis.game;
});

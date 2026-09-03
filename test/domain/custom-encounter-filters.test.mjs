import assert from "node:assert/strict";
import test from "node:test";
import { createFacetState, cycleFacetState, matchesFacet } from "../../scripts/domain/custom-encounter-filters.mjs";

test("cycles custom facets from neutral to include, exclude, and neutral", () => {
  const state = createFacetState(["type"]).type;
  assert.equal(cycleFacetState(state, "beast"), "include");
  assert.equal(matchesFacet(state, ["beast"]), true);
  assert.equal(matchesFacet(state, ["dragon"]), false);
  assert.equal(cycleFacetState(state, "beast"), "exclude");
  assert.equal(matchesFacet(state, ["beast"]), false);
  assert.equal(matchesFacet(state, ["dragon"]), true);
  assert.equal(cycleFacetState(state, "beast"), "none");
  assert.equal(matchesFacet(state, ["beast"]), true);
});

test("uses OR semantics for included values and rejects any excluded value", () => {
  const state = createFacetState(["terrain"]).terrain;
  cycleFacetState(state, "forest");
  cycleFacetState(state, "swamp");
  assert.equal(matchesFacet(state, ["swamp"]), true);
  assert.equal(matchesFacet(state, ["urban"]), false);
  cycleFacetState(state, "forest");
  assert.equal(matchesFacet(state, ["forest", "swamp"]), false);
});

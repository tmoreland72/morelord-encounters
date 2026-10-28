import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { explicitSelectedSourceIds, initialSelectedSourceIds, sourceTierBadges } from "../../scripts/domain/source-tier-status.mjs";

const srd = { id: "dnd5e.monsters", packId: "dnd5e.monsters", label: "System Reference Document 5.1" };
const manual = { id: "dnd-monster-manual.actors", packId: "dnd-monster-manual.actors", label: "Monster Manual" };

test("a content tier never adds packs, and a disabled pack cannot stay selected", () => {
  const available = [manual];
  assert.deepEqual(explicitSelectedSourceIds(available, [srd.id, manual.id]), [manual.id]);
  assert.deepEqual(initialSelectedSourceIds(available, [srd.id]), [manual.id]);
  assert.deepEqual(initialSelectedSourceIds(available, []), [manual.id]);
});

test("source badges distinguish licensed availability from Encounter Source selection", () => {
  assert.deepEqual(sourceTierBadges({ licensed: false, sources: [srd], selectedIds: [] }), [
    { text: "Access Required", tone: "warning" }
  ]);
  assert.deepEqual(sourceTierBadges({ licensed: true, sources: [srd], selectedIds: [manual.id] }), [
    { text: "Available", tone: "success" },
    { text: "Not enabled", tone: "muted" }
  ]);
  assert.deepEqual(sourceTierBadges({ licensed: true, sources: [manual], selectedIds: [manual.id] }), [
    { text: "Enabled", tone: "enabled" }
  ]);
});

test("verify party list fills the section with flexible columns", () => {
  const dialog = readFileSync(new URL("../../scripts/apps/encounter-builder-dialog.mjs", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../styles/morelord-encounters.css", import.meta.url), "utf8");
  assert.match(dialog, /partyList\.className = "ml-grid ml-encounters-party-list"/);
  assert.doesNotMatch(dialog, /partyList\.dataset\.columns = "2"/);
  assert.match(css, /\.ml-encounters-party-section > \.ml-section-heading[\s\S]*width:\s*100%/);
  assert.match(css, /\.ml-encounters-party-list\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*220px\),\s*1fr\)\)/s);
});

# Drakkenheim encounter audit — September 21, 2026

Reviewed all 117 installed results, including their source descriptions, linked creatures, title boundaries, and intentionally empty rosters. `drakkenheim.json` records per-result coverage without copying the book text.

| Table | Results |
| --- | ---: |
| Inner City | 38 |
| Outer City | 25 |
| Sewers | 20 |
| Crater Basin | 6 |
| Gates | 8 |
| Interactions | 6 |
| Queen's Park | 8 |
| Special Outlaw Members | 6 |

## Corrections

Eight table results were affected:

- **Living Ruin / Living Ruins** (Inner City and Sewers): reconcile the singular table title with the plural book heading, and offer Animated Delerium Sludge, Entropic Flame, Living Deep Haze, and Walking Delerium Geode. These are the four CR 5 adventure choices, not the similarly named CR 0 summon template from Sebastian Crowe's Guide.
- **Hooded Lanterns Scouts** (Inner City and Outer City): resolve the book heading Hooded Lantern Patrol, restoring its description and Urban Ranger leader alongside the Scouts.
- **Haze Haunt** (Inner City and Outer City): stop at the corrected patrol heading, removing its unrelated description and creatures.
- **Castle Guardians** and **Royal Guards** (Gates): prefer complete bold stat-block names; remove the extra ordinary Gargoyle, Wight, and Guard introduced by substring/prose matching.

The corrected source audit reports zero missing descriptions and zero unresolved creatures. Sixteen results intentionally omit creature links: lost/travel/location events, Double Trouble's follow-up instructions, Turned Around, and the explicit None on Special Outlaw Members. Their source instructions remain visible; monster-drag help is omitted.

## Repeat the checks

- From Core, run `node tools/audit-drakkenheim-sources.mjs`. It reads copies of installed source packs and fails on missing descriptions or unresolved creatures. The offline fixture represents adventure Actors as imported; it cannot establish live world readiness.
- Run `node --test test/services/drakkenheim-encounter-service.test.mjs` in Encounters.
- In verified Dev1 only, use Core's shared runner with `drakkenheimChecks` and `livingRuinCheck` from `scripts/testing/drakkenheim.mjs`. This checks the complete installed inventory, the eight corrected results, expected creature-free results, and the actual Core roster dialog with resolvable, draggable CR 5 Actor links. The forced-draw fixture affects only the testing browser and restores the original pack method without updating documents.

No campaign data or source packs are migrated. Previously generated/saved encounters retain their snapshots; generate a new result after refreshing the client to use the corrected resolver.

## Verification

The final Dev1 run passed all three checks on Foundry 14.368 / D&D5e 6.0.3. Core retains `test/in-game-reports/2026-09-22-drakkenheim-full-audit.json` and the matching, visually inspected PNG: the Living Ruin window shows the full description and four CR 5 Monsters of Drakkenheim links. All 10 Drakkenheim Node tests and Core's design-system check passed. A full Encounters run had 77/80 passing: concurrent guided-library changes failed three tests in `test/domain/guided-encounters.test.mjs` (fixed library size, exhaustion order, and indexed story selection); those are separate release blockers, not failures of this audit.

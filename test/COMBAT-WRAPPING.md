# Combat wrapper regression

In Dev1 only, enable Encounters, libWrapper, and Monk's Combat Details, then reload. Before the fix, startup reports non-libWrapper wrapping of `CONFIG.Combat.documentClass.prototype._sortCombatants` by Encounters. After the fix, that warning must be absent and all five Encounters combat wrappers must appear in libWrapper's registered wrappers.

Run the module-owned check through Core's shared runner:

```js
const {runInGameTests}=await import('/modules/morelord-core/scripts/testing/in-game.js');
const {combatWrappingCheck}=await import('/modules/morelord-encounters/scripts/testing/combat-wrapping.mjs');
await runInGameTests({checks:[combatWrappingCheck]});
```

The check temporarily registers a second libWrapper consumer under Core and removes it afterward. It uses unsaved documents to verify marker priority, ordinary initiative ordering, and no sorting-time conflict. Also run `roundStartWaveCheck` from `scripts/testing/round-start-waves.mjs` through the same runner to verify native start/next-round/next-turn and marker initiative exclusion with both modules enabled.

November 25, 2026: all 141 Encounters Node tests passed, including registration of all five wrappers exactly once, continuation of ordinary sorting, marker priority, initiative filtering, method arguments/results, and standalone fallback. Live testing was skipped because the server status identified `wow-one-shot`, not Dev1. No world was switched. Website documentation was reviewed: this changes internal wrapping only, with no changed controls, settings, requirements, or workflow, so no guide update is needed.

The base `combatWrappingCheck` can run without Monk's Combat Details and verifies real libWrapper chaining. When that optional module is active, also run `combatWrappingWithMonksCheck` from the same file for exact interoperability coverage.

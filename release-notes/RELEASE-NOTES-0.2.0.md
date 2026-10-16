# Morelord Encounters 0.2.0

## What Changed

### Added

- **Mass Combat (alpha)** is the fourth encounter type, with wave setup, group attacks and result review inside the existing Encounters window. This feature is available for testing and feedback; controls and behavior may change, and bugs may remain.
- Saved encounter rosters schedule automatic creature arrivals on native initiative turns. Each wave has its own initiative, first spawn round, total spawn rounds, skipped rounds and fixed roster multiplier. Arrival cards describe each deployment.
- Native weapon and saving-throw choices support group attacks, critical hits, typed damage, full/half/no damage on saves, attached on-hit saves, zero-damage saves and directly named/linked repeated-weapon Multiattack counts.

### Improvements

- Full saved creature counts are deployed. Living NPCs of the same creature type share one turn from the start of combat, including the first initiative group. Player characters retain their individual turns and are excluded from creature selectors.
- Combat saves contain creature rosters only. Legacy saves display without extra GM details, and saved encounters can be deleted with confirmation without deleting scheduled snapshots or deployed creatures.
- Attack cards summarize hits, kills and damage. Previews remain reviewable inside Encounters and stale previous-combat results clear safely. Ending combat immediately clears scheduled waves and pending Mass Combat state.
- Expanded Encounters website documentation covers every Mass Combat field and action, fixed multipliers, zero skipped rounds, Monster Manual examples, alpha status and GM-managed effects or mixed-weapon routines.

### Changed

- Requires Morelord Core 0.5.0 or later. Group attacks require D&D5e 6.0.3 or later; existing encounter workflows retain the declared D&D5e 5.3 minimum.

## Verification

All 103 Encounters automated tests passed; Core's 80 tests and design-system check and Game Master's 50 tests also passed. Dev1 on Foundry VTT 14.368 / D&D5e 6.0.3 passed the nine-check Mass Combat suite and five-check combined-attack suite. Evidence is retained in test/in-game-reports, including dark/light, narrow-width and zoom captures.

Latest stable Foundry VTT 14.369 was checked against official release information. Troy explicitly authorized a release-specific exception to latest-build testing. Compatibility remains truthfully verified 14.368 with the existing v14 support bounds. Non-damage effects, optional or mixed-weapon Multiattack routines, resources, and token defeat markers remain GM-managed; first-hit save limits apply within one batch.

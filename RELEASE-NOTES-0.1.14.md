# Morelord Encounters 0.1.14

Updates to shared reporting and encounters workflows.

## What Changed

### Improvements

- Added optional builder/selection/roster usage and generation error reporting through Core, requiring fresh GM consent.
- [Premium] Aligned the story library with Core list toolbars and card icon actions; removed Start a Story and story-level authoring controls from the reading view.
- [Premium] Removed campaign/region/plane presentation, added player-safe Read aloud callouts, and repaired duplicate journal navigation headings without deleting pages or replacing GM-edited prose.
- [Premium] Added Premium Encounter Stories as the third builder choice, with Combat Encounters and Guide Me Encounters using their agreed labels.
- [Premium] Added the original Brother's Keeper template: editable private GM journals, two core Monster Manual hill giants, a party-dependent difficulty label, and a Craftworks hoard entry point.
- [Premium] Added blank story authoring, independent duplication, editable category/duration details, and multiple prepared combat rosters. Edit Combat Encounter seeds the existing custom builder and saves only on acceptance.
- [Premium] Reused Core's application shell, hero, surfaces, section headings, cards, actor choices, details, actions, and page footer. Native journals own story prose. No new runtime dependency or shared CSS was introduced.
- [Premium] Updated the GM manual, README, in-app documentation, and story implementation notes. Missing Monster Manual or Craftworks content is explained without substituting SRD assets; existing journals remain available after Premium expires.
- Expanded Guide Me from 10 to 40 original offline situations: eight per interaction type, all usable in every offered setting. The 30 additions include individual follow-up hooks and high-pressure deadlines.
- [Premium] Fixed short-cycle repetition: client history persists across builder sessions, selects unseen eligible situations first, then least recently used situations. Opening a saved snapshot does not regenerate it or advance history.
- [Premium] Documented the Encounter Story format separately from the shorter Guide Me workflow; the first journal-based implementation is now available in development.
- Extended stable encounter strength to every generated style. Removed broad XP tolerance and randomized strength targets, selected group quantities by budget fit, and accounted for spent XP in mixed groups. All creature rerolls now preserve XP and quantity; sparse catalogs retain the current creature when no eligible same-XP replacement exists.
- Fixed Boss Battle strength swinging across CR tiers with unchanged setup. Bosses now use the closest available XP tier to the fixed party budget, including creature rerolls, while retaining creature and source variety within that tier.
- Verify Party now includes NPC pets and summons in the primary party through Core participation. Selected NPCs add their XP to difficulty budgets as an explicit estimate; cards show CR and contribution, and saved selections remain intact.
- [Premium] Added a top-level **Combat Encounters / Guide Me Encounters / Encounter Stories** choice while preserving existing roster, published, and saved encounter workflows.
- [Premium] Added guided non-combat generation for unknown or selected settings, five interaction types, four story purposes, three pressure levels, and an optional campaign connection.
- Included 40 original offline situations with playable approaches, suggested checks, motivations, and consequences. Guided scenes need no party or monster packs.
- Added editable scene details, private saved snapshots, reopening, New Scene, and saved guided defaults.
- Reused Core's choice cards, grids, surfaces, form controls, dialog shell, and footer behavior; no new shared component or runtime dependency was needed.
- Added domain tests and an opt-in Foundry workflow test using Core's shared runner. Updated the README, GM manual, and in-app documentation.

## Compatibility and verification

Verified release workflows on Foundry VTT 14.368 with D&D5e 6.0.3 in a disposable test world. Supported minimum/maximum bounds are unchanged. Existing Node tests and the shared Core design-system check passed; in-game evidence is retained in the repositories.

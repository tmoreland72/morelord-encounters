# Morelord Encounters 0.1.9

Morelord Encounters 0.1.9 adds a flexible Custom encounter builder and corrects encounter difficulty calculations to use the published 2024 D&D encounter budgets.

## What Changed

### Added

- Added Custom as the final encounter-type option, with a searchable monster browser and a live encounter roster.
- Added three-state include and exclude filters for creature type, size, terrain, and source, plus challenge rating, Armor Class, and Hit Point filters.
- Added clickable monster details, live XP and difficulty feedback, quantity controls, and scene-ready draggable Actors.

### Improved

- Rebuilt encounter difficulty around the 2024 XP Budget per Character table, using raw monster XP without the retired 2014 multiple-creature multiplier.
- Mapped the published Low, Moderate, and High budgets to Easy, Standard, and Hard, with Deadly beginning at 150 percent of the High budget.
- Standardized the Custom builder on shared Morelord Core components, design tokens, source labels, and integration functions.
- Moved encounter guidance outside the roster and styled the Drakkenheim monster-source warning with the shared warning treatment.

### Fixed

- Fixed difficulty ratings that incorrectly classified three CR 1 monsters as Hard for four level 3 characters.
- Fixed the first Add Monster click being lost after the monster list was updated by a filter.
- Fixed Custom roster quantity controls and result-list actions across Foundry dialog rendering.

# Morelord Encounters 0.4.5

## What Changed

### Fixed

- Register Mass Combat sorting, initiative, and round-transition wrappers with libWrapper when active, preventing the non-libWrapper wrapping warning and preserving other wrappers.
- Preserve standalone Mass Combat behavior when libWrapper is inactive.

## Verification

- Verified in Dev1 on Foundry VTT 14.370 and D&D 5e 6.1.1.
- Settings regression evidence and responsive screenshots are recorded in Morelord Core test/in-game-reports/2026-11-25-settings-*.
- libWrapper chaining and round-start scheduling have dedicated repeatable in-game regressions. Exact Monk's Combat Details coexistence requires that optional module to be enabled.

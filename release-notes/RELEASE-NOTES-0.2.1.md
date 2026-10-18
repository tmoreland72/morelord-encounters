# Morelord Encounters 0.2.1

## What Changed

### Improvements

- Requires Morelord Core 0.5.1 or later. Publish and install Core 0.5.1 before this update; earlier Core releases do not include the required shared components.

- Encounter result cards now consume Core's shared monster-card component. Quantity, portrait, CR/source, Regenerate, and Open Actor sheet behavior are preserved. Craftworks material sources use the same component with Open only.


## Verification

All 103 automated tests pass. Six shared-runner checks passed in Dev1 on Foundry VTT 14.369 / D&D5e 6.0.3, covering Core readiness, recipient routing, saved-roster waves, and native activity/save resolution. Craftworks exercises the same shared monster-card renderer and Actor-open interaction. The older fourth-encounter-type check requires a separately published Monster Manual roster fixture absent from this world; its initial fixture assertion failed, and that check is not claimed as passing.

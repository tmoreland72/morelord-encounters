# Morelord Encounters 0.1.0

Morelord Encounters introduces a standalone, entitlement-aware encounter builder for Foundry VTT and D&D 5e.

## What Changed

### Added

- Added six generated encounter styles: Pack Skirmish, Boss Battle, Boss and Minions, The Horde, Elite Team / Mirror Team, and Random.
- Added difficulty-aware encounter budgets, party verification, a ten-creature limit, and individual creature regeneration.
- Added monster-source selection backed by Morelord Core access: Standard includes SRD sources, while Premium includes every installed monster compendium.
- Added simplified creature previews with source and challenge rating details, plus expanded stat-card inspection.
- Added selectable generated encounters and final monster rosters whose Actor links can be opened or dragged onto a scene.
- Added saved encounter-builder defaults and a shared Morelord Core integration settings experience.

### Improvements

- Generated encounters favor creatures appropriate to each encounter style and filter likely noncombat NPCs.
- Encounter windows use resizable layouts, top-aligned content, standard outer scrolling, and fixed generated-encounter actions.
- Source names are derived from their actual compendiums instead of being inferred from unrelated core-book labels.

### Fixed

- Fixed selected encounters being replaced by placeholder bandits on the final roster.
- Fixed difficulty choices producing identical encounter budgets.
- Fixed default settings not being restored when reopening the builder.
- Fixed malformed creature-card references and invalid numeric ability-save values leaking into previews.

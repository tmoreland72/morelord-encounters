# Morelord Encounters 0.1.4

Morelord Encounters 0.1.4 expands monster variety, cleans up source discovery, rebalances difficulty, and streamlines encounter review.

## What Changed

### Improved

- Expanded generation across the full pool of comparably suitable monsters instead of limiting selection to the first 48 indexed creatures.
- Prefer unused creature names across all six encounter suggestions while continuing to balance selected source books.
- Treat copies of the same named monster from different compendiums as repeats for variety purposes.
- Rebalanced the difficulty ladder so Easy, Standard, and Hard use the former Standard, Hard, and Killer budgets; added a stronger Deadly tier.
- Added a Back action from generated encounters that restores the current setup selections.
- Open generated creatures in their native Foundry Actor sheets.

### Fixed

- Consolidated inconsistent per-creature source aliases when a module declares a single source book, preventing duplicate source selectors such as Tome of Beasts.
- Prevented boss-and-minion fallback selection from unnecessarily repeating the leader creature.
- Allowed rerolls to reach the complete suitable catalog while avoiding creatures already used in the encounter when alternatives exist.

### Documentation

- Updated the Game Master Manual for the new difficulty budgets, Actor-sheet workflow, Back navigation, source consolidation, and expanded variety behavior.

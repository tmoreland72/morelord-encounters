# Morelord Encounters 0.1.1

Morelord Encounters 0.1.1 expands encounter variety across selected source books and adds habitat-aware creature generation.

## What Changed

### Added

- Added terrain-based encounter generation using the structured D&D 5e NPC habitat data.
- Added every standard D&D 5e terrain as an encounter option, including Arctic, Coastal, Desert, Forest, Grassland, Hill, Mountain, Planar, Swamp, Underdark, Underwater, and Urban.
- Added a default-on Terrain-Based Encounters setting to the standard Morelord Encounters settings interface.
- Added terrain selection to saved encounter defaults and terrain context to the generated encounter summary.
- Added runtime catalog diagnostics showing eligible monsters by source and the number matching the selected terrain.

### Improvements

- Encounter generation now balances equally suitable monsters across selected source books instead of favoring compendium index order.
- Expanded random and individual-creature regeneration from the first six nearby candidates to a much broader set of suitably rated creatures.
- Terrain selection strongly prefers habitat matches while safely widening the pool when a publisher lacks enough appropriately rated habitat data.
- Random encounters avoid repeating the same creature when suitable alternatives exist.

### Fixed

- Fixed repeated encounters drawing the same creatures despite many selected monster sources.
- Fixed equal-CR and equal-XP creatures from later compendiums being effectively unreachable during generation.

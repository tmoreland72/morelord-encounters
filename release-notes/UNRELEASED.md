# Unreleased

## What Changed

### Added

- Package a cumulative `CHANGELOG.md` at the module root so in-Foundry changelog viewers and GitHub can read released changes. `release.ps1` rebuilds it from `release-notes/`.
- Warn, without blocking the GM, when a roster outnumbers the characters or stacks group abilities such as Coven, Death Glare, Pack Tactics, or an aura.

### Fixed

- Pack Skirmish, The Horde, and the other counted encounter styles now vary creature count, Challenge Rating, and creature inside the 2024 XP budget. Moderate encounters stay at or under the number of player characters. NPC companions still add their XP and do not raise that cap.
- Creatures whose own traits get stronger in numbers are left out of packs and hordes. A custom roster of seven sea hags is warned instead of being offered as a Moderate pack.
- Monster lookup uses only compendiums enabled in dnd5e Configure Sources and selected in Encounter Source. Encounters asks Morelord Core's Configure Sources API first and uses its own boolean check only when that API is absent. A license tier no longer implies those packs are in the pool. References to a disabled system pack are skipped, and an empty pool warns instead of falling back. Open source and custom monster lists refresh when Configure Sources changes.
- Monster Sources badges show **Enabled** only when that tier's books are selected, and **Available** plus **Not enabled** when they are licensed but not selected.
- Verify Party is a two-column grid again. Commit `ab3d442` (2026-09-14) had replaced `ml-grid` with `ml-actor-choice-grid` and dropped the party list from the grid CSS.

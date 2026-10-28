# Morelord Encounters 0.4.0

## What Changed

### Added

- **Roster warnings.** Encounters now warns, without blocking you, when a roster has more creatures than characters or stacks group abilities such as Coven, Death Glare, Pack Tactics, or an aura.
- **Packaged changelog.** The module now ships a `CHANGELOG.md` at its root so changelog viewers can read released changes.

### Changed

- **The Horde** is always ten of the same creature. Each roll picks a different creature from your enabled sources that fits the XP budget. If no creature fits ten times, you get a warning instead of a different count.
- **Elite Team** (Mirror Team) is one rival for each selected character, with a Challenge Rating close to that character's level. If the team is over the XP budget, you get a warning and no rival is dropped.
- **Pack Skirmish** and the other counted encounter styles now vary the creature count, Challenge Rating, and creature within the XP budget. Moderate encounters stay at or under the number of player characters. NPC companions add their XP and do not raise that cap.
- **Verify Party** uses the full width of the window. Its cards sit on a flexible grid that adds columns as the window gets wider.

### Fixed

- **Configure Sources is respected.** Monsters come only from compendiums you enabled in the D&D system's Configure Sources setting and selected in Encounter Source. Encounters asks Morelord Core first. A source tier no longer adds packs you did not select, and an empty monster list warns instead of falling back to another pack.
- Open source and custom monster lists refresh when Configure Sources changes.
- Monster Sources badges show **Enabled** only when that tier's books are selected, and **Available** plus **Not enabled** when you have access but have not selected them.
- Creatures whose own traits get stronger in numbers are left out of packs and hordes. A custom roster of seven sea hags is warned about instead of being offered as a Moderate pack.

### Requires

- Morelord Core 0.7.0 or later.

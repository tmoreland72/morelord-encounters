# Morelord Encounters 0.4.3

## What Changed

### Added

- A script macro can open **Configure Encounter** with `await game.modules.get("morelord-encounters").api.open()`. `MorelordEncounters.open()` is the same call as the Morelord Tools button.

### Fixed

- Ending or deleting a combat no longer logs a mass-combat reset error when that scene has already been deleted.
- A wave marker that has no id is skipped during that reset, so it is not sent to the scene.

### Changed

- The saved-roster in-game check waits until the mass-combat reset clears its combat, then deletes that scene and the initiative message the check created.

### Requires

- Morelord Core 0.8.2 or later.

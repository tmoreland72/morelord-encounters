# Morelord Encounters 0.4.2

## What Changed

### Fixed

- Starting over or opening the next encounter window no longer leaves the previous dialog stuck on screen with no way to close it.
- Ending or deleting a combat no longer logs a false mass-combat reset error on a GM client that does not control that scene's schedule.

### Changed

- The in-game checks now create the characters, encounters, and windows they need, then remove that temporary setup when they finish.
- A new version can be published from the GitHub Release action. That action builds the package, creates the GitHub release, and sends it to the Foundry package listing and the Morelord Gaming website.

### Requires

- Morelord Core 0.8.2 or later.

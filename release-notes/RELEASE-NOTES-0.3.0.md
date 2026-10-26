# Morelord Encounters 0.3.0

## What Changed

### Changed

- The Morelord Encounters button moves from the Token controls into Morelord Tools. It keeps the hydra icon, stays available to the GM only, and still opens Configure Encounter.

- Requires Morelord Core 0.6.0 or later. Install Core 0.6.0 before this update so the button is registered with Morelord Tools. If Core is older than 0.6.0, the button stays on the Token controls.

## Verification

Automated tests cover registration with Core's tools API and the Token-controls fallback used when Core is older than 0.6.0 or does not expose `api.tools`. Live Foundry verification of the Morelord Tools control is still outstanding.

# Morelord Encounters 0.1.12

## What Changed

### Improvements

- Account management is in its own Morelord Account section above Monster Sources.

- Settings use Core headers, section headings, cards, responsive settings rows, badges, and footers; duplicated local settings styling has been removed.

- The read-only Encounters Settings page has a Core page footer with a Close action; content scrolls independently.

- The party selector uses Core’s standard actor selection cards and shared eligibility: player-owned characters plus character members of the primary party. Unowned characters outside that party are excluded.

### Changed

- Require Morelord Core 0.3.7 or later for the shared components and character eligibility used by this release.

### Fixed

- Distinguish monster compendium source labels using Core's book, adventure folder, and pack labels.

## Validation

- All 48 module tests pass; Core's design-system check passes across six feature modules.
- Live Foundry visual and multiplayer verification was not performed.

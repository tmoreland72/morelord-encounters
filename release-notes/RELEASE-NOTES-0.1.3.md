# Morelord Encounters 0.1.3

Morelord Encounters 0.1.3 adopts the shared Morelord product interface and improves dialog behavior.

## What Changed

### Improved

- Migrated settings, party selection, monster sources, controls, cards, accents, and application shells to Core-owned components and tokens.
- Standardized readable `ml-encounters-*` selectors.
- Added accessible names and shared icon-button behavior to generated-creature controls.
- Standardized Encounter configuration headings, fields, cards, scrolling, and actions.

### Fixed

- Preserved Foundry's attribute-free `DialogV2` content contract by using an inner shared shell.
- Separated scrollable dialog content from the solid, non-scrolling action footer.

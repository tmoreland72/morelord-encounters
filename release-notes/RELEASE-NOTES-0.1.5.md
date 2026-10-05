# Morelord Encounters 0.1.5

Morelord Encounters 0.1.5 corrects monster-source discovery so the encounter setup matches the D&D 5e compendium source configuration.

## What Changed

### Fixed

- Collapsed repeated source-book aliases that resolve to the same compendium title, preventing sources such as Heliana's Guide to Monster Hunting from appearing numerous times.
- Excluded Actor compendiums disabled in the D&D 5e Compendium Browser source settings, including SRD 5.1 when it is not selected.
- Deduplicated repeated compendium and source identifiers during source discovery.

### Documentation

- Updated the product documentation for release 0.1.5.

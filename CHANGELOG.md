# Morelord Encounters Changelog

## 0.3.0

### Changed

- The Morelord Encounters button moves from the Token controls into Morelord Tools. It keeps the hydra icon, stays available to the GM only, and still opens Configure Encounter.

- Requires Morelord Core 0.6.0 or later. Install Core 0.6.0 before this update so the button is registered with Morelord Tools. If Core is older than 0.6.0, the button stays on the Token controls.

## 0.2.1

### Improvements

- Requires Morelord Core 0.5.1 or later. Publish and install Core 0.5.1 before this update; earlier Core releases do not include the required shared components.

- Encounter result cards now consume Core's shared monster-card component. Quantity, portrait, CR/source, Regenerate, and Open Actor sheet behavior are preserved. Craftworks material sources use the same component with Open only.

## 0.2.0

### Added

- **Mass Combat (alpha)** is the fourth encounter type, with wave setup, group attacks and result review inside the existing Encounters window. This feature is available for testing and feedback; controls and behavior may change, and bugs may remain.
- Saved encounter rosters schedule automatic creature arrivals on native initiative turns. Each wave has its own initiative, first spawn round, total spawn rounds, skipped rounds and fixed roster multiplier. Arrival cards describe each deployment.
- Native weapon and saving-throw choices support group attacks, critical hits, typed damage, full/half/no damage on saves, attached on-hit saves, zero-damage saves and directly named/linked repeated-weapon Multiattack counts.

### Improvements

- Full saved creature counts are deployed. Living NPCs of the same creature type share one turn from the start of combat, including the first initiative group. Player characters retain their individual turns and are excluded from creature selectors.
- Combat saves contain creature rosters only. Legacy saves display without extra GM details, and saved encounters can be deleted with confirmation without deleting scheduled snapshots or deployed creatures.
- Attack cards summarize hits, kills and damage. Previews remain reviewable inside Encounters and stale previous-combat results clear safely. Ending combat immediately clears scheduled waves and pending Mass Combat state.
- Expanded Encounters website documentation covers every Mass Combat field and action, fixed multipliers, zero skipped rounds, Monster Manual examples, alpha status and GM-managed effects or mixed-weapon routines.

### Changed

- Requires Morelord Core 0.5.0 or later. Group attacks require D&D5e 6.0.3 or later; existing encounter workflows retain the declared D&D5e 5.3 minimum.

## 0.1.16

### Improvements

- Documentation opens the GM manual and player guide through Core.
- Added a manifest changelog link and moved release history into `release-notes/`. Local working files belong in ignored `/tmp/`.

- Release staging and generated ZIP files use module-local `/tmp/`; ZIP validation rejects working files and release-note sources.

## 0.1.15

### Improvements

- Expand Guide Me from 40 to 60 situations, with twelve per interaction and preserved saved scenes and browser history.
- [Premium] Add The Ninth Bell, The Ferry of Promises, and The House That Kept Tomorrow, each with six private journal pages and no creature-pack requirement.
- Audit all 117 Drakkenheim results across eight tables. Restore Living Ruin and Hooded Lantern patrol descriptions and links, offer the four CR 5 Living Ruin elemental alternatives, and prevent text from bleeding between entries.
- Match full creature names, restore official D&D/SRD and imported-adventure fallbacks, remove injected JavaScript text, and hide monster-drag instructions for intentionally creature-free encounters.

## 0.1.14

### Improvements

- Added optional builder/selection/roster usage and generation error reporting through Core, requiring fresh GM consent.
- [Premium] Aligned the story library with Core list toolbars and card icon actions; removed Start a Story and story-level authoring controls from the reading view.
- [Premium] Removed campaign/region/plane presentation, added player-safe Read aloud callouts, and repaired duplicate journal navigation headings without deleting pages or replacing GM-edited prose.
- [Premium] Added Premium Encounter Stories as the third builder choice, with Combat Encounters and Guide Me Encounters using their agreed labels.
- [Premium] Added the original Brother's Keeper template: editable private GM journals, two core Monster Manual hill giants, a party-dependent difficulty label, and a Craftworks hoard entry point.
- [Premium] Added blank story authoring, independent duplication, editable category/duration details, and multiple prepared combat rosters. Edit Combat Encounter seeds the existing custom builder and saves only on acceptance.
- [Premium] Reused Core's application shell, hero, surfaces, section headings, cards, actor choices, details, actions, and page footer. Native journals own story prose. No new runtime dependency or shared CSS was introduced.
- [Premium] Updated the GM manual, README, in-app documentation, and story implementation notes. Missing Monster Manual or Craftworks content is explained without substituting SRD assets; existing journals remain available after Premium expires.
- Expanded Guide Me from 10 to 40 original offline situations: eight per interaction type, all usable in every offered setting. The 30 additions include individual follow-up hooks and high-pressure deadlines.
- [Premium] Fixed short-cycle repetition: client history persists across builder sessions, selects unseen eligible situations first, then least recently used situations. Opening a saved snapshot does not regenerate it or advance history.
- [Premium] Documented the Encounter Story format separately from the shorter Guide Me workflow; the first journal-based implementation is now available in development.
- Extended stable encounter strength to every generated style. Removed broad XP tolerance and randomized strength targets, selected group quantities by budget fit, and accounted for spent XP in mixed groups. All creature rerolls now preserve XP and quantity; sparse catalogs retain the current creature when no eligible same-XP replacement exists.
- Fixed Boss Battle strength swinging across CR tiers with unchanged setup. Bosses now use the closest available XP tier to the fixed party budget, including creature rerolls, while retaining creature and source variety within that tier.
- Verify Party now includes NPC pets and summons in the primary party through Core participation. Selected NPCs add their XP to difficulty budgets as an explicit estimate; cards show CR and contribution, and saved selections remain intact.
- [Premium] Added a top-level **Combat Encounters / Guide Me Encounters / Encounter Stories** choice while preserving existing roster, published, and saved encounter workflows.
- [Premium] Added guided non-combat generation for unknown or selected settings, five interaction types, four story purposes, three pressure levels, and an optional campaign connection.
- Included 40 original offline situations with playable approaches, suggested checks, motivations, and consequences. Guided scenes need no party or monster packs.
- Added editable scene details, private saved snapshots, reopening, New Scene, and saved guided defaults.
- Reused Core's choice cards, grids, surfaces, form controls, dialog shell, and footer behavior; no new shared component or runtime dependency was needed.
- Added domain tests and an opt-in Foundry workflow test using Core's shared runner. Updated the README, GM manual, and in-app documentation.

## 0.1.13

### Improvements

- Updated Foundry verification metadata to the latest stable build, 14.367. Existing support minimums are unchanged.
- Verified Foundry compatibility is explicitly recorded as 14.367; existing Foundry and system support minimums remain unchanged.
- Release guidelines require checking the latest stable Foundry build and confirming the published Foundry listing.

## 0.1.12

### Improvements

- Account management is in its own Morelord Account section above Monster Sources.

- Settings use Core headers, section headings, cards, responsive settings rows, badges, and footers; duplicated local settings styling has been removed.

- The read-only Encounters Settings page has a Core page footer with a Close action; content scrolls independently.

- The party selector uses Core’s standard actor selection cards and shared eligibility: player-owned characters plus character members of the primary party. Unowned characters outside that party are excluded.

### Changed

- Require Morelord Core 0.3.7 or later for the shared components and character eligibility used by this release.

### Fixed

- Distinguish monster compendium source labels using Core's book, adventure folder, and pack labels.

## 0.1.11

### Improvements

- Use Core actor portraits consistently in party selection, encounter choices, custom monster lists, and encounter rosters.

### Fixed

- Align documented Core requirements with the manifest.
- Synchronize the release script with the canonical Core workflow.

## 0.1.10

### Added

- Save any final encounter with a name as a private GM Journal Entry in the current world.
- Review saved encounter cards and open their final rosters without rerolling quantities or GM notes.
- Add Select All and Unselect All controls for party and monster sources.
- Show working notifications during loading, generation, and roster preparation.
- Include Sewers and randomly choose documented rival adventuring parties or Queen's Men gangs for Drakkenheim rivals.

### Improvements

- Use Core headers and section cards matching Morelord Downtime, with consistent titles, subtitles, and divider placement.
- Rename encounter types to Random Encounters and Custom Encounters.
- Place encounter type and difficulty in two columns and order final actions as Start Over, Save, Close.
- Allow custom rosters above ten creatures while retaining the ten-creature cap for Random Encounters.
- Use Core window geometry and collapsible notes; update in-app and published documentation.

### Fixed

- Identify SRD 5.1 and 5.2 separately and select their complete monster packs.
- Exclude source packs without eligible monsters, including Starter Heroes, empty packs, and unreadable packs.
- Restrict Drakkenheim Actors to Monsters of Drakkenheim, using Ratling Warrior and Deep Dreg Warrior replacements and reporting unresolved matches.
- Match saved monster cards to generated previews while keeping scene dragging on the final roster.

## 0.1.9

### Added

- Added Custom as the final encounter-type option, with a searchable monster browser and a live encounter roster.
- Added three-state include and exclude filters for creature type, size, terrain, and source, plus challenge rating, Armor Class, and Hit Point filters.
- Added clickable monster details, live XP and difficulty feedback, quantity controls, and scene-ready draggable Actors.

### Improved

- Rebuilt encounter difficulty around the 2024 XP Budget per Character table, using raw monster XP without the retired 2014 multiple-creature multiplier.
- Mapped the published Low, Moderate, and High budgets to Easy, Standard, and Hard, with Deadly beginning at 150 percent of the High budget.
- Standardized the Custom builder on shared Morelord Core components, design tokens, source labels, and integration functions.
- Moved encounter guidance outside the roster and styled the Drakkenheim monster-source warning with the shared warning treatment.

### Fixed

- Fixed difficulty ratings that incorrectly classified three CR 1 monsters as Hard for four level 3 characters.
- Fixed the first Add Monster click being lost after the monster list was updated by a filter.
- Fixed Custom roster quantity controls and result-list actions across Foundry dialog rendering.

## 0.1.8

### Added

- **Champion:** Added published Drakkenheim encounter tables for the Inner City, Outer City, Sewers, Crater Basin, Gates, Interactions, Queen's Park, and Special Outlaw Members.
- **Champion:** Added complete GM encounter descriptions, clickable private quantity rolls, prioritized draggable monster Actors, and automatic encounter Stealth results.
- Added an encounter-type selector with saved defaults and a unified Start Over workflow.

### Improved

- Improved monster resolution across Monsters of Drakkenheim, Dungeons of Drakkenheim, installed Actor compendiums, and SRD sources, including known renamed creatures.
- Standardized encounter dialogs on shared Morelord UI components, source-book labels, callouts, sizing behavior, and footer controls.
- Disabled difficulty selection when using published Drakkenheim encounters, where difficulty does not apply.

### Fixed

- Fixed Drakkenheim result parsing, duplicated or missing titles, unresolved UUID text, misleading Actor quantities, and stale selector states.
- Fixed live encounter-type changes so switching back to Monster Compendiums immediately restores the Difficulty control.

## 0.1.7

### Added

- Added an optional Encounter Stealth roll using the lowest Stealth modifier among the encounter's creatures.
- Added an orange help button explaining how the result can be compared with character passive Perception to determine surprise.

### Improved

- Presented the final creature roster as an aligned, borderless table inside a highlighted encounter card.
- Kept adjusted XP totals and Stealth controls outside the creature card for clearer visual hierarchy.
- Added reliable creature portrait fallbacks in the final roster.

### Documentation

- Updated the product documentation for release 0.1.7.

## 0.1.6

### Fixed

- Consolidated enabled Actor compendiums from the same package when they share a generic label such as Bestiary, preventing Heliana's Guide to Monster Hunting from appearing twelve times.
- Expanded a consolidated source selection back to every underlying compendium during encounter generation so no available creatures are lost.
- Preserved existing selections when their individual compendiums are consolidated into one source card.

### Documentation

- Updated the product documentation for release 0.1.6.

## 0.1.5

### Fixed

- Collapsed repeated source-book aliases that resolve to the same compendium title, preventing sources such as Heliana's Guide to Monster Hunting from appearing numerous times.
- Excluded Actor compendiums disabled in the D&D 5e Compendium Browser source settings, including SRD 5.1 when it is not selected.
- Deduplicated repeated compendium and source identifiers during source discovery.

### Documentation

- Updated the product documentation for release 0.1.5.

## 0.1.4

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

## 0.1.3

### Improved

- Migrated settings, party selection, monster sources, controls, cards, accents, and application shells to Core-owned components and tokens.
- Standardized readable `ml-encounters-*` selectors.
- Added accessible names and shared icon-button behavior to generated-creature controls.
- Standardized Encounter configuration headings, fields, cards, scrolling, and actions.

### Fixed

- Preserved Foundry's attribute-free `DialogV2` content contract by using an inner shared shell.
- Separated scrollable dialog content from the solid, non-scrolling action footer.

## 0.1.2

### Improvements

- Removed terrain-based encounter generation and its setup option because inconsistent publisher habitat data produced results that did not reliably match the GM's selected environment.
- Simplified saved encounter defaults and generation diagnostics after removing terrain selection.
- Updated the in-application explanation and product documentation to describe only the supported generation behavior.

### Fixed

- Fixed the Learn More window failing to open because its Foundry `DialogV2` root content element contained a CSS attribute.

## 0.1.1

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

## 0.1.0

### Added

- Added six generated encounter styles: Pack Skirmish, Boss Battle, Boss and Minions, The Horde, Elite Team / Mirror Team, and Random.
- Added difficulty-aware encounter budgets, party verification, a ten-creature limit, and individual creature regeneration.
- Added monster-source selection backed by Morelord Core access: Standard includes SRD sources, while Premium includes every installed monster compendium.
- Added simplified creature previews with source and challenge rating details, plus expanded stat-card inspection.
- Added selectable generated encounters and final monster rosters whose Actor links can be opened or dragged onto a scene.
- Added saved encounter-builder defaults and a shared Morelord Core integration settings experience.

### Improvements

- Generated encounters favor creatures appropriate to each encounter style and filter likely noncombat NPCs.
- Encounter windows use resizable layouts, top-aligned content, standard outer scrolling, and fixed generated-encounter actions.
- Source names are derived from their actual compendiums instead of being inferred from unrelated core-book labels.

### Fixed

- Fixed selected encounters being replaced by placeholder bandits on the final roster.
- Fixed difficulty choices producing identical encounter budgets.
- Fixed default settings not being restored when reopening the builder.
- Fixed malformed creature-card references and invalid numeric ability-save values leaking into previews.

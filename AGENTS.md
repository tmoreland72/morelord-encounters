# Morelord Development Guidelines

## Hard rules

- HARD RULE: Use D&D 5e 2024 rules (SRD 5.2) only. Never use or add 2014 rules, never add a 2014/2024 rules-version switch or detection, and use 2024 terms and mechanics in code, data, UI text and docs.
- D&D 5e Configure Sources is the primary compendium filter for every module. Use Core's `sources.getAllowedPacks`, `sources.getAllowedPack`, `sources.isSourceAllowed`, and `sources.isUuidAllowed`. An explicit `packSourceConfiguration` boolean wins; otherwise a pack is allowed only when its `rulesVersion` flag is empty or matches the dnd5e rules version. Module source pickers only narrow that set. Refresh open lists on `morelordCoreConfigureSourcesChanged`. The Core README has the contract.
- All module settings are world-scoped and GM-only unless Troy says otherwise.

## Shared assets in Morelord Core

- During every Morelord coding task, actively look for opportunities to reuse or create shared assets in Morelord Core, including UI components, CSS, design tokens, templates, functions, utilities, and services.
- Before adding module-specific code or styles, inspect Morelord Core for an existing asset that can be reused or extended.
- When functionality or styling is useful across multiple Morelord modules, place the shared implementation in Morelord Core and have the modules consume it instead of duplicating it.
- When touching duplicated code or styles, consider consolidating them in Morelord Core as part of the relevant change.
- Keep shared assets simple and focused on demonstrated needs. Keep behavior specific to one module in that module unless there is a clear shared use case.
- Preserve compatibility for existing consumers when changing shared assets, and check the affected modules.
- In the completion summary, briefly identify shared assets reused, extended, or introduced when relevant.

## Brand and interface consistency

- ALL Foundry UI in every Morelord module MUST use Core's shared components, styles, tokens, and UI functions. This applies to new and existing windows, dialogs, forms, cards, lists, chat output, and sheet integrations, including prototypes and unreleased modules.
- The full brand guide lives with the other brand and business docs in Google Drive: [Morelord Gaming](https://drive.google.com/drive/folders/1JKMCzl8f7MyNhgtuIMzCz1Y2o4_w9cC0). Keep these developer rules here:
- Every ApplicationV2 window includes `ml-window` in `DEFAULT_OPTIONS.classes`. Every full application template begins with `ml-app` and normally `ml-app-shell`.
- DialogV2 `config.content` has no attributes. Put the shell on an inner wrapper: `ml-app ml-app-shell ml-dialog-shell`.
- Use readable `ml-{module}-*` namespaces (`ml-core-*`, `ml-marketplace-*`, `ml-journeys-*`, `ml-craftworks-*`, `ml-encounters-*`, `ml-downtime-*`, `ml-character-export-*`). Do not introduce `mlm-*`, `mjourneys-*`, `mcw-*`, `mlh-*`, or `morelord-encounter-*`.
- Use semantic Core tokens (`--ml-color-accent`, `--ml-color-success`, `--ml-color-info`, `--ml-color-warning`, `--ml-color-danger`, `--ml-color-muted`). Do not use a raw red, green, amber, or blue for application state.
- Keep footers opaque and outside the scroll region. Only the content body scrolls.
- Disabled buttons say why. Pass `disabledReason`, or call `MorelordCore.ui.setDisabled(element, reason)`. The first line is the bold tooltip title and each later line is a short line under it. A blank reason enables the control and removes the tooltip.
- Use the appropriate Core component with its required markup, classes, and behavior. Adding `ml-*` classes or Core tokens to independently designed markup is not sufficient. Core is the source of truth; another module is only an example of consuming it, not a design system to copy.
- Bottom form and window actions use `<footer class="ml-form-footer">`. The footer has a top border and a gap, and its buttons sit on the right at their natural width. Do not stretch those buttons. `MorelordCore.ui.confirm` is the exception: its two buttons fill that footer at equal width. Keep `ml-page-footer` on the same footer when Core's page layout should move it out of the scrolling body.
- Do not recreate, override, or patch shared UI in a feature module. If Core lacks a needed shared component or its component does not work correctly, add or fix it in Core, preserve existing consumers, and have the feature module consume that implementation.
- Module-specific UI code may implement domain-specific layout and behavior only. Shared typography, surfaces, controls, spacing, states, and window behavior remain owned by Core. Ensure Core's assets and required UI initialization are actually loaded; do not compensate for missing integration with local styling.
- Verify the rendered UI with Foundry and Core styles loaded, including relevant interactions and responsive behavior. Passing a class-name or design-system scan alone does not establish compliance. Report any live Foundry verification still outstanding.

## Player roll requests

- Every workflow that requests player rolls must let the GM roll for characters whose players are not logged in, including when a player disconnects with a request pending. Reuse Core's user/recipient routing, preserve the roll's visibility rules, and prevent duplicate resolution.

## Compatibility and existing world data

- Read each affected module's `module.json` before changing APIs or dependencies. Preserve its declared Foundry and game-system support, and distinguish required dependencies from optional integrations.
- Keep stored keys and identifiers stable. Handle necessary data migrations explicitly, and never delete campaign data because premium access expires.

## Verification

- Before any in-Foundry testing, verify the loaded world ID is `dev1` (Dev1). If another world is loaded, or its identity cannot be verified, skip all in-Foundry testing without switching worlds. An explicit user instruction to skip testing takes precedence even in Dev1.

- Every in-game bug fix must include a repeatable in-game regression test that reproduces the bug and verifies the corrected behavior. Follow Core's `IN-GAME-TESTING.md`, reuse its shared runner, and keep module-specific tests in the owning module. Run the test in Foundry and report the result or any verification blocker.
- When changing Core, identify and check the modules that consume the changed functionality.
- Run relevant existing tests and, for shared UI changes, Core's `npm run check:design-system`. Clearly report anything that still needs live Foundry verification.

## Releasing

- HARD RULE: Morelord releases always run through a GitHub Actions Release workflow that uses the repo secrets `FOUNDRY_RELEASE_TOKEN` and `RELEASE_PUBLISH_TOKEN` (already set on this repo). Cloud agents must never run `release.ps1` themselves, never skip the Foundry or website publish steps, and never report the tokens as missing.
- Agents release only when Troy approves, by running `gh workflow run release.yml -f version=X.Y.Z`, then watching that run. The workflow file is `.github/workflows/release.yml` on `main`. One run publishes the GitHub Release, the Foundry package, and the website feed.

## Releases and documentation

- Per-version release notes live in `release-notes/RELEASE-NOTES-<version>.md` and are excluded from release archives. Every released module maintains a cumulative root `CHANGELOG.md` (newest version first; `#`, `##`, and `###` headings with a space after `#`; `- ` bullets; no `---` horizontal rules) generated from `release-notes/RELEASE-NOTES-*.md`, auto-updated by `release.ps1`, and packaged at the root of the release `.zip`.
- Put temporary scripts, staging folders, browser profiles, and other working files in the owning module's `/tmp/` directory; ignore `/tmp/` in Git and exclude it from release archives. Preserve permanent source, documentation, and regression evidence.

- Campaign Manager is inactive. Exclude it from active-module inventories, release checks, and development planning unless the user explicitly revives it.

- Follow the affected repository's `release.config.json` and release-note conventions when preparing a requested release. Publishing runs through the Release workflow in Releasing.
- For every release, check the latest stable Foundry VTT version against official release information and verify module compatibility on that version. Update `module.json`'s `compatibility.verified` to the exact verified version/build before packaging, and publish matching compatibility metadata to the Foundry package release. Preserve supported minimum/maximum bounds unless intentionally changing support; do not claim untested compatibility. After publishing, verify the public manifest and Foundry release listing both reflect the updated compatibility, so stale metadata does not leave users with a compatibility-risk warning. Report any verification or publication blocker explicitly.
- Character Export and Downtime follow the standard release requirements; all modules must follow shared UI and Core asset standards.
- As part of every code change, review affected documentation and update it when behavior, UI, settings, APIs, dependencies, or workflows change. Include relevant READMEs, user guides, API examples, and release notes; update shared documentation in Core when applicable.
- Keep public documentation aligned with actual implemented behavior and compatibility. Documentation review is part of completing the change, not something deferred until release.
- Document every player-visible and GM-visible page, including each module's Game Settings: explain every field and action using its exact UI label, accepted values/defaults, dependencies, and effect. Put examples in documentation, not helper text. Keep essential UI help concise; Shop Manager uses documentation instead of helper paragraphs. Check field coverage whenever a page or setting changes.
- Documentation buttons use Core to open the actual module documentation on the Morelord Gaming website in a new browser tab. Keep one documentation source; do not maintain separate in-game summaries.
- In the completion summary, identify documentation updated or state why no update was needed.

## Demo videos

- Before planning, scripting, recording, editing, or exporting any Morelord demo video, read and follow the demo recording guide in [Morelord Gaming](https://drive.google.com/drive/folders/1JKMCzl8f7MyNhgtuIMzCz1Y2o4_w9cC0).
- Save reusable demo instructions and corrections from the user in that guide; keep video-specific requirements in the video's brief. Check the finished video against those requirements before delivery.

## Maintaining these guidelines

- Treat `morelord-core/AGENTS.md` as the canonical shared standard.
- When updating shared guidelines, update Core's file first and copy it to the other Morelord repositories: Character Export, Compendium, Craftworks, Downtime, Encounters, Journeys, and Marketplace.
- Keep this file concise and reference existing documentation for details.


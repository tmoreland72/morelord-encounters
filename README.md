# Morelord Encounters

Optional reporting: with a compatible Core and fresh GM consent, builder/selection/roster opens and generation errors are reported without account linking. Core owns privacy, transport and sanitized errors; see [Core telemetry](../morelord-core/TELEMETRY.md). Existing Core versions keep working without reporting. The website endpoint must be deployed before release.

A standalone combat and non-combat encounter builder for Foundry VTT v14 and D&D 5e.

Enable the module, enter a world as a GM, and click **Morelord Encounters** in the Token scene controls to launch the encounter builder.

Choose **Combat Encounters** for Random Encounters, Custom Encounters, published Drakkenheim Encounters, and Saved Encounters, or **Guide Me Encounters** to create a non-combat situation even when its setting is unknown. Custom encounters provide a filterable monster browser with a live difficulty rating. Every completed roster presents linked, draggable monster Actors and Start Over, Save, and Close controls. Saved encounters are stored privately for GMs in the current world.

## Guided non-combat encounters

**Guide Me Encounters** asks about setting, interaction, story purpose, and pressure, with an optional campaign connection. Leave **Choose for me** or **Surprise me** selected for anything undecided. **Generate Situation** creates a scene with an opening, GM truth, motivations, approaches, optional checks, pressure, success, setbacks, walk-away consequences, and a reward or campaign connection.

The initial library contains 40 original situations across conversation, investigation, rescue, obstacles, and discovery, with eight possible settings. Generation runs locally without an AI service, monster packs, or a selected party. Pressure changes suggested DCs and the cost or urgency of setbacks; this is GM guidance, not a combat difficulty calculation. Checks are suggestions and do not send roll requests or modify Actors.

Expand **Edit this scene** to change any text. **Save** stores an independent snapshot; reopen it through **Combat Encounters → Saved Encounters**. **New Scene** replaces the current draft using the same answers and avoids repeating the immediately preceding situation. Save edits before replacing a draft. **Start Over** returns to setup with your current configuration. **Save as Default** also remembers guided mode and its answers. Saving an edited scene again creates another snapshot; it does not overwrite earlier saves.

### Guided workflow verification

Run `npm test` for isolated checks. In a development world, close Encounters windows and run this as GM in a browser console or Script macro:

```js
const { runGuidedEncounterTests } = await import("./modules/morelord-encounters/scripts/testing/guided-encounters.mjs");
console.log(JSON.stringify(await runGuidedEncounterTests(), null, 2));
```

This opt-in suite uses Core's in-game runner. It verifies mode switching, unknown-setting defaults, answer persistence, generation, editing, private saves, reopening, and regeneration. It deletes its own temporary Journal Entry and restores changed default settings. It does not alter existing saved encounters, Actors, or tokens. See Core's `IN-GAME-TESTING.md` for the shared runner and full visual verification requirements.

Generated styles include Pack Skirmish, Boss Battle, Boss and Minions, The Horde, Elite Team / Mirror Team, and Random.

Boss Battle chooses creatures from the available XP tier closest to the party's difficulty target. Regenerating or rerolling the boss varies the creature within that tier, rather than randomly shifting its strength. Equally close tiers favor the lower XP; if there is no other boss in the chosen tier, reroll keeps the current creature. Restricted source selections may leave only a tier far from the target; review the displayed total and target XP.

All six styles prioritize XP fit before creature or source variety. Pack (4–7), Horde (8–10), and Random (2–6) choose quantities by their total XP fit; Boss and Minions uses a fixed leader target and 3–5 minions. Elite and Random account for XP already assigned as they fill remaining slots. Regeneration preserves each style's total XP with an unchanged party, difficulty, and catalog. Individual rerolls preserve creature XP and quantity, retaining the current creature when no eligible same-XP alternative exists. Limited catalogs may require repeated creatures or leave a gap from the target; this is an approximation, not a guarantee of an exact budget match.

In-game regression: after selecting sources containing CR 4 and CR 5 creatures, run `const { runEncounterStrengthTests } = await import("./modules/morelord-encounters/scripts/testing/boss-strength.mjs"); console.log(await runEncounterStrengthTests());` in the Foundry console. This uses Core's runner and the loaded source catalog to check all six styles and repeated rerolls without changing world data.

Monster sources follow explicit Morelord Core features: `encounters.standard` enables SRD creatures, while `encounters.premium` enables every installed monster source book, including SRD, core, and third-party content. Source selection is tracked at the individual book level even when Foundry combines several books into one constructed compendium index.

## Product goal

The completed workflow will produce a ready-to-use encounter containing linked monster Actor documents. The GM will be able to review the generated roster and drag its monsters directly into a scene.

Integration entry points for Morelord Journeys, Morelord Craftworks, and other modules will be added after the standalone workflow is established.

## Installation

Install Morelord Encounters and its required Morelord Core dependency in Foundry using this permanent manifest URL:

```text
https://raw.githubusercontent.com/tmoreland72/morelord-encounters/main/module.json
```

## Release workflow

Morelord Encounters uses the standard Morelord Foundry module release workflow. Project-specific settings are stored in `release.config.json`, while local website publishing credentials belong in an untracked `.env` file copied from `.env.example`:

```text
RELEASE_PUBLISH_TOKEN=your-token-here
```

Release notes use the standard filename format `RELEASE-NOTES-x.y.z.md` and must include a `## What Changed` section.

Every release must also include current product documentation in `docs/`. The documentation landing page and manuals must identify the release version. Because `docs/` is a required release path, packaging fails if product documentation is missing. The release script also requires the landing-page frontmatter version to match the release and dispatches a Morelord Gaming website documentation deployment after a normal release.

Validate a release without modifying GitHub or the website:

```powershell
.\release.ps1 -Version 0.1.0 -DryRun
```

Publish the release:

```powershell
.\release.ps1 -Version 0.1.0
```

The workflow validates the repository and release notes, updates `module.json`, builds and verifies the Foundry ZIP, commits and tags the release, pushes it, creates the GitHub Release, and publishes the same release metadata to MorelordGaming.com. Draft and prerelease builds skip the public website feed.


The party selector uses Core’s standard actor selection cards and shared eligibility: player-owned characters plus character and NPC members of the primary party. NPCs outside that party and unowned characters outside it are excluded. Select participating pets and summons in Verify Party; saved selections are preserved, so select newly added companions explicitly. NPC cards show CR and their XP contribution. Each selected NPC adds its XP value (falling back to CR-derived XP) to every difficulty budget, after the Deadly multiplier on character budgets. This is an estimate, not an official NPC-to-character conversion; deselect companions that will not fight.

To regression-test companion selection in Foundry, use a development world whose primary party includes an NPC, close Encounters windows, then run as GM:

```js
const { runPartyCompanionTests } = await import("./modules/morelord-encounters/scripts/testing/party-companions.mjs");
console.log(await runPartyCompanionTests());
```

The check uses Core's in-game runner, verifies NPC selection and budget contributions, and closes its window without saving or changing world data. Live visual review, including narrow windows and themes, remains a separate verification step.


The read-only Encounters Settings page has a Core page footer with a Close action; content scrolls independently.


Settings use Morelord Core’s shared headers, sections, content cards, settings rows, and footer. Descriptions remain beside checkboxes at narrow widths.


Settings separates Morelord Account management from Monster Sources. Account connection and refresh controls appear in the account section above the source-access cards.

Guide Me now includes 40 original situations (eight per interaction) and remembers recently generated situations in this browser. Unseen matching situations appear before repeats. See the [GM manual](docs/gm-manual.md) and [Encounter Story implementation notes](docs/encounter-stories-design.md).

Encounter Stories is now the third builder option. Premium GMs can create the original Brother's Keeper template or author a blank story, edit native GM journals, duplicate independently, and change prepared rosters through the Combat Encounters custom builder. Brother's Keeper requires the core Monster Manual; its hoard opens Morelord Craftworks at Challenge 5–10. See the [GM manual](docs/gm-manual.md#encounter-stories-premium).

Encounter Stories uses a left-aligned **+ Create a Story** toolbar and top-right card copy/pencil icons. Story categories are Fantasy or Eldritch Horror; reading views omit campaign/region/plane metadata. Player-safe passages use **Read aloud** callouts, separate from private GM guidance.

## Release dependency

This release requires Morelord Core 0.3.10 or newer for the shared UI and service updates. Optional integrations remain optional.

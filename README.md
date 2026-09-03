# Morelord Encounters

A standalone encounter builder for Foundry VTT v14 and D&D 5e.

Enable the module, enter a world as a GM, and click **Morelord Encounters** in the Token scene controls to launch the encounter builder.

The builder supports generated, custom, and published Drakkenheim encounters. Custom encounters provide a filterable monster browser with a live difficulty rating, while every completed roster presents linked, draggable monster Actors.

Generated styles include Pack Skirmish, Boss Battle, Boss and Minions, The Horde, Elite Team / Mirror Team, and Random.

Monster sources follow explicit Morelord Core features: `encounters.standard` enables SRD creatures, while `encounters.premium` enables every installed monster source book, including SRD, core, and third-party content. Source selection is tracked at the individual book level even when Foundry combines several books into one constructed compendium index.

## Product goal

The completed workflow will produce a ready-to-use encounter containing linked monster Actor documents. The GM will be able to review the generated roster and drag its monsters directly into a scene.

Integration entry points for Morelord Journeys, Morelord Craftworks, and other modules will be added after the standalone workflow is established.

## Installation

After the first GitHub release is published, install Morelord Encounters in Foundry using this permanent manifest URL:

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

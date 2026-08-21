---
title: Game Master Manual
description: Install, configure, and use Morelord Encounters in a D&D 5e world.
slug: morelord-encounters/gm-manual
product: morelord-encounters
audience: game-master
version: 0.1.2
foundry: 14
order: 10
---

# Morelord Encounters: Game Master Manual

## Requirements

- Foundry Virtual Tabletop v14
- D&D 5e system 5.3 or later
- Morelord Core
- GM permission in the world

Morelord Encounters uses monster Actor compendiums supplied by D&D 5e and installed content modules. It does not download or duplicate monsters from books the world does not have installed.

## Installation

Install the module with this manifest URL:

`https://raw.githubusercontent.com/tmoreland72/morelord-encounters/main/module.json`

Enable both **Morelord Core** and **Morelord Encounters** in the world.

## Content access

Open **Game Settings → Configure Settings → Module Settings → Morelord Encounters → Configure Encounters** to review account access.

- **Encounters Standard** provides creatures from available SRD compendiums.
- **Encounters Premium** provides every installed monster compendium, including core and third-party source books.

Use **Manage Account** to open Morelord Core account management. Use **Refresh** after changing product access or installing new content.

## Terrain-based encounters

Terrain-based generation is enabled by default in Encounters Settings. When enabled, the encounter setup offers the standard D&D 5e NPC habitats:

- Arctic
- Coastal
- Desert
- Forest
- Grassland
- Hill
- Mountain
- Planar
- Swamp
- Underdark
- Underwater
- Urban

Choose **Any Terrain** when location should not affect creature selection.

The generator strongly prefers appropriately rated creatures whose structured D&D 5e habitat matches the selected terrain. Creatures marked for any habitat can appear everywhere. Custom habitat text is also considered. If a publisher has incomplete habitat metadata or the matching creatures cannot support the requested difficulty, the generator safely widens the pool instead of returning an empty or badly underpowered encounter.

## Opening the encounter builder

Select the hydra button in Foundry's Token scene controls to open **Configure Encounter**.

### Encounter Settings

Choose the desired difficulty:

- **Easy** uses the D&D 5e easy XP threshold.
- **Standard** uses the medium XP threshold.
- **Hard** uses the hard XP threshold.
- **Killer** starts from the deadly threshold and increases it further for a high-risk battle.

If terrain-based encounters are enabled, choose the current terrain.

Select **Learn More** for an in-application explanation of the generator's decisions and limitations.

### Verify Party

Select every character who should contribute to the encounter budget. All character Actors are available, including characters without a player owner.

The selected character levels determine the base XP target. Review the party before generating whenever attendance or levels have changed.

### Monster Sources

Select every monster source allowed for the encounter. Each selector shows:

- The source-book title
- The Actor compendium name
- A button that opens the underlying compendium for verification

Only selected and entitled sources are indexed. Premium access allows every installed monster source, but the GM remains in control of which sources participate in a particular encounter.

### Saving defaults

Select **Save as Default** to preserve the current difficulty, terrain, party, and source selections. Saving does not close the builder or generate encounters. The saved setup is restored the next time the builder opens.

## Generated encounter styles

Select **Generate Encounters** to build six alternatives:

- **Pack Skirmish** — several creatures that fight as a coordinated pack
- **Boss Battle** — one powerful solo creature
- **Boss and Minions** — a stronger leader supported by weaker creatures
- **The Horde** — up to ten weak creatures suited to area effects
- **Elite Team / Mirror Team** — a distinct group of individually selected opponents
- **Random** — an intentionally unpredictable mix

The first encounter is selected by default. Click anywhere in another encounter section to select it.

Each simplified creature card shows its image, quantity, name, challenge rating, and source. Use the external-link button to open the expanded stat preview. Use the rotate button to replace only that creature with a similarly rated alternative.

Select **Regenerate Encounters** to replace all six alternatives.

## Difficulty and adjusted XP

The builder starts from the standard D&D 5e party thresholds. It then selects creatures whose XP values fit the composition of each encounter style. Adjusted XP includes the multiple-creature multiplier, while base XP is also displayed for reference.

No automated calculation can account for every battlefield. Surprise, terrain, cover, hazards, tactics, magic items, depleted resources, unusual party composition, and monster synergies can all change the real difficulty. Treat the generated result as a strong starting point and review it before play.

## Variety across source books

Creatures with the same challenge rating often share identical XP values. Morelord Encounters randomizes among comparably suitable creatures and balances choices across the selected source books instead of repeatedly taking the first compendium match.

The generator limits encounters to ten creatures. If ten weak creatures cannot reach the difficulty target, it chooses tougher creatures rather than adding an unmanageable number of tokens.

## Selecting and placing an encounter

After selecting the desired alternative, choose **Select Encounter**. The final roster shows a draggable Actor link for each creature type.

- Click a monster link to open its Actor sheet.
- Drag the link onto the scene to create a token.
- Repeat the drag for the quantity shown.

The module links directly to the installed compendium Actor, so the resulting token uses that source's statistics, artwork, items, and automation.

## Troubleshooting

### A source book is missing

1. Confirm its module is installed and active.
2. Confirm the Actor compendium is enabled in D&D 5e's source configuration.
3. Open Encounters Settings and select **Refresh**.
4. Confirm the Morelord account has Encounters Premium when using non-SRD sources.

### Encounters do not appear terrain-specific

Some publishers do not populate D&D 5e habitat metadata consistently. Confirm terrain-based generation is enabled and that a specific terrain—not Any Terrain—is selected. The generator falls back when matching creatures cannot satisfy the requested CR or XP range.

### Encounters seem repetitive

Confirm multiple sources are selected and regenerate the encounters. A narrow difficulty target may legitimately favor creatures at a small number of challenge ratings, but equal-rated alternatives from other selected books remain eligible.

### A creature cannot be dragged

Drag the Actor link on the final Monster Links page, not the simplified preview card. Drop it onto an active scene where the GM has permission to create tokens.

### Defaults did not change

Make the desired selections and choose **Save as Default** before closing the setup window. A confirmation notification appears when the world setting has been saved.

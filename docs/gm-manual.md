---
title: Game Master Manual
description: Install, configure, and use Morelord Encounters in a D&D 5e world.
slug: morelord-encounters/gm-manual
product: morelord-encounters
audience: game-master
version: 0.1.12
foundry: 14
order: 10
---

# Morelord Encounters: Game Master Manual

## Requirements

- Foundry Virtual Tabletop v14
- D&D 5e system 5.3 or later
- Morelord Core 0.3.7 or later
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

## Opening the encounter builder

Select the hydra button in Foundry's Token scene controls to open **Configure Encounter**.

### Encounter Settings

Choose **Random Encounters** to generate six encounter suggestions, **Custom Encounters** to assemble a roster in the monster browser, **Drakkenheim Encounters** when that published content is available, or **Saved Encounters** to reuse a saved roster. Encounter Settings, Verify Party, and Encounter Source each appear in a Core section card, following Morelord Downtime's layout. Encounter type appears in the left column; difficulty appears on the right for Random Encounters.

For Random Encounters, choose the desired difficulty:

- **Easy** uses the 2024 D&D Low encounter budget.
- **Standard** uses the 2024 D&D Moderate encounter budget.
- **Hard** uses the 2024 D&D High encounter budget.
- **Deadly** is a Morelord extension at 150 percent of the 2024 High budget.

Select **Documentation** beside the Morelord Encounters title to open the shared Morelord documentation viewer.

### Verify Party

Select every character who should contribute to the encounter budget. All character Actors are available, including characters without a player owner.

The selected character levels determine the base XP target. Review the party before generating whenever attendance or levels have changed.

Use **Select All** or **Unselect All** to update the party checkboxes together. These controls affect only the party. Verify Party is hidden when reusing a saved encounter.

### Monster Sources

Select every monster source allowed for the encounter. Each selector shows:

- The source-book title
- The Actor compendium name
- A button that opens the underlying compendium for verification

Source discovery checks enabled Actor compendiums for eligible monsters. Character-only packs such as Starter Heroes, vehicle-only packs, empty packs, and unreadable packs are omitted. Non-hostile humanoid NPCs are excluded by the same rule used during generation. D&D 5e's **Monsters (SRD)** pack is labeled **System Reference Document 5.1**; its **Actors** pack is labeled **System Reference Document 5.2**. Actor-level legacy book names do not override these editions.

Only selected, entitled sources contribute to the encounter catalog. Premium access allows installed monster sources beyond the SRD, but the GM controls which participate. Use **Select All** or **Unselect All** to update the source checkboxes without changing the party. These controls appear for Random and Custom Encounters; Drakkenheim locations and Saved Encounters use single selection.

### Saving defaults

Select **Save as Default** to preserve the current difficulty, party, and source selections. Saving does not close the builder or generate encounters. The saved setup is restored the next time the builder opens.

## Generated encounter styles

Select **Generate Encounters** to build six alternatives:

- **Pack Skirmish** — several creatures that fight as a coordinated pack
- **Boss Battle** — one powerful solo creature
- **Boss and Minions** — a stronger leader supported by weaker creatures
- **The Horde** — up to ten weak creatures suited to area effects
- **Elite Team / Mirror Team** — a distinct group of individually selected opponents
- **Random** — an intentionally unpredictable mix

The first encounter is selected by default. Click anywhere in another encounter section to select it.

Each simplified creature card shows its image, quantity, name, challenge rating, and source. Use the external-link button to open its native Foundry Actor sheet. Use the rotate button to replace only that creature with a similarly rated alternative.

Select **Regenerate Encounters** to replace all six alternatives. Select **Start Over** to return to encounter setup with the current difficulty, party, and source selections preserved.

A working notification appears while monsters are loaded, encounters are generated, or a final roster is prepared. Wait for the next page rather than launching the builder again.

## Custom encounters

Choose **Custom Encounters**, verify the party and monster sources, then continue to the monster browser. Search and numeric filters appear first, with minimum and maximum CR paired together and minimum AC and HP paired beneath them. Creature type, size, terrain (when supplied by the source), and source values each cycle through Any, Include, and Exclude; source options appear at the bottom of the filter pane. Click a monster to open its Actor sheet, select the plus button to add it to the roster, and use the roster controls to change its quantity or remove it.

The live rating changes between **Easy**, **Standard**, **Hard**, and **Deadly** as total monster XP crosses the 2024 D&D encounter budgets. Encounters below the Moderate budget remain Easy; Standard begins at Moderate, Hard begins at High, and Deadly begins at 150 percent of High. The 2024 rules do not apply a multiple-creature XP multiplier. The builder shows progress toward the next tier and the total XP represented by the roster. Custom encounters use the same budgets and source access rules as generated encounters, but have no ten-creature cap. The GM controls the roster size.

Select **Generate Encounter** when the roster is ready. The final screen uses the same draggable Actor links as generated encounters.

## Saved encounters

On any final encounter screen, select **Save**, enter a name in the Save Encounter dialog, and choose **Save** or **Cancel**. A blank name is not accepted. Saving leaves the final roster open.

Choose **Saved Encounters** in the encounter type selector, review the encounter cards, select one, then choose **Generate Encounter** to open its final roster. The cards use the same monster presentation as generated suggestions. Monster buttons open Actor sheets; previews have no reroll controls and cannot be dragged onto the scene. Expand GM encounter details when available. The saved roster, quantities, and GM notes are preserved without regenerating the encounter.

Saves belong to the current world and use private Journal Entries accessible to GMs; rename or delete those entries in Foundry's Journal directory to manage the list. Saves retain Actor references, so their source content must remain available to open sheets or place tokens.

## Published Drakkenheim encounters

Drakkenheim Encounters requires eligible Champion access and both **Dungeons of Drakkenheim** and **Monsters of Drakkenheim** active. Select one available published table, including **Sewers**, then generate the encounter. The final page includes GM notes, rolled quantities, and resolved monster links. Published encounters follow their book tables rather than the random builder's XP budget.

## Drakkenheim rivals

**Rival Adventurers** randomly selects one of the book's four sample adventuring parties or five named Queen's Men gangs. The result includes the published description and resolved Actor links. Gang encounters suggest the documented leader with a rolled 1d6-bandit escort, labeled in the notes as a travelling group rather than the entire gang. All Drakkenheim encounters use Actors exclusively from **Monsters of Drakkenheim**. Ratlings resolve to **Ratling Warrior**, and aquatic delerium dregs resolve to **Deep Dreg Warrior**. Creatures without a MoD match are flagged as unresolved instead of using Actors from another source.

## Difficulty and XP budgets

The builder uses the 2024 D&D XP Budget per Character table. It adds each selected character's budget for the chosen difficulty, then selects creatures whose unmodified XP total fits the encounter composition. No 2014 multiple-creature multiplier is used.

No automated calculation can account for every battlefield. Surprise, battlefield layout, cover, hazards, tactics, magic items, depleted resources, unusual party composition, and monster synergies can all change the real difficulty. Treat the generated result as a strong starting point and review it before play.

## Variety across source books

Creatures with the same challenge rating often share identical XP values. Morelord Encounters randomizes across the full comparably suitable catalog, prefers creatures not already shown among the six suggestions, and balances choices across selected source books. Copies of the same named creature in different compendiums count as one choice for variety purposes.

When a module declares one source book, inconsistent source labels on its individual creatures are consolidated into one source selector. Constructed compendiums that genuinely declare multiple books remain selectable book by book.

Random Encounters limits generated rosters to ten creatures. If ten weak creatures cannot reach the difficulty target, it chooses tougher creatures rather than adding an unmanageable number of tokens.

## Selecting and placing an encounter

After selecting the desired alternative, choose **Select Encounter**. The final roster shows a draggable Actor link for each creature type.

- Click a monster link to open its Actor sheet.
- Drag the link onto the scene to create a token.
- Repeat the drag for the quantity shown.

The final roster also includes an optional **Roll Encounter Stealth** button. The roll uses the lowest Stealth modifier among the encounter's creatures. Compare the result with each character's passive Perception—or the party's highest passive Perception for a quick group check—to help determine whether the encounter begins as a surprise attack.

The module links directly to the installed compendium Actor, so the resulting token uses that source's statistics, artwork, items, and automation.

The final footer is ordered **Start Over**, **Save**, **Close**. Start Over returns to setup, Save opens the naming dialog, and Close dismisses the roster. Morelord Core remembers window position and size for the current world and user in this browser.

## Troubleshooting

### A source book is missing

1. Confirm its module is installed and active.
2. Confirm the Actor compendium is enabled in D&D 5e's source configuration.
3. Open Encounters Settings and select **Refresh**.
4. Confirm the Morelord account has Encounters Premium when using non-SRD sources.
5. Confirm the compendium contains eligible NPC monsters. A compendium containing only characters, vehicles, or non-hostile humanoids is intentionally omitted.

### Encounters seem repetitive

Confirm multiple sources are selected and regenerate the encounters. A narrow difficulty target may legitimately favor creatures at a small number of challenge ratings, but equal-rated alternatives from other selected books remain eligible.

### A creature cannot be dragged

Drag the Actor link on the final Monster Links page, not the simplified preview card. Drop it onto an active scene where the GM has permission to create tokens.

### Defaults did not change

Make the desired selections and choose **Save as Default** before closing the setup window. A confirmation notification appears when the world setting has been saved.

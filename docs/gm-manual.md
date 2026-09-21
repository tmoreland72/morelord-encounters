---
title: Game Master Manual
description: Install, configure, and use Morelord Encounters in a D&D 5e world.
slug: morelord-encounters/gm-manual
product: morelord-encounters
audience: game-master
version: 0.1.14
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

At the top, choose **Combat Encounters** for the established roster, published-table, and saved-encounter workflows. Choose **Guide Me Encounters** to create a non-combat scene from a few questions, including when you have not decided where it happens. Switching between these choices retains the selections on the current setup page.

Choose **Random Encounters** to generate six encounter suggestions, **Custom Encounters** to assemble a roster in the monster browser, **Drakkenheim Encounters** when that published content is available, or **Saved Encounters** to reuse a saved roster. Encounter Settings, Verify Party, and Encounter Source each appear in a Core section card, following Morelord Downtime's layout. Encounter type appears in the left column; difficulty appears on the right for Random Encounters.

For Random Encounters, choose the desired difficulty:

- **Easy** uses the 2024 D&D Low encounter budget.
- **Standard** uses the 2024 D&D Moderate encounter budget.
- **Hard** uses the 2024 D&D High encounter budget.
- **Deadly** is a Morelord extension at 150 percent of the 2024 High budget.

Select **Documentation** beside the Morelord Encounters title to open the shared Morelord documentation viewer.

### Verify Party

Select participating player-owned characters and character or NPC members of the primary party Group, including pets and summons without player owners. NPCs outside that party are excluded. Saved selections are preserved; select newly added companions explicitly.

The selected character levels determine the base XP target. Each selected NPC adds its XP value (falling back to CR-derived XP) to every difficulty budget, after the Deadly multiplier on character budgets. NPC cards show CR and their XP contribution. This is an estimate, not an official NPC-to-character conversion; deselect companions that will not fight. Review the party before generating whenever attendance or levels have changed.

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

## Guided non-combat situations

This workflow is included in the development workspace and is not yet released.

Choose **Guide Me Encounters**, then answer as many of these questions as you need:

- **Where could this happen?** Choose a road, forest, city, dungeon, coast, mountains, swamp, or desert. **Choose for me** selects a setting during generation.
- **What will the party do?** Choose conversation, investigation, rescue, an obstacle, or discovery; **Surprise me** chooses one.
- **What should this add to the story?** Reveal information, introduce a contact, offer assistance, or present a difficult choice.
- **How much pressure should there be?** Low emphasizes time and inconvenience; Moderate adds costs in trust or resources; High includes a deadline of three meaningful attempts. Suggested DCs begin at 10, 13, and 16 respectively and remain editable.
- **Connect it to your campaign.** Optionally name an existing concern, person, faction, or destination. This text shapes the reward or follow-up; it does not look up campaign documents automatically.

Select **Generate Situation**. No party or monster sources are required. The offline library contains 40 original situations, generated locally without an AI service.

The library has eight distinct situations in each of the five interaction types. Every situation can be placed in any offered setting; changing the setting adapts the location rather than creating a different plot. New situations include specific follow-up hooks and story-specific high-pressure deadlines.

Guide Me remembers the situations generated in this browser's Foundry client, including across closing the builder and refreshing. It selects unused situations matching your interaction choice first, then the least recently used eligible situation. Changing the setting or purpose does not reset this history. **Surprise me** draws from all 40 situations. Clearing browser storage resets this local history. Reopening a saved scene preserves its text and does not consume another situation; **New Scene** creates a fresh draft using the history.

The result includes the opening, GM truth, motivations, possible approaches, optional checks, pressure, success, setbacks, consequences of walking away, and rewards or campaign connections. These are preparation aids: checks do not automatically request rolls, apply damage, or change world resources. Sound plans, useful equipment, and suitable spells can resolve a situation without a roll. A failed check need not lead to combat.

Expand **Edit this scene** to revise the title, summary, or any section. Changes immediately update the displayed scene. **Save** preserves the edited result as a private world Journal snapshot. Reopen it from **Combat Encounters → Saved Encounters**; it opens exactly as saved, without generating a new scene. Saving again creates another snapshot.

**New Scene** replaces the current draft with another situation using the original answers; save anything you want to keep first. **Start Over** returns to setup with your current configuration. **Save as Default** on setup remembers the mode and guided answers for the next launch. These scenes have no monster roster or XP rating.

## Generated encounter styles

Select **Generate Encounters** to build six alternatives:

- **Pack Skirmish** — several creatures that fight as a coordinated pack
- **Boss Battle** — one solo creature from the available XP tier closest to the party's difficulty target. Regeneration and the creature reroll keep that tier, varying the creature where alternatives exist. Equally close tiers favor the lower XP; reroll retains the current boss if no alternative exists at the chosen tier. A limited source catalog can still leave a large gap between total and target XP.
- **Boss and Minions** — a stronger leader supported by weaker creatures
- **The Horde** — up to ten weak creatures suited to area effects
- **Elite Team / Mirror Team** — a distinct group of individually selected opponents
- **Random** — an intentionally unpredictable mix

The first encounter is selected by default. Click anywhere in another encounter section to select it.

Each simplified creature card shows its image, quantity, name, challenge rating, and source. Use the external-link button to open its native Foundry Actor sheet. Use the rotate button to replace only that creature with an eligible same-XP alternative, preserving quantity. If none is available, the creature remains unchanged.

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

Morelord Encounters chooses the closest available XP tier before randomizing creature names and balancing source books. Pack (4–7), Horde (8–10), and Random (2–6) choose quantities by total XP fit. Boss and Minions uses a fixed leader target and 3–5 minions; mixed groups account for XP already assigned when filling remaining slots. With unchanged party, difficulty, and catalog, regeneration preserves each style's total XP. Creature rerolls preserve XP and quantity; if no eligible same-XP replacement exists, the creature remains unchanged. Limited catalogs may require repeated creatures or leave a gap from the target. Copies of the same named creature in different compendiums count as one choice for variety purposes.

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

### Guide Me variety regression

The opt-in `runGuidedEncounterTests()` development suite also generates eight social situations across separate builder sessions, checks that none repeats early, and verifies oldest-first reuse on the ninth. It checks that opening a saved scene does not advance the local history. The suite restores its settings and removes only its temporary journal.


## Encounter Stories (Premium)

The builder has three choices: **Combat Encounters**, **Guide Me Encounters**, and **Encounter Stories**. Guide Me is for a simple Minor Encounter taking two hours or less, often much less. Encounter Stories organize adventures normally completed within one session of up to four hours. Select the participating party before opening the story library; Verify Party remains available in each story and its difficulty labels update when the selection changes.

**Brother's Keeper** is the first template: an original fantasy travel adventure. Use the included card’s copy icon (shown when no copy exists) to create a private world journal with seven GM pages and a prepared roster containing two Hill Giants from the installed **D&D Monster Manual** (`dnd-monster-manual.actors`). It never substitutes SRD or other books. The module includes original prose and creature references, not redistributed Monster Manual statistics or art. Missing Monster Manual content blocks creating that template and explains the requirement.

**Open Journal** opens the native journal. Use the library card’s pencil icon to enter story editing; **Edit Journal** opens its native editor. Edit text, add pages, and gather scattered notes with links to existing Journals, Actors, and Scenes. The card’s copy icon creates independent pages and roster snapshots, retargets links between its own journal pages, and resets the copy to GM-private ownership. Source compendium Actors remain shared references. Editing those source Actors is different from editing the story's roster. Keep player handouts in separate documents.

The card’s pencil icon opens **Story details** to change the title, summary, category (Fantasy or Eldritch Horror), expected duration, continuation label, and hoard profile. Campaign, region, and plane are not displayed or requested. **Done Editing** returns to the reading view. Durations above four hours are labeled as potentially continuing across sessions. Save Story Details does not overwrite journal prose or rosters.

**Prepare Combat** opens the existing linked Actor roster. Drag the displayed quantity onto the GM's chosen map and name the giants Mogg and Brugg. Opening the story does not create Actors, tokens, a map, or combat. The XP difficulty uses the selected party's current levels and companion estimates; terrain, escape routes, and resource depletion remain separate GM considerations. No party selection means no difficulty rating.

In story editing, the combat card’s pencil icon opens Combat Encounters' source/party setup and custom builder with the current roster already selected. Accepting the custom roster saves it to this story copy. Closing the setup or custom builder cancels without changing the story. **Add Combat Encounter** adds another prepared roster. Revise the journal's tactics and treasure profile after changing its creatures. **Create a Story** starts a blank journal with prompts and no required combat encounters.

**Open Craftworks Hoard** opens the existing Craftworks review-and-award workflow at the story's chosen profile (initially Challenge 5–10 for the brothers). Nothing is rolled or awarded automatically. An already-open hoard is brought forward without discarding its work. Craftworks is optional for Encounters generally and required for this hoard action; the story remains readable without it. Craftworks must finish initializing and have its required item sources enabled. Record completed awards in the GM notes: this version does not synchronize award status or maintain a second treasure inventory.

Premium access is required for story creation, duplication, combat preparation/editing, metadata editing, and the story's hoard action. Existing journals remain readable and retain their native editing permissions after access expires. No campaign documents are deleted. Journeys can use the premise as a Discovery manually; automatic Discovery integration is not implemented.

The library follows Core’s list layout: **+ Create a Story** at the left above the cards, and copy/pencil icon buttons at each card’s upper right. Opening a card shows its reading/preparation view without story edit or duplicate controls.

**Read aloud** callouts contain only player-safe description or dialogue. GM motives, clues, checks, and staging instructions stay outside them. Native journal titles supply navigation; generated content no longer repeats them as headings. Existing stories receive a targeted presentation repair when opened: unchanged seed paragraphs are updated, custom prose and pages are preserved, and no page is deleted.

### Story regression test

In a development world, as a Premium GM with Monster Manual and Craftworks loaded, close Encounters and Hoard windows, then run:

```js
const { runEncounterStoryTests } = await import("./modules/morelord-encounters/scripts/testing/encounter-stories.mjs");
console.log(await runEncounterStoryTests());
```

The test creates private disposable stories, checks independent duplication and journal edits, verifies custom-builder cancel/save behavior and party-dependent difficulty, and opens the Craftworks hoard without rolling or awarding it. It removes its fixtures and restores changed encounter-source settings.

The story regression also reproduces the former duplicate journal heading, verifies its repair without losing a custom GM note, checks player-safe callouts, and verifies that authoring controls live on library cards rather than the reading view.

---
title: Game Master Manual
description: Install, configure, and use Morelord Encounters in a D&D 5e world.
slug: morelord-encounters/gm-manual
product: morelord-encounters
audience: game-master
version: 0.4.0
foundry: 14
order: 10
---

# Morelord Encounters: Game Master Manual

## Requirements

- Foundry Virtual Tabletop v14
- D&D 5e system 5.3 or later
- Morelord Core 0.7.0 or later
- GM permission in the world

Morelord Encounters uses monster Actor compendiums supplied by D&D 5e and installed content modules. It does not download or duplicate monsters from books the world does not have installed.

## Installation

Install the module with this manifest URL:

`https://raw.githubusercontent.com/tmoreland72/morelord-encounters/main/module.json`

Enable both **Morelord Core** and **Morelord Encounters** in the world.

## Content access

Open **Game Settings → Configure Settings → Module Settings → Morelord Encounters → Configure Encounters** to review account access.

- **Encounters Standard** licenses SRD compendiums. The badge reads **Available** when the license is active and **Not enabled** until Encounter Source selects one of those books. It reads **Enabled** (orange) only while a Standard book is selected. **Access Required** means the license is missing.
- **Encounters Premium** licenses core and third-party monster books the same way. A license never adds a compendium to the monster pool by itself.

dnd5e's **Configure Sources** is the primary compendium filter, read through Morelord Core. A pack that is unchecked there is not listed in Encounter Source, is not offered by a tier, and is never used as a fallback. An open Encounter Source list, Monster Sources badges, and a custom monster list refresh when that setting changes. Encounter Source is a second filter inside that set. Actors stored only as references to a disabled pack, including `dnd5e.monsters`, are skipped instead of resolving to that pack. A full stat block that lives in a selected compendium is used even when its printed book is older than 2024; the card names the selected compendium.

Use **Manage Account** to open Morelord Core account management. Use **Refresh** after changing product access or installing new content.

## Opening the encounter builder

Open **Morelord Tools** in the scene controls and select the hydra button, **Morelord Encounters**, to open **Configure Encounter**. The button is visible to the GM only. Players with no other Morelord tools do not see the Morelord Tools control.

### Encounter Settings

At the top, choose **Combat Encounters** for the established roster, published-table, and saved-encounter workflows. Choose **Guide Me Encounters** to create a non-combat scene from a few questions, including when you have not decided where it happens. Switching between these choices retains the selections on the current setup page.

Choose **Random Encounters** to generate six encounter suggestions, **Custom Encounters** to assemble a roster in the monster browser, **Drakkenheim Encounters** when that published content is available, or **Saved Encounters** to reuse a saved roster. Encounter Settings, Verify Party, and Encounter Source each appear in a Core section card, following Morelord Downtime's layout. Encounter type appears in the left column; difficulty appears on the right for Random Encounters.

For Random Encounters, choose the desired difficulty:

- **Easy** uses the 2024 D&D Low encounter budget.
- **Standard** uses the 2024 D&D Moderate encounter budget.
- **Hard** uses the 2024 D&D High encounter budget.
- **Deadly** is a Morelord Encounters extension at 150 percent of the 2024 High budget.

Select **Documentation** beside the Morelord Encounters title to open the shared Morelord Gaming documentation viewer.

### Verify Party

Select participating player-owned characters and character or NPC members of the primary party Group, including pets and summons without player owners. NPCs outside that party are excluded. Saved selections are preserved; select newly added companions explicitly.

The selected character levels determine the base XP target. Each selected NPC adds its XP value (falling back to CR-derived XP) to every difficulty budget, after the Deadly multiplier on character budgets. NPC cards show CR and their XP contribution. This is an estimate, not an official NPC-to-character conversion; deselect companions that will not fight. Review the party before generating whenever attendance or levels have changed.

NPC companions do not count toward party size for the creature-count cap. A ranger's beast, shown for example as **NPC CR 1, +200 XP estimate**, raises a four level-5 Moderate budget from 3,000 to 3,200 XP, and the cap stays at four creatures. Companions act with their character rather than adding another side in the turn order. Counting them as characters would allow still more monsters.

Use **Select All** or **Unselect All** to update the party checkboxes together. These controls affect only the party. Verify Party is hidden when reusing a saved encounter.

### Monster Sources

Select every monster source allowed for the encounter. Each selector shows:

- The source-book title
- The Actor compendium name
- A button that opens the underlying compendium for verification

Source discovery checks Actor compendiums that dnd5e **Configure Sources** leaves enabled. Character-only packs such as Starter Heroes, vehicle-only packs, empty packs, and unreadable packs are omitted. Non-hostile humanoid NPCs are excluded by the same rule used during generation. D&D 5e's **Monsters (SRD)** pack is labeled **System Reference Document 5.1**; its **Actors** pack is labeled **System Reference Document 5.2**. Those packs appear only when Configure Sources enables them. Actor-level legacy book names do not override these editions, and they do not pull a disabled system pack into the pool.

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

Select **Generate Situation**. No party or monster sources are required. The offline library contains 60 original situations, generated locally without an AI service.

The library has twelve distinct situations in each of the five interaction types. Every situation can be placed in any offered setting; changing the setting adapts the location rather than creating a different plot. New situations include specific follow-up hooks and story-specific high-pressure deadlines.

Guide Me remembers the situations generated in this browser's Foundry client, including across closing the builder and refreshing. It selects unused situations matching your interaction choice first, then the least recently used eligible situation. Changing the setting or purpose does not reset this history. **Surprise me** draws from all 60 situations; each specific interaction has twelve. Setting changes the staging location, not the underlying premise. Clearing browser storage resets this local history. Reopening a saved scene preserves its text and does not consume another situation; **New Scene** creates a fresh draft using the history.

The result includes the opening, GM truth, motivations, possible approaches, optional checks, pressure, success, setbacks, consequences of walking away, and rewards or campaign connections. These are preparation aids: checks do not automatically request rolls, apply damage, or change world resources. Sound plans, useful equipment, and suitable spells can resolve a situation without a roll. A failed check need not lead to combat.

Expand **Edit this scene** to revise the title, summary, or any section. Changes immediately update the displayed scene. **Save** preserves the edited result as a private world Journal snapshot. Reopen it from **Combat Encounters → Saved Encounters**; it opens exactly as saved, without generating a new scene. Saving again creates another snapshot.

**New Scene** replaces the current draft with another situation using the original answers; save anything you want to keep first. **Start Over** returns to setup with your current configuration. **Save as Default** on setup remembers the mode and guided answers for the next launch. These scenes have no monster roster or XP rating.

## Generated encounter styles

Select **Generate Encounters** to build six alternatives:

- **Pack Skirmish** — a coordinated group whose size, Challenge Rating, and creature change from roll to roll. Moderate encounters stay at or under the character count and at or under the XP budget. Creatures whose traits get stronger in numbers, such as a hag **Coven**, **Death Glare**, **Pack Tactics**, or an **Aura**, are left out of the pack.
- **Boss Battle** — one solo creature from the available XP tier closest to the party's difficulty target. Regeneration and the creature reroll keep that tier, varying the creature where alternatives exist. Equally close tiers favor the lower XP; reroll retains the current boss if no alternative exists at the chosen tier. A limited source catalog can still leave a large gap between total and target XP.
- **Boss and Minions** — a stronger leader supported by fewer weaker creatures, still inside the same creature cap and XP budget
- **The Horde** — exactly ten of one creature from the enabled sources. The party-size cap does not apply. Each roll chooses among the creatures at the highest Challenge Rating whose ten-fold XP still fits the budget, so the horde lands near that budget. If none fit, the style warns and does not change the count or mix creatures. Creatures whose traits get stronger in numbers are not used.
- **Elite Team / Mirror Team** — one rival per selected character, not counting companions. Each rival starts at the available Challenge Rating nearest that character's level (an equal tie uses the lower rating). Those ratings then step down together, one available rating at a time, until the total fits the XP budget. Each roll changes which creatures fill the resulting ratings. The count stays equal to the number of characters. The style warns only when even the lowest available ratings are still over the budget, and it still does not drop a rival.
- **Random** — an intentionally unpredictable mix inside the same cap and budget

The first encounter is selected by default. Click anywhere in another encounter section to select it.

Each simplified creature card shows its image, quantity, name, challenge rating, and source. Use the external-link button to open its native Foundry Actor sheet. Use the rotate button to replace only that creature with an eligible same-XP alternative, preserving quantity. If none is available, the creature remains unchanged.

These cards use Core's shared monster-card component, also used by Craftworks material sources. Encounters retains both its Open and Regenerate actions; source-reference cards in Craftworks offer Open only.

Select **Regenerate Encounters** to replace all six alternatives. Select **Start Over** to return to encounter setup with the current difficulty, party, and source selections preserved.

A working notification appears while monsters are loaded, encounters are generated, or a final roster is prepared. Wait for the next page rather than launching the builder again.

## Custom encounters

Choose **Custom Encounters**, verify the party and monster sources, then continue to the monster browser. Search and numeric filters appear first, with minimum and maximum CR paired together and minimum AC and HP paired beneath them. Creature type, size, terrain (when supplied by the source), and source values each cycle through Any, Include, and Exclude; source options appear at the bottom of the filter pane. Click a monster to open its Actor sheet, select the plus button to add it to the roster, and use the roster controls to change its quantity or remove it.

The live rating changes between **Easy**, **Standard**, **Hard**, and **Deadly** as total monster XP crosses the 2024 D&D encounter budgets. Encounters below the Moderate budget remain Easy; Standard begins at Moderate, Hard begins at High, and Deadly begins at 150 percent of High. The 2024 rules do not apply a multiple-creature XP multiplier. The builder shows progress toward the next tier and the total XP represented by the roster. A warning, not an error, appears when the roster has more creatures than characters or when group abilities (a coven, Death Glare, Pack Tactics, or an aura) are stacked. Custom encounters use the same budgets and source access rules as generated encounters, but have no ten-creature cap. The GM controls the roster size.

Select **Generate Encounter** when the roster is ready. The final screen uses the same draggable Actor links as generated encounters.

## Saved encounters

On any final encounter screen, select **Save**, enter a name in the Save Encounter dialog, and choose **Save** or **Cancel**. A blank name is not accepted. Saving leaves the final roster open.

Choose **Saved Encounters** in the encounter type selector, review the encounter cards, select one, then choose **Generate Encounter** to open its final roster. Each combat card shows the creature names and quantities. Monster buttons open Actor sheets; previews have no reroll controls and cannot be dragged onto the scene. **Delete Saved Encounter** on each card opens a confirmation with **Cancel** (default) and **Delete Saved Encounter**. Confirming deletes only that save. Encounters stays open and selects another available save. Already scheduled waves retain their snapshots, and creatures on the map remain.

Saved combat encounters contain only creature references and their saved quantities; descriptions, GM notes, XP summaries, and source-book details are omitted. Published rolled quantities are retained without rerolling. Older saves display as rosters without rewriting their stored notes. Guided scenes retain their separate editable scene snapshots.

Saves belong to the current world and use private Journal Entries accessible to GMs; rename or delete those entries in Foundry's Journal directory to manage the list. Saves retain Actor references, so their source content must remain available to open sheets or place tokens.

## Published Drakkenheim encounters

Drakkenheim Encounters requires eligible Champion access and both **Dungeons of Drakkenheim** and **Monsters of Drakkenheim** active. Select one available published table, including **Sewers**, then generate the encounter. The final page includes GM notes, rolled quantities, and resolved monster links. Published encounters follow their book tables rather than the random builder's XP budget.

**Living Ruin** uses the book's **Living Ruins** description. Both the Inner City and Sewers results offer **Animated Delerium Sludge**, **Entropic Flame**, **Living Deep Haze**, and **Walking Delerium Geode**, all CR 5 adventure creatures. Choose the type appropriate for the area and use the source quantity; the four links are alternatives, not four separate groups. **Hooded Lanterns Scouts** uses **Hooded Lantern Patrol**, including its Scout and Urban Ranger links. Each description stops at the next encounter; **Haze Haunt** contains only its own Warp Witch encounter. Creature links match the full stat-block name, so a Haze Wight does not add an ordinary Wight.

Some results intentionally have no creature links: becoming lost, arriving at a location, **Double Trouble** (follow its instructions to roll twice), and an explicit **None** on the Special Outlaw Members table. These retain their source instructions without monster-drag help.

## Drakkenheim rivals

**Rival Adventurers** randomly selects one of the book's four sample adventuring parties or five named Queen's Men gangs. The result includes the published description and resolved Actor links. Gang encounters suggest the documented leader with a rolled 1d6-bandit escort, labeled in the notes as a travelling group rather than the entire gang. Drakkenheim encounters prefer **Monsters of Drakkenheim**, then other official Drakkenheim sources and installed D&D core compendiums that dnd5e Configure Sources still enables. System SRD packs are consulted only when that setting leaves them enabled. Ratlings resolve to **Ratling Warrior**, aquatic delerium dregs to **Deep Dreg Warrior**, Garmyr to **Garmyr Warrior**, and The Lord of the Feast to **Lord of the Feast**. Manticore and other core creatures remain available without a MoD version. Adventure-only NPCs retain their original imported Actor when available; import the official adventure NPCs if neither a supported compendium nor the original world document resolves. Unavailable creatures are explicitly reported. The Drakkenheim selector is labeled **Encounter Location**, while other modes retain **Encounter Source**.

## Difficulty and XP budgets

The builder uses the 2024 D&D XP Budget per Character table. It adds each selected character's budget for the chosen difficulty, then each selected companion's XP, and keeps the unmodified creature XP total at or under that budget when a group can do so. No 2014 multiple-creature multiplier is used.

Creature count is capped from the number of player characters, not from companions. Easy and Moderate stay at that character count. Hard may add two creatures. Deadly may add four, and no generated roster exceeds ten. The Horde is an exception to that cap: it is always ten of one creature at the highest Challenge Rating that fits ten times, and it warns only when no enabled creature fits. Elite Team keeps one creature per character and lowers those Challenge Ratings evenly until the roster fits the XP budget. It warns only when the lowest available ratings still do not fit. Group traits are read from the creature's own features. Packs and hordes omit creatures that get stronger in numbers. A warning calls out a coven of three or more, or two or more creatures with Pack Tactics, Death Glare, or an aura.

No automated calculation can account for every battlefield. Surprise, battlefield layout, cover, hazards, tactics, magic items, depleted resources, unusual party composition, and monster synergies can all change the real difficulty. Treat the generated result as a strong starting point and review it before play.

## Variety across source books

Morelord Encounters chooses creatures from the selected sources only. Boss Battle still uses the closest XP tier. Pack, Boss and Minions, and Random vary how many creatures appear and which Challenge Rating fills the budget, while staying inside the character-count cap. The Horde stays at ten of one creature from the highest Challenge Rating that fits. Elite Team stays at one rival per character, starting near each character's level and stepping those Challenge Ratings down evenly until the team fits the XP budget. Regeneration can therefore change a pack's size and creature. Creature rerolls preserve XP and quantity; if no eligible same-XP replacement exists, the creature remains unchanged. A reroll will not turn a group into creatures whose traits stack. Limited catalogs may require repeated creatures or leave a gap from the target. Copies of the same named creature in different compendiums count as one choice for variety purposes.

When a module declares one source book, inconsistent source labels on its individual creatures are consolidated into one source selector. Constructed compendiums that genuinely declare multiple books remain selectable book by book.

Random Encounters limits generated rosters to ten creatures, and to fewer than that when the party is smaller. If the cap cannot spend the whole XP budget, it chooses tougher creatures rather than adding an unmanageable number of tokens. If every selected source is disabled or empty, the builder warns and does not fall back to a system SRD pack.

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
4. Confirm the Morelord Gaming account has Encounters Premium when using non-SRD sources.
5. Confirm the compendium contains eligible NPC monsters. A compendium containing only characters, vehicles, or non-hostile humanoids is intentionally omitted.

### Encounters seem repetitive

Confirm multiple sources are selected and regenerate the encounters. A narrow difficulty target may legitimately favor creatures at a small number of challenge ratings, but equal-rated alternatives from other selected books remain eligible.

### A creature cannot be dragged

Drag the Actor link on the final Monster Links page, not the simplified preview card. Drop it onto an active scene where the GM has permission to create tokens.

### Defaults did not change

Make the desired selections and choose **Save as Default** before closing the setup window. A confirmation notification appears when the world setting has been saved.

### Guide Me variety regression

The opt-in `runGuidedEncounterTests()` development suite also generates twelve social situations across separate builder sessions, checks that none repeats early, and verifies oldest-first reuse on the thirteenth. It checks that opening a saved scene does not advance the local history. The suite restores its settings and removes only its temporary journal.

September 22, 2026 (UTC): this suite and `storyLibraryCheck` passed in Dev1 on Foundry 14.368 / D&D5e 6.0.3. The story check clicks each new template's actual copy control and verifies its private six-page journal, correct template ID, read-aloud content, and optional combat control, then deletes its fixtures. Run it before creating permanent copies of the three new stories. `tools/verify-encounter-library.mjs` runs both suites using `MORELORD_PLAYWRIGHT` (path to an installed Playwright `index.mjs`) and optional `FOUNDRY_TEST_GM` / `FOUNDRY_TEST_PASSWORD`. It verifies Dev1 before and after login and never switches worlds. Reports and 850px/360px dark-theme captures are in `test/in-game-reports/2026-09-22-encounter-library*`. Normal/narrow layout was inspected; full light-theme and 200% zoom review remain outstanding. These checks verify the software workflow, not a full tabletop playtest of each adventure.


## Encounter Stories (Premium)

The library includes three adventures alongside Brother's Keeper: **The Ninth Bell** (Eldritch Horror, 180 minutes), **The Ferry of Promises** (Fantasy, 150 minutes), and **The House That Kept Tomorrow** (Eldritch Horror, 210 minutes). Each supplies six private GM pages with read-aloud passages, clues, motives, multiple solutions, consequences, and a complete ending. These three require no creature pack and start without combat rosters. Add optional combat only if it serves your version. Optional Craftworks rewards begin at Challenge 0–4; follow each journal's reward conditions before reviewing and awarding anything. Included cards appear until a copy exists; open, edit, or duplicate that saved copy afterward.

The builder has four choices: **Combat Encounters**, **Guide Me Encounters**, **Encounter Stories**, and **Mass Combat**. Guide Me is for a simple Minor Encounter taking two hours or less, often much less. Encounter Stories organize adventures normally completed within one session of up to four hours. Select the participating party before opening the story library; Verify Party remains available in each story and its difficulty labels update when the selection changes.

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

## Mass Combat

**Alpha feature:** Mass Combat is available for testing and feedback. Its controls and behavior may change, and bugs may remain. Review attack previews before applying damage. This alpha designation applies to Mass Combat, not the other encounter types.

Published saved encounters use their saved rolled quantities for both the Saved Encounter creature total and wave deployment. For example, a saved roll of four creatures of one type and ten of another deploys fourteen creatures, without rerolling the roster.

Select the fourth encounter type, **Mass Combat**, in the existing Encounters window. Its controls appear below the encounter-type choices. There is no separate Mass Combat window: wave setup, NPC selection, attack review, and damage application stay inside Encounters. Core supplies the collapsible sections, cards, fields, actor selectors, and status badges. Use the existing Encounters documentation entry to read this manual; Mass Combat adds no Documentation button.

Mass Combat deploys complete saved combat rosters on their native initiative turns, then resolves ordinary NPC attacks in groups. Spawning creatures does not automatically attack. You choose the attacker type, target type, and weapon profile, review the GM-only result, and apply damage explicitly.

### First session: deploy four Skeletons and ten Zombies

1. Choose **Combat Encounters → Custom Encounters**, select your installed **Monster Manual** source, and build a roster of **4 Skeletons** and **10 Zombies**. Choose **Save** and name the encounter **Undead Reinforcements**. Saving a roster does not deploy it.
2. Open the square-grid scene for the battle, add starting participants to a native Foundry combat, and select that combat in the tracker. Prepare the wave before starting combat.
3. Select **Mass Combat** in Encounters. Under **Add a wave**, choose **Undead Reinforcements** in **Saved Encounter**. The label shows **14 creatures**. Keep **Roster Multiplier** at 1 and set **First Spawn Round** to 3, **Total Spawn Rounds** to 2, and **Skipped Rounds Between Spawns** to 1. Choose **Add Wave**.
4. Foundry now has a GM-only **Wave: Undead Reinforcements** initiative entry. Its initiative is rolled using the first saved creature's native initiative. **Scheduled waves** shows the initiative and **14 creatures per deployment**.
5. Start combat and advance native turns normally. The wave does not arrive on its turn in rounds 1 or 2. When its turn comes up in round 3, all fourteen creatures appear at the map edges. Round 4 has no arrival; round 5 brings fourteen more on the same wave initiative.
6. Each arrival posts a GM-only **Wave deployed: Undead Reinforcements** chat card describing the round, initiative, quantities, arrival number, and next scheduled round or completion. Review placement against walls and terrain.

The fourteen physical creature tokens have independent HP. This roster uses two shared mob turns, one for Skeletons and one for Zombies. New mob turns inherit the wave's initiative, and Foundry moves to the first new mob so it can act. Later arrivals join an existing type's turn and retain its initiative. Player characters keep their separate turns. After the final arrival, the scheduler entry is removed; the deployed mobs remain.

For a wave starting on round 1 with **Skipped Rounds Between Spawns** 1, eligible rounds are **1, 3, 5, 7**, and so on. A new round alone never deploys a wave: its own initiative turn must also become active. Missed turns do not cause an arrival on an off-cadence round. Repeating a turn or rewinding the tracker does not duplicate an arrival.

### Resolve a mob attack

1. On a mob's turn, **Attacker Type** defaults to that mob. Otherwise the first living deployed mob is selected. Change it if needed.
2. Choose **Target Type**. Both dropdowns contain living NPC creature types on this scene, with living counts. Player characters and wave scheduler placeholders are never listed. The attacker type is excluded from target choices. No map selection or targeting reticles are needed.
3. Choose **Attack Targets**. The attacker group is remembered automatically. The **Mass Combat — Group Attack** review appears inside the same Encounters window. Choose the weapon or ability in **Attack** to load its options.
4. Check **Attack name**, **Attack bonus**, **Attacks per troop**, **Average damage per hit**, **Average critical damage**, **Damage type**, **Attack rolls**, and **Magical weapon damage** against the intended weapon. Suggestions come from the first attacker. Use separate batches for different weapons or modifiers.
5. Expand **Target order: finish one before moving on**. Choose **Resolve attacks** and review the GM-only chat preview. No HP changes during preview.
6. Choose **Apply Damage** in the same Encounters panel to accept that result. **Cancel** dismisses an attack review without applying damage.

Ten living Zombies with **Attacks per troop** 1 make up to ten attacks. They focus on the first target until it falls; only later attacks move to the next. Killing-blow excess damage is lost. Once all selected targets fall, unused attacks stop. Dead members are excluded. Change **Target Type** for the next group, or **Attacker Type** for a different mob.

### Wave fields and actions

| Field | Accepted values/default | Effect |
| --- | --- | --- |
| **Saved Encounter** | Saved combat roster containing creatures; initially unselected | Copies its complete roster on **Add Wave**. The label shows the unmultiplied count. Guided non-combat encounters are excluded. |
| **First Spawn Round** | Whole number 1–10000; default 1 | First eligible round for this wave's initiative turn. |
| **Total Spawn Rounds** | Whole number 1–100; default 1 | Maximum number of complete roster arrivals. |
| **Skipped Rounds Between Spawns** | Whole number 0–9999; default 0 | Complete rounds with no spawn between scheduled spawns. 0 spawns every round; 1 spawns on alternate rounds. Existing schedules retain their timing. |
| **Roster Multiplier** | Whole number 1–100; default 1 | Fixed scale applied to each saved creature quantity on every spawn. It never compounds between spawns. Maximum 200 creatures per spawn. |
| **Wave to Remove** | Existing wave; first selected initially | Selects the schedule removed by **Remove Wave**. |

**Roster Multiplier example:** a saved roster of 4 Skeletons and 10 Zombies contains 14 creatures. A multiplier of 3 spawns 12 Skeletons and 30 Zombies (42 creatures) each time. With **Total Spawn Rounds** 3, all three spawns contain 42 creatures, for 126 creatures in total. It does not spawn 42, then 126, then 378. **Total Spawn Rounds** controls how many spawns occur; **Roster Multiplier** controls the size of each spawn.

**Add Wave** saves a snapshot and creates its native initiative slot. Later edits/deletion of the original saved encounter do not change the snapshot. **Scheduled waves** shows the full creature count, initiative, start round, interval, and completed/total arrivals. Missing Actor sources must be restored before deployment.

**Remove Wave** cancels future arrivals and removes its scheduler slot; it retains deployed tokens, mob turns, imported Actors, and the original saved encounter. Finish pending deployment before adding or removing waves.

Adding the first wave to an empty schedule enables automatic deployment, including after a previous combat ended. Adding another wave to an existing paused schedule keeps that schedule paused. A round-one wave deploys on its own initiative turn, including when it is the first turn of combat. **Pause Wave Turns** stops automatic deployment without deleting schedules. **Enable Wave Turns** resumes future eligible wave turns; it does not advance the tracker or spawn immediately. **Resume Wave** appears only for an interrupted batch and finishes missing tokens, mob turns, and its chat card without duplicating completed work.

### Attack fields and actions

| Field | Accepted values/default | Effect |
| --- | --- | --- |
| **Attacker Type** | Living NPC types; active mob, otherwise first deployed living mob | All living tokens of this type attack together. Defaults follow the active mob turn. |
| **Target Type** | Other living NPC types; first eligible type | Supplies the ordered target tokens. Player characters are excluded. |
| **Attack** | Native attack and saving-throw activities from the first living attacker; remembered activity when available, otherwise first available; **Manual attack** fallback | Selecting a weapon or ability updates its fields immediately. For example, choose Longbow or Shortsword to load that activity’s native attack bonus, average damage, and damage type. |
| **Attack name** | Text; suggested weapon name when available, otherwise blank | Labels the shared profile. |
| **Attack bonus** | Attack-roll activities only; whole number −100–10000; native suggestion when available, otherwise required | Added to attack d20s; include situational modifiers manually. |
| **Attacks per troop** | Attack-roll activities; whole number 1–20; native Multiattack count when unambiguous, otherwise 1 | Defaults to a directly named/linked repeated-weapon Multiattack count when unambiguous, otherwise 1. Edit for optional or mixed attacks. Maximum 500 attack or saving-throw rolls per batch. |
| **Uses per troop** | Saving-throw activities; whole number 1–20; default 1 | Each living attacker uses the selected ability this many times. Each affected living target makes a native save for each use. |
| **Save ability** | Saving-throw activities only; ability allowed by the selected native activity | Chooses the shared save ability. Each target uses its own native saving throw bonuses and applicable modifiers. |
| **Save DC** | Saving-throw activities only; whole number 1–10000; native activity DC when available | A total equal to or higher than the DC succeeds. |
| **Damage on successful save** | Saving-throw activities only; **No damage**, **Half damage**, or **Full damage**; native activity rule | Sets the successful-save damage before each target’s native defenses. A failed save uses full damage. |
| **Target coverage** | Saving-throw activities only; **Every selected target per use** or **Limited targets per use**; area templates default to every target | Every-target mode affects the whole selected target group for each use. Limited mode works through living targets in scene token order. |
| **Targets per use** | Limited-target saving-throw activities only; whole number 1–200; native target count when available, otherwise 1 | Caps living targets affected by each use. Hidden and ignored in every-target mode. |
| **Average damage on failed save** | Saving-throw activities only; whole number 0–10000; native average when available | Base damage before successful-save scaling and per-target defenses. |
| **Saving throws** | Saving-throw activities only; **Normal (native modifiers)**, **Advantage**, or **Disadvantage** | Uses native D&D5e saves, including each target’s bonuses and applicable native modifiers; combines those rolls into one private group result. |
| **Average damage per hit** | Whole number 0–10000; suggested when available, otherwise required | Fixed damage for normal hits. |
| **Average critical damage** | Attack-roll activities only; whole number 0–10000; native suggestion when available, otherwise required | Fixed damage for natural 20s. |
| **Damage type** | Installed D&D5e types; suggested when available, otherwise slashing | Used by native per-target defenses. |
| **Attack rolls** | **Normal (native modifiers)** (default), **Advantage**, **Disadvantage** | One d20 or the higher/lower of two. |
| **Magical weapon damage** | Checkbox; suggested when available, otherwise off | Supplies the magical weapon property. |

**Attack Targets** prepares an attack review using the dropdowns. Before Foundry starts round one, Mass Combat consolidates participating living NPC types into one native tracker turn each, including a group acting first in initiative. This is generic for every NPC type, including manually placed groups. Before combat starts the highest existing initiative for each type is retained; during combat its current representative is preserved. Four Veterans share one turn and four Recruits share another; individual token HP and PC turns are preserved. The review opens visibly even if an earlier review was collapsed; **Cancel** returns to the controls. **Resolve attacks** creates a compact preview showing targets hit out of the target group, total hits, creatures killed (reduced to zero HP), and total actual damage to HP and temporary HP after defenses. Individual target HP lines are omitted; detailed results remain stored internally for application and recovery. Preview figures are projected until applied; **Apply Damage** commits it from the same GM and scene. The last selected activity and edited profile are retained for the same attacker group. Activities with multiple damage types retain separate damage components for native resistance/immunity calculation. Saving-throw results summarize passed and failed saves, targets damaged, kills, and actual damage; the preview leaves HP unchanged until **Apply Damage**. Successful half damage combines with resistance and temporary HP through native D&D5e damage handling. For example, one attacker using an area ability once against ten targets rolls ten saves; four attackers using it once each can roll forty saves. Limited-target mode instead allocates the configured targets per use. No resources, spell slots, recharge, effects, or templates are consumed/applied automatically; select affected targets and manage those costs or riders as GM. With a preview pending, **Attack Targets** offers **Apply damage**, **Discard result**, or **Close Review** instead of rerolling. Its compact preview is displayed directly inside Encounters; there is no need to find it in chat. **Close Review** retains the pending preview; **Discard result** clears it without applying damage. Each preview belongs to one native combat. Previews from an earlier combat, deleted messages, and already-resolved results are cleared before a fresh attack; no additional damage is applied during cleanup. Interrupted application offers **Resume applying** and **Discard remaining work**. Discard keeps damage already applied. Changed HP, AC, defenses, or target identity blocks a stale preview: discard it and resolve again. Pending results survive refresh independently of Game Master's macros.

### Placement, recovery, and GM responsibilities

Waves arrive as visible hostile unlinked creature tokens in a three-square band around all four map edges, inset one square. Large footprints go first; existing footprints are avoided. Insufficient space stops deployment. Review walls, terrain, and reachability. Compendium creatures are imported as private world Actors and reused; those imports are retained.

Use one controlling GM/browser session. Another eligible GM can take over when that GM disconnects. Select the intended native combat if multiple combats use this scene; scene-unlinked combats are supported when their combatants belong to the scene. Ending or deleting combat immediately clears all wave definitions, wave initiatives, pending deployments, and pending attacks, and releases active attack reviews without switching tabs. Opening Mass Combat also clears a schedule bound to a missing combat. Saved encounters and creatures already on the map remain available. Add waves again for the next combat. Schedules and pending token IDs survive refresh. Use **Resume Wave** after an interruption rather than recreating a half-deployed wave manually. Each successful arrival creates only one GM chat card, including after recovery.

Closing Encounters does not stop scheduled arrivals. Choose **Pause Wave Turns** to stop them. Individual player-character attacks and attacks against PCs remain native sheet/turn workflows. Range, line of sight, cover, ammunition/resources, special riders, concentration, reactions, survival traits, death statuses, and defeated markers remain GM-controlled. A representative creature supplies a mob's tracker entry; manage its defeated marker while surviving members remain. Natural 1 misses and natural 20 hits. Native per-target resistance, immunity, vulnerability, thresholds, reductions, and temporary HP apply. Targets sharing linked HP are rejected. No player roll requests or generic cease-fire controls are added.

### Requirements and verification

Use the matching updated Morelord Core build; Game Master is optional. Waves require Foundry v14 and a square grid. Ordinary encounter generation retains D&D5e 5.3+ support; group attacks require 6.0.3+. Dev1 native initiative/cadence, shared turns, player exclusion, duplicate suppression, and arrival-card checks passed on Foundry 14.368 / D&D5e 6.0.3 through the isolated regression launcher. This describes unreleased module changes.


Combined attack and save: an imported item with one attack and an on-hit saving throw appears once in **Attack**. Resolve rolls attacks first and rolls the attached native save only on hits. A save with no damage is valid; it reports passed/failed saves without adding damage. First-hit-per-turn text limits the rider to one save per target in that batch. Non-damage effects (including contamination) remain GM-controlled. Keep a creature type’s full attack sequence in one batch; splitting it into batches repeats that first-hit limit. An unambiguous Multiattack description naming/linking that weapon supplies **Attacks per troop** automatically (for example, two blasts defaults to 2). Check or edit this field for optional attacks, replacements, and mixed-weapon routines; resolve different weapons in separate batches. Attached saving throws count toward the 500-roll limit and share the attack’s preview/application.

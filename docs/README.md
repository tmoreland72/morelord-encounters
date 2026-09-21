---
title: Morelord Encounters Documentation
description: Build monster rosters and guided non-combat situations in Foundry VTT.
slug: morelord-encounters
product: morelord-encounters
version: 0.1.14
foundry: 14
order: 0
---

# Morelord Encounters Documentation

Morelord Encounters is a Game Master tool for building D&D 5e encounters from monster compendiums already installed in Foundry Virtual Tabletop. Champion GMs with the official Drakkenheim modules can also generate published Drakkenheim encounters with GM descriptions and draggable Actors. It verifies the adventuring party, calculates a difficulty target where applicable, respects Morelord content access, and generates encounter compositions for the GM to review.

Choose Random Encounters, Custom Encounters, published Drakkenheim Encounters, or Saved Encounters. Party and monster-source lists offer Select All and Unselect All controls. Sources without eligible monsters are omitted, and the system SRD packs are identified separately as 5.1 and 5.2.

The unreleased **Guide Me Encounters** workflow adds non-combat situations, including when the setting is undecided. Answer optional questions about the setting, interaction, and story purpose, choose the pressure, and add a campaign connection. Edit the resulting scene's motivations, approaches, checks, and consequences, then save it alongside existing encounters. The initial library contains 40 original offline situations and needs no party or monster sources. **Combat Encounters** retains the established workflows and opens all saved encounters.

The final roster contains Actor links that can be opened for inspection or dragged directly onto the current scene. Its footer provides Start Over, Save, and Close. Saved encounters are private to GMs in the current world and can be reviewed as cards before reopening. The roster also offers an optional encounter Stealth roll using the lowest creature modifier.

## Choose a guide

- [Game Master Manual](gm-manual.md) — installation, account access, encounter setup, guided non-combat situations, generation, saved encounters, Drakkenheim rivals, Actor sheets, and scene placement.

These instructions describe the Morelord Encounters 0.1.13 development workspace, including the unreleased guided workflow, for Foundry Virtual Tabletop v14 and D&D 5e 5.3 or later, with Morelord Core 0.3.7 or later.

Guide Me offers 40 original situations and remembers recent choices in this browser to avoid repeats until matching options are exhausted. The [Encounter Story implementation notes](encounter-stories-design.md) describe the first editable journal-based story workflow and its remaining integration boundaries.

**Encounter Stories** is the third builder option for Premium GMs. Create an editable Brother's Keeper copy (core Monster Manual), or a blank story. Native journals hold prose and references; independent roster snapshots reopen in the Combat Encounters custom builder. The story's treasure action opens Craftworks Hoard for explicit GM review and award.

Encounter Stories uses a left-aligned **+ Create a Story** toolbar and top-right card copy/pencil icons. Story categories are Fantasy or Eldritch Horror; reading views omit campaign/region/plane metadata. Player-safe passages use **Read aloud** callouts, separate from private GM guidance.

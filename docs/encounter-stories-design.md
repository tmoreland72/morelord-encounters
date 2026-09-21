# Encounter Stories: first implementation

The third builder option is **Encounter Stories**, alongside **Combat Encounters** and **Guide Me Encounters**. Guide Me remains a simple Minor Encounter aid for two hours or less. Stories normally fit a session of up to four hours.

## Implemented

- Brother's Keeper: original fantasy travel adventure, with seven private GM journal pages, two core Monster Manual hill giants, and a Craftworks hoard action.
- GM-authored blank stories, native journal text/page editing and document links, editable story metadata, and independent duplicates with internal page links retargeted.
- Category is Fantasy or Eldritch Horror. Campaign, region, and plane are authoring reference rather than story presentation; legacy stored keys remain compatible. Longer durations are explicitly labeled.
- Multiple optional prepared combat snapshots per story. Edit Combat Encounter seeds the existing custom builder; cancellation preserves the saved roster. Difficulty follows the selected party through existing XP budgets.
- Premium authoring and preparation controls, with existing journals preserved and readable after access changes. Missing compendiums are explained without silently substituting SRD monsters.
- Craftworks' existing Hoard interface opens at the chosen profile, initially Challenge 5–10. Generation and award remain explicit GM actions. Existing open hoards are preserved.

## Deliberate boundaries

No automatic token deployment, map creation, initiative, player-roll requests, treasure award, or synchronized hoard history. The GM records awards in the story notes. Source Actors remain compendium references, not copied licensed content. Journal text is authoritative for narrative; metadata or roster changes never overwrite edited prose.

Journeys Discovery integration remains manual. A later integration can link a story journal UUID while leaving travel-time accounting in Journeys. No required dependency is added to Journeys.

## Source organization

The user-supplied Adaptable Encounters and Adventure Bundles PDFs informed the overview / playable scenes / alternate approaches / aftermath organization. The implemented story follows the user's giant-brothers premise and uses original text; it includes no copied PDF artwork or adventure prose.

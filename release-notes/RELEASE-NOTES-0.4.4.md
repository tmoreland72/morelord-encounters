# Morelord encounters 0.4.4

## What Changed

### Improvements

- Source-access badges now use Core's shared enabled/muted tones. Removed the redundant party-heading width/stretch rule after live comparison confirmed identical rendering in both themes at normal and narrow widths.

- Fixed source books missing on the first encounter-builder open until Encounters settings had been opened. The builder now refreshes Core account access before filtering sources.
- Added **Place Monsters** to final combat rosters, using the same native D&D 5e group placement flow as Tidy Sheets’ **Place Members**, with the roster’s full quantities.

- Mass Combat wave placeholders stay at the top of initiative without rolling. Enabled waves spawn at the beginning of eligible rounds and roll native creature-group initiative. **First Spawn Round** accepts positive values only and defaults to **1**. Legacy round-zero schedules migrate without deleting sources, deployed creatures, or counts.

- Mass Combat provides shared number steppers and concise field helpers, hides empty wave schedules, selects waves through cards, and includes a footer Close button. Custom rosters use **Save Encounter**.
- Optional **Show Group Attacks** appears after combat starts. **Attack Group** lists groups; **Attack Target** includes grouped and individual NPCs and PCs, preferring enemies by disposition. Attacks cycle across living targets before repeating instead of focusing one target until death.

- Added **Pause Wave** / **Enable Wave** for the selected card, **Pause All Waves**, and **Enable All Waves**. Paused cards remain selectable and show a badge, dashed border, and muted quantities. Recorded arrival dice are reused after interrupted deployment.

- Requires Morelord Core 0.9.4 or later. Update Core first, then refresh connected clients.

## Compatibility

- Verified on Foundry VTT 14.370 with D&D5e 6.1.1 in Dev1.

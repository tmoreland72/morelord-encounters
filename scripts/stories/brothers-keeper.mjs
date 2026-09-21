// Original Morelord adventure. Creature statistics remain in the licensed source pack.
export const BROTHERS_KEEPER = {
  id: "brothers-keeper", name: "Brother's Keeper", genre: "fantasy",
  durationMinutes: 180,
  continuation: false, summary: "Two arguing hill giant brothers offer a tempting bargain. The bullied brother's loyalty turns a treasure hunt into a dangerous confrontation.",
  sourceModule: "dnd-monster-manual", sourcePack: "dnd-monster-manual.actors", actorId: "mmHillGiant00000", actorName: "Hill Giant",
  combatName: "Mogg and Brugg", hoardProfile: "5-10",
  pages: [
    { name: "1. GM Briefing", paragraphs: [
      "A self-contained fantasy travel adventure. Place the brothers beside a road and their cave in a nearby hillside.",
      "Premise: the party overhears hill giant brothers quarreling. Brugg bullies Mogg and takes his food. Mogg offers the party Brugg's treasure if they help take him out in his cave. His grievance is genuine, but he is loyal to his brother and sees smaller travelers as food. Once the party is vulnerable inside, both giants may turn on them.",
      "Run time: about three hours, with a four-hour ceiling. Roadside argument and bargain: 30 minutes. Approach and reconnaissance: 30 minutes. Cave confrontation: up to 90 minutes. Treasure and aftermath: 30 minutes. If time is short, reveal the approach clues immediately and combine the treasure recess with the main chamber. Optional follow-up never prevents a complete ending this session.",
      "The betrayal is a possible outcome, not a cutscene the party must endure. Give clues before commitment. Honor successful reconnaissance, negotiations, precautions, withdrawal, and magic. Do not teleport Mogg behind the party or seal an exit they secured.",
      "Prepared combat: two hill giants from the installed core Monster Manual, represented initially by one roster entry with quantity two. Name their tokens Mogg and Brugg when placing them. Difficulty is calculated in Encounter Stories from the currently selected party, using the existing Encounters budgets. Confined space and blocked retreat can increase danger beyond that label.",
      "Treasure: one accumulated lair hoard through Morelord Craftworks, initially Challenge 5–10. It is not two individual loot rolls. Generate, review, and award only when the party gains access; a bargain or theft can earn access without killing either giant."
    ] },
    { name: "2. Brothers and Motives", paragraphs: [
      "Brugg, the older brother: possessive, impatient, and used to being obeyed. He calls the cave and everything inside it his. He wants food, an undisturbed resting place, and public acknowledgment that he is in charge. He assumes Mogg will side with family when outsiders become a threat.",
      "Mogg, the younger brother: resentful of humiliation, eager for a share of the hoard, and fiercely defensive of Brugg when strangers threaten him. He wants someone else to frighten Brugg, but he has not thought through the difference between a beating and a lethal attack. He readily rationalizes eating the party afterward.",
      "Mogg's conflicting motives should be visible. He complains in detail about Brugg but defends his strength. He answers Brugg's calls immediately. If the party explicitly discusses killing Brugg, he says, 'Nobody said kill.' If challenged about the bargain, he insists he only wants his brother made to stop.",
      "Neither brother needs to fight to the death. Brugg can accept a credible food bargain or withdraw if badly hurt and given an escape. Mogg may surrender to save Brugg, drag him toward safety, or plead for his life. If Brugg dies, Mogg first reacts with grief and rage; a later surrender or retreat remains possible. Use the actual battle and player choices rather than a mandatory script."
    ] },
    { name: "3. Roadside Argument", paragraphs: [
      { readAloud: "Beyond a low ridge, a deep voice bellows, 'Mine!' Something heavy strikes the ground. A second voice answers, 'You had yours!' Looking over the rise, you see one giant wrench a bulging sack from another and shove him into the mud. The victor lumbers toward a dark opening in the hillside. The other sits rubbing his shoulder." },
      "The party can remain hidden, approach, follow Brugg, or continue traveling. Mogg does not automatically detect observers. If they approach peacefully, he complains that Brugg takes the food, the shiny things, and the best sleeping place.",
      { readAloud: "Mogg leans closer. 'You make Brugg stop. His shiny things are yours. I just want what's mine.'" },
      "Mogg promises to lead them in while Brugg eats. He describes the treasure vaguely but is very specific about where visitors should stand.",
      "Essential clues require no check when the party engages: Mogg objects to talk of killing Brugg; he instinctively obeys his brother's shouted instruction; he becomes hungry and distracted while watching the party's smallest member. Use these behaviors, not a single secret roll, to signal danger.",
      "Optional checks: DC 13 Insight can clarify that the grievance is real but the promised alliance is unreliable. A concrete offer plus DC 13 Persuasion may persuade Mogg to call Brugg outside. A convincing food bargain or a clever plan may work without a roll. Failure changes the brothers' patience or the terms, rather than erasing clues or instantly starting combat.",
      "If the party walks away, let them. They may later hear that travelers are avoiding this stretch of road, but do not force another ambush simply to recover the planned encounter."
    ] },
    { name: "4. Approach and Cave", paragraphs: [
      { readAloud: "A heavy hide hangs across the cave mouth. Beside it rests a boulder taller than a person. Broad footprints churn the earth between gnawed bones and scraps of torn clothing. From within comes the smell of smoke and old meat." },
      "Use a map the GM chooses or theater of the mind. No map Scene is created automatically. A useful layout is a 15-foot-wide entrance passage leading into a roughly 45-by-35-foot main chamber with a high ceiling. A shallow treasure recess opens from the back wall. A narrow natural fissure connects a side wall to scrub outside.",
      "Entrance: giant footprints, a heavy hide curtain, and a boulder used as a windbreak. The boulder is initially beside the opening, not sealing it. Mogg must visibly move or occupy the passage to block retreat; apply normal movement, actions, and initiative if contested.",
      "Main chamber: Brugg eats beside a broad stone slab. Heaped bedding and stolen cargo provide cover and obstacles. Establish the actual distances and clear routes before combat. Neither brother can occupy the same space, and their size limits how they can maneuver around the slab.",
      "Treasure recess: mixed travelers' goods and a closed chest tempt visitors deeper inside. Its actual valuables are the single Craftworks hoard. Do not add a second automatic treasure award for the chest's description.",
      "Escape fissure: visibly small enough to exclude the giants. Describe a cool draft and daylight beyond loose brush when someone examines that wall. A Small adventurer can pass; a Medium adventurer may squeeze where appropriate to the chosen map and system rules. Establish any restrictions before the escape attempt.",
      "Approach clues: gnawed bones and discarded travelers' belongings are plainly visible near the entrance. Tracks show that both giants regularly enter and leave together. DC 13 Survival adds the observation that no recent chase drove Mogg out; DC 13 Investigation identifies where the boulder would obstruct the passage. Reconnaissance from outside can locate the fissure without entering through the front.",
      "Mogg encourages visitors toward the treasure recess while he stays near the entrance. If the party refuses that arrangement, respect it. He may become evasive or call Brugg rather than inventing a way to place himself behind them."
    ] },
    { name: "5. The Confrontation", paragraphs: [
      "Read the following only if the party enters on Mogg's terms. Give them a chance to react; the exchange grants neither giant a free attack or automatic surprise.",
      { readAloud: "Brugg looks past you. 'You brought supper?' Mogg hesitates at the entrance. 'They said they'd hurt you.' Brugg sets down what he was eating. 'Then mind the entrance.'" },
      "The turning point can instead be a demand for the treasure, a serious threat against Brugg, or an exposed deception. If the party already negotiated, separated the giants, restrained Mogg, or secured an exit, those preparations matter. Use the normal system rules to determine initiative and any surprise.",
      "Initial tactics: Brugg pressures the nearest immediate threat while Mogg tries to occupy the entrance. They use only the attacks and abilities on their linked Monster Manual Actors. The terrain warning is guidance, not an invented increase to CR or a creature-count XP multiplier.",
      "Adjusting the encounter: use the story card's Edit icon, then the combat encounter's Edit icon to reopen Combat Encounters' custom builder with the current roster. Changes update this story copy's roster only. If you change the creatures or numbers, revise these motives, staging notes, and treasure profile to match.",
      "Alternatives: meet both brothers outside; trade a substantial food supply for safe passage or selected goods; exploit their rivalry to separate them; steal the hoard without confronting them; retreat through the entrance or fissure. The GM adjudicates credible plans without requiring combat.",
      "If the party is overwhelmed, make genuine escape and surrender opportunities legible. A negotiated release costs an agreed resource or favor; it should not depend on the GM secretly undoing the players' successful precautions."
    ] },
    { name: "6. Craftworks Hoard and Aftermath", paragraphs: [
      "The brothers share one accumulated hoard. Open Craftworks Hoard from the story workspace; the starting profile is Challenge 5–10. Craftworks uses its enabled item sources and world settings to generate the treasure. The GM reviews the result, chooses a character or Group recipient, and explicitly awards it through Craftworks.",
      "Opening this story or its journal never rolls treasure or adds items to an Actor. If Craftworks is disabled or unavailable, retain the story and show the requirement; do not substitute fixed coin or an SRD loot table. If the roster changes, the GM can edit the hoard profile in story details before opening Craftworks.",
      "The hoard belongs to this lair, not to each giant separately. Before awarding, check the GM notes for a prior award. Record the recipient and award chat reference afterward. This first story version opens Craftworks' existing review-and-award workflow; it does not maintain a second treasure inventory or automatically synchronize award status.",
      "Victorious party: the cave can be made safe and stolen goods returned. Escaping party: the brothers remember the intrusion and may abandon the exposed cave. Negotiated outcome: record exactly what was promised and whether the brothers keep it. Ignored hook: travel continues without requiring pursuit.",
      "Optional follow-up: choose a caravan or contact already present in the GM's campaign and identify one of the ordinary recovered belongings as theirs. This is a GM-selected connection, not an additional magic item or a claim about a published chapter. Returning it can close the story or provide a later lead.",
      "End this session with the immediate danger and treasure access resolved. A return journey, unresolved promise, or surviving brother can support a future session only if the GM and party want to pursue it."
    ] },
    { name: "7. GM Notes and References", paragraphs: [
      "Collect your existing ideas here. Paste notes, add Foundry document links by dragging Journals, Actors, or Scenes into the native journal editor, and add additional pages as needed. Keep player-facing handouts separate from this private GM journal.",
      "Travel day and starting circumstances:", "Party decisions and promises:", "Chosen map or scene link:", "Changes to Mogg, Brugg, or the combat roster:", "Hoard generated / awarded, recipient, and chat reference:", "Outcome and optional follow-up:"
    ] }
  ]
};

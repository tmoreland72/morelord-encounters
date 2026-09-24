// Original adventures with complete non-combat resolutions; no creature pack required.
export const ADDITIONAL_STORIES = [
  {
    id: "the-ninth-bell", name: "The Ninth Bell", genre: "eldritch-horror", durationMinutes: 180,
    continuation: false, hoardProfile: "0-4",
    summary: "A bell rings from a tower with no bell, and empty houses begin answering. Discover who invited the listener beneath the village before the ninth reply.",
    pages: [
      { name: "1. GM Briefing", paragraphs: [
        "A three-hour investigation for any party, staged in a small settlement or inhabited ruin. No creature statistics, compulsory combat, or purchased source is required. Allow 25 minutes for arrival, 50 for investigation, 60 for the tower, and 45 for the decision and aftermath. For a shorter session, put the ledger and tuning diagram together in the bell keeper's workshop.",
        "Truth: bell keeper Mara used an old resonator to hear her missing brother. Something below the settlement answered with borrowed voices. It cannot leave its resonator, but each unanswered toll makes another empty building repeat conversations from the past. The ninth answer will make the settlement uninhabitable through relentless sound, not instantly kill or possess its residents.",
        "Use three visible stages: a house repeats a supper conversation; the well repeats names; windows hum throughout the square. Advance after a substantial scene spent delaying, never for asking questions or failing one roll. Tell players through Mara how much time remains. They can pause the progression by wrapping the resonator in the workshop's felt blankets.",
        "Tone: unsettling sounds, grief, and uncertain contact. Agree on comfort with impersonated loved ones before play. The listener never reads a player character's history without that player's agreement. Use Mara's brother for all borrowed voices if preferred."
      ] },
      { name: "2. Arrival and People", paragraphs: [
        { readAloud: "The empty bell tower rings once. Across the square, a shuttered house answers with the scrape of chairs and the laughter of a crowded dinner. Its windows are dark. The woman beside you whispers, 'That house has been empty for eleven years.'" },
        "Mara wants her brother back but values living neighbors more. She admits operating the resonator if someone describes the empty house without accusing her. She has heard three true childhood details and one impossible claim: her brother says the tower still has its bell, sold years before he disappeared.",
        "Caretaker Oren wants evacuation and has a wagon ready. He will help carry equipment if the party secures a quiet route. Apprentice Pell wants Mara spared public humiliation and has hidden her work ledger in the workshop, not destroyed it. Asking what Mara was trying to fix earns the ledger without a roll.",
        "The party may organize evacuation first. This protects residents and does not forfeit the investigation. Nobody locks the party inside or sabotages sensible precautions."
      ] },
      { name: "3. Three Routes to the Truth", paragraphs: [
        "Empty house: opening its door reveals cold, vacant rooms while sound comes from a copper pipe. Covering the pipe muffles the voices. DC 12 Investigation traces it toward the tower more quickly; failure costs a few minutes, and following the visible pipe still works.",
        "Workshop: the ledger plainly records the resonator's three parts: a listening cup, a name plate, and a tuning fork. Its diagram shows that removing the name plate closes the invitation. DC 13 Arcana explains why breaking the cup would release a deafening burst, so a controlled dismantling is preferable. Do not hide the shutdown instruction behind the check.",
        "Mara's testimony: the false memory about the sold bell proves the voice is assembling fragments. Oren confirms the sale date. DC 12 Insight helps distinguish Mara's hope from certainty but is not needed to persuade her to examine the contradiction.",
        "Any two locations provide both the tower destination and a safe shutdown method. If the party skips them all, Pell brings the diagram when the well begins answering. The mystery's cost is lost preparation, not a dead end."
      ] },
      { name: "4. The Listening Room", paragraphs: [
        { readAloud: "Copper tubes climb the tower walls like bare roots. At their center, a shallow cup trembles above a brass plate. A voice rises from it: 'Mara? Tell them not to make me alone again.' Beneath the words, you hear someone taking a breath that never ends." },
        "Layout: a 30-foot square ground room, an open stair to the bell platform, and an exterior maintenance door. The cup sits on a central workbench; the name plate slides out toward the door. Nothing blocks retreat. The upper platform is optional and holds the felt blankets and original tuning fork.",
        "Safe closure: wrap the cup, hold the fork against its marked bracket, and slide out the name plate. With the diagram and all three steps, no roll is necessary. Improvising insulation or a replacement tone may call for DC 13 Arcana or a suitable tool check; failure produces a shouted borrowed phrase and loosens a tube, revealing the marked bracket. Let the party change the approach.",
        "Negotiation: the listener wants new sounds, not bodies. It accepts a recorded song or an agreed hour of ordinary storytelling in exchange for releasing the invitation, provided the party first removes the name plate. It cannot promise to locate the missing brother. Mara may participate, but the party is never required to impersonate him.",
        "Smashing the apparatus ends the connection with a painful noise and damaged workshop, but residents already evacuated remain safe. Describe that risk before the blow. If optional combat is added through Add Combat Encounter, choose actual Actors and revise the fiction; the listener itself has no supplied combat statistics."
      ] },
      { name: "5. Ending and Reward", paragraphs: [
        "Closure: the pipes fall silent, and Mara distinguishes what she knows about her brother from what the listener claimed. She asks for help posting an honest missing-person notice. A bargain leaves a quiet cup that works only during explicitly agreed visits; the settlement can refuse further contact.",
        "If the party leaves or the final stage arrives, Oren evacuates the remaining residents. The noise keeps the square empty until the name plate is removed. Return visits remain possible; no unseen mass death punishes withdrawal.",
        "Reward: the community offers lodging and a repaired bell or ordinary tool as thanks. A locked workshop coffer contains the settlement's discretionary repair fund; only if the council explicitly grants it should the GM use one optional Craftworks Challenge 0–4 hoard, reviewed before award. Do not award both that hoard and an invented second cash payment. Opening the hoard is never required to finish the story.",
        "Follow-up: the original tuning diagram bears the mark of another listening station. This is an optional lead; the current connection is closed and this session has a complete ending."
      ] },
      { name: "6. GM Notes", paragraphs: ["Record evacuated residents, the shutdown or bargain terms, Mara's choices, any optional Actor roster, and the recipient of any reward. Keep player handouts separate from this private journal. Record whether the name plate was removed so the ending survives a later session."] }
    ]
  },
  {
    id: "the-ferry-of-promises", name: "The Ferry of Promises", genre: "fantasy", durationMinutes: 150,
    continuation: false, hoardProfile: "0-4",
    summary: "A ferry refuses to leave until an old promise is honored. Recover the real agreement, settle competing needs, and bring a stranded wedding party across without sacrificing the river's nesting grounds.",
    pages: [
      { name: "1. GM Briefing", paragraphs: [
        "A two-and-a-half-hour river adventure about negotiation and exploration, suitable for any party. No purchased creature source or required battle. Budget 20 minutes for the stranded landing, 40 for clues, 35 for the old mooring, 40 for the settlement, and 15 for the crossing. Shorten by having the ferryman carry the original contract fragment.",
        "Truth: an old river covenant lets the ferry travel safely if one reed island remains undisturbed during nesting season. The landing authority moved a mooring onto that island after a storm. The river's guardian has stopped the ferry's guide chain to enforce the agreement, but cannot control other boats or prevent flight and swimming.",
        "The immediate deadline is sunset, when a wedding party will miss its planned ceremony across the river. Missing it causes disappointment and rescheduling, not a curse. The party may bypass the ferry by any credible means; helping resolve the covenant remains a separate choice."
      ] },
      { name: "2. The Waiting Landing", paragraphs: [
        { readAloud: "The ferry floats a few feet from the landing, its guide chain taut as a bowstring. Every pull on the winch earns one clear note from the reeds. Behind you, a bride lifts her muddy hem and asks, 'Does anyone know whether a wedding can happen on the wrong side of a river?'" },
        "Ferryman Sen wants a safe crossing and admits moving the mooring, believing the island abandoned. Bride Ista cares more about her partner and elderly guests than the formal venue; she will support a practical compromise. Landing reeve Daro fears losing authority and initially blames a damaged winch, but accepts a solution that includes a public repair commitment.",
        "The guardian speaks through reeds when addressed politely. It says, 'A place to raise the small ones. That was the price.' It wants the island clear, not money or worship. It willingly describes what activity counts as disturbance.",
        "DC 12 Persuasion can get Daro to lend workers immediately; a failed check means Sen offers tools and the party must demonstrate the repair first. No check is required to hear the guardian or ask Ista what she needs."
      ] },
      { name: "3. Following the Agreement", paragraphs: [
        "The winch: inspection shows the chain is intact and held from the water, with reed stems braided around one link. Cutting it releases the ferry from guidance but leaves the crossing to ordinary boating skill. State the current and available rescue ropes before anyone cuts.",
        "The landing ledger: an old rubbing records the nesting promise and identifies a stone mooring upstream. The relevant lines are legible without a roll. DC 12 History explains that the covenant belongs to the public crossing, not Daro personally.",
        "The island: visible nests prove the birds have returned. Sen points out the recently installed post. A boat or a careful shore approach reaches a place from which the party can talk to the guardian without entering the nests. DC 13 Nature identifies a route that avoids even incidental disturbance; failure leads to a longer route, not destroyed eggs.",
        "All three clues point to relocating the mooring or suspending ferry use while arranging another crossing. If investigation stalls, the guardian names the upstream stone directly."
      ] },
      { name: "4. The Old Mooring", paragraphs: [
        { readAloud: "Above the bend, a stone ring juts from the bank. Flood debris leans against it, and a pale line on the rock marks how high the river rose. Across the water, the reed island rustles with hidden life." },
        "Layout: a stable bank path reaches the stone ring, twenty feet above the old landing along the river. A fallen branch traps debris against it. There is room to work from shore and an unobstructed retreat uphill. Use theater of the mind or a GM-selected map; no Scene is created.",
        "The ring remains sound. With ropes, tools, and time, the group clears it without a roll. Working before sunset under pressure may call for DC 13 Athletics to shift the braced branch or a suitable tool check to cut it safely. A failed attempt loses a rope into reachable shallows; use a pole or change the attachment point instead of repeating the same check.",
        "Choices: relocate the chain and remove the island post; arrange temporary ferry closure and hire ordinary boats; hold the wedding on this bank while workers repair the route. Flight, water magic, and other suitable abilities can solve transport immediately but do not automatically remove the covenant's ecological concern.",
        "Daro agrees if the repaired crossing remains public and the work is witnessed. The guardian releases the chain once the post is removed or a genuine closure is enacted. Neither requires humiliation, a hidden extra task, or combat. Optional hostile outsiders can use a roster the GM adds, but are not needed for the story's climax."
      ] },
      { name: "5. Crossing and Aftermath", paragraphs: [
        "Successful repair: the ferry moves, the guardian marks the safe mooring with flowering reeds, and Ista invites everyone to the ceremony. Alternative transport or a relocated wedding also completes the guests' immediate story. The agreement is written in plain language at both landings.",
        "If no agreement is reached, Sen suspends the ferry, Ista holds a smaller ceremony here, and Daro must arrange repairs later. The guardian does not pursue the party or harm the guests. The island remains protected.",
        "Reward: free future passage and a dependable contact at each landing. If the community also votes to grant the old ferrymen's service coffer, the GM may prepare one optional Craftworks Challenge 0–4 hoard and review its contents before award. The coffer is a single agreed reward, not treasure taken from nests or the guardian. Note the recipient to prevent a second award.",
        "Optional continuation: the ledger records another crossing whose covenant is due for renewal. The present ferry dispute ends today regardless of whether the party follows that lead."
      ] },
      { name: "6. GM Notes", paragraphs: ["Record the chosen crossing, covenant terms, wedding outcome, promised labor, and any reward recipient. If adding combat, record the actual Actor sources and review the selected party's difficulty before play. No actor deployment or treasure award happens automatically."] }
    ]
  },
  {
    id: "the-house-that-kept-tomorrow", name: "The House That Kept Tomorrow", genre: "eldritch-horror", durationMinutes: 210,
    continuation: false, hoardProfile: "0-4",
    summary: "An abandoned observatory serves breakfast for tomorrow's guests. Rescue its caretaker from a repeating rehearsal and decide what to do with a machine that mistakes predictions for promises.",
    pages: [
      { name: "1. GM Briefing", paragraphs: [
        "A three-and-a-half-hour exploration mystery for any party. Place the house beside a road, in a settlement, or among accessible ruins. No required creature pack, combat, or time-travel rules. Budget 30 minutes for arrival, 45 for exploring, 45 for reaching the caretaker, 60 for the machine, and 30 for the ending. Combine the dining room and workshop clues for a shorter session.",
        "Truth: a planning engine projects likely household routines. Caretaker Venn asked it to prepare for a reunion that was canceled. It now repeats preparations and keeps Venn's attention trapped in the rehearsal. He is physically present and can be led out. The projections cannot alter history, predict player choices reliably, or undo actions.",
        "The danger is a household unable to stop preparing: water runs, heating stones remain hot, and food spoils. Use three visible stages after substantial delays: overflowing sink, overheated kitchen, smoke at the pantry. Announce each change and leave the front door usable. Sensible shutdown of water and heat prevents those hazards while the mystery continues.",
        "Agree on the table's comfort with disorientation and repeated conversations. Do not steal a character's memories or narrate decisions for them. The engine's written forecasts are guesses the players are encouraged to contradict."
      ] },
      { name: "2. An Invitation Already Answered", paragraphs: [
        { readAloud: "The door opens onto a table laid for precisely your number. Steam rises from untouched cups. Beside each plate lies a card reading, 'Thank you for agreeing to stay.' Somewhere upstairs, a tired voice rehearses a welcome and begins again." },
        "The cards appear when visitors cross the threshold; the machine counts movement and supplies generic invitations. Guests can refuse, leave, or carry a card away. The front door never locks itself.",
        "Venn wants his scattered family to share one meal. He repeats preparations because the engine keeps telling him they are almost ready. Neighbor Sol wants him outside and offers a cart and blankets. Sol carries the family's cancellation letter but feels guilty for not delivering it sooner.",
        "Ask Sol what actually happened: flood damage interrupted travel and everyone is safe. No persuasion roll is needed. The letter is evidence of changed plans, not proof that Venn's family abandoned him."
      ] },
      { name: "3. Rooms That Give the Game Away", paragraphs: [
        "Dining room: the engine predicts a guest will break a cup. Leaving the cup untouched causes the forecast to fade and be replaced. This openly demonstrates that outcomes are not fixed. DC 12 Investigation identifies pressure plates that count arrivals; failure still reveals them when a chair is moved.",
        "Kitchen: visible valves stop the water and marked controls cool the heating stones. Any careful character can operate them. DC 13 with a suitable tool skill speeds up a jammed valve; failure leaks water onto the floor, inviting a bucket or alternate shutoff rather than damage by surprise.",
        "Workshop: a maintenance card says, 'End rehearsal: acknowledge changed plans, withdraw attendance, release the schedule.' Its diagram identifies a brass attendance wheel in the attic. No roll is needed to read it. DC 13 Arcana reveals that the engine's apparent voices are stored greetings.",
        "Stair: Venn sits on a landing folding place cards. He can follow one concrete request, such as stepping outside to inspect flowers. Physical rescue does not require solving the machine first. DC 12 Medicine suggests rest and reduced stimulation; it does not diagnose a real illness or make consent unnecessary.",
        "If the party misses the workshop, Venn has copied the maintenance instruction onto the backs of his cards. Essential shutdown information has more than one route."
      ] },
      { name: "4. Release the Schedule", paragraphs: [
        { readAloud: "In the attic, a brass wheel turns beneath a web of paper strips. Each strip lists an ordinary kindness: warm the bread, open the curtains, set another chair. A fresh line writes itself as you watch: 'If they leave, begin again.'" },
        "Layout: a 25-foot attic room with the open stair at one end and a wide service window at the other. The attendance wheel stands beside a desk, reachable from the doorway. No forced fall, sealed exit, or invisible enemy is present. The window offers an additional rope-assisted exit if the party wants one.",
        "To stop the engine safely, put the cancellation letter or a newly written correction into the input tray, turn the attendance wheel to zero, and pull the clearly marked schedule-release lever. With the maintenance card, this works without checks. The engine asks once whether tomorrow should be canceled; distinguish this frightened metaphor from its actual power, which is only household preparation.",
        "Alternatives: disconnect the visible drive belt after shutting off the kitchen; persuade Venn to write a revised gathering date and let the engine store it without rehearsing; dismantle the device and preserve its greeting cylinders as keepsakes. DC 14 Arcana or a relevant tool check helps preserve fragile recordings during a hurried dismantling. Failure damages a greeting cylinder, not Venn or the exit.",
        "Do not make the machine immune to sensible magic or physical intervention to preserve the puzzle. There is no compulsory final monster. If the GM wants a combat variant, add appropriate Actors in the story workspace and establish their motive, actual abilities, and escape route before play."
      ] },
      { name: "5. The Next Real Morning", paragraphs: [
        "A safe shutdown leaves a quiet house and a living caretaker who needs food, rest, and company. Sol helps him send a new invitation that explicitly permits guests to decline. Saving the recordings gives Venn a keepsake without requiring him to resume the rehearsal.",
        "If the party rescues Venn but leaves the engine running, Sol shuts the utilities off outside and boards the house until a repairer arrives. If they leave everyone behind, Venn eventually follows the smoke outside and Sol shelters him; the pantry is damaged. Resolve the household's fate openly rather than threatening an infinite time loop.",
        "Reward: Venn offers the observatory as a future safe stop and shares ordinary maps. If he grants the retired workshop's salvage chest, use at most one optional Craftworks Challenge 0–4 hoard, inspect generated items, and record the award. Do not treat the caretaker's possessions as automatically available loot or grant the engine itself as an unlimited prediction item.",
        "Follow-up: a greeting cylinder contains a return address for the engine's original builder. The rescue and shutdown still form a complete ending this session; visiting the builder is optional."
      ] },
      { name: "6. GM Notes", paragraphs: ["Record who left the house, utility controls shut off, engine disposition, saved recordings, new invitation terms, and any treasure recipient. Keep actual player decisions distinct from discarded forecasts. Add chosen maps or Actor references only when needed."] }
    ]
  }
];

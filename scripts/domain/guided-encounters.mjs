import { ADDITIONAL_SITUATIONS } from "./guided-encounter-library.mjs";

// Original Morelord situations. Templates keep the first version usable offline.
export const GUIDED_CHOICES = {
  setting: {
    any: "Choose for me", road: "Road or trail", forest: "Forest", city: "City or settlement",
    dungeon: "Dungeon or ruins", coast: "Coast", mountain: "Mountains", swamp: "Swamp", desert: "Desert"
  },
  interaction: {
    any: "Surprise me", social: "Conversation or negotiation", investigation: "Clues and investigation",
    rescue: "Help or rescue", obstacle: "Obstacle or hazard", discovery: "Discovery or wonder"
  },
  purpose: {
    any: "Choose for me", clue: "Reveal useful information", connection: "Introduce a recurring contact",
    aid: "Offer help or a resource", dilemma: "Present a difficult choice"
  },
  stakes: { low: "Low — time and inconvenience", moderate: "Moderate — trust and resources", high: "High — urgent consequences" }
};

export const GUIDED_FIELDS = {
  opening: "What the party notices", truth: "What is really happening", motivation: "Who wants what",
  approaches: "Ways to engage", checks: "Optional checks", pressure: "Stakes and pressure",
  success: "If the party succeeds", setback: "If things go wrong", ignored: "If the party walks away",
  reward: "Reward and campaign connection"
};

export function normalizeGuidance(value = {}) {
  value = value && typeof value === "object" ? value : {};
  return {
    ...Object.fromEntries(Object.entries(GUIDED_CHOICES).map(([key, choices]) => [key,
      Object.hasOwn(choices, value[key]) ? value[key] : (key === "stakes" ? "moderate" : "any")])),
    connection: String(value.connection ?? "").trim().slice(0, 240)
  };
}

const PLACES = {
  road: ["a roadside shelter beside a broken milestone", "a tollhouse on an old trade road"],
  forest: ["a foresters' refuge beneath an enormous oak", "a moss-covered clearing beside a hunters' trail"],
  city: ["a crowded courtyard behind the market", "a neighborhood meeting hall beside the city wall"],
  dungeon: ["a dry chamber inside an abandoned stronghold", "a ruined archive beside a collapsed stairway"],
  coast: ["a sheltered cove beside an old signal tower", "a boat repair shed above the tide line"],
  mountain: ["a stone refuge overlooking a steep pass", "a disused quarry beside a mountain trail"],
  swamp: ["a raised shelter on the edge of a reed bed", "a timber platform beside an overgrown causeway"],
  desert: ["a shaded rest station beside a dry watercourse", "a wind-worn shelter near a caravan trail"]
};

export const GUIDED_SITUATIONS = [
  ...ADDITIONAL_SITUATIONS,
  {
    id: "borrowed-shelter", kind: "social", name: "The Borrowed Shelter",
    opening: "At {place}, two groups have arrived with matching permits to use the same shelter. Their supplies are already piled across the entrance, and each asks the party to witness the other's trespass.",
    truth: "A distracted clerk issued both permits for the same date. Neither group is lying. One needs room for a sick traveler; the other must keep fragile goods dry.",
    motivation: "The two group leaders want a fair arrangement without appearing weak in front of their companions. Both can accept shared space if their immediate needs are met.",
    approaches: "Compare the permits and find the clerical error. Divide the space around the travelers' actual needs. Offer labor or equipment to extend the shelter.",
    skills: ["Investigation: spot the duplicated permit number", "Persuasion: win agreement to a specific compromise"],
    success: "Both groups cooperate and make room for the party. Each agrees to honor the arrangement until morning.",
    setback: "A leader refuses further bargaining until the party does something practical to demonstrate fairness. Repairing a screen or moving goods can reopen talks.",
    ignored: "One group leaves. Its abandoned supplies and complaints remain for the next travelers to find."
  },
  {
    id: "contested-keepsake", kind: "social", name: "A Keepsake with Two Owners",
    opening: "At {place}, a courier and a repairer both claim a small brass music box. They ask someone impartial to hear their accounts before the courier departs.",
    truth: "The courier carries the box for its absent owner, who never paid for repairs. Hidden beneath its lining is a receipt showing that the owner promised payment from the delivery fee.",
    motivation: "The repairer wants payment and recognition. The courier wants to keep a promise without paying someone else's debt.",
    approaches: "Inspect the box with permission. Offer to witness payment on delivery. Find a useful service the courier can provide in exchange.",
    skills: ["Investigation: find the folded receipt without harming the lining", "Insight: identify the repairer's need for an acknowledgment"],
    success: "They agree on a witnessed arrangement and demonstrate the box's melody as thanks.",
    setback: "The repairer stops discussing money and asks for proof the party will keep its word. A practical favor can restore trust.",
    ignored: "The courier leaves empty-handed. The owner later seeks someone willing to settle the dispute."
  },
  {
    id: "shifted-markers", kind: "investigation", name: "The Markers Moved at Night",
    opening: "At {place}, a surveyor lays out maps that no longer match the nearby route. Travelers report taking the same wrong turn despite following the markers.",
    truth: "A local caretaker moved the markers to keep traffic away from a damaged section, but the temporary route points toward a dead end. Fresh tool marks reveal the change.",
    motivation: "The surveyor wants reliable measurements. The caretaker wants to protect travelers and avoid admitting a costly mistake.",
    approaches: "Compare wear on the markers with their new positions. Walk the route and place temporary signs. Ask the caretaker about recent repairs without assigning blame.",
    skills: ["Investigation: reconstruct the original marker positions", "Survival: identify a safe alternate route"],
    success: "The party restores a safe route and learns who maintains the area.",
    setback: "An attempted shortcut ends at a dead end. Returning costs time, but disturbed soil there provides a new clue to the original route.",
    ignored: "More travelers arrive late or turn back; the caretaker asks someone else for help."
  },
  {
    id: "unclaimed-delivery", kind: "investigation", name: "The Delivery Nobody Ordered",
    opening: "At {place}, a sealed crate waits with a delivery note bearing yesterday's date. Three people deny ordering it, but all recognize the sender's mark.",
    truth: "A former caretaker sent back tools borrowed years ago. The note was damaged in transit; scraps of its missing corner identify the intended recipient.",
    motivation: "The current caretaker fears accepting someone else's debt. The delivery assistant needs a signature and knows where the damaged wrapping was discarded.",
    approaches: "Reconstruct the note. Compare the tools with old repair marks. Ask the assistant to retrace the delivery rather than accuse anyone of theft.",
    skills: ["Investigation: match the note's torn edges", "History: recognize the sender's obsolete trade mark"],
    success: "The tools reach the right hands, and the recipient shares the sender's last known destination.",
    setback: "A wrong assumption sends the party to an uninvolved resident. That resident can point them back toward the delivery assistant.",
    ignored: "The crate is returned to its sender, leaving a forwarding address as a later lead."
  },
  {
    id: "trapped-carrier", kind: "rescue", name: "A Load That Will Not Let Go",
    opening: "At {place}, a pack animal is pinned beneath a shifted carrying frame. Its handler is holding the load steady and cannot reach the release straps.",
    truth: "The frame is wedged against a stone. Pulling the animal directly will tighten the harness; unloading one side and supporting the frame creates a safe release.",
    motivation: "The handler values the animal above the cargo but fears being blamed for losing someone else's supplies.",
    approaches: "Unload and brace the frame. Calm the animal while someone loosens the straps. Cut the harness and accept the cost, or use suitable magic to lift the load.",
    skills: ["Animal Handling: keep the frightened animal still", "Athletics: support the frame during a hurried release"],
    success: "The animal is freed, and the handler can continue after repairs.",
    setback: "A strap snaps and scatters cargo. The animal is still reachable; the party must brace the frame again or sacrifice more equipment.",
    ignored: "The handler cuts away the harness and abandons cargo to free the animal."
  },
  {
    id: "lost-apprentice", kind: "rescue", name: "The Answering Whistle",
    opening: "At {place}, a worried craftsperson blows a three-note whistle. A faint answer comes from beyond a blocked passage, where their apprentice went to retrieve a dropped tool.",
    truth: "The apprentice is unharmed but cannot move a fallen timber alone. A narrow gap carries sound and is wide enough for a rope or small tool.",
    motivation: "The craftsperson wants the apprentice safe. The apprentice is embarrassed and understates how thoroughly the timber has trapped them.",
    approaches: "Establish clear signals before moving debris. Pass a rope through the gap. Brace and lift the timber with tools or suitable magic.",
    skills: ["Perception: locate the clearest gap for communication", "Athletics: lift a supported timber while the apprentice crawls free"],
    success: "The apprentice emerges safely and shows the party what they noticed beyond the passage.",
    setback: "Debris blocks the first gap. The whistle remains audible through a second opening, revealing another way to reach the apprentice.",
    ignored: "The craftsperson leaves to fetch more help; the apprentice faces a long, anxious wait."
  },
  {
    id: "unstable-crossing", kind: "obstacle", name: "One Crossing, Three Plans",
    opening: "At {place}, a damaged walkway spans a deep drainage channel. A small group waits beside it, arguing over whether to repair it, improvise a crossing, or take a long detour.",
    truth: "The side supports are sound but several boards are rotten. A loaded handcart cannot cross safely until its weight is redistributed.",
    motivation: "The travelers want to preserve their supplies and arrive before a promised meeting. Their practical knowledge differs, but each plan has merit.",
    approaches: "Replace weak boards using tools and spare timber. Move loads separately with a rope. Take the slower, reliable detour, or bypass the crossing with suitable magic.",
    skills: ["Investigation: identify the boards that need replacement", "Acrobatics: carry a light line across the supported edge"],
    success: "The group crosses with its supplies intact and shares a dependable route onward.",
    setback: "A board gives way beneath a loose load. Supplies become stranded on a ledge, creating a retrieval choice instead of forcing another identical check.",
    ignored: "The travelers take the detour and leave a warning for those who follow."
  },
  {
    id: "sealed-cistern", kind: "obstacle", name: "Water Behind the Seal",
    opening: "At {place}, the shared cistern's handle has jammed. The caretaker has opened the maintenance panel, but the reserve water is running low.",
    truth: "A swollen wooden shim blocks the mechanism. Forcing the handle will break it; relieving the pressure first allows the shim to be removed.",
    motivation: "The caretaker wants a lasting repair. Waiting travelers want water immediately and offer competing advice.",
    approaches: "Inspect the linkage and vent the pressure. Organize fair distribution of the reserve. Bring water from another source or use appropriate magic while repairs proceed.",
    skills: ["Investigation: locate the jam and pressure release", "Sleight of Hand: remove the shim through the narrow panel"],
    success: "The cistern works again and everyone receives a fair share.",
    setback: "A rushed adjustment drains part of the reserve. The mechanism remains repairable, but the group must ration what is left.",
    ignored: "The caretaker closes the station and directs travelers toward a more distant water source."
  },
  {
    id: "memory-lantern", kind: "discovery", name: "The Lantern's Last Evening",
    opening: "At {place}, an unlit lantern projects moving shadows of people sharing a meal. A quiet traveler watches, trying to recognize one of the figures.",
    truth: "The lantern holds a harmless memory. It repeats when someone places an empty cup beside it; adding a second cup reveals the person who was sitting out of view.",
    motivation: "The traveler is tracing a relative's journey and wants to preserve the lantern rather than sell it.",
    approaches: "Observe the whole sequence. Recreate the table setting. Ask the traveler what they recognize, or experiment gently with light and objects.",
    skills: ["Arcana: identify the memory's repeating trigger", "Perception: notice the unseen diner's shadow reaching for a second cup"],
    success: "The complete memory reveals a recognizable emblem and a direction of travel.",
    setback: "A disruptive experiment pauses the projection. Restoring the cups and giving it a quiet moment starts the sequence again.",
    ignored: "The traveler remains to study it and can recount the discovery when the party returns."
  },
  {
    id: "seed-library", kind: "discovery", name: "The Little Library of Seasons",
    opening: "At {place}, a caretaker tends labeled jars of seeds. When a lid opens, a brief scent and sound from the seed's place of origin fills the air.",
    truth: "The jars preserve impressions of their home soil. One unmarked jar carries the sound of running water and a distinctive bell heard near a forgotten refuge.",
    motivation: "The caretaker wants to identify the last jar and asks visitors to contribute memories rather than money.",
    approaches: "Compare the sounds with local landmarks. Examine the seeds without planting them. Trade a true travel memory or help catalog the collection.",
    skills: ["Nature: narrow down the seed's growing conditions", "History: connect the bell's pattern to a former refuge"],
    success: "The party identifies a promising destination and receives an invitation to return with what it learns.",
    setback: "A mistaken identification leads to a nearby but incorrect landmark. Local knowledge there supplies a clearer direction.",
    ignored: "The caretaker preserves the jar and continues asking other travelers."
  }
];

export function generateGuidedEncounter(guidance = {}, { random = Math.random, previousId = "", recentIds = [] } = {}) {
  const answers = normalizeGuidance(guidance);
  const pick = values => values[Math.min(values.length - 1, Math.max(0, Math.floor(random() * values.length)))];
  const setting = answers.setting === "any" ? pick(Object.keys(PLACES)) : answers.setting;
  const eligible = GUIDED_SITUATIONS.filter(seed => answers.interaction === "any" || seed.kind === answers.interaction);
  const alternatives = eligible.filter(seed => seed.id !== previousId);
  const candidates = alternatives.length ? alternatives : eligible;
  const history = Array.isArray(recentIds) ? recentIds : [];
  const unseen = candidates.filter(seed => !history.includes(seed.id));
  // History is newest first. Once exhausted, reuse the oldest eligible situation.
  const seed = unseen.length ? pick(unseen)
    : candidates.reduce((oldest, candidate) => history.indexOf(candidate.id) > history.indexOf(oldest.id) ? candidate : oldest);
  const interaction = seed.kind;
  const place = pick(PLACES[setting]);
  const purpose = answers.purpose === "any"
    ? pick(Object.keys(GUIDED_CHOICES.purpose).filter(key => key !== "any")) : answers.purpose;
  const dc = { low: 10, moderate: 13, high: 16 }[answers.stakes];
  const connection = answers.connection || "a nearby place the party hopes to reach";
  const rewards = {
    clue: `A person involved can share a first-hand account concerning ${connection}. Give the party one useful lead when they engage; an optional check can add detail, but should not gate the essential clue.`,
    connection: `Someone involved offers to remain a contact who can provide introductions concerning ${connection}. Agree on a name and a way to find them again.`,
    aid: `The people involved offer practical help with ${connection}: directions, a safe rest, or the loan of ordinary tools. Choose an offer that fits the party's needs.`,
    dilemma: `Helping here costs time that could be spent pursuing ${connection}. Explain that tradeoff before the party commits. Both choices remain valid; record who benefited and who must wait.`
  };
  const pressure = {
    low: "There is time to observe, ask questions, and make a careful plan. Setbacks cost a little time or inconvenience; nobody is in immediate danger.",
    moderate: "People have limited patience and supplies. After a failed approach, offer a concrete cost in time, equipment, or trust before the party chooses its next move.",
    high: "A departing relief group creates a deadline: only three meaningful attempts remain before its help and spare equipment leave. State this openly. A setback uses one attempt; when time runs out, apply the walk-away consequence. A credible plan or suitable magic can still resolve the problem directly."
  };
  return {
    kind: "guided", seedId: seed.id, name: seed.name, members: [], guidance: answers,
    description: `${GUIDED_CHOICES.setting[setting]} · ${GUIDED_CHOICES.interaction[interaction]} · Non-combat`,
    setting, interaction, purpose,
    scene: {
      opening: seed.opening.replaceAll("{place}", place), truth: seed.truth, motivation: seed.motivation,
      approaches: seed.approaches,
      checks: `${seed.skills.map(skill => `DC ${dc} ${skill}.`).join("\n")}\nThese are editable starting points, not required rolls. Let sound plans, relevant tools, and suitable spells work when the outcome is clear.`,
      pressure: answers.stakes === "high" && seed.urgency
        ? `${seed.urgency} Allow three meaningful attempts before applying the walk-away consequence. State the deadline openly; a sound plan or suitable magic can resolve the situation directly.`
        : pressure[answers.stakes], success: seed.success, setback: seed.setback, ignored: seed.ignored,
      reward: [seed.hook, rewards[purpose]].filter(Boolean).join("\n\n")
    }
  };
}

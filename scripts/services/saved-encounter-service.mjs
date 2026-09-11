import { MODULE_ID } from "../domain/constants.mjs";

export function getSavedEncounters() {
  if (!game.user?.isGM) throw new Error("Only GMs can access saved encounters.");
  return Array.from(game.journal ?? [])
    .filter(journal => journal.getFlag(MODULE_ID, "savedEncounter"))
    .map(journal => ({
      id: journal.id,
      name: journal.name,
      encounter: { ...structuredClone(journal.getFlag(MODULE_ID, "savedEncounter")), name: journal.name }
    }));
}

export async function saveEncounter(name, encounter) {
  if (!game.user?.isGM) throw new Error("Only GMs can save encounters.");
  name = String(name ?? "").trim();
  if (!name) throw new Error("Enter an encounter name.");
  const snapshot = structuredClone({ ...encounter, name });
  const journal = await JournalEntry.create({
    name,
    ownership: { default: 0 },
    flags: { [MODULE_ID]: { savedEncounter: snapshot } }
  });
  return { id: journal.id, name, encounter: snapshot };
}

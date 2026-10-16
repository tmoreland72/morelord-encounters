import { MODULE_ID } from "../domain/constants.mjs";

export function combatRosterMembers(encounter) {
  return (encounter.members ?? []).map(member => ({
    uuid: member.uuid, name: member.name, img: member.img,
    count: encounter.published ? member.rolledQuantity ?? member.count : member.count
  }));
}

function snapshot(name, encounter) {
  return encounter.kind === 'guided' ? structuredClone({...encounter,name})
    : {name,kind:'roster',members:combatRosterMembers(encounter)};
}

export function getSavedEncounters() {
  if (!game.user?.isGM) throw new Error("Only GMs can access saved encounters.");
  return Array.from(game.journal ?? [])
    .filter(journal => journal.getFlag(MODULE_ID, "savedEncounter"))
    .map(journal => ({
      id: journal.id,
      name: journal.name,
      encounter: snapshot(journal.name, journal.getFlag(MODULE_ID, "savedEncounter"))
    }));
}

export async function saveEncounter(name, encounter) {
  if (!game.user?.isGM) throw new Error("Only GMs can save encounters.");
  name = String(name ?? "").trim();
  if (!name) throw new Error("Enter an encounter name.");
  const saved = snapshot(name, encounter);
  const journal = await JournalEntry.create({
    name,
    ownership: { default: 0 },
    flags: { [MODULE_ID]: { savedEncounter: saved } }
  });
  return { id: journal.id, name, encounter: saved };
}

export async function deleteSavedEncounter(id) {
  if (!game.user?.isGM) throw new Error('Only GMs can delete saved encounters.');
  const journal = game.journal.get(id);
  if (!journal?.getFlag(MODULE_ID, 'savedEncounter')) throw new Error('That saved encounter is unavailable.');
  await journal.delete();
}

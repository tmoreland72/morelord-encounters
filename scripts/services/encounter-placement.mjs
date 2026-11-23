import { combatRosterMembers } from "./saved-encounter-service.mjs";
import { isEncounterUuidAllowed } from "./system-pack-access.mjs";

export async function placeEncounterMonsters(encounter) {
  if (!game.user.isGM) throw new Error("Only GMs can place encounter monsters.");
  if (!canvas.ready || !canvas.scene) throw new Error("View a scene before placing monsters.");
  const members = combatRosterMembers(encounter);
  if (!members.length) return [];
  for (const member of members) {
    if (!isEncounterUuidAllowed(member.uuid)) throw new Error(`${member.name} is disabled in Configure Sources.`);
    if (!Number.isInteger(member.count) || member.count < 1) throw new Error(`Invalid monster quantity for ${member.name}.`);
  }
  // An unsaved group reuses the exact native party placement flow without adding a group Actor.
  const group = new CONFIG.Actor.documentClass({ name: encounter.name, type: "group" });
  group.system.getPlaceableMembers = async () => Promise.all(members.map(async member => ({
    actor: await CONFIG.Actor.documentClass.fetchExisting(member.uuid),
    quantity: { value: member.count }
  })));
  return group.system.placeMembers();
}

import { MODULE_ID } from '../domain/constants.mjs';
import { getSavedEncounters, combatRosterMembers } from './saved-encounter-service.mjs';
import { getCoreApi } from '../core/core-api.mjs';
import { edgePositions } from '../../../morelord-core/scripts/services/combat-placement.mjs';
import { createMassCombat } from '../../../morelord-core/scripts/services/mass-combat.mjs';

const KEY = 'massCombatWaves';
const read = scene => foundry.utils.deepClone(scene.getFlag(MODULE_ID, KEY) ?? { waves: [] });
const save = (scene, state) => scene.setFlag(MODULE_ID, KEY, state);
const scheduleId = combatant => combatant?.getFlag?.(MODULE_ID, 'massCombatSchedule') ?? combatant?.flags?.[MODULE_ID]?.massCombatSchedule;

export function waveRoster(encounter) {
  return combatRosterMembers(encounter);
}

async function rosterActor(member) {
  let actor = await fromUuid(member.uuid);
  if (actor?.documentName !== 'Actor' || actor.type !== 'npc') throw Error(`The saved creature ${member.name} is unavailable. Restore its Actor source before retrying.`);
  if (actor.pack) {
    const source = actor.uuid;
    actor = game.actors.find(a => a.getFlag(MODULE_ID, 'massCombatSource') === source)
      ?? await Actor.create({ ...actor.toObject(), _id: undefined, ownership: { default: 0 }, flags: { ...actor.flags, [MODULE_ID]: { ...actor.flags?.[MODULE_ID], massCombatSource: source } } });
  }
  return actor;
}

async function ensureWaveTurn(scene, state, wave, combat) {
  if (state.turnSchedulingVersion !== 1) { state.turnSchedulingVersion = 1; state.automatic = true; }
  let entry = combat.combatants.find(c => scheduleId(c) === wave.id);
  if (!entry) {
    const actor = await rosterActor(wave.members[0]);
    wave.schedulerTokenId ??= foundry.utils.randomID();
    await save(scene,state);
    if (!scene.tokens.has(wave.schedulerTokenId)) {
      const token=(await actor.getTokenDocument({name:`Wave: ${wave.name}`,actorLink:true,hidden:true,alpha:0,disposition:0},{parent:scene})).toObject();
      token._id=wave.schedulerTokenId;
      token.flags={...token.flags,[MODULE_ID]:{...token.flags?.[MODULE_ID],massCombatScheduler:wave.id}};
      await scene.createEmbeddedDocuments('Token',[token],{keepId:true});
    }
    [entry] = await combat.createEmbeddedDocuments('Combatant', [{ name: `Wave: ${wave.name}`, tokenId:wave.schedulerTokenId,actorId: actor.id, sceneId: scene.id, hidden: true,
      flags: { [MODULE_ID]: { massCombatSchedule: wave.id } } }]);
  }
  wave.combatantId = entry.id;
  await save(scene, state);
  if (entry.initiative == null) await combat.rollInitiative([entry.id], {messageMode:'gm'});
  wave.initiative = entry.initiative;
  await save(scene, state);
}

export const creatureGroupKey = token => token.getFlag?.(MODULE_ID, 'massCombatGroup') ?? token.flags?.[MODULE_ID]?.massCombatGroup ?? token.actor?.getFlag?.(MODULE_ID, 'massCombatSource') ?? `Actor.${token.actorId}`;

export function creatureGroups(scene) {
  const groups = new Map();
  for (const token of scene.tokens.values()) {
    if (token.getFlag?.(MODULE_ID,'massCombatScheduler') ?? token.flags?.[MODULE_ID]?.massCombatScheduler) continue;
    if (token.actor?.type !== 'npc' || !(Number(token.actor.system.attributes.hp.value) > 0)) continue;
    const key = creatureGroupKey(token);
    if (!groups.has(key)) groups.set(key, { key, name: token.actor.name, img: token.texture?.src, actorUuid: token.actor.uuid, tokens: [], deployed: false });
    const group = groups.get(key);
    group.tokens.push(token);
    group.deployed ||= Boolean(token.getFlag?.(MODULE_ID, 'massCombatWave') ?? token.flags?.[MODULE_ID]?.massCombatWave);
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function defaultAttackerGroup(scene, combat) {
  const groups = creatureGroups(scene);
  const current = combat?.combatant;
  const activeToken = scene.tokens.get(current?.tokenId);
  const activeKey = current?.getFlag?.(MODULE_ID, 'massCombatGroup') ?? current?.flags?.[MODULE_ID]?.massCombatGroup ?? (activeToken && creatureGroupKey(activeToken));
  return groups.find(g => g.key === activeKey)?.key ?? groups.find(g => g.deployed)?.key ?? groups[0]?.key ?? '';
}

export function validateWave({ encounterId, round = 1, repeats = 1, interval = 1, multiplier = 1 }) {
  if (!encounterId) throw Error('Choose a saved combat encounter.');
  const wave = { encounterId: String(encounterId) };
  for (const [key, value, max] of [['round', round, 10000], ['repeats', repeats, 100], ['interval', interval, 10000], ['multiplier', multiplier, 100]]) {
    if (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > max) throw Error(`Invalid ${key}: choose a whole number from 1 to ${max}.`);
    wave[key] = Number(value);
  }
  return wave;
}

export function waveInputFromForm(input) {
  const skipped = Number(input.skippedRounds ?? 0);
  if (!Number.isInteger(skipped) || skipped < 0 || skipped > 9999) throw Error('Skipped Rounds Between Spawns must be a whole number from 0 to 9999.');
  return {...input,interval:skipped + 1};
}

export function dueWaves(waves, round) {
  return waves.filter(wave => (wave.deployed ?? 0) < wave.repeats && round >= wave.round && (round - wave.round) % wave.interval === 0 && round > (wave.lastDeploymentRound ?? 0));
}

export function combatUsesScene(combat, scene) {
  return combat.scene?.id === scene.id || (!combat.scene && combat.combatants.some(c => c.sceneId === scene.id && scene.tokens.has(c.tokenId)));
}

function getCombat(scene, state) {
  if (state.combatId) {
    const combat = game.combats.get(state.combatId);
    if (!combat || !(combatUsesScene(combat, scene) || (!combat.scene && !combat.combatants.size))) throw Error('The scheduled combat is missing or belongs to another scene. Restore it before continuing.');
    return combat;
  }
  const viewed = game.combats.viewed ?? game.combat;
  if (viewed && combatUsesScene(viewed, scene)) return viewed;
  const matches = game.combats.filter(c => combatUsesScene(c, scene));
  if (matches.length > 1) throw Error('Select the intended combat in the combat tracker first.');
  if (!matches.length) throw Error('Create a combat with a token from this scene first.');
  return matches[0];
}

async function locked(scene, callback) {
  const core = getCoreApi();
  if (!game.user?.isGM || !core?.socket?.runSerialized || !core.users.list().some(u => u.id === game.user.id)) throw Error('An enabled, non-ignored GM and Morelord Core are required.');
  return core.socket.runSerialized(`${MODULE_ID}:${KEY}:${scene.id}`, async () => {
    const state = read(scene), controller = core.users.list().find(u => u.id === state.controllerId && u.isGM);
    if (controller?.active && controller.id !== game.user.id) throw Error(`${controller.name} controls this schedule. Wait until that GM disconnects to take over.`);
    if (state.controllerId !== game.user.id) {
      state.controllerId = game.user.id;
      await save(scene, state);
    }
    return callback(state);
  });
}

export function waveStatus(scene) {
  if (!game.user?.isGM) throw Error('Only GMs can manage mass combat.');
  return read(scene);
}

export async function addWave(scene, input) {
  return locked(scene, async state => {
    if (state.pending) throw Error('Resume the interrupted deployment first.');
    const plan = validateWave(input);
    const saved = getSavedEncounters().find(e => e.id === plan.encounterId);
    if (!saved || saved.encounter.kind === 'guided' || !saved.encounter.members?.length) throw Error('Choose a saved combat encounter with creatures.');
    const members = waveRoster(saved.encounter);
    if (members.some(m => !m.uuid || !Number.isInteger(m.count) || m.count < 1)) throw Error('The saved roster contains an invalid creature or quantity.');
    if (members.reduce((n, m) => n + m.count, 0) * plan.multiplier > 200) throw Error('Deploy at most 200 creatures per wave.');
    const wave = { ...plan, id: foundry.utils.randomID(), name: saved.name, members, deployed: 0, rosterQuantityVersion: 1 };
    if (!state.waves.length) state.automatic = true;
    state.waves.push(wave);
    state.automatic ??= true;
    const combat = getCombat(scene, state);
    state.combatId = combat.id;
    await save(scene, state);
    await ensureWaveTurn(scene, state, wave, combat);
    return wave;
  });
}

export async function removeWave(scene, id) {
  return locked(scene, async state => {
    if (state.pending) throw Error('Resume the interrupted deployment first.');
    const combat = getCombat(scene, state);
    const entries = combat.combatants.filter(c => scheduleId(c) === id).map(c => c.id);
    if (entries.length) await combat.deleteEmbeddedDocuments('Combatant', entries);
    const scheduler = state.waves.find(w=>w.id===id)?.schedulerTokenId;
    if(scheduler && scene.tokens.has(scheduler))await scene.deleteEmbeddedDocuments('Token',[scheduler]);
    state.waves = state.waves.filter(w => w.id !== id);
    await save(scene, state);
  });
}

export async function setAutomatic(scene, enabled) {
  return locked(scene, async state => {
    const combat = getCombat(scene, state);
    state.combatId = combat.id;
    state.automatic = Boolean(enabled);
    state.turnSchedulingVersion = 1;
    await save(scene, state);
  });
}

async function finishBatch(scene, state, combat) {
  const pending = state.pending;
  for (const token of pending.tokens) {
    if (!scene.tokens.has(token._id)) await scene.createEmbeddedDocuments('Token', [token], { keepId: true });
  }
  const currentTurnId = combat.combatant?.id;
  const createdGroups = await synchronizeGroups(scene, combat, pending.tokens, pending.initiative);
  const wave = state.waves.find(w => w.id === pending.waveId);
  wave.deployed = pending.deployed;
  const batchId = `${wave.id}:${pending.deployed}`;
  if (!game.messages.find(message => message.getFlag(MODULE_ID, 'massCombatArrival') === batchId)) {
    const core = getCoreApi(), escape = value => foundry.utils.escapeHTML(String(value ?? ''));
    const rows = wave.members.map(member => `<div class="ml-item-row">${core.ui.actorIdentity({actorUuid:member.uuid,name:member.name,img:member.img})}<strong>× ${member.count * wave.multiplier}</strong></div>`).join('');
    await ChatMessage.create({speaker:ChatMessage.getSpeaker(),whisper:core.users.list().filter(u=>u.isGM).map(u=>u.id),
      content:`<section class="ml-chat-card"><h3>Wave deployed: ${escape(wave.name)}</h3><p>Round ${combat.round} · Initiative ${escape(pending.initiative)} · Arrival ${wave.deployed}/${wave.repeats}</p><div class="ml-stack">${rows}</div><p>${pending.tokens.length} creatures arrived with independent HP. Each monster type uses its shared mob turn.${wave.deployed < wave.repeats ? ` Next scheduled round: ${combat.round + wave.interval}.` : ' All arrivals complete.'}</p></section>`,
      flags:{[MODULE_ID]:{massCombatArrival:batchId}}},{messageMode:'gm'});
  }
  state.pending = null;
  if (wave.deployed >= wave.repeats) {
    const scheduleEntries = combat.combatants.filter(c => scheduleId(c) === wave.id).map(c => c.id);
    if (scheduleEntries.length) await combat.deleteEmbeddedDocuments('Combatant', scheduleEntries);
    if (wave.schedulerTokenId && scene.tokens.has(wave.schedulerTokenId)) await scene.deleteEmbeddedDocuments('Token',[wave.schedulerTokenId]);
  }
  // Hand the native tracker to the first new mob, including equal-initiative ties.
  const firstMob = combat.turns?.findIndex(c => createdGroups.includes(c.id));
  const preserved = combat.turns?.findIndex(c => c.id === currentTurnId);
  const nextTurn = firstMob >= 0 ? firstMob : preserved;
  if (nextTurn >= 0 && nextTurn !== combat.turn) await combat.update({turn:nextTurn});
  await save(scene, state);
  ui.notifications.info(`${wave.name}: deployment ${wave.deployed}/${wave.repeats} complete.`);
}

async function synchronizeGroups(scene, combat, tokens, initiative = null) {
  const createdGroups = [];
  const representatives = new Map();
  for (const token of tokens) representatives.set(creatureGroupKey(token), token);
  for (const [groupKey, token] of representatives) {
    const groupTokens = scene.tokens.filter(t => !(t.getFlag?.(MODULE_ID,'massCombatScheduler') ?? t.flags?.[MODULE_ID]?.massCombatScheduler) && creatureGroupKey(t) === groupKey);
    const entries = combat.combatants.filter(c => !scheduleId(c) && (c.sceneId ?? combat.scene?.id) === scene.id && groupTokens.some(t => t.id === c.tokenId));
    let representative = (combat.round > 0 ? entries.find(c => c.id === combat.combatant?.id) : null)
      ?? entries.filter(c=>c.initiative != null).sort((a,b)=>b.initiative-a.initiative)[0] ?? entries[0];
    if (!representative) {
      [representative] = await combat.createEmbeddedDocuments('Combatant', [{ tokenId: token._id ?? token.id, sceneId: scene.id, actorId: token.actorId, hidden: token.hidden, ...(initiative != null ? {initiative} : {}) }]);
      createdGroups.push(representative.id);
    }
    await combat.updateEmbeddedDocuments('Combatant', [{_id: representative.id, name: `${groupTokens[0]?.name ?? token.name ?? 'Mob'} (${groupTokens.length})`, [`flags.${MODULE_ID}.massCombatGroup`]: groupKey}]);
    // Consolidate only tokens belonging to this deployed monster type; PCs retain their turns.
    if (entries.length > 1) await combat.deleteEmbeddedDocuments('Combatant', entries.filter(c => c.id !== representative.id).map(c => c.id));
  }
  const groupKeys = new Set(representatives.keys());
  const unrolled = combat.combatants.filter(c => groupKeys.has(c.getFlag?.(MODULE_ID, 'massCombatGroup') ?? c.flags?.[MODULE_ID]?.massCombatGroup) && (c.sceneId ?? combat.scene?.id) === scene.id && c.initiative == null).map(c => c.id);
  if (unrolled.length) await combat.rollInitiative(unrolled, { messageMode: 'gm' });
  return createdGroups;
}

async function resetRun(scene, state, combat) {
  const markers = scene.tokens.filter(t => t.getFlag?.(MODULE_ID, 'massCombatScheduler') ?? t.flags?.[MODULE_ID]?.massCombatScheduler).map(t => t.id);
  const entries = combat?.combatants.filter(c => scheduleId(c)).map(c => c.id) ?? [];
  if (entries.length) await combat.deleteEmbeddedDocuments('Combatant', entries);
  if (markers.length) await scene.deleteEmbeddedDocuments('Token', markers);
  state.combatId = null;
  state.pending = null;
  state.waves = [];
  state.automatic = false;
  state.groupTurns = false;
  state.runResetVersion = (state.runResetVersion ?? 0) + 1;
  await save(scene, state);
  if (game.user.getFlag?.(MODULE_ID,'massCombat')?.sceneId === scene.id) await createMassCombat(MODULE_ID).massCombat('reset');
}

export async function synchronizeMobTurns(scene, intendedCombat = null) {
  return locked(scene, async state => {
    state.groupTurns = true;
    await save(scene,state);
    let migrated = false;
    for (const wave of state.waves) {
      if (wave.rosterQuantityVersion === 1) continue;
      wave.members = wave.members.map(m=>({...m,count:m.rolledQuantity ?? m.count}));
      wave.rosterQuantityVersion = 1;
      migrated = true;
    }
    if (migrated) await save(scene, state);
    const bound = state.combatId && game.combats.get(state.combatId);
    if (state.combatId && (!bound || !combatUsesScene(bound, scene))) await resetRun(scene, state, null);
    const viewed = game.combats.viewed ?? game.combat;
    const matches = game.combats.filter(c => combatUsesScene(c, scene));
    const combat = intendedCombat ?? (state.combatId ? bound : (viewed && combatUsesScene(viewed, scene) ? viewed : matches.length === 1 ? matches[0] : null));
    if (!combat) return;
    if (!(combat.round > 0) && (state.pending || state.waves.some(w => w.deployed || w.lastDeploymentRound))) await resetRun(scene, state, combat);
    state.combatId = combat.id;
    await save(scene, state);
    for (const wave of state.waves) if (wave.deployed < wave.repeats) await ensureWaveTurn(scene, state, wave, combat);
    const tokens = creatureGroups(scene).flatMap(group=>group.tokens).filter(t => combat.combatants.some(c=>c.tokenId===t.id) || (t.getFlag?.(MODULE_ID,'massCombatWave') ?? t.flags?.[MODULE_ID]?.massCombatWave));
    if (!tokens.length) return;
    await synchronizeGroups(scene, combat, tokens);
  });
}

export async function synchronizeAttackerTurn(scene, groupKey) {
  return locked(scene, async state => {
    const viewed = game.combats.viewed ?? game.combat;
    const matches = game.combats.filter(c=>combatUsesScene(c,scene));
    const combat = game.combats.get(state.combatId) ?? (viewed && combatUsesScene(viewed,scene) ? viewed : matches.length===1 ? matches[0] : null);
    if (!combat || !combatUsesScene(combat,scene)) return;
    const group = creatureGroups(scene).find(g=>g.key===groupKey);
    if (group) {
      state.combatId=combat.id;
      await save(scene,state);
      await synchronizeGroups(scene,combat,group.tokens);
    }
  });
}

export async function deployWaves(scene, { automatic = false, combatId = null } = {}) {
  return locked(scene, async state => {
    if (automatic && (!state.automatic || state.combatId !== combatId)) return;
    if (scene.grid.type !== 1) throw Error('Wave placement requires a square-grid scene.');
    const combat = getCombat(scene, state);
    if (!(combat.round > 0)) throw Error('Start combat before deploying scheduled waves.');
    state.combatId = combat.id;
    if (state.pending) await finishBatch(scene, state, combat);
    // One repetition per wave per call. Missed rounds never flood the scene on reconnect.
    const due = dueWaves(state.waves, combat.round).filter(w => scheduleId(combat.combatant) === w.id);
    if (!due.length) return state;
    for (const wave of due) {
      if (wave.lastDeploymentRound >= combat.round) continue;
      const tokens = [];
      for (const member of wave.members) {
        const actor = await rosterActor(member);
        for (let i = 0; i < member.count * wave.multiplier; i++) {
          const token = (await actor.getTokenDocument({ actorLink: false, hidden: false, disposition: -1 }, { parent: scene })).toObject();
          token._id = foundry.utils.randomID();
          token.flags ??= {};
          token.flags[MODULE_ID] = { ...token.flags[MODULE_ID], massCombatWave: wave.id, massCombatGroup: member.uuid };
          tokens.push(token);
        }
      }
      tokens.sort((a, b) => b.width * b.height - a.width * a.height);
      const size = scene.grid.size;
      const positions = edgePositions({ rect: scene.dimensions.sceneRect, size, footprints: tokens,
        occupied: scene.tokens.map(t => ({ x: t.x, y: t.y, width: t.width * size, height: t.height * size })) });
      tokens.forEach((t, i) => Object.assign(t, positions[i]));
      state.pending = { tokens, waveId: wave.id, deployed: wave.deployed + 1, initiative: combat.combatant.initiative };
      wave.lastDeploymentRound = combat.round;
      await save(scene, state);
      await finishBatch(scene, state, combat);
    }
    return state;
  });
}

export function registerMassCombatHooks() {
  const prototype=globalThis.CONFIG?.Combat?.documentClass?.prototype;
  if(prototype?.startCombat && !Object.hasOwn(prototype,'morelordMassCombatStart')) {
    const original=prototype.startCombat;
    Object.defineProperty(prototype,'morelordMassCombatStart',{value:true});
    prototype.startCombat=async function(...args) {
      if(game.user.isGM)for(const scene of game.scenes){
        if(!combatUsesScene(this,scene))continue;
        const state=read(scene);
        if(state.groupTurns || state.waves.length)await synchronizeMobTurns(scene,this);
      }
      return original.apply(this,args);
    };
  }
  const resetEndedCombat = combat => {
    if (!game.user.isGM) return;
    for (const scene of game.scenes) {
      if (read(scene).combatId !== combat.id) continue;
      void locked(scene, state => state.combatId === combat.id ? resetRun(scene, state, game.combats.get(combat.id)) : undefined)
        .catch(error => console.error(`${MODULE_ID} | Reset mass combat`, error));
    }
  };
  Hooks.on('deleteCombat', resetEndedCombat);
  Hooks.on('updateCombat', (combat, changes) => {
    if (Object.hasOwn(changes, 'round') && !(combat.round > 0)) { resetEndedCombat(combat); return; }
    if ((!Object.hasOwn(changes, 'round') && !Object.hasOwn(changes, 'turn')) || !(combat.round > 0) || !game.user.isGM || !scheduleId(combat.combatant)) return;
    for (const scene of game.scenes) {
      const state = read(scene);
      if (!state.automatic || state.combatId !== combat.id) continue;
      const eligible = getCoreApi()?.users.list().filter(u => u.isGM && u.active) ?? [];
      const controller = eligible.find(u => u.id === state.controllerId);
      const elected = controller ?? eligible.sort((a, b) => a.id.localeCompare(b.id))[0];
      if (elected?.id !== game.user.id) continue;
      void deployWaves(scene, { automatic: true, combatId: combat.id }).catch(error => {
        console.error(`${MODULE_ID} | Wave deployment`, error);
        ui.notifications.error(`Wave deployment stopped: ${error.message} Open Mass Combat to retry.`);
      });
    }
  });
}

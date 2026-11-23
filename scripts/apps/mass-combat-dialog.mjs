import { getSavedEncounters } from '../services/saved-encounter-service.mjs';
import { addWave, removeWave, setAutomatic, setWaveEnabled, waveStatus, deployWaves, defaultAttackerGroup, synchronizeMobTurns, combatUsesScene, waveRoster, waveInputFromForm, synchronizeAttackerTurn, attackGroups, attackTargets } from '../services/mass-combat-service.mjs';
import { createMassCombat } from '../../../morelord-core/scripts/services/mass-combat.mjs';
import {numberControl,activateNumberControls} from '../../../morelord-core/scripts/ui/number-control.js';
import { getCoreApi } from '../core/core-api.mjs';

const e = value => foundry.utils.escapeHTML(String(value ?? ''));
const actionButton = (action, label) => `<button type="button" data-action="mass-${action}">${label}</button>`;

const panels = new WeakMap();
export async function mountMassCombat(form) {
  if (!game.user.isGM || !canvas.ready || !canvas.scene) throw Error('Open a scene as GM first.');
  const scene = canvas.scene;
  const existing = panels.get(form);
  if (existing) {await synchronizeMobTurns(scene);return existing;}
  let panel = form.querySelector('.ml-encounters-mass-panel');
  if (!panel) { panel = document.createElement('section'); panel.className='ml-stack ml-encounters-mass-panel'; form.append(panel); }
  let draft = {showGroupAttacks:false}, busy = false, activeTurn, review = null, operation = 0;
  let resetVersion = waveStatus(scene).runResetVersion;
  const resetLocal = () => {
    operation++;busy=false;draft={showGroupAttacks:false};activeTurn=undefined;
    if(review){const resolve=review.resolve;review=null;resolve(null);}
  };
  const readDraft = data => Object.fromEntries([...data].filter(([name])=>['encounterId','round','repeats','skippedRounds','multiplier','waveId','attackerGroup','targetGroup'].includes(name)));
  const groups = () => attackGroups(scene);
  const targets = () => attackTargets(scene,groups().find(g=>g.key===draft.attackerGroup)?.tokens ?? []);
  const attacks = createMassCombat('morelord-encounters', {
    selectedTokens: role => (role==='attackers'?groups():targets()).find(g => g.key === draft[role === 'attackers' ? 'attackerGroup' : 'targetGroup'])?.tokens ?? [],
    presentForm: config => new Promise(resolve=>{
      review={...config,resolve};refresh();
      requestAnimationFrame(()=>{
        const section=panel.querySelector('[data-ml-section-key="encounters.mass.review"]');
        const control=section?.querySelector('input,select,button');
        control?.focus();control?.scrollIntoView({block:'center'});
      });
    })
  });
  const content = () => {
    const state = waveStatus(scene);
    const saved = getSavedEncounters().filter(s => s.encounter.kind !== 'guided' && s.encounter.members?.length).map(s => ({...s,encounter:{...s.encounter,members:waveRoster(s.encounter)}}));
    const available = groups();
    const candidate = game.combats.get(state.combatId) ?? game.combats.viewed ?? game.combat;
    const combat = candidate && combatUsesScene(candidate, scene) ? candidate : null;
    if (combat?.combatant?.id !== activeTurn) { activeTurn = combat?.combatant?.id; draft.attackerGroup = defaultAttackerGroup(scene, combat); }
    if (!available.some(g => g.key === draft.attackerGroup)) draft.attackerGroup = defaultAttackerGroup(scene, combat);
    if(!available.some(g=>g.key===draft.attackerGroup))draft.attackerGroup=available[0]?.key ?? '';
    const targetOptions=targets();
    if(!targetOptions.some(g=>g.key===draft.targetGroup))draft.targetGroup=targetOptions[0]?.key ?? '';
    if(!state.waves.some(w=>w.id===draft.waveId))draft.waveId=state.waves[0]?.id ?? '';
    const selectedWave=state.waves.find(w=>w.id===draft.waveId);
    const number=(name,label,value,max,min,help)=>numberControl({name,label,value,max,min,help});
    const selector = (name, label, options) => '<label class="ml-setting-row"><span>'+label+'</span><select name="'+name+'"><option value="">Choose an actor or group</option>'+options.map(g => '<option value="'+e(g.key)+'" '+(draft[name]===g.key?'selected':'')+'>'+e(g.name)+' ('+g.tokens.length+')'+(g.enemy?' - Enemy':'')+'</option>').join('')+'</select></label>';
    return `<div class="ml-stack">
        <header class="ml-section-heading"><div><h2>Mass Combat</h2><p>${e(scene.name)}</p></div><div class="ml-toolbar"><span class="ml-badge" data-tone="${combat?.started ? 'info' : 'warning'}">${combat?.started ? `Round ${combat.round}` : 'Combat not started'}</span></div></header>
        ${state.waves.length ? `<section data-mass-section="waves"><h2>Scheduled waves</h2><p>${state.waves.filter(w=>!w.paused).length}/${state.waves.length} waves enabled</p>
        ${state.pending ? '<span class="ml-status" data-tone="warning">Deployment interrupted. Resume Wave resumes it.</span>' : ''}
        ${state.waves.length ? state.waves.map(w => `<article class="ml-card ml-stack" data-ml-selectable-card data-state="${w.paused?'paused':'enabled'}"><div class="ml-section-heading" data-actions><label><input type="radio" name="waveId" value="${e(w.id)}" ${draft.waveId===w.id?'checked':''}><span>${e(w.name)}</span></label><span class="ml-badge" data-tone="${w.paused ? 'warning' : w.deployed >= w.repeats ? 'success' : 'info'}">${w.paused ? 'Paused - ' : ''}${w.deployed}/${w.repeats} deployed</span></div><dl class="ml-quantity-list"><dt>Creatures per deployment</dt><dd>${w.members.reduce((n,m)=>n+m.count,0)*w.multiplier}</dd><dt>Wave trigger</dt><dd>Start of round</dd><dt>First Spawn Round</dt><dd>${w.round}</dd><dt>Skipped Rounds Between Spawns</dt><dd>${w.interval - 1}</dd></dl></article>`).join('') : '<p class="ml-empty-message">No waves scheduled.</p>'}
        <p>Selected wave: <strong>${e(state.waves.find(w=>w.id===draft.waveId)?.name)}</strong></p>
        <div class="ml-actions">${actionButton('remove','Remove Wave')}${state.pending ? actionButton('deploy', 'Resume Wave') : ''}${actionButton('wave-enabled',selectedWave?.paused?'Enable Wave':'Pause Wave')}${actionButton('pause-all','Pause All Waves')}${actionButton('enable-all','Enable All Waves')}</div>
        <p>Pause Wave and Enable Wave apply to the selected card. All Waves controls apply to the entire schedule.</p>
        </section>` : ''}
        <section data-mass-section="prepare"><h2>Add a wave</h2><p>Prepare a saved combat roster.</p>
        <label class="ml-setting-row"><span>Saved Encounter</span><select name="encounterId"><option value="">Choose a saved combat encounter</option>${saved.map(s => `<option value="${e(s.id)}">${e(s.name)} — ${s.encounter.members.reduce((n,m)=>n+m.count,0)} creatures</option>`).join('')}</select></label>
        <div class="ml-stack">${number('round', 'First Spawn Round', 1, 10000, 1, 'Spawns at the beginning of this round, before normal initiative turns.')}${number('repeats', 'Total Spawn Rounds', 1, 100, 1, 'Total arrivals of this wave, including its first spawn.')}${number('skippedRounds', 'Skipped Rounds Between Spawns', 0, 9999, 0, 'Full rounds between arrivals. 0 means every round.')}${number('multiplier', 'Roster Multiplier', 1, 100, 1, 'Multiplies each creature quantity for every arrival; never compounds.')}</div>
        <div class="ml-actions">${actionButton('add', 'Add Wave')}</div>
        </section>
        ${combat?.started ? `<label class="ml-setting-row"><input type="checkbox" name="showGroupAttacks" ${draft.showGroupAttacks?'checked':''}><span class="ml-stack" data-gap="1">Show Group Attacks<small>Optional: resolve one attack at a time across living targets, cycling again when attackers outnumber targets. Preview before applying damage.</small></span></label>` : ''}
        ${combat?.started && draft.showGroupAttacks ? `<section data-mass-section="attacks"><h2>Group Attacks</h2><p>Resolve a group against an opposing actor or group.</p><div class="ml-stack">${selector("attackerGroup","Attack Group",available)}${selector("targetGroup","Attack Target",targetOptions)}</div><div class="ml-actions">${actionButton('resolve', 'Attack Targets')}${actionButton('apply', 'Apply Damage')}</div></section>` : ''}
        ${review ? `<section data-mass-section="review"><h2>${e(review.title)}</h2><p>Review this group before continuing.</p><div class="ml-stack">${review.content}</div><div class="ml-actions">${review.buttons.map(([action,label])=>actionButton(`review-${action}`,label)).join('')}</div></section>` : ''}
      </div>`;
  };
  const refresh = () => {
    if (!form.isConnected || panel.hidden) return;
    const core = getCoreApi();
    if (!core?.ui?.createCollapsibleSection) throw Error('Update Morelord Core to load its shared section components.');
    const scroll = panel.closest('.dialog-content');
    const top = scroll?.scrollTop;
    panel.innerHTML = content();
    const sections=new Map();
    for (const source of panel.querySelectorAll('[data-mass-section]')) {
      const title=source.querySelector(':scope > h2'), description=source.querySelector(':scope > p');
      const section=core.ui.createCollapsibleSection({key:'encounters.mass.'+source.dataset.massSection,title:title.textContent,description:description.textContent});
      if(source.dataset.massSection==='prepare' && waveStatus(scene).waves.length)section.dataset.mlSectionDefault='closed';
      sections.set(source.dataset.massSection,section);
      title.remove();description.remove();
      section.querySelector('.ml-collapsible-section__body').append(...source.childNodes);
      source.replaceWith(section);
    }
    const body=panel.querySelector(':scope > .ml-stack');
    for(const key of ['review','attacks','waves','prepare'])if(sections.has(key))body.append(sections.get(key));
    for (const [name,value] of Object.entries(draft)) {
      const input=panel.querySelector('[name="'+name+'"]');
      if(input && !['attackerGroup','targetGroup','waveId','showGroupAttacks'].includes(name)) input.value=value;
    }
    for (const select of panel.querySelectorAll('[name="attackerGroup"], [name="targetGroup"]')) {
      core.ui.decorateActorSelect?.(select,key=>[...groups(),...targets()].find(g=>g.key===key)?.actorUuid ?? key);
      select.parentElement.dataset.mlActorSelectLayout='inline';
    }
    core.ui.activateCollapsibleSections?.(null,panel);
    // An active question must remain visible even if an earlier review was collapsed.
    if(review && sections.has('review'))sections.get('review').open=true;
    review?.onChange?.({target:{}},panel);
    for(const input of panel.querySelectorAll('input,select'))core.ui.setDisabled(input,busy && !input.closest('[data-ml-section-key="encounters.mass.review"]')?'Wait for the current action to finish.':'');
    for(const button of panel.querySelectorAll('[data-action^="mass-"]')) {
      let reason=busy && !button.dataset.action.startsWith('mass-review-')?'Wait for the current action to finish.':'';
      if(button.dataset.action==='mass-apply' && !game.user.getFlag?.('morelord-encounters','massCombat')?.pendingId)reason='Resolve an attack preview first.';
      if(button.dataset.action==='mass-resolve' && (!draft.attackerGroup || !draft.targetGroup))reason='Choose an Attack Group and Attack Target first.';
      if(!reason && button.dataset.action==='mass-pause-all' && !waveStatus(scene).waves.some(w=>!w.paused))reason='All waves are already paused.';
      if(!reason && button.dataset.action==='mass-enable-all' && !waveStatus(scene).waves.some(w=>w.paused))reason='All waves are already enabled.';
      core.ui.setDisabled(button,reason);
    }
    activateNumberControls(panel);
    core.ui.activateCardSelection?.(null,form.closest('.ml-window'));
    if(scroll)scroll.scrollTop=top;
  };
  panel.addEventListener('click', async event => {
    const button=event.target.closest('[data-action^="mass-"]');
    if(!button || !panel.contains(button))return;
    event.preventDefault();event.stopImmediatePropagation();
    const action=button.dataset.action.slice(5);
    if(['resolve','apply'].includes(action) && !(game.combats.get(waveStatus(scene).combatId)?.started))return;
    if(action.startsWith('review-') && review){
      const resolve=review.resolve;review=null;resolve({action:action.slice(7),data:new FormData(panel.closest('form'))});return;
    }
    if(busy)return;
    busy=true;
    const currentOperation=operation;
    draft={...draft,...readDraft(new FormData(panel.closest('form')))};
    refresh();
    try {
      if (canvas.scene?.id!==scene.id) throw Error('Reopen Encounters on the scheduled combat scene.');
      if(action==='add'){const wave=await addWave(scene,waveInputFromForm(draft));draft.waveId=wave.id;}
      if(action==='remove')await removeWave(scene,draft.waveId);
      if(action==='deploy')await deployWaves(scene);
      if(action==='wave-enabled'){const wave=waveStatus(scene).waves.find(w=>w.id===draft.waveId);await setWaveEnabled(scene,draft.waveId,wave?.paused);}
      if(action==='pause-all')await setAutomatic(scene,false);
      if(action==='enable-all')await setAutomatic(scene,true);
      if(action==='attackers')await attacks.massCombat('attackers');
      if(action==='resolve'){
        await synchronizeAttackerTurn(scene,draft.attackerGroup);
        if(currentOperation!==operation)return;
        await attacks.massCombat('reconcile');
        if(!game.user.getFlag('morelord-encounters','massCombat')?.pendingId)await attacks.massCombat('attackers');
        if(currentOperation!==operation)return;
        await attacks.massCombat('resolve');
      }
      if(action==='apply')await attacks.massCombat('apply');
    } catch(error){console.error('Morelord Encounters | Mass combat',error);ui.notifications.error(error.message);}
    finally {if(currentOperation===operation){busy=false;refresh();}}
  },{capture:true});
  panel.addEventListener('change',event=>{
    draft={...draft,...readDraft(new FormData(panel.closest('form')))};
    review?.onChange?.(event,panel);
    if(event.target.name==='showGroupAttacks')draft.showGroupAttacks=event.target.checked;
    if(['attackerGroup','waveId','showGroupAttacks'].includes(event.target.name))refresh();
  });
  const hooks=['updateToken','createToken','deleteToken','updateCombat','deleteCombat','updateScene','deleteJournalEntry','createJournalEntry'].map(name=>[name,Hooks.on(name,(document,changes)=>{
    const ended=(name==='deleteCombat' || (name==='updateCombat' && Object.hasOwn(changes,'round') && !(document.round>0))) && combatUsesScene(document,scene);
    const version=waveStatus(scene).runResetVersion;
    if(ended || version!==resetVersion){resetVersion=version;resetLocal();}
    if(!busy)refresh();
  })]);
  const app=[...foundry.applications.instances.values()].find(app=>app.id==='morelord-encounters-configure');
  const dispose=()=>{if(review){review.resolve(null);review=null;}for(const [name,id] of hooks)Hooks.off(name,id);panels.delete(form);};
  app?.addEventListener('close',dispose,{once:true});
  const controller={panel,refresh,dispose};
  panels.set(form,controller);
  busy=true;
  try{await synchronizeMobTurns(scene);await attacks.massCombat('reconcile');}catch(error){ui.notifications.error(error.message);}finally{busy=false;}
  refresh();
  return controller;
}

export function openMassCombat() {
  const form=document.querySelector('#morelord-encounters-configure .ml-encounters-source-form');
  if(!form)throw Error('Open Morelord Encounters and select Mass Combat.');
  return mountMassCombat(form);
}

import { getSavedEncounters } from '../services/saved-encounter-service.mjs';
import { addWave, removeWave, setAutomatic, waveStatus, deployWaves, creatureGroups, defaultAttackerGroup, synchronizeMobTurns, combatUsesScene, waveRoster, waveInputFromForm, synchronizeAttackerTurn } from '../services/mass-combat-service.mjs';
import { createMassCombat } from '../../../morelord-core/scripts/services/mass-combat.mjs';
import { getCoreApi } from '../core/core-api.mjs';

const e = value => foundry.utils.escapeHTML(String(value ?? ''));
const number = (name, label, value, max, min = 1) => `<label class="ml-setting-row"><span>${label}</span><input name="${name}" type="number" min="${min}" max="${max}" step="1" value="${value}" required></label>`;
const actionButton = (action, label) => `<button type="button" data-action="mass-${action}">${label}</button>`;

const panels = new WeakMap();
export async function mountMassCombat(form) {
  if (!game.user.isGM || !canvas.ready || !canvas.scene) throw Error('Open a scene as GM first.');
  const scene = canvas.scene;
  const existing = panels.get(form);
  if (existing) {await synchronizeMobTurns(scene);return existing;}
  let panel = form.querySelector('.ml-encounters-mass-panel');
  if (!panel) { panel = document.createElement('section'); panel.className='ml-stack ml-encounters-mass-panel'; form.append(panel); }
  let draft = {}, busy = false, activeTurn, review = null, operation = 0;
  let resetVersion = waveStatus(scene).runResetVersion;
  const resetLocal = () => {
    operation++;busy=false;draft={};activeTurn=undefined;
    if(review){const resolve=review.resolve;review=null;resolve(null);}
  };
  const readDraft = data => Object.fromEntries([...data].filter(([name])=>['encounterId','round','repeats','skippedRounds','multiplier','waveId','attackerGroup','targetGroup'].includes(name)));
  const groups = () => creatureGroups(scene);
  const attacks = createMassCombat('morelord-encounters', {
    selectedTokens: role => groups().find(g => g.key === draft[role === 'attackers' ? 'attackerGroup' : 'targetGroup'])?.tokens ?? [],
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
    if (!available.some(g => g.key === draft.targetGroup) || draft.targetGroup === draft.attackerGroup) draft.targetGroup = available.find(g => g.key !== draft.attackerGroup)?.key ?? '';
    const selector = (name, label, options) => '<label class="ml-setting-row"><span>'+label+'</span><select name="'+name+'"><option value="">Choose a creature type</option>'+options.map(g => '<option value="'+e(g.key)+'" '+(draft[name]===g.key?'selected':'')+'>'+e(g.name)+' ('+g.tokens.length+')</option>').join('')+'</select></label>';
    return `<div class="ml-stack">
        <header class="ml-section-heading"><div><h2>Mass Combat</h2><p>${e(scene.name)}</p></div><div class="ml-toolbar"><span class="ml-badge" data-tone="${combat?.started ? 'info' : 'warning'}">${combat?.started ? `Round ${combat.round}` : 'Combat not started'}</span></div></header>
        <section data-mass-section="waves"><h2>Scheduled waves</h2><p>${state.automatic ? 'Automatic wave turns enabled' : 'Wave turns paused'}</p>
        ${state.pending ? '<span class="ml-status" data-tone="warning">Deployment interrupted. Resume Wave resumes it.</span>' : ''}
        ${state.waves.length ? state.waves.map(w => `<article class="ml-card ml-stack"><div class="ml-section-heading"><h3>${e(w.name)}</h3><span class="ml-badge" data-tone="${w.deployed >= w.repeats ? 'success' : 'info'}">${w.deployed}/${w.repeats} deployed</span></div><dl class="ml-quantity-list"><dt>Creatures per deployment</dt><dd>${w.members.reduce((n,m)=>n+m.count,0)*w.multiplier}</dd><dt>Initiative</dt><dd>${combat?.combatants.find(c=>c.id===w.combatantId)?.initiative ?? w.initiative ?? "Pending"}</dd><dt>First Spawn Round</dt><dd>${w.round}</dd><dt>Skipped Rounds Between Spawns</dt><dd>${w.interval - 1}</dd></dl></article>`).join('') : '<p class="ml-empty-message">No waves scheduled.</p>'}
        ${state.waves.length ? `<label class="ml-setting-row"><span>Wave to Remove</span><select name="waveId">${state.waves.map(w => `<option value="${e(w.id)}">${e(w.name)} (${w.deployed}/${w.repeats})</option>`).join('')}</select></label><div class="ml-actions">${actionButton('remove', 'Remove Wave')}</div>` : ''}
        <div class="ml-actions">${state.pending ? actionButton('deploy', 'Resume Wave') : ''}${actionButton('automatic', state.automatic ? 'Pause Wave Turns' : 'Enable Wave Turns')}</div>
        </section>
        <section data-mass-section="prepare"><h2>Add a wave</h2><p>Prepare a saved combat roster.</p>
        <label class="ml-setting-row"><span>Saved Encounter</span><select name="encounterId"><option value="">Choose a saved combat encounter</option>${saved.map(s => `<option value="${e(s.id)}">${e(s.name)} — ${s.encounter.members.reduce((n,m)=>n+m.count,0)} creatures</option>`).join('')}</select></label>
        <div class="ml-stack">${number('round', 'First Spawn Round', 1, 10000)}${number('repeats', 'Total Spawn Rounds', 1, 100)}${number('skippedRounds', 'Skipped Rounds Between Spawns', 0, 9999, 0)}${number('multiplier', 'Roster Multiplier', 1, 100)}</div>
        <div class="ml-actions">${actionButton('add', 'Add Wave')}</div>
        </section>
        <section data-mass-section="attacks"><h2>Group attacks</h2><p>Resolve the active mob against another creature type.</p><div class="ml-stack">${selector("attackerGroup","Attacker Type",available)}${selector("targetGroup","Target Type",available.filter(g=>g.key!==draft.attackerGroup))}</div><div class="ml-actions">${actionButton('resolve', 'Attack Targets')}${actionButton('apply', 'Apply Damage')}</div></section>
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
      if(input && name!=='attackerGroup' && name!=='targetGroup') input.value=value;
    }
    for (const select of panel.querySelectorAll('[name="attackerGroup"], [name="targetGroup"]')) {
      core.ui.decorateActorSelect?.(select,key=>groups().find(g=>g.key===key)?.actorUuid ?? key);
      select.parentElement.dataset.mlActorSelectLayout='inline';
    }
    core.ui.activateCollapsibleSections?.(null,panel);
    // An active question must remain visible even if an earlier review was collapsed.
    if(review && sections.has('review'))sections.get('review').open=true;
    review?.onChange?.({target:{}},panel);
    for(const input of panel.querySelectorAll('input,select'))input.disabled=busy && !input.closest('[data-ml-section-key="encounters.mass.review"]');
    for (const button of panel.querySelectorAll('[data-action^="mass-"]')) {
      button.disabled=busy && !button.dataset.action.startsWith('mass-review-');
      if(button.dataset.action==='mass-apply' && !game.user.getFlag?.('morelord-encounters','massCombat')?.pendingId)button.disabled=true;
      if(button.dataset.action==='mass-resolve' && (!draft.attackerGroup || !draft.targetGroup))button.disabled=true;
    }
    if(scroll)scroll.scrollTop=top;
  };
  panel.addEventListener('click', async event => {
    const button=event.target.closest('[data-action^="mass-"]');
    if(!button || !panel.contains(button))return;
    event.preventDefault();event.stopImmediatePropagation();
    const action=button.dataset.action.slice(5);
    if(action.startsWith('review-') && review){
      const resolve=review.resolve;review=null;resolve({action:action.slice(7),data:new FormData(panel.closest('form'))});return;
    }
    if(busy)return;
    busy=true;
    const currentOperation=operation;
    draft={...draft,...readDraft(new FormData(panel.closest('form')))};
    try {
      if (canvas.scene?.id!==scene.id) throw Error('Reopen Encounters on the scheduled combat scene.');
      if(action==='add')await addWave(scene,waveInputFromForm(draft));
      if(action==='remove')await removeWave(scene,draft.waveId);
      if(action==='deploy')await deployWaves(scene);
      if(action==='automatic')await setAutomatic(scene,!waveStatus(scene).automatic);
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
    if(event.target.name==='attackerGroup')refresh();
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

import { addWave, deployWaves, setAutomatic, creatureGroups, synchronizeMobTurns, synchronizeAttackerTurn } from '../services/mass-combat-service.mjs';
import { saveEncounter } from '../services/saved-encounter-service.mjs';
import { assert } from '../../../morelord-core/scripts/testing/in-game.js';

export const massCombatEntryCheck = {
  id: 'morelord-encounters.fourth-encounter-type',
  async run() {
    assert(game.world.id === 'dev1' && game.user.isGM, 'Run only as GM in Dev1');
    const ids=['morelord-encounters-configure','morelord-encounters-mass-combat'];
    assert(!ids.some(id=>document.getElementById(id)), 'Close the encounter builder and Mass Combat first');
    const until=async read=>{
      const end=Date.now()+20000;
      while(Date.now()<end){const value=read();if(value)return value;await new Promise(resolve=>setTimeout(resolve,30));}
      throw Error('Mass Combat condition timed out: '+read.toString()+'; notices: '+notices.join(' | '));
    };
    const {configureEncounter}=await import('../apps/encounter-builder-dialog.mjs');
    let pending,closed=false;
    const notices=[],notify=ui.notifications.error;
    ui.notifications.error=function(message,...args){notices.push(String(message));return notify.call(this,message,...args);};
    try {
      pending=configureEncounter({initial:{encounterSource:'mass'}});
      pending.then(()=>{closed=true;});
      const form=await until(()=>document.querySelector('#morelord-encounters-configure .ml-encounters-source-form'));
      const modes=[...form.querySelectorAll('[name="encounterMode"]')];
      assert(modes.length===4 && modes[3].value==='mass' && modes[3].checked,'Mass Combat is the selected fourth encounter type');
      assert(form.querySelector('.ml-encounters-party-section').hidden && form.querySelector('.ml-encounters-source-section').hidden,'Mass Combat requires no party or monster-source setup');
      const panel=await until(()=>form.querySelector('.ml-encounters-mass-panel [name="encounterId"]')?.closest('.ml-encounters-mass-panel'));
      assert(!document.getElementById('morelord-encounters-mass-combat'),'No separate Mass Combat window');
      assert([...panel.querySelector('[name=encounterId]').options].some(o=>o.textContent.includes('Monster Manual wave fixture — 14 creatures')),'Saved published roster dropdown totals rolled quantities');
      assert(panel.querySelectorAll('.ml-collapsible-section').length===3,'Core section components render inside Encounters');
      await globalThis.__morelordMassVisual?.();
      assert(panel.querySelector('[name="attackerGroup"]') && panel.querySelector('[name="targetGroup"]'),'NPC creature dropdowns are present');
      assert(!panel.querySelector('[data-action="documentation"]'),'No extra Documentation button');
      panel.querySelector('[data-action="mass-add"]').click();
      await new Promise(resolve=>setTimeout(resolve,250));
      assert(form.querySelector('.ml-encounters-mass-panel')===panel,'Actions preserve the same embedded panel');
      const targets=panel.querySelector('[name="targetGroup"]');
      if(targets.value){
        panel.querySelector('[data-action="mass-resolve"]').click();
        await until(()=>panel.querySelector('[name="bonus"]'));
        for(const [name,value] of [['bonus','20'],['attacks','1'],['damage','2'],['critical','4']])panel.querySelector('[name="'+name+'"]').value=value;
        assert(!document.getElementById('morelord-encounters-mass-attack'),'Attack review stays inside Encounters');
        panel.querySelector('[data-action="mass-review-roll"]').click();
        await until(()=>game.user.getFlag('morelord-encounters','massCombat')?.pendingId);
        const message=game.messages.get(game.user.getFlag('morelord-encounters','massCombat').pendingId);
        const batch=message.getFlag('morelord-encounters','massCombat');
        assert(batch.result.rows.every(row=>canvas.scene.tokens.get(row.id).actor.system.attributes.hp.value===row.before.hp),'Preview keeps HP unchanged');
        assert(batch.combatId===canvas.scene.getFlag('morelord-encounters','massCombatWaves').combatId,'New previews record their native combat ID');
        await until(()=>!panel.querySelector('[data-action="mass-resolve"]').disabled);
        panel.querySelector('[data-action="mass-resolve"]').click();
        await until(()=>panel.querySelector('[data-action="mass-review-apply"]'));
        assert(panel.textContent.includes('targets hit') && !panel.textContent.includes('waiting in GM chat'),'Current pending preview shows its summary inside Encounters');
        assert(panel.querySelector('[data-action="mass-review-cancel"]').textContent==='Close Review','Closing review clearly retains a valid preview');
        panel.querySelector('[data-action="mass-review-cancel"]').click();
        await until(()=>!panel.querySelector('[data-action="mass-resolve"]').disabled);
        assert(game.user.getFlag('morelord-encounters','massCombat').pendingId===message.id,'Close Review retains a current-combat preview');
        await until(()=>!panel.querySelector('[data-action="mass-apply"]').disabled);
        panel.querySelector('[data-action="mass-apply"]').click();
        await until(()=>!game.user.getFlag('morelord-encounters','massCombat')?.pendingId);
        assert(batch.result.rows.every(row=>canvas.scene.tokens.get(row.id).actor.system.attributes.hp.value===row.hp),'Embedded Apply Damage commits the preview');
        assert(message.content.includes('targets hit') && message.content.includes('total damage') && !message.content.includes('ml-item-row'),'Attack card summarizes targets and damage without individual target rows');
        const key=JSON.stringify(['morelord-core.sections',game.world.id,game.user.id,'encounters.mass.review']);
        const previous=localStorage.getItem(key);
        try {
          localStorage.setItem(key,'false');
          const combat=game.combats.get(canvas.scene.getFlag('morelord-encounters','massCombatWaves').combatId);
          await combat.update({round:2});
          const stale=await ChatMessage.create({speaker:ChatMessage.getSpeaker(),content:'Stale previous-combat regression preview',whisper:[game.user.id],flags:{'morelord-encounters':{massCombat:{...foundry.utils.deepClone(batch),combatId:'previous-combat',stage:'preview'}}}});
          await game.user.setFlag('morelord-encounters','massCombat',{...game.user.getFlag('morelord-encounters','massCombat'),pendingId:stale.id});
          panel.querySelector('[data-action="mass-resolve"]').click();
          await until(()=>panel.querySelector('[name="bonus"]'));
          assert(stale.getFlag('morelord-encounters','massCombat').stage==='discarded','Previous-combat preview is discarded before a fresh attack');
          assert(batch.result.rows.every(row=>canvas.scene.tokens.get(row.id).actor.system.attributes.hp.value===row.hp),'Discarding stale preview applies no additional damage');
          await stale.delete();
          assert(panel.querySelector('[data-ml-section-key="encounters.mass.review"]').open,'Second-round attack review is visible despite saved collapsed state');
          assert(!panel.querySelector('[data-action="mass-review-cancel"]').disabled,'Active review always has an enabled Cancel action');
          await combat.update({round:0,turn:null});
          await until(()=>!canvas.scene.getFlag('morelord-encounters','massCombatWaves').waves.length && !game.user.getFlag('morelord-encounters','massCombat'));
          await until(()=>!panel.querySelector('[name="bonus"]') && !panel.querySelector('[data-action="mass-resolve"]').disabled);
          assert(panel.textContent.includes('No waves scheduled.'),'Ending combat immediately clears wave definitions without switching tabs');
          panel.querySelector('[data-action="mass-resolve"]').click();
          await until(()=>panel.querySelector('[name="bonus"]'));
          panel.querySelector('[data-action="mass-review-cancel"]').click();
          await until(()=>!panel.querySelector('[data-action="mass-resolve"]').disabled);
        } finally {if(previous==null)localStorage.removeItem(key);else localStorage.setItem(key,previous);}
      }
      const roster=form.querySelector('[name="encounterMode"][value="roster"]');roster.checked=true;roster.dispatchEvent(new Event('change',{bubbles:true}));
      assert(panel.hidden,'Other encounter types hide the mass panel');
      modes[3].checked=true;modes[3].dispatchEvent(new Event('change',{bubbles:true}));
      assert(!panel.hidden,'Returning to Mass Combat reuses its panel');
      for(const builder of foundry.applications.instances.values())if(builder.id==='morelord-encounters-configure')await builder.close();
      await pending;
    } finally {
      for(const app of foundry.applications.instances.values())if(ids.includes(app.id))await app.close();
      await pending;
      ui.notifications.error=notify;
    }
  }
};

export const massCombatCheck = {
  id: 'morelord-encounters.saved-roster-waves',
  async run() {
    assert(game.world.id === 'dev1' && game.user.isGM, 'Run only as GM in Dev1');
    let actor, huskActor, defenderActor, scene, combat, journal;
    try {
      actor = await Actor.create({name:'Mass Combat regression Haze Wight',type:'npc',system:{attributes:{hp:{value:10,max:10}}}});
      huskActor = await Actor.create({name:'Mass Combat regression Haze Husk',type:'npc',system:{attributes:{hp:{value:10,max:10}}}});
      defenderActor = await Actor.create({name:'Mass Combat regression defender',type:'character'});
      scene = await Scene.create({name:'Mass Combat regression scene',width:3000,height:2000,padding:0,grid:{type:1,size:100}});
      const defender = (await defenderActor.getTokenDocument({x:1500,y:1000,actorLink:false},{parent:scene})).toObject();
      const [token] = await scene.createEmbeddedDocuments('Token',[defender]);
      combat = await Combat.create({scene:scene.id,combatants:[{tokenId:token.id,actorId:defenderActor.id,sceneId:scene.id,initiative:17}]});
      const saved = await saveEncounter('Mass Combat regression roster',{published:true,members:[{uuid:actor.uuid,name:actor.name,count:1,rolledQuantity:4},{uuid:huskActor.uuid,name:huskActor.name,count:1,rolledQuantity:10}]});
      journal = game.journal.get(saved.id);
      const wave=await addWave(scene,{encounterId:saved.id,round:3,interval:2,repeats:2});
      const legacy=foundry.utils.deepClone(scene.getFlag('morelord-encounters','massCombatWaves'));
      legacy.waves[0].rosterQuantityVersion=null;
      legacy.waves[0].members.forEach((m,i)=>{m.count=1;m.rolledQuantity=[4,10][i];});
      await scene.setFlag('morelord-encounters','massCombatWaves',legacy);
      await synchronizeMobTurns(scene);
      assert(scene.getFlag('morelord-encounters','massCombatWaves').waves[0].members.reduce((n,m)=>n+m.count,0)===14,'Legacy published wave snapshots recover saved rolled quantities');
      await combat.startCombat();
      const until=async read=>{const end=Date.now()+10000;while(Date.now()<end){if(read())return;await new Promise(r=>setTimeout(r,30));}throw Error('Automatic wave deployment timed out');};
      const creatures=()=>scene.tokens.filter(t=>!t.getFlag('morelord-encounters','massCombatScheduler'));
      const waveTurn=()=>combat.turns.findIndex(c=>c.id===wave.combatantId);
      await combat.update({round:1,turn:waveTurn()});
      await new Promise(r=>setTimeout(r,150));assert(creatures().length===1,'A round-3 wave does not deploy on its round-1 turn');
      await combat.update({round:2,turn:waveTurn()});
      await new Promise(r=>setTimeout(r,150));assert(creatures().length===1,'A round-3 wave does not deploy in round 2');
      await combat.update({round:3,turn:waveTurn()});
      await until(()=>scene.getFlag('morelord-encounters','massCombatWaves')?.waves[0]?.deployed===1);
      assert(creatures().length===15 && combat.combatants.size===4,'Four wights and ten husks spawn on the due initiative turn with two mob turns');
      assert(creatures().filter(t=>t.id!==token.id).every(t=>!t.actorLink),'Troops have independent HP');
      assert(combat.combatants.find(c=>c.tokenId===token.id).initiative===17,'Player initiative preserved');
      assert(creatureGroups(scene).length===2,'NPC dropdowns exclude the player character');
      await combat.update({round:4,turn:waveTurn()});
      await new Promise(r=>setTimeout(r,150));assert(creatures().length===15,'Two-round cadence skips round 4');
      await combat.update({round:5,turn:waveTurn()});
      await until(()=>scene.getFlag('morelord-encounters','massCombatWaves')?.waves[0]?.deployed===2);
      assert(creatures().length===29 && combat.combatants.size===3,'Final arrival reuses mob turns and removes its completed wave slot');
      const arrivals=game.messages.filter(m=>String(m.getFlag('morelord-encounters','massCombatArrival')??'').startsWith(wave.id+':'));
      assert(arrivals.length===2 && arrivals.every(m=>m.whisper.length>0),'Each arrival has one private Core chat card');
      await combat.update({round:0,turn:null});
      await until(()=>!scene.getFlag('morelord-encounters','massCombatWaves')?.combatId);
      assert(scene.getFlag('morelord-encounters','massCombatWaves').waves.length===0,'Ending combat clears wave definitions');
      assert(creatures().length===29,'Ending combat retains deployed creatures');
      await addWave(scene,{encounterId:saved.id,round:3,repeats:2});
      await combat.delete();combat=null;
      await until(()=>!scene.getFlag('morelord-encounters','massCombatWaves')?.combatId);
      assert(scene.getFlag('morelord-encounters','massCombatWaves').waves.length===0,'Deleting combat clears wave definitions');
      await scene.setFlag('morelord-encounters','massCombatWaves',{combatId:'missing-combat',waves:[wave]});
      await synchronizeMobTurns(scene);
      assert(!scene.getFlag('morelord-encounters','massCombatWaves').waves.length,'Opening without combat clears a stale schedule');
      for(const arrival of arrivals)await arrival.delete();
    } finally {
      for(const message of game.messages.filter(m=>m.speaker?.scene===scene?.id || [actor?.id,huskActor?.id,defenderActor?.id].filter(Boolean).includes(m.speaker?.actor) || String(m.getFlag('morelord-encounters','massCombatArrival')??'').startsWith(scene?.getFlag('morelord-encounters','massCombatWaves')?.waves[0]?.id+':')))await message.delete();
      // Disable hooks and drain any local deployment before deleting only this test's fixtures.
      try {
        if(scene && combat) { await setAutomatic(scene,false); await deployWaves(scene).catch(()=>{}); }
      } finally {
        try { await combat?.delete(); }
        finally {
          try { await scene?.delete(); }
          finally { try { await journal?.delete(); } finally { try { await actor?.delete(); } finally { try { await defenderActor?.delete(); } finally { await huskActor?.delete(); } } } }
        }
      }
    }
  }
};

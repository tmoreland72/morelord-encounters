import {assert} from '../../../morelord-core/scripts/testing/in-game.js';
import {configureEncounter} from '../apps/encounter-builder-dialog.mjs';
import {createMassCombat} from '../../../morelord-core/scripts/services/mass-combat.mjs';
const ID='morelord-encounters';
const until=async read=>{const end=Date.now()+30000;while(Date.now()<end){const value=read();if(value)return value;await new Promise(r=>setTimeout(r,30));}throw Error('Activity regression timed out: '+read);};
export const massCombatActivitiesCheck={
 id:'morelord-encounters.activity-selection-and-native-saves',
 async run(){
  assert(game.world.id==='dev1' && game.user.isGM,'Dev1 GM only');
  const actors=[];let scene,combat,pending;const original=canvas.scene?.id;
  const prior=foundry.utils.deepClone(game.user.getFlag(ID,'massCombat'));
  const priorGM=foundry.utils.deepClone(game.user.getFlag('morelord-game-master','massCombat'));
  try{
   const attacker=await Actor.create({name:'Activity attacker fixture',type:'npc',system:{abilities:{dex:{value:16},str:{value:14}},attributes:{hp:{value:100,max:100}}}});actors.push(attacker);
   const target=await Actor.create({name:'Saving throw target fixture',type:'npc',system:{abilities:{dex:{value:10}},attributes:{hp:{value:100,max:100}}}});actors.push(target);
   const attack=(id,name,die,type)=>({name,type:'weapon',system:{type:{value:'martialR'},damage:{base:{number:1,denomination:die,bonus:'2',types:[type]}},activities:{[id]:{type:'attack',attack:{bonus:'5',flat:true,type:{value:'ranged',classification:'weapon'}},damage:{includeBase:true,parts:[]}}}}});
   const save=(id,name,onSave)=>({name,type:'feat',system:{activities:{[id]:{
    type:'save',save:{ability:['dex'],dc:{calculation:'',formula:'13'}},
    damage:{onSave,parts:[{number:4,denomination:6,bonus:'',types:['fire']}]},
    target:{template:{type:'cone',size:'15'},affects:{type:'creature',count:''}}
   }}}});
   await attacker.createEmbeddedDocuments('Item',[attack('longbowAttack001','Longbow',8,'piercing'),attack('shortswordAtk001','Shortsword',6,'piercing'),save('halfDamageSave01','Flame Burst','half'),save('noDamageSave0001','Static Burst','none')]);
   scene=await Scene.create({name:'Mass Combat activity regression',width:3000,height:2000,padding:0,grid:{type:1,size:100}});
   const data=[];
   for(const [i,actor] of [attacker,target,target].entries())data.push((await actor.getTokenDocument({x:500+i*200,y:500,actorLink:false},{parent:scene})).toObject());
   await scene.createEmbeddedDocuments('Token',data);
   const placed=[scene.tokens.find(t=>t.actorId===attacker.id),...scene.tokens.filter(t=>t.actorId===target.id).sort((a,b)=>a.x-b.x)];
   await placed[1].actor.update({'system.attributes.hp.temp':3});
   await placed[2].actor.update({'system.traits.dr.value':['fire']});
   combat=await Combat.create({scene:scene.id,combatants:placed.map((t,i)=>({tokenId:t.id,actorId:t.actorId,sceneId:scene.id,initiative:20-i}))});
   await scene.view();
   await game.user.unsetFlag(ID,'massCombat');
   pending=configureEncounter({initial:{encounterSource:'mass'}});
   const panel=await until(()=>document.querySelector('.ml-encounters-mass-panel [name=attackerGroup]')?.closest('.ml-encounters-mass-panel'));
   await combat.startCombat();
   const select=(name,value)=>{const input=panel.querySelector('[name="'+name+'"]');assert(input,'Missing '+name);input.value=value;input.dispatchEvent(new Event('change',{bubbles:true}));};
   select('attackerGroup','Actor.'+attacker.id);select('targetGroup','Actor.'+target.id);
   const open=async()=>{await until(()=>!panel.querySelector('[data-action=mass-resolve]').disabled);panel.querySelector('[data-action=mass-resolve]').click();return until(()=>panel.querySelector('[name=activityId]'));};
   const menu=await open();
   const option=name=>[...menu.options].find(o=>o.textContent.startsWith(name))?.value;
   assert(option('Longbow') && option('Shortsword') && option('Flame Burst') && option('Static Burst'),'Activity dropdown includes both weapons and saving-throw abilities');
   select('activityId',option('Longbow'));const bow=Number(panel.querySelector('[name=damage]').value);
   select('activityId',option('Shortsword'));const sword=Number(panel.querySelector('[name=damage]').value);
   assert(Number.isFinite(bow) && Number.isFinite(sword) && bow>sword,'Switching weapons updates native average damage');
   select('activityId',option('Flame Burst'));
   assert(panel.querySelector('[name=onSave]').value==='half' && panel.querySelector('[name=dc]').value==='13','Saving activity supplies native DC and half-damage success rule');
   assert(!panel.querySelector('[name=bonus]') && !panel.querySelector('[name=critical]'),'Saving activity replaces attack and critical fields');
   assert(panel.querySelector('[name=coverage]').value==='all','Area template defaults to all selected targets per use');
   await globalThis.__morelordActivityVisual?.();
   const resolve=async(dc,onSave)=>{
    panel.querySelector('[name=dc]').value=String(dc);panel.querySelector('[name=damage]').value='8';if(onSave)select('onSave',onSave);
    panel.querySelector('[data-action=mass-review-roll]').click();
    const id=await until(()=>game.user.getFlag(ID,'massCombat')?.pendingId);
    const message=game.messages.get(id),batch=message.getFlag(ID,'massCombat');
    assert(batch.profile.kind==='save' && batch.result.rows.length===2,'One group result contains native saves for both target tokens');
    assert(message.whisper.length>0 && message.rolls.length===2,'Native saving rolls are grouped into one private result');
    return batch;
   };
   let batch=await resolve(1);
   assert(batch.result.passed===2 && batch.result.failed===0,'Low DC produces successful native saving throws');
   assert(batch.result.rows.find(r=>r.id===placed[1].id)?.damage===4 && batch.result.rows.find(r=>r.id===placed[2].id)?.damage===2,'Half damage stacks with native fire resistance: '+JSON.stringify({rows:batch.result.rows.map(r=>({id:r.id,damage:r.damage,passed:r.passed})),expected:placed.slice(1).map(t=>t.id)}));
   assert(placed[1].actor.system.attributes.hp.value===100 && placed[1].actor.system.attributes.hp.temp===3,'Preview leaves HP and temporary HP unchanged');
   panel.querySelector('[data-action=mass-apply]').click();await until(()=>!game.user.getFlag(ID,'massCombat')?.pendingId);
   assert(placed[1].actor.system.attributes.hp.value===99 && placed[1].actor.system.attributes.hp.temp===0 && placed[2].actor.system.attributes.hp.value===98,'Apply Damage commits native defenses and temporary HP');
   let next=await open();select('activityId',[...next.options].find(o=>o.textContent.startsWith('Static Burst')).value);
   assert(panel.querySelector('[name=onSave]').value==='none','Other saving activity supplies native no-damage success rule');
   batch=await resolve(1);assert(batch.result.passed===2 && batch.result.rows.every(r=>r.damage===0),'Successful no-damage saves cause no HP loss');
   panel.querySelector('[data-action=mass-apply]').click();await until(()=>!game.user.getFlag(ID,'massCombat')?.pendingId);
   next=await open();select('activityId',[...next.options].find(o=>o.textContent.startsWith('Flame Burst')).value);
   batch=await resolve(100);assert(batch.result.failed===2 && batch.result.rows.find(r=>r.id===placed[1].id).damage===8 && batch.result.rows.find(r=>r.id===placed[2].id).damage===4,'Failed native saves use full damage before resistance');
   panel.querySelector('[data-action=mass-apply]').click();await until(()=>!game.user.getFlag(ID,'massCombat')?.pendingId);
   assert(placed[1].actor.system.attributes.hp.value===91 && placed[2].actor.system.attributes.hp.value===94,'Failed-save damage is applied exactly once');
   const native=createMassCombat('morelord-game-master',{selectedTokens:role=>role==='attackers'?[placed[0]]:placed.slice(1)});
   await native.massCombat('attackers');
   const nativeReview=native.massCombat('resolve');
   try {
    const dialog=await until(()=>document.querySelector('#morelord-game-master-mass-attack [name=activityId]')?.closest('.application'));
    const selectNative=name=>{const input=dialog.querySelector('[name=activityId]');input.value=[...input.options].find(o=>o.textContent.startsWith(name)).value;input.dispatchEvent(new Event('change',{bubbles:true}));};
    selectNative('Longbow');const bowDamage=Number(dialog.querySelector('[name=damage]').value);
    selectNative('Shortsword');assert(bowDamage>Number(dialog.querySelector('[name=damage]').value),'Game Master native dialog also updates weapon fields');
    selectNative('Static Burst');assert(dialog.querySelector('[name=onSave]').value==='none' && !dialog.querySelector('[name=bonus]'),'Game Master native dialog also switches to saving-throw fields');
    dialog.querySelector('[data-action=cancel]').click();await nativeReview;
   } finally {for(const app of foundry.applications.instances.values())if(app.id==='morelord-game-master-mass-attack')await app.close();await nativeReview;}
  }finally{
   for(const app of foundry.applications.instances.values())if(app.id==='morelord-encounters-configure')await app.close();
   await pending;
   await game.user.unsetFlag(ID,'massCombat');
   if(combat && game.combats.has(combat.id)){await combat.delete();await until(()=>!scene.getFlag(ID,'massCombatWaves')?.combatId);}
   for(const message of game.messages.filter(m=>m.getFlag(ID,'massCombat')?.sceneId===scene?.id || m.speaker?.scene===scene?.id || actors.some(a=>a.id===m.speaker?.actor)))await message.delete();
   if(original && game.scenes.has(original))await game.scenes.get(original).view();
   if(scene && game.scenes.has(scene.id))await scene.delete();
   for(const actor of actors)await actor.delete();
   if(prior!==undefined)await game.user.setFlag(ID,'massCombat',prior);
   await game.user.unsetFlag('morelord-game-master','massCombat');
   if(priorGM!==undefined)await game.user.setFlag('morelord-game-master','massCombat',priorGM);
  }
 }
};

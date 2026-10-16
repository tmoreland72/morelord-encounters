import {assert} from '../../../morelord-core/scripts/testing/in-game.js';
import {massCombatActivities} from '../../../morelord-core/scripts/services/mass-combat-profiles.mjs';
import {createMassCombat} from '../../../morelord-core/scripts/services/mass-combat.mjs';
export const combinedAttackCheck={id:'morelord-encounters.combined-on-hit-save-and-multiattack',async run(){
 assert(game.world.id==='dev1' && game.user.isGM,'Dev1 GM only');
 const prior=foundry.utils.deepClone(game.user.getFlag('morelord-encounters','massCombat')),original=canvas.scene?.id;
 let attacker,target,scene;
 try{
  const source=game.actors.find(a=>a.name==='Haze Wight' && a.items.some(i=>i.name==='Contaminated Blast'));
  assert(source,'Installed combined-attack source is available');
  attacker=await Actor.create({...source.toObject(),_id:undefined,name:'Combined attack regression fixture'});
  const profiles=await massCombatActivities(attacker),blast=profiles.find(c=>c.profile.label.startsWith('Contaminated Blast'));
  assert(blast && profiles.length===1,'One attack choice includes the attached save');
  assert(blast.profile.attacks===2 && blast.profile.saves.length===1 && blast.profile.saves[0].damage===0,'Native Multiattack and zero-damage save are read correctly');
  assert(blast.profile.saves[0].oncePerTarget,'First-hit-only saving throw is recognized');
  // High bonus and advantage make an accidental all-miss fixture negligible; natural ones still miss.
  await blast.activity.update({'attack.flat':true,'attack.bonus':'100'});
  target=await Actor.create({name:'Combined target fixture',type:'npc',system:{attributes:{hp:{value:1000,max:1000}}}});
  scene=await Scene.create({name:'Combined attack regression',width:2000,height:2000,grid:{type:1,size:100}});
  for(const [i,actor] of [attacker,target].entries())await scene.createEmbeddedDocuments('Token',[(await actor.getTokenDocument({x:500+i*200,y:500,actorLink:false},{parent:scene})).toObject()]);
  await scene.view();
  const a=scene.tokens.find(t=>t.actorId===attacker.id),t=scene.tokens.find(t=>t.actorId===target.id);
  await game.user.unsetFlag('morelord-encounters','massCombat');
  const api=createMassCombat('morelord-encounters',{selectedTokens:role=>role==='attackers'?[a]:[t],presentForm:async config=>{
   assert(config.content.includes('On hit: DC 13 con'),'Review shows the attached save');
   const p=(await massCombatActivities(a.actor))[0].profile;
   return {action:'roll',data:new Map(Object.entries({...p,attacks:'2',bonus:'100',damage:String(p.damage),critical:String(p.critical),kind:'attack',mode:'advantage'}))};
  }});
  await api.massCombat('attackers');await api.massCombat('resolve');
  const message=game.messages.get(game.user.getFlag('morelord-encounters','massCombat')?.pendingId),batch=message?.getFlag('morelord-encounters','massCombat');
  assert(batch?.result.hits>0,'Combined attack resolves without an invalid damage error');
  assert(batch.result.rows[0].saves.length===1 && message.rolls.length===2,'Repeated hits produce exactly one native on-hit save');
  const projected=batch.result.rows[0].hp;
  await api.massCombat('apply');assert(t.actor.system.attributes.hp.value===projected,'Attack damage applies once alongside the save result');
 }finally{
  for(const m of game.messages.filter(m=>scene && m.getFlag('morelord-encounters','massCombat')?.sceneId===scene.id))await m.delete();
  await game.user.unsetFlag('morelord-encounters','massCombat');if(prior!==undefined)await game.user.setFlag('morelord-encounters','massCombat',prior);
  if(original && game.scenes.has(original))await game.scenes.get(original).view();
  await scene?.delete();await attacker?.delete();await target?.delete();
 }
}};

import {assert} from '../../../morelord-core/scripts/testing/in-game.js';
import {addWave,waveInputFromForm} from '../services/mass-combat-service.mjs';
import {saveEncounter} from '../services/saved-encounter-service.mjs';
const ID='morelord-encounters';
const until=async read=>{const end=Date.now()+15000;while(Date.now()<end){if(read())return;await new Promise(r=>setTimeout(r,30));}throw Error('Round-one wave condition timed out: '+read);};
export const roundOneWaveCheck={
 id:'morelord-encounters.round-one-wave-after-reset',
 async run(){
  assert(game.world.id==='dev1' && game.user.isGM,'Dev1 GM only');
  let scene,combat,npc,pc,journal;const waveIds=[];
  try{
   scene=await Scene.create({name:'Round-one automatic wave regression',width:3000,height:2000,padding:0,grid:{type:1,size:100}});
   npc=await Actor.create({name:'Round-one wave creature fixture',type:'npc',system:{attributes:{hp:{value:20,max:20}}}});
   pc=await Actor.create({name:'Round-one wave player fixture',type:'character',system:{attributes:{hp:{value:20,max:20}}}});
   const [anchor]=await scene.createEmbeddedDocuments('Token',[(await pc.getTokenDocument({x:1500,y:1000,actorLink:false},{parent:scene})).toObject()]);
   const saved=await saveEncounter('Round-one wave saved roster fixture',{members:[{uuid:npc.uuid,name:npc.name,count:2}]});journal=game.journal.get(saved.id);
   combat=await Combat.create({scene:scene.id,combatants:[{tokenId:anchor.id,actorId:pc.id,sceneId:scene.id,initiative:10}]});
   const first=await addWave(scene,waveInputFromForm({encounterId:saved.id,round:1,repeats:2,skippedRounds:0,multiplier:1}));
   waveIds.push(first.id);
   await combat.updateEmbeddedDocuments('Combatant',[{_id:first.combatantId,initiative:30}]);
   const state=()=>scene.getFlag(ID,'massCombatWaves');
   const creatures=()=>scene.tokens.filter(t=>!t.getFlag(ID,'massCombatScheduler'));
   await combat.startCombat();
   await until(()=>state().waves[0]?.deployed===1);
   assert(combat.round===1 && creatures().length===3,'A round-one wave acting first deploys automatically at native combat start');
   await combat.nextRound();
   const waveTurn=()=>combat.combatant?.getFlag(ID,'massCombatSchedule')===first.id;
   for(let step=0;step<4 && state().waves[0].deployed<2;step++){
    if(waveTurn()){await until(()=>state().waves[0].deployed===2);break;}
    const next=combat.turns[(combat.turn+1)%combat.turns.length];
    await combat.nextTurn();
    if(next.getFlag(ID,'massCombatSchedule')===first.id){await until(()=>state().waves[0].deployed===2);break;}
   }
   await until(()=>state().waves[0].deployed===2);
   assert(combat.round===2 && creatures().length===5,'Zero skipped rounds deploys the next arrival in round two through native turn advancement');
   await combat.delete();combat=null;
   await until(()=>!state().combatId);
   assert(state().waves.length===0 && state().automatic===false,'Ending combat leaves an empty stopped schedule');
   const existingMob=scene.tokens.find(t=>t.actorId===npc.id && !t.getFlag(ID,'massCombatScheduler'));
   combat=await Combat.create({scene:scene.id,combatants:[{tokenId:anchor.id,actorId:pc.id,sceneId:scene.id,initiative:10},{tokenId:existingMob.id,actorId:npc.id,sceneId:scene.id,initiative:20}]});
   const second=await addWave(scene,waveInputFromForm({encounterId:saved.id,round:1,repeats:1,skippedRounds:0,multiplier:1}));
   waveIds.push(second.id);
   assert(state().automatic===true,'The first new wave automatically enables its fresh schedule after a reset');
   await combat.updateEmbeddedDocuments('Combatant',[{_id:second.combatantId,initiative:5}]);
   await combat.startCombat();
   assert(state().waves[0].deployed===0 && creatures().length===5,'A round-one wave waits until its own initiative turn');
   for(let step=0;step<3;step++){
    const next=combat.turns[(combat.turn+1)%combat.turns.length];
    await combat.nextTurn();
    if(next.getFlag(ID,'massCombatSchedule')===second.id){await until(()=>state().waves[0].deployed===1);break;}
   }
   await until(()=>state().waves[0].deployed===1);
   assert(state().waves[0].lastDeploymentRound===1 && creatures().length===7,'The restarted combat deploys its later-initiative wave during round one');
   const arrivals=game.messages.filter(m=>[first.id+':1',first.id+':2',second.id+':1'].includes(m.getFlag(ID,'massCombatArrival')));
   assert(arrivals.length===3 && arrivals.every(m=>m.whisper.length>0),'Each arrival creates exactly one private chat card');
  }finally{
   if(combat && game.combats.has(combat.id)){await combat.delete();await until(()=>!scene.getFlag(ID,'massCombatWaves')?.combatId);}
   const actorIds=[npc?.id,pc?.id].filter(Boolean);
   for(const message of game.messages.filter(m=>(scene?.id && m.speaker?.scene===scene.id) || actorIds.includes(m.speaker?.actor)))await message.delete();
   // Arrival cards may use the current canvas speaker rather than this off-screen fixture scene.
   for(const message of game.messages.filter(m=>waveIds.some(id=>String(m.getFlag(ID,'massCombatArrival')??'').startsWith(id+':'))))await message.delete();
   if(scene && game.scenes.has(scene.id))await scene.delete();
   if(journal)await journal.delete();if(npc)await npc.delete();if(pc)await pc.delete();
  }
 }
};

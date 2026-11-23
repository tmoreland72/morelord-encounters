import {assert} from '../../../morelord-core/scripts/testing/in-game.js';
import {waveStatus,setWaveEnabled,validateWave} from '../services/mass-combat-service.mjs';
const ID='morelord-encounters';
// Keep the previous check export as a migration regression for existing round-zero world data.
export const roundZeroWaveCheck={id:'morelord-encounters.legacy-round-zero-migration',async run(){
 assert(game.world.id==='dev1' && game.user.isGM,'Dev1 GM only');
 let scene;
 try{
  scene=await Scene.create({name:'Legacy zero-wave migration fixture',flags:{[ID]:{massCombatWaves:{automatic:false,waves:[{id:'fresh',round:0,interval:2,repeats:3,deployed:0},{id:'started',round:0,interval:2,repeats:3,deployed:1,lastDeploymentRound:0}]}}}});
  const state=waveStatus(scene);
  assert(state.waves[0].round===1 && state.waves[1].round===2,'Legacy zero waves become positive while preserving an active cadence');
  assert(state.waves.every(w=>w.paused) && state.waves[1].deployed===1,'Existing pause and deployed counts survive');
  await setWaveEnabled(scene,'fresh',true);
  const stored=scene.getFlag(ID,'massCombatWaves');
  assert(stored.roundStartVersion===1 && stored.waves[1].lastDeploymentRound===0,'Migration persists without clearing arrival history');
  let rejected=false;try{validateWave({encounterId:'fixture',round:0});}catch{rejected=true;}
  assert(rejected,'New round-zero schedules are rejected');
 }finally{if(scene)await scene.delete();}
}};

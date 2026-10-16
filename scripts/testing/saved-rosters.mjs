import {assert} from '../../../morelord-core/scripts/testing/in-game.js';
import {configureEncounter} from '../apps/encounter-builder-dialog.mjs';
import {saveEncounter,getSavedEncounters} from '../services/saved-encounter-service.mjs';
import {addWave,synchronizeAttackerTurn,synchronizeMobTurns} from '../services/mass-combat-service.mjs';
const ID='morelord-encounters';
const until=async read=>{const end=Date.now()+20000;while(Date.now()<end){const value=read();if(value)return value;await new Promise(r=>setTimeout(r,30));}throw Error('Roster regression timed out: '+read);};
export const savedRosterCheck={
 id:'morelord-encounters.saved-roster-delete-and-native-mobs',
 async run(){
  assert(game.world.id==='dev1' && game.user.isGM,'Dev1 GM only');
  const actors=[];let scene,combat,legacy,other,pending;
  try{
   for(const [name,type] of [['Veteran fixture','npc'],['Recruit fixture','npc'],['Player fixture','character']])actors.push(await Actor.create({name,type,system:{attributes:{hp:{value:50,max:50}}}}));
   scene=await Scene.create({name:'Saved roster and native mob regression',width:3000,height:2000,padding:0,grid:{type:1,size:100}});
   const data=[];
   for(let i=0;i<9;i++){const actor=actors[i<4?0:i<8?1:2];data.push((await actor.getTokenDocument({actorLink:false,x:300+(i%5)*200,y:300+Math.floor(i/5)*200},{parent:scene})).toObject());}
   const tokens=await scene.createEmbeddedDocuments('Token',data);
   await synchronizeMobTurns(scene);
   combat=await Combat.create({scene:scene.id,combatants:tokens.map((t,i)=>({tokenId:t.id,actorId:t.actorId,sceneId:scene.id,initiative:20-i}))});
   assert(combat.combatants.size===9,'Fixture begins with native individual turns after Mass Combat was opened');
   await combat.startCombat();
   assert(combat.combatants.size===3 && combat.combatant.actorId===actors[0].id,'First initiative group is consolidated before the first native turn starts');
   const active=combat.combatant.id,initiative=combat.combatant.initiative;
   await synchronizeAttackerTurn(scene,'Actor.'+actors[0].id);
   await synchronizeAttackerTurn(scene,'Actor.'+actors[1].id);
   assert(combat.combatants.size===3,'Four Veterans and four Recruits use two NPC turns plus the PC turn');
   assert(combat.combatants.get(active)?.initiative===initiative,'The active mob representative and initiative are retained');
   assert(scene.tokens.size===9 && scene.tokens.every(t=>t.actor.system.attributes.hp.value===50),'Grouping retains individual tokens and HP');
   legacy=await JournalEntry.create({name:'Legacy saved roster fixture',ownership:{default:0},flags:{[ID]:{savedEncounter:{published:true,description:'SHOULD NOT APPEAR',notes:[{title:'GM notes',text:'PRIVATE NOTE SHOULD NOT APPEAR'}],members:[{uuid:actors[0].uuid,name:actors[0].name,img:actors[0].img,count:1,rolledQuantity:4},{uuid:actors[1].uuid,name:actors[1].name,img:actors[1].img,count:1,rolledQuantity:10}]}}}});
   const saved=await saveEncounter('New saved roster fixture',{description:'Not saved',notes:[{text:'Not saved'}],members:[{uuid:actors[1].uuid,name:actors[1].name,count:4}]});other=game.journal.get(saved.id);
   assert(!other.getFlag(ID,'savedEncounter').notes && !other.getFlag(ID,'savedEncounter').description,'New saves contain only their roster');
   await addWave(scene,{encounterId:legacy.id,round:3});
   const waveBefore=foundry.utils.deepClone(scene.getFlag(ID,'massCombatWaves').waves);
   pending=configureEncounter({initial:{encounterSource:'saved',savedEncounterId:legacy.id}});
   const card=await until(()=>document.querySelector('[name="savedEncounterId"][value="'+legacy.id+'"]')?.closest('.ml-encounters-saved-option'));
   assert(!card.querySelector('details,.ml-encounters-published-notes,.ml-encounters-xp') && !card.textContent.includes('SHOULD NOT APPEAR'),'Legacy saved card displays only creature names and counts');
   assert(card.textContent.includes('4×') && card.textContent.includes('10×'),'Legacy card retains saved rolled quantities');
   await globalThis.__morelordSavedVisual?.();
   card.querySelector('[data-morelord-action="delete-saved-encounter"]').click();
   const cancel=await until(()=>document.querySelector('#morelord-encounters-delete-saved [data-action="cancel"]'));cancel.click();
   await until(()=>!document.getElementById('morelord-encounters-delete-saved'));
   assert(game.journal.has(legacy.id) && card.isConnected,'Cancel retains the saved encounter');
   card.querySelector('[data-morelord-action="delete-saved-encounter"]').click();
   (await until(()=>document.querySelector('#morelord-encounters-delete-saved [data-action="delete"]'))).click();
   await until(()=>!game.journal.has(legacy.id) && !card.isConnected);
   assert(game.journal.has(other.id),'Deleting one encounter retains other saved rosters');
   assert(JSON.stringify(scene.getFlag(ID,'massCombatWaves').waves)===JSON.stringify(waveBefore),'Deleting a saved encounter retains scheduled wave snapshots');
   const form=document.querySelector('#morelord-encounters-configure .ml-encounters-source-form');
   assert(form && form.querySelector('[name="savedEncounterId"]:checked'),'Deletion keeps Encounters open and selects an available saved roster');
   form.querySelector('[name="savedEncounterId"][value="'+other.id+'"]').checked=true;
   document.querySelector('#morelord-encounters-configure [data-action="generate"]').click();
   const roster=await until(()=>document.querySelector('#morelord-encounters-roster .ml-encounters-roster'));
   assert(roster.textContent.includes('4×') && !roster.textContent.includes('undefined') && !roster.querySelector('.ml-encounters-published-notes,.ml-encounters-roster-total'),'Opening a saved roster shows creatures and counts only');
  }finally{
   for(const app of foundry.applications.instances.values())if(['morelord-encounters-configure','morelord-encounters-delete-saved','morelord-encounters-roster'].includes(app.id))await app.close();
   await pending;
   if(combat && game.combats.has(combat.id))await combat.delete();
   if(scene && game.scenes.has(scene.id))await scene.delete();
   for(const journal of [legacy,other])if(journal && game.journal.has(journal.id))await journal.delete();
   for(const actor of actors)await actor.delete();
  }
 }
};

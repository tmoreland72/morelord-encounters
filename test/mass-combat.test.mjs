import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWave, dueWaves, addWave, deployWaves, setAutomatic, registerMassCombatHooks, creatureGroups, defaultAttackerGroup, synchronizeMobTurns, synchronizeAttackerTurn, waveInputFromForm } from '../scripts/services/mass-combat-service.mjs';
import { mountMassCombat } from '../scripts/apps/mass-combat-dialog.mjs';

test('wave input accepts saved encounters and rejects invalid schedule bounds', () => {
  assert.deepEqual(validateWave({encounterId:'saved',round:'2',repeats:'3',interval:'2',multiplier:'4'}), {encounterId:'saved',round:2,repeats:3,interval:2,multiplier:4});
  for (const input of [{}, {encounterId:'x',round:0}, {encounterId:'x',repeats:101}, {encounterId:'x',interval:1.5}, {encounterId:'x',multiplier:Infinity}]) assert.throws(()=>validateWave(input));
});

test('only due, incomplete waves are eligible, without off-cadence catch-up', () => {
  const waves=[{round:2,repeats:3,interval:2,deployed:1},{round:1,repeats:1,interval:1,deployed:1}];
  assert.equal(dueWaves(waves,3).length,0);
  assert.deepEqual(dueWaves(waves,4),[waves[0]]);
  assert.deepEqual(dueWaves(waves,9),[]);
  assert.deepEqual(dueWaves(waves,10),[waves[0]]);
});

function fixture() {
  let sequence=0, fail=false;
  const tokens=new Map(), combatants=[];
  tokens.map=fn=>[...tokens.values()].map(fn);
  tokens.filter=fn=>[...tokens.values()].filter(fn);
  let state;
  const scene={id:'scene',grid:{type:1,size:100},dimensions:{sceneRect:{x:0,y:0,width:3000,height:2000}},tokens,
    async deleteEmbeddedDocuments(_type,ids){ids.forEach(id=>tokens.delete(id));},getFlag:()=>state,setFlag:async(_id,_key,value)=>{state=structuredClone(value);},
    async createEmbeddedDocuments(_type,rows){for(const row of rows){tokens.set(row._id,{...row,id:row._id});if(fail){fail=false;throw Error('interrupted');}}}};
  const combat={id:'combat',scene,round:1,combatants,async createEmbeddedDocuments(_type,rows){const created=rows.map(row=>({...row,id:`c${++sequence}`,initiative:row.initiative ?? null}));combatants.push(...created);combat.combatant ??= created[0];return created;},async updateEmbeddedDocuments(_type,rows){for(const row of rows){const c=combatants.find(c=>c.id===row._id);c.name=row.name;c.flags={'morelord-encounters':{massCombatGroup:row['flags.morelord-encounters.massCombatGroup']}};}},async deleteEmbeddedDocuments(_type,ids){for(let i=combatants.length-1;i>=0;i--)if(ids.includes(combatants[i].id))combatants.splice(i,1);},async rollInitiative(ids,options){assert.equal(options.messageMode,'gm');combatants.filter(c=>ids.includes(c.id)).forEach(c=>c.initiative=12);}};
  const actor={id:'npc',documentName:'Actor',type:'npc',async getTokenDocument(){return {toObject:()=>({actorId:'npc',width:1,height:1,actorLink:false})};}};
  const saved={id:'saved',name:'Troops',getFlag:()=>({members:[{uuid:'Actor.npc',name:'Troop',count:2}]})};
  globalThis.foundry={utils:{deepClone:structuredClone,escapeHTML:String,randomID:()=>`id${++sequence}`}};
  globalThis.game={user:{id:'gm',isGM:true},users:new Map([['gm',{id:'gm',active:true}]]),journal:[saved],modules:new Map(),combats:{get:()=>combat,viewed:combat,filter:()=>[combat]},scenes:[scene],messages:[]};
  globalThis.ChatMessage={getSpeaker:()=>({}),async create(data){const message={...data,getFlag:(id,key)=>data.flags?.[id]?.[key]};game.messages.push(message);return message;}};
  globalThis.MorelordCore={ui:{actorIdentity:({name})=>name},users:{list:()=>[{id:'gm',isGM:true,active:true}]},socket:{runSerialized:async(_key,fn)=>fn()}};
  globalThis.ui={notifications:{info(){},error(){}}};
  globalThis.fromUuid=async()=>actor;
  return {scene,combat,saved,actor,tokens,combatants,count:()=>[...tokens.values()].filter(t=>!t.flags?.['morelord-encounters']?.massCombatScheduler).length,state:()=>state,interrupt:()=>{fail=true;}};
}

test('saved roster snapshot, repeated rounds, private initiative and interruption recovery', async () => {
  const f=fixture();
  await addWave(f.scene,{encounterId:'saved',repeats:3,multiplier:2});
  f.saved.getFlag=()=>({members:[]});
  await deployWaves(f.scene);
  assert.equal(f.count(),4);assert.equal(f.combatants.length,2);
  assert.ok(f.combatants.every(c=>c.sceneId==='scene' && c.initiative===12));
  await deployWaves(f.scene);assert.equal(f.count(),4);
  f.combat.round=2;f.interrupt();
  await assert.rejects(deployWaves(f.scene),/interrupted/);
  assert.equal(f.count(),5);assert.ok(f.state().pending);
  await deployWaves(f.scene);
  assert.equal(f.count(),8);assert.equal(f.combatants.length,2);assert.equal(f.state().pending,null);
  f.combat.round=3;await deployWaves(f.scene);await deployWaves(f.scene);
  assert.equal(f.count(),12);assert.equal(f.state().waves[0].deployed,3);
});

test('tracker turn hook uses the controlling GM and ignores unrelated combat updates', async () => {
  const f=fixture();let hook;
  globalThis.Hooks={on:(_name,fn)=>{hook=fn;}};
  registerMassCombatHooks();
  await addWave(f.scene,{encounterId:'saved'});await setAutomatic(f.scene,true);
  const waveTurn=f.combat.combatant;
  f.combat.combatant={id:'pc-turn'};hook(f.combat,{round:1});assert.equal(f.count(),0);
  f.combat.combatant=waveTurn;hook(f.combat,{turn:1});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.count(),2);
  hook(f.combat,{round:1});await new Promise(resolve=>setImmediate(resolve));assert.equal(f.count(),2);
});

test('native wave turns enforce rounds 1,3,5 and start round 3, posting one private card per arrival',async()=>{
  const f=fixture();let hook;
  globalThis.Hooks={on:(_name,fn)=>{hook=fn;}};registerMassCombatHooks();
  const first=await addWave(f.scene,{encounterId:'saved',round:1,interval:2,repeats:3});
  const later=await addWave(f.scene,{encounterId:'saved',round:3});
  const turn=async(wave,round)=>{
    f.combat.round=round;f.combat.combatant=f.combatants.find(c=>c.id===wave.combatantId);
    hook(f.combat,{turn:1});await new Promise(resolve=>setImmediate(resolve));
  };
  await turn(later,1);assert.equal(f.count(),0);
  await turn(first,1);assert.equal(f.count(),2);
  await turn(first,2);assert.equal(f.count(),2);
  await turn(later,2);assert.equal(f.count(),2);
  await turn(first,3);assert.equal(f.count(),4);
  await turn(later,3);assert.equal(f.count(),6);
  await turn(first,3);assert.equal(f.count(),6);
  assert.equal(game.messages.length,3);
  assert.ok(game.messages.every(m=>m.whisper.includes('gm') && m.content.includes('Wave deployed') && m.content.includes('Initiative')));
});

test('missing actors and another active GM stop deployment without spawning', async () => {
  const f=fixture();await addWave(f.scene,{encounterId:'saved'});
  globalThis.fromUuid=async()=>null;
  await assert.rejects(deployWaves(f.scene),/unavailable/);assert.equal(f.count(),0);
  game.user.id='other';
  await assert.rejects(deployWaves(f.scene),/controls this schedule|non-ignored/);
});

test('compendium rosters import a private world Actor once and reuse it across waves', async () => {
  const f=fixture(),imports=[];
  Object.assign(f.actor,{pack:'monsters',uuid:'Compendium.monsters.Actor.npc',flags:{},toObject:()=>({name:'Troop',type:'npc'})});
  game.actors=[];
  globalThis.Actor={async create(data){
    imports.push(data);
    const actor={...f.actor,pack:null,getFlag:(_id,key)=>data.flags['morelord-encounters'][key]};
    game.actors.push(actor);return actor;
  }};
  await addWave(f.scene,{encounterId:'saved',repeats:2});await deployWaves(f.scene);
  f.combat.round=2;await deployWaves(f.scene);
  assert.equal(imports.length,1);assert.equal(imports[0].ownership.default,0);
  assert.equal(f.count(),4);
});

test('four haze wights and ten haze husks deploy fourteen tokens in two shared turns', async()=>{
  const f=fixture();
  f.saved.getFlag=()=>({members:[{uuid:'Actor.wight',name:'Haze Wight',count:4},{uuid:'Actor.husk',name:'Haze Husk',count:10}]});
  globalThis.fromUuid=async uuid=>({...f.actor,id:uuid,async getTokenDocument(){return {toObject:()=>({actorId:uuid,name:uuid,width:1,height:1,actorLink:false})};}});
  await addWave(f.scene,{encounterId:'saved'});await deployWaves(f.scene);
  assert.equal(f.count(),14);assert.equal(f.combatants.length,2);
  assert.equal([...f.tokens.values()].filter(t=>t.flags['morelord-encounters'].massCombatGroup==='Actor.wight').length,4);
  assert.equal([...f.tokens.values()].filter(t=>t.flags['morelord-encounters'].massCombatGroup==='Actor.husk').length,10);
  await deployWaves(f.scene);assert.equal(f.count(),14);
});

test('creature dropdowns exclude PCs and dead NPCs and default to the active mob',()=>{
  const f=fixture();
  const token=(id,type,hp,group)=>({id,actorId:id,actor:{name:id,type,system:{attributes:{hp:{value:hp}}}},flags:{'morelord-encounters':{massCombatGroup:group,massCombatWave:'wave'}}});
  f.tokens.set('pc',token('pc','character',20,'pc'));
  f.tokens.set('dead',token('dead','npc',0,'dead'));
  f.tokens.set('a',token('a','npc',10,'husks'));f.tokens.set('b',token('b','npc',10,'husks'));f.tokens.set('c',token('c','npc',10,'wights'));
  const groups=creatureGroups(f.scene);
  assert.deepEqual(groups.map(g=>g.key),['husks','wights']);assert.equal(groups[0].tokens.length,2);
  f.combat.combatant={flags:{'morelord-encounters':{massCombatGroup:'wights'}}};
  assert.equal(defaultAttackerGroup(f.scene,f.combat),'wights');
});

test('wave actions stay in the existing Encounters panel without creating another window',async()=>{
  const f=fixture(),listeners=new Map();let closed=0;
  const NativeFormData=globalThis.FormData;
  globalThis.FormData=class{constructor(form){return new Map(Object.entries(form.data));}};
  globalThis.canvas={ready:true,scene:f.scene};globalThis.Hooks={on:()=>1,off(){}};
  const form={isConnected:true,data:{encounterId:'saved',round:'1',repeats:'1',interval:'1',multiplier:'1'},querySelector:()=>panel};
  const panel={hidden:false,querySelectorAll:()=>[],querySelector:()=>null,contains:()=>true,closest:selector=>selector==='form'?form:null,addEventListener:(name,fn)=>listeners.set(name,fn)};
  foundry.applications={instances:new Map([['builder',{id:'morelord-encounters-configure',addEventListener(){},close(){closed++;}}]])};
  MorelordCore.ui.createCollapsibleSection=()=>{};
  let controller;
  try {
    controller=await mountMassCombat(form);
    const button={dataset:{action:'mass-add'}};
    await listeners.get('click')({target:{closest:()=>button},preventDefault(){},stopImmediatePropagation(){}});
    assert.equal(f.state().waves.length,1);assert.equal(closed,0);
    assert.equal(await mountMassCombat(form),controller);
    assert.ok(panel.innerHTML.includes('Saved Encounter'));
    assert.ok(!panel.innerHTML.includes('Documentation'));
    assert.ok(!panel.innerHTML.includes('ml-app-shell'));
  }finally{controller?.dispose();globalThis.FormData=NativeFormData;}
});

test('missing combat clears the schedule without removing creatures',async()=>{
 const f=fixture(); await addWave(f.scene,{encounterId:'saved',repeats:2,interval:2});await deployWaves(f.scene);
 game.combats={get:()=>undefined,viewed:null,filter:()=>[]};game.combat=null;
 await synchronizeMobTurns(f.scene);
 const state=f.state();assert.equal(state.combatId,null);assert.equal(state.pending,null);assert.deepEqual(state.waves,[]);
 assert.equal(f.count(),2);assert.equal(f.tokens.size,2);
 await synchronizeMobTurns(f.scene);assert.deepEqual(f.state().waves,[]);
});

test('ending combat resets counters and removes only scheduler entries',async()=>{
 const f=fixture(),hooks=new Map();globalThis.Hooks={on:(name,fn)=>hooks.set(name,fn)};registerMassCombatHooks();
 await addWave(f.scene,{encounterId:'saved',repeats:2});await deployWaves(f.scene);
 f.combat.round=0;hooks.get('updateCombat')(f.combat,{round:0});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.state().combatId,null);assert.deepEqual(f.state().waves,[]);
 assert.equal(f.combatants.length,1);assert.equal(f.count(),2);assert.equal(f.tokens.size,2);
});

test('published saved rolled quantities determine wave size and deployed creatures',async()=>{
 const f=fixture();f.saved.getFlag=()=>({published:true,members:[{uuid:'Actor.wight',name:'Haze Wight',count:1,rolledQuantity:4},{uuid:'Actor.husk',name:'Haze Husk',count:1,rolledQuantity:10}]});
 const wave=await addWave(f.scene,{encounterId:'saved'});
 assert.deepEqual(wave.members.map(m=>m.count),[4,10]);
 await deployWaves(f.scene);assert.equal(f.count(),14);
});

test('skipped spawn rounds convert to cadence without changing stored schedule values',()=>{
 assert.equal(waveInputFromForm({skippedRounds:'0'}).interval,1);assert.equal(waveInputFromForm({skippedRounds:'1'}).interval,2);
 for(const skippedRounds of [-1,1.5,10000])assert.throws(()=>waveInputFromForm({skippedRounds}),/Skipped Rounds/);
});
test('a group attack consolidates non-wave NPC turns and preserves active initiative and PC turns',async()=>{
 const f=fixture();
 for(let i=0;i<4;i++)f.tokens.set('v'+i,{id:'v'+i,actorId:'veteran',name:'Veteran',actor:{type:'npc',name:'Veteran',system:{attributes:{hp:{value:50}}}}});
 f.combatants.push(...[...f.tokens.values()].map((t,i)=>({id:'c-v'+i,tokenId:t.id,sceneId:'scene',initiative:10+i})),{id:'pc',tokenId:'pc',sceneId:'scene',initiative:19});
 f.combat.combatant=f.combatants[2];
 await synchronizeAttackerTurn(f.scene,'Actor.veteran');
 assert.equal(f.combatants.length,2);assert.ok(f.combatants.some(c=>c.id==='c-v2' && c.initiative===12));assert.ok(f.combatants.some(c=>c.id==='pc' && c.initiative===19));assert.equal(f.tokens.size,4);
});

test('mass combat consolidates every NPC type before the native first turn begins',async()=>{
 const f=fixture();
 const types=['archer','guard'];
 for(const [j,type] of types.entries())for(let i=0;i<4;i++){
  const id=type+i;f.tokens.set(id,{id,actorId:type,name:type,actor:{type:'npc',name:type,system:{attributes:{hp:{value:20}}}}});
  f.combatants.push({id:'turn-'+id,tokenId:id,sceneId:'scene',initiative:30-j*10-i});
 }
 f.combatants.push({id:'pc-turn',tokenId:'pc',sceneId:'scene',initiative:4});f.combat.round=0;
 await synchronizeMobTurns(f.scene);
 // Add duplicate native turns after opening Mass Combat, reproducing pre-start additions.
 for(let i=1;i<4;i++)f.combatants.push({id:'late-'+i,tokenId:'archer'+i,sceneId:'scene',initiative:29-i});
 let started=false;
 class NativeCombat{async startCombat(){assert.equal(this.combatants.length,3);assert.ok(this.combatants.some(c=>c.id==='turn-archer0' && c.initiative===30));started=true;this.round=1;return this;}}
 Object.setPrototypeOf(f.combat,NativeCombat.prototype);
 globalThis.CONFIG={Combat:{documentClass:NativeCombat}};globalThis.Hooks={on(){}};
 registerMassCombatHooks();
 assert.equal(await f.combat.startCombat(),f.combat);assert.equal(started,true);assert.equal(f.tokens.size,8);
});

test('the first wave of a new schedule re-enables spawning after combat reset without unpausing existing schedules',async()=>{
 const f=fixture(),hooks=new Map();globalThis.Hooks={on:(name,fn)=>hooks.set(name,fn)};
 globalThis.CONFIG=undefined;registerMassCombatHooks();
 await addWave(f.scene,{encounterId:'saved'});
 f.combat.round=0;hooks.get('updateCombat')(f.combat,{round:0});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.state().automatic,false);assert.deepEqual(f.state().waves,[]);
 const wave=await addWave(f.scene,{encounterId:'saved'});
 assert.equal(f.state().automatic,true);
 f.combat.round=1;f.combat.combatant=f.combatants.find(c=>c.id===wave.combatantId);
 hooks.get('updateCombat')(f.combat,{round:1,turn:0});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.count(),2);assert.equal(f.state().waves[0].deployed,1);
 await setAutomatic(f.scene,false);await addWave(f.scene,{encounterId:'saved'});assert.equal(f.state().automatic,false);
});

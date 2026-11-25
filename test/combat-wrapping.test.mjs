import test from 'node:test';
import assert from 'node:assert/strict';
import {registerMassCombatHooks} from '../scripts/services/mass-combat-service.mjs';

for(const withLibWrapper of [false,true])test(`combat wrappers preserve chaining (libWrapper ${withLibWrapper})`,async()=>{
  const calls=[],registrations=[];
  class Combat {
    _sortCombatants(a,b){assert.equal(this,combat);calls.push('sort');return b.initiative-a.initiative;}
    rollInitiative(...args){calls.push(args);return Promise.resolve(this);}
    async startCombat(...args){calls.push(args);return this;}
    async nextRound(...args){calls.push(args);return this;}
    async nextTurn(...args){calls.push(args);return this;}
  }
  const combat=new Combat(),normal={id:'normal',initiative:7},marker={id:'marker',initiative:1,flags:{'morelord-encounters':{massCombatSchedule:'wave'}}};
  combat.combatants=[normal,marker];
  const saved={CONFIG:globalThis.CONFIG,Hooks:globalThis.Hooks,game:globalThis.game,libWrapper:globalThis.libWrapper};
  try{
    globalThis.CONFIG={Combat:{documentClass:Combat}};
    globalThis.Hooks={on(){}};
    globalThis.game={user:{isGM:false}};
    globalThis.libWrapper=withLibWrapper?{register(id,target,callback,type){
      registrations.push({id,target,type});
      const method=target.split('.').at(-1),original=Combat.prototype[method];
      Combat.prototype[method]=function(...args){return callback.call(this,original.bind(this),...args);};
    }}:undefined;
    registerMassCombatHooks();registerMassCombatHooks();
    if(withLibWrapper){
      assert.deepEqual(registrations.map(r=>[r.target.split('.').at(-1),r.type]),[['_sortCombatants','MIXED'],['rollInitiative','MIXED'],['startCombat','WRAPPER'],['nextRound','WRAPPER'],['nextTurn','WRAPPER']]);
      assert.ok(registrations.every(r=>r.id==='morelord-encounters' && r.target.startsWith('CONFIG.Combat.documentClass.prototype.')));
    }
    assert.ok(combat._sortCombatants(marker,normal)<0);
    assert.ok(combat._sortCombatants(normal,marker)>0);
    assert.equal(combat._sortCombatants(normal,{initiative:12}),5);
    assert.equal(combat._sortCombatants(marker,marker),0);
    assert.deepEqual(calls,['sort','sort']);
    calls.length=0;
    const options={messageMode:'gm'};
    assert.equal(await combat.rollInitiative(['marker'],options),combat);
    assert.equal(calls.length,0);
    assert.equal(await combat.rollInitiative(['marker','normal'],options),combat);
    assert.equal(await combat.rollInitiative('normal',options),combat);
    assert.deepEqual(calls,[[['normal'],options],[['normal'],options]]);
    calls.length=0;
    for(const method of ['startCombat','nextRound','nextTurn'])assert.equal(await combat[method](options),combat);
    assert.deepEqual(calls,[[options],[options],[options]]);
  }finally{Object.assign(globalThis,saved);}
});

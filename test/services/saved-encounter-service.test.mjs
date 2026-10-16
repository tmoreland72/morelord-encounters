import assert from "node:assert/strict";
import test from "node:test";
import { getSavedEncounters, saveEncounter, deleteSavedEncounter } from "../../scripts/services/saved-encounter-service.mjs";

test("saves independent world encounter snapshots and protects GM access", async () => {
  const stored = [];
  globalThis.game = {
    user: { isGM: true },
    journal: stored
  };
  globalThis.JournalEntry = {
    create: async data => {
      assert.deepEqual(data.ownership, { default: 0 });
      const journal = { id: `journal-${stored.length}`, name: data.name,
        getFlag: (module, key) => data.flags[module]?.[key] };
      stored.push(journal);
      return journal;
    }
  };
  for (const published of [false, true]) {
    const encounter = { name: "Original", published, members: [{ uuid: "Actor.monster", count: 3 }], notes: [{ title: "Details", text: "Ambush" }], totalXp: 600 };
    const saved = await saveEncounter("  Sewer ambush  ", encounter);
    assert.equal(saved.name, "Sewer ambush");
    assert.deepEqual(saved.encounter, {name:"Sewer ambush",kind:"roster",members:[{uuid:"Actor.monster",name:undefined,img:undefined,count:3}]});
    encounter.members[0].count = 9;
    assert.equal(getSavedEncounters().at(-1).encounter.members[0].count, 3);
  }
  const reopened = getSavedEncounters();
  reopened[0].encounter.members[0].count = 20;
  assert.equal(getSavedEncounters()[0].encounter.members[0].count, 3);
  assert.equal(reopened[0].encounter.notes,undefined);
  assert.notEqual(reopened[0].id, reopened[1].id);
  stored[0].name = "Renamed in Journals";
  assert.equal(getSavedEncounters()[0].encounter.name, "Renamed in Journals");
  await assert.rejects(saveEncounter("  ", {}), /name/);
  assert.equal(stored.length, 2);
  game.user.isGM = false;
  assert.throws(() => getSavedEncounters(), /Only GMs/);
  await assert.rejects(saveEncounter("Blocked", {}), /Only GMs/);
  assert.equal(stored.length, 2);
});

test('legacy published saves become roster-only without rewriting their original data',()=>{
 const raw={published:true,notes:[{text:'Retain on disk'}],description:'Book detail',members:[{uuid:'Actor.w',count:1,rolledQuantity:4},{uuid:'Actor.h',count:1,rolledQuantity:10}]};
 globalThis.game={user:{isGM:true},journal:[{id:'old',name:'Hateful Dead',getFlag:()=>raw}]};
 const saved=getSavedEncounters()[0].encounter;
 assert.deepEqual(saved.members.map(m=>m.count),[4,10]);assert.equal(saved.notes,undefined);assert.equal(saved.description,undefined);assert.equal(raw.notes[0].text,'Retain on disk');
});
test('deleting a save checks GM permission and only deletes a saved encounter document',async()=>{
 let deleted=false;const journal={getFlag:()=>true,delete:async()=>{deleted=true;}};
 globalThis.game={user:{isGM:true},journal:new Map([['saved',journal],['other',{getFlag:()=>null}]])};
 await assert.rejects(deleteSavedEncounter('other'),/unavailable/);assert.equal(deleted,false);
 game.user.isGM=false;await assert.rejects(deleteSavedEncounter('saved'),/Only GMs/);assert.equal(deleted,false);
 game.user.isGM=true;await deleteSavedEncounter('saved');assert.equal(deleted,true);
});
test('guided scenes retain their editable scene snapshot',async()=>{
 globalThis.game={user:{isGM:true}};globalThis.JournalEntry={create:async data=>({id:'guided',...data})};
 const scene={kind:'guided',scene:{opening:'A clue'},notes:[{text:'GM guidance'}]};
 const saved=await saveEncounter('Clue',scene);assert.deepEqual(saved.encounter,{...scene,name:'Clue'});
});

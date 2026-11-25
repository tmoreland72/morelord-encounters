import {assert} from '../../../morelord-core/scripts/testing/in-game.js';
import {withCombatSortCompanion} from '../../../morelord-core/scripts/testing/combat-sort-companion.js';

export const combatWrappingCheck={id:'morelord-encounters.libwrapper-combat-sorting',async run(){
  assert(game.world.id==='dev1','Dev1 only');
  assert(game.modules.get('lib-wrapper')?.active,'Enable libWrapper before reloading and running this check');
  const conflicts=[];
  const hook=Hooks.on('libWrapper.ConflictDetected',(first,second,target)=>{
    if([first,second].includes('morelord-encounters'))conflicts.push(target);
  });
  try{
    await withCombatSortCompanion(chained=>{
    // Unsaved documents exercise the installed sorting chain without changing world data.
    const combat=new CONFIG.Combat.documentClass();
    const entry=(name,initiative,flags={})=>new CONFIG.Combatant.documentClass({_id:foundry.utils.randomID(),name,initiative,flags},{parent:combat});
    const marker=entry('Wave marker',1,{'morelord-encounters':{massCombatSchedule:'fixture'}});
    const high=entry('High initiative',2000001),low=entry('Low initiative',2);
    const sort=(a,b)=>combat._sortCombatants(a,b);
    assert(sort(marker,high)<0 && sort(high,marker)>0,'Wave markers sort before ordinary turns');
    assert(sort(high,low)<0 && sort(low,high)>0,'Ordinary combatants retain initiative order through the installed chain');
    assert(sort(marker,marker)===0,'Equal markers can continue the sorting chain');
    assert(chained()===5,'A second libWrapper consumer remains in the sorting chain');
    assert(conflicts.length===0,'Sorting must not report a libWrapper conflict involving Encounters');
    });
  }finally{Hooks.off('libWrapper.ConflictDetected',hook);}
}};

export const combatWrappingWithMonksCheck={id:'morelord-encounters.monks-combat-details-sorting',async run(){
  assert(game.modules.get('monks-combat-details')?.active,"Enable Monk's Combat Details before running this optional interoperability check");
  await combatWrappingCheck.run();
}};

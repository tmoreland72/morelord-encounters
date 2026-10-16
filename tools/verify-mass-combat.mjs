import {startBrowser} from '../../morelord-game-master/tests/browser-driver.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.FOUNDRY_TEST_URL ?? 'http://127.0.0.1:31400';
const status=await (await fetch(`${url}/api/status`)).json();
if(status.world!=='dev1')throw Error(`Refusing live testing: world is ${status.world}`);
const output=new URL('../test/in-game-reports/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await startBrowser();
try{
  await browser.command('Page.navigate',{url:`${url}/join`});
  await browser.wait('document.readyState === "complete"');
  if((await browser.evaluate('document.title')).trim()!=='Dev1')throw Error('Dev1 join page not verified');
  await browser.wait('document.querySelector("[name=username]") || globalThis.game?.ready',30000);
  await browser.evaluate(`if(!globalThis.game?.ready){document.querySelector('[name="username"]').value=${JSON.stringify(process.env.FOUNDRY_TEST_USER??'Chuck')};document.querySelector('button[name="join"]').click();}`);
  await browser.wait('globalThis.game?.ready && globalThis.MorelordCore?.ui?.createCollapsibleSection',120000);
  await browser.command('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  console.log(JSON.stringify(await browser.evaluate(`({world:game.world.id,foundry:game.version,system:game.system.version,gm:game.user.isGM,encounters:game.modules.get('morelord-encounters')?.active})`)));
  await browser.evaluate(`globalThis.__morelordMassVisual=()=>new Promise(resolve=>{globalThis.__massVisualReady=true;globalThis.__massVisualResume=resolve;});
  globalThis.__morelordSavedVisual=()=>new Promise(resolve=>{globalThis.__savedVisualReady=true;globalThis.__savedVisualResume=resolve;});
  globalThis.__morelordActivityVisual=()=>new Promise(resolve=>{globalThis.__activityVisualReady=true;globalThis.__activityVisualResume=resolve;});
  globalThis.__massReportPromise=(async()=>{
    if(game.world.id!=='dev1' || !game.user.isGM)throw Error('Only Dev1 GM is authorized');
    const originalScene=canvas.scene?.id;
    const fixture=await Scene.create({name:'Mass Combat UI fixture',width:3000,height:2000,padding:0,grid:{type:1,size:100}});
    const actors=[];let combat,journal;
    const prior=foundry.utils.deepClone(game.user.getFlag('morelord-encounters','massCombat'));
    try{
      for(const [name,type] of [['Skeleton fixture','npc'],['Zombie fixture','npc'],['Player fixture','character']])actors.push(await Actor.create({name,type,system:{attributes:{hp:{value:20,max:20}}}}));
      const tokens=[];
      for(const [index,actor] of actors.entries())tokens.push((await actor.getTokenDocument({x:1200+index*200,y:1000,actorLink:false},{parent:fixture})).toObject());
      const placed=await fixture.createEmbeddedDocuments('Token',tokens);
      combat=await Combat.create({scene:fixture.id,combatants:placed.map((t,i)=>({tokenId:t.id,actorId:t.actorId,sceneId:fixture.id,initiative:17-i}))});
      const {saveEncounter}=await import('/modules/morelord-encounters/scripts/services/saved-encounter-service.mjs');
      const saved=await saveEncounter('Monster Manual wave fixture',{published:true,members:[{uuid:actors[0].uuid,name:actors[0].name,img:actors[0].img,count:1,rolledQuantity:4},{uuid:actors[1].uuid,name:actors[1].name,img:actors[1].img,count:1,rolledQuantity:10}]});
      journal=game.journal.get(saved.id);
      const {addWave}=await import('/modules/morelord-encounters/scripts/services/mass-combat-service.mjs');
      await addWave(fixture,{encounterId:saved.id,round:3,interval:2,repeats:2});
      await game.user.unsetFlag('morelord-encounters','massCombat');
      await fixture.view();
      const {runInGameTests}=await import('/modules/morelord-core/scripts/testing/in-game.js');
      const {massCombatCheck,massCombatEntryCheck}=await import('/modules/morelord-encounters/scripts/testing/mass-combat.mjs');
      const {savedRosterCheck}=await import('/modules/morelord-encounters/scripts/testing/saved-rosters.mjs');
      const {massCombatActivitiesCheck}=await import('/modules/morelord-encounters/scripts/testing/mass-combat-activities.mjs');
      const {roundOneWaveCheck}=await import('/modules/morelord-encounters/scripts/testing/round-one-waves.mjs');
      return await runInGameTests({checks:[massCombatCheck,massCombatEntryCheck,savedRosterCheck,massCombatActivitiesCheck,roundOneWaveCheck]});
    }finally{
      for(const app of foundry.applications.instances.values())if(app.id==='morelord-encounters-configure')await app.close();
      await game.user.unsetFlag('morelord-encounters','massCombat');
      if(prior!==undefined)await game.user.setFlag('morelord-encounters','massCombat',prior);
      for(const message of game.messages.filter(m=>m.speaker?.scene===fixture.id || actors.some(a=>a.id===m.speaker?.actor)))await message.delete();
      await combat?.delete();await journal?.delete();
      if(originalScene && game.scenes.has(originalScene))await game.scenes.get(originalScene).view();
      await fixture.delete();
      for(const actor of actors)await actor.delete();
    }
  })().then(report=>globalThis.__massReport=report).catch(error=>globalThis.__massError=error.stack);true`);
  await browser.wait('globalThis.__massVisualReady || globalThis.__massReport || globalThis.__massError',120000);
  if(await browser.evaluate('!!globalThis.__massVisualReady')){
    const visual=[];
    for(const theme of ['dark','light'])for(const width of [1280,700]){
      await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
      await browser.evaluate(`(async()=>{const app=foundry.applications.instances.get('morelord-encounters-configure') ?? [...foundry.applications.instances.values()].find(a=>a.id==='morelord-encounters-configure');app.element.classList.remove('theme-dark','theme-light');app.element.classList.add('themed','theme-${theme}');app.element.style.colorScheme='${theme}';ui.notifications.clear();for(const other of foundry.applications.instances.values())if(other!==app && other.id!=='notifications')void other.close();app.setPosition({width:${width===700?560:720},height:850,left:16,top:32});await document.fonts.ready;})()`);
      const screenshot=await browser.command('Page.captureScreenshot',{format:'png'});
      await writeFile(new URL(`2026-10-15-mass-combat-${theme}-${width}.png`,output),Buffer.from(screenshot.data,'base64'));
      visual.push(await browser.evaluate(`(()=>{const p=document.querySelector('.ml-encounters-mass-panel');return {theme:'${theme}',width:${width},overflow:p.scrollWidth>p.clientWidth+1,sections:p.querySelectorAll('.ml-collapsible-section').length};})()`));
    }
    await browser.command('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
    const zoom=await browser.evaluate(`(()=>{
      const app=[...foundry.applications.instances.values()].find(a=>a.id==='morelord-encounters-configure');
      document.body.style.zoom='2';app.setPosition({width:560,height:440,left:8,top:16});
      const input=app.element.querySelector('[name="attackerGroup"]');input.focus();input.scrollIntoView({block:'center'});
      const footer=app.element.querySelector('.form-footer').getBoundingClientRect(),field=input.getBoundingClientRect(),panel=app.element.querySelector('.ml-encounters-mass-panel');
      return {zoom:2,width:1280,overflow:panel.scrollWidth>panel.clientWidth+1,focusClear:field.bottom<=footer.top,footerVisible:footer.bottom<=innerHeight};
    })()`);
    const zoomShot=await browser.command('Page.captureScreenshot',{format:'png'});
    await writeFile(new URL('2026-10-15-mass-combat-zoom-200.png',output),Buffer.from(zoomShot.data,'base64'));
    visual.push(zoom);
    await browser.evaluate(`document.body.style.zoom='1';true`);
    for(const section of ['waves','prepare']){
      await browser.evaluate(`(()=>{const app=[...foundry.applications.instances.values()].find(a=>a.id==='morelord-encounters-configure');app.setPosition({width:720,height:850,left:16,top:32});const section=app.element.querySelector('[data-ml-section-key="encounters.mass.${section}"]');section.open=true;section.scrollIntoView({block:'start'});})()`);
      const shot=await browser.command('Page.captureScreenshot',{format:'png'});
      await writeFile(new URL(`2026-10-15-mass-combat-${section}.png`,output),Buffer.from(shot.data,'base64'));
    }
    await browser.evaluate(`document.querySelector('[name="encounterMode"][value="mass"]').focus();true`);
    for(const [key,code,expected] of [['ArrowLeft',37,'stories'],['ArrowRight',39,'mass']]){
      await browser.command('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:code,nativeVirtualKeyCode:code});
      await browser.command('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:code,nativeVirtualKeyCode:code});
      if(await browser.evaluate('document.querySelector("[name=encounterMode]:checked").value')!==expected)throw Error('Native radio keyboard navigation failed');
    }
    visual.push({keyboardModes:true});
    await writeFile(new URL('2026-10-15-mass-combat-visual.json',output),JSON.stringify(visual,null,2));
    await browser.evaluate('globalThis.__massVisualResume();true');
  }
  await browser.wait('globalThis.__savedVisualReady || globalThis.__massReport || globalThis.__massError',120000);
  if(await browser.evaluate('!!globalThis.__savedVisualReady')){
    for(const theme of ['dark','light'])for(const width of [1280,700]){
      await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
      await browser.evaluate(`(()=>{const app=[...foundry.applications.instances.values()].find(a=>a.id==='morelord-encounters-configure');app.element.classList.remove('theme-dark','theme-light');app.element.classList.add('themed','theme-${theme}');app.setPosition({width:${width===700?560:900},height:850,left:16,top:32});ui.notifications.clear();app.element.querySelector('[name=savedEncounterId]:checked').closest('.ml-card').scrollIntoView({block:'center'});})()`);
      const shot=await browser.command('Page.captureScreenshot',{format:'png'});
      await writeFile(new URL(`2026-10-15-saved-rosters-${theme}-${width}.png`,output),Buffer.from(shot.data,'base64'));
    }
    await browser.evaluate('globalThis.__savedVisualResume();true');
  }
  await browser.wait('globalThis.__activityVisualReady || globalThis.__massReport || globalThis.__massError',120000);
  if(await browser.evaluate('!!globalThis.__activityVisualReady')){
    const visual=[];
    for(const theme of ['dark','light'])for(const width of [1280,700]){
      await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
      await browser.evaluate(`(()=>{const app=[...foundry.applications.instances.values()].find(a=>a.id==='morelord-encounters-configure');app.element.classList.remove('theme-dark','theme-light');app.element.classList.add('themed','theme-${theme}');app.setPosition({width:${width===700?560:900},height:850,left:16,top:32});ui.notifications.clear();app.element.querySelector('[name=activityId]').scrollIntoView({block:'start'});})()`);
      const shot=await browser.command('Page.captureScreenshot',{format:'png'});
      await writeFile(new URL(`2026-10-16-mass-combat-activities-${theme}-${width}.png`,output),Buffer.from(shot.data,'base64'));
      visual.push(await browser.evaluate(`(()=>{const p=document.querySelector('.ml-encounters-mass-panel');return {theme:'${theme}',width:${width},overflow:p.scrollWidth>p.clientWidth+1};})()`));
    }
    await writeFile(new URL('2026-10-16-mass-combat-activities-visual.json',output),JSON.stringify(visual,null,2));
    await browser.evaluate('globalThis.__activityVisualResume();true');
  }
  await browser.wait('globalThis.__massReport || globalThis.__massError',120000);
  const error=await browser.evaluate('globalThis.__massError');if(error)throw Error(error);
  const report=await browser.evaluate('globalThis.__massReport');
  await writeFile(new URL('2026-10-15-mass-combat-live.json',output),JSON.stringify(report,null,2));
  console.log(JSON.stringify({ok:report.ok,summary:report.summary,results:report.results}));
  if(!report.ok)process.exitCode=1;
}finally{
  await browser.evaluate('globalThis.__massVisualResume?.();globalThis.__savedVisualResume?.();globalThis.__activityVisualResume?.();true').catch(()=>{});
  await browser.evaluate('await globalThis.__massReportPromise').catch(()=>{});
  await browser.close();
}

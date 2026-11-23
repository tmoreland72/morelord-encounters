import {startBrowser} from '../../morelord-game-master/tests/browser-driver.mjs';
import {writeFile} from 'node:fs/promises';
const username=process.env.FOUNDRY_TEST_USER ?? 'Chuck';
const url=process.env.FOUNDRY_TEST_URL ?? 'http://127.0.0.1:31400';
const status=await (await fetch(`${url}/api/status`)).json();
if(status.world!=='dev1')throw Error('Dev1 only');
const browser=await startBrowser();
try{
 await browser.command('Page.navigate',{url:`${url}/join`});
 await browser.wait('document.querySelector("[name=userId], [name=username]") || globalThis.game?.ready',15000);
 await browser.wait(`globalThis.game?.ready || [...document.querySelectorAll(':is([name=userId], [name=username]) option')].some(o=>o.textContent.trim()===${JSON.stringify(username)})`,15000);
 await browser.evaluate(`if(!globalThis.game?.ready){const select=document.querySelector('[name=userId], [name=username]');const option=[...select.options].find(o=>o.textContent.trim()===${JSON.stringify(username)} && !o.disabled);if(!option)throw Error('Test GM unavailable');select.value=option.value;document.querySelector('button[name=join]').click();}`);
 await browser.wait('globalThis.game?.ready && globalThis.MorelordCore?.socket?.ready',45000);
 await browser.command('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
 await browser.evaluate(`globalThis.__morelordMassUXVisual=stage=>new Promise(resolve=>{globalThis.__uxStage=stage;globalThis.__uxResume=resolve;});
 globalThis.__uxPromise=(async()=>{
  if(game.world.id!=='dev1' || game.user.name!=='Chuck')throw Error('Dev1 Chuck only');
  const {runInGameTests}=await import('/modules/morelord-core/scripts/testing/in-game.js');
  const {massCombatUXCheck}=await import('/modules/morelord-encounters/scripts/testing/mass-combat-ux.mjs');
  const {massCombatActivitiesCheck}=await import('/modules/morelord-encounters/scripts/testing/mass-combat-activities.mjs');
  const {roundZeroWaveCheck}=await import('/modules/morelord-encounters/scripts/testing/round-zero-waves.mjs');
  const {roundStartWaveCheck}=await import('/modules/morelord-encounters/scripts/testing/round-start-waves.mjs');
  return runInGameTests({checks:[massCombatUXCheck,massCombatActivitiesCheck,roundStartWaveCheck,roundZeroWaveCheck]});
 })().then(r=>globalThis.__uxReport=r).catch(e=>globalThis.__uxError=e.stack);true`);
 const visuals=[];
 for(const stage of ['prepare','waves','attacks']){
  await browser.wait(`globalThis.__uxStage==='${stage}' || globalThis.__uxReport || globalThis.__uxError`,60000);
  if(await browser.evaluate(`globalThis.__uxStage==='${stage}'`)){
   for(const theme of ['dark','light'])for(const width of [720,560]){
    await browser.evaluate(`(()=>{const app=foundry.applications.instances.get('morelord-encounters-configure');app.element.classList.remove('theme-dark','theme-light');app.element.classList.add('themed','theme-${theme}');app.setPosition({width:${width},height:850,left:16,top:24});for(const section of app.element.querySelectorAll('.ml-collapsible-section'))section.open=true;ui.notifications.clear();app.element.querySelector('[data-ml-section-key="encounters.mass.${stage}"]')?.scrollIntoView({block:'start'});})()`);
    await browser.evaluate('document.fonts.ready.then(()=>true)');
    const shot=await browser.command('Page.captureScreenshot',{format:'png'});
    await writeFile(new URL(`../test/in-game-reports/2026-11-23-mass-ux-${stage}-${theme}-${width}.png`,import.meta.url),Buffer.from(shot.data,'base64'));
    visuals.push(await browser.evaluate(`(()=>{const p=document.querySelector('.ml-encounters-mass-panel'),f=document.querySelector('#morelord-encounters-configure .ml-form-footer');return {stage:'${stage}',theme:'${theme}',width:${width},overflow:p.scrollWidth>p.clientWidth+1,footerVisible:f.getBoundingClientRect().bottom<=innerHeight};})()`));
   }
   await browser.evaluate('globalThis.__uxStage=null;globalThis.__uxResume();true');
  }
 }
 await browser.wait('globalThis.__uxReport || globalThis.__uxError',60000);
 const error=await browser.evaluate('globalThis.__uxError');if(error)throw Error(error);
 const report=await browser.evaluate('globalThis.__uxReport');
 report.visuals=visuals;
 if(visuals.some(v=>v.overflow || !v.footerVisible)){report.ok=false;report.layoutFailure='Mass Combat overflow or obscured footer';}
 await writeFile(new URL('../test/in-game-reports/2026-11-23-mass-combat-ux.json',import.meta.url),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
 if(!report.ok)process.exitCode=1;
}finally{await browser.evaluate('globalThis.__uxResume?.();true').catch(()=>{});await browser.evaluate('globalThis.__uxPromise').catch(()=>{});await browser.close();}

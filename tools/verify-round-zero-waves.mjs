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
 const report=await browser.evaluate(`await(async()=>{
  if(game.world.id!=='dev1' || !game.user.isGM)throw Error('Dev1 GM only');
  const {runInGameTests}=await import('/modules/morelord-core/scripts/testing/in-game.js');
  const {roundZeroWaveCheck}=await import('/modules/morelord-encounters/scripts/testing/round-zero-waves.mjs');
  return runInGameTests({checks:[roundZeroWaveCheck]});
 })()`);
 await writeFile(new URL('../test/in-game-reports/2026-11-23-round-zero-waves.json',import.meta.url),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
 if(!report.ok)process.exitCode=1;
}finally{await browser.close();}

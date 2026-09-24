import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.MORELORD_PLAYWRIGHT).href);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 950 } });
  await page.route("**/api/foundry/telemetry**", route => route.abort());
  await page.goto("http://127.0.0.1:31400/join");
  if ((await page.title()).trim().toLowerCase() !== "dev1") throw Error("Not verified Dev1; skipping live tests.");
  await page.locator("input[name=username]").fill(process.env.FOUNDRY_TEST_GM || "Chuck");
  await page.locator("input[name=password]").fill(process.env.FOUNDRY_TEST_PASSWORD || "");
  await page.locator("button[name=join]").click();
  await page.waitForFunction(() => globalThis.game?.ready && game.modules.get("morelord-core")?.api, {}, { timeout: 60000 });
  if (await page.evaluate(() => game.world.id.toLowerCase()) !== "dev1") throw Error("Not Dev1; skipping live tests.");
  const reports = await page.evaluate(async () => {
    const { runGuidedEncounterTests } = await import("./modules/morelord-encounters/scripts/testing/guided-encounters.mjs");
    const guided = await runGuidedEncounterTests();
    const { runInGameTests } = await import("./modules/morelord-core/scripts/testing/in-game.js");
    const { storyLibraryCheck } = await import("./modules/morelord-encounters/scripts/testing/story-library.mjs");
    const stories = await runInGameTests({ checks: [storyLibraryCheck] });
    return { guided, stories };
  });
  const prefix = "test/in-game-reports/2026-09-22-encounter-library";
  await fs.writeFile(`${prefix}.json`, JSON.stringify(reports, null, 2));
  console.log(JSON.stringify(reports));
  await page.evaluate(async () => {
    const { EncounterStoriesApp } = await import("./modules/morelord-encounters/scripts/apps/encounter-stories-dialog.mjs");
    globalThis.libraryReviewApp = new EncounterStoriesApp();
    await libraryReviewApp.render({ force: true });
  });
  for (const width of [850, 360]) {
    await page.evaluate(width => libraryReviewApp.setPosition({ width, left: 20, top: 20, height: 800 }), width);
    await page.locator("#morelord-encounters-stories").screenshot({ path: `${prefix}-${width}.png` });
  }
  await page.evaluate(() => libraryReviewApp.close());
  if (!reports.guided.ok || !reports.stories.ok) process.exitCode = 1;
} finally { await browser.close(); }

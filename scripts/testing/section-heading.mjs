import { assert } from "../../../morelord-core/scripts/testing/in-game.js";
import { configureEncounter } from "../apps/encounter-builder-dialog.mjs";

const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const selector = ".ml-encounters-party-section > .ml-section-heading";
function measure(heading) {
  const rect = heading.getBoundingClientRect();
  const style = getComputedStyle(heading);
  const title = getComputedStyle(heading.querySelector("h2"));
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height,
    border: style.borderBottom, padding: style.padding, margin: style.margin,
    titleFont: title.font, titleColor: title.color };
}

export async function compareEncounterSectionHeading() {
  assert(!foundry.applications.instances.has("morelord-encounters-configure"), "Close Encounters first.");
  const legacy = document.createElement("style");
  // Reproduce the removed override as well as checking checkouts that still contain it.
  legacy.textContent = `${selector} { width: 100%; align-self: stretch; }`;
  const editedRules = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules) {
      if (!rule.selectorText?.split(",").some(part => part.trim() === selector)) continue;
      editedRules.push([rule, rule.selectorText]);
      rule.selectorText = rule.selectorText.split(",").filter(part => part.trim() !== selector).join(",");
    }
  }
  let pending;
  const measurements = [];
  try {
    pending = configureEncounter({ initial: { encounterSource: "monster-compendiums" } });
    const deadline = Date.now() + 60000;
    let app;
    while (Date.now() < deadline) {
      app = foundry.applications.instances.get("morelord-encounters-configure");
      if (app?.rendered && app.element.querySelector(selector)) break;
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    assert(app?.rendered && app.element.querySelector(selector), "Encounter heading did not render.");
    for (const theme of ["dark", "light"]) for (const width of [960, 560]) {
      app.element.classList.remove("theme-dark", "theme-light");
      app.element.classList.add("themed", `theme-${theme}`);
      app.element.style.colorScheme = theme;
      app.setPosition({ width, height: 800, left: 10, top: 30 });
      document.head.append(legacy);
      await frame();
      const withOverride = measure(app.element.querySelector(selector));
      legacy.remove();
      await frame();
      const withoutOverride = measure(app.element.querySelector(selector));
      measurements.push({ theme, width, withOverride, withoutOverride });
      assert(JSON.stringify(withOverride) === JSON.stringify(withoutOverride), `Heading changes without override at ${width}px in ${theme}.`);
    }
    return measurements;
  } finally {
    legacy.remove();
    for (const [rule, original] of editedRules) rule.selectorText = original;
    await foundry.applications.instances.get("morelord-encounters-configure")?.close();
    if (pending) await pending;
  }
}

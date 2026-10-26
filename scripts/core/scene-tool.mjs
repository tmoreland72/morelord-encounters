const CORE_MODULE_ID = "morelord-core";
const CORE_TOOLS_VERSION = "0.6.0";

export function addMorelordTool(def, dependencies = {}) {
  const hooks = dependencies.hooks ?? globalThis.Hooks;
  hooks.once("setup", () => {
    const game = dependencies.game ?? globalThis.game;
    const coreModule = game?.modules?.get?.(CORE_MODULE_ID);
    if (coreProvidesTools(coreModule)) {
      coreModule.api.tools.register(def);
      return;
    }
    const key = legacySceneToolKey(def.id);
    hooks.on("getSceneControlButtons", controls => {
      const tokenTools = controls?.tokens?.tools;
      if (!tokenTools) return;
      tokenTools[key] = {
        name: key,
        title: def.title,
        icon: def.icon,
        order: Object.keys(tokenTools).length,
        button: true,
        visible: typeof def.visible === "function" ? def.visible() : def.visible,
        onChange: () => void def.onClick?.()
      };
    });
  });
}

export function coreProvidesTools(coreModule) {
  if (typeof coreModule?.api?.tools?.register !== "function") return false;
  const version = coreModule.version ?? coreModule.data?.version ?? coreModule.manifest?.version;
  if (!version) return true;
  return compareVersions(version, CORE_TOOLS_VERSION) >= 0;
}

export function legacySceneToolKey(id) {
  return String(id ?? "").replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function compareVersions(left, right) {
  const parse = value => String(value ?? "").split(".").map(part => Number.parseInt(part, 10) || 0);
  const a = parse(left);
  const b = parse(right);
  const length = Math.max(a.length, b.length, 3);
  for (let index = 0; index < length; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return 0;
}

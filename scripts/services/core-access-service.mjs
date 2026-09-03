import { PRODUCT_SLUG } from "../domain/constants.mjs";
import { getCoreApi } from "../core/core-api.mjs";

const normalize = value => String(value ?? "").trim().toLowerCase();
const PREMIUM_TIERS = new Set(["premium", "tools-premium", "tools_premium"]);
export const ENCOUNTER_FEATURES = Object.freeze({
  standard: "encounters.standard",
  premium: "encounters.premium"
});

export class CoreAccessService {
  get api() {
    return getCoreApi();
  }

  get tier() { return normalize(this.api?.getTier?.(PRODUCT_SLUG) ?? "standard"); }
  get entitlements() { return this.api?.getEntitlements?.(PRODUCT_SLUG) ?? null; }
  get isConnected() { return Boolean(this.api?.isConnected?.()); }
  get isActive() { return Boolean(this.api); }

  hasFeature(feature) {
    return Boolean(this.api?.hasFeature?.(feature, PRODUCT_SLUG));
  }

  get rawFeatures() {
    return {
      standard: this.hasFeature(ENCOUNTER_FEATURES.standard),
      premium: this.hasFeature(ENCOUNTER_FEATURES.premium)
    };
  }

  get access() {
    const raw = this.rawFeatures;
    const premium = PREMIUM_TIERS.has(this.tier) || raw.premium;
    return {
      standard: premium || raw.standard || !this.isConnected,
      premium
    };
  }

  canUseSource(source, access = this.access) {
    if (access.premium) return true;
    const label = normalize(source.label);
    const labelIsMeaningful = label && !/^(actors?|monsters?|bestiary|adventure bestiary)$/.test(label);
    const value = labelIsMeaningful
      ? label
      : normalize([source.book, source.packLabel, source.id].filter(Boolean).join(" "));
    const isSrd = /\bsrd\b|system reference document|dnd5e\.monsters/.test(value);
    if (isSrd) return access.standard;
    return false;
  }

  async refresh({ quiet = true } = {}) {
    if (!this.api?.refresh) return null;
    try { return await this.api.refresh(PRODUCT_SLUG, { quiet }); }
    catch (error) {
      console.error("Morelord Encounters | Unable to refresh entitlements", error);
      if (!quiet) ui.notifications.error(error?.message ?? "Encounter access could not be refreshed.");
      return null;
    }
  }

  openAccount() {
    if (this.api?.open) return this.api.open();
    ui.notifications.warn("Morelord Core must be enabled before a Morelord account can be connected.");
    return null;
  }

  status() {
    return {
      coreActive: this.isActive,
      connected: this.isConnected,
      tier: this.tier,
      features: this.access,
      rawFeatures: this.rawFeatures,
      validatedAt: this.entitlements?.validatedAt ?? null,
      expiresAt: this.entitlements?.expiresAt ?? null
    };
  }
}

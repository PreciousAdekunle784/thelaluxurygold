import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getSettings } from "@/lib/repo/settings";

export const SETTINGS_TAG = "site-settings";

export interface SiteSettings {
  /** Media key for the homepage hero background (desktop / wide screens). */
  heroDesktop?: string;
  /** Media key for the hero on phones (falls back to the desktop image). */
  heroMobile?: string;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(SETTINGS_TAG);
  try {
    const s = await getSettings(["heroDesktop", "heroMobile"]);
    return { heroDesktop: s.heroDesktop || undefined, heroMobile: s.heroMobile || undefined };
  } catch (err) {
    console.error("[settings] unavailable, using defaults", err);
    return {};
  }
}

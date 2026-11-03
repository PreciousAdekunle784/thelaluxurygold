import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getSettings } from "@/lib/repo/settings";
import { withTimeout } from "@/lib/db/client";

export const SETTINGS_TAG = "site-settings";

export interface SiteSettings {
  /** Media key for the homepage hero background (desktop / wide screens). */
  heroDesktop?: string;
  /** Media key for the hero on phones (falls back to the desktop image). */
  heroMobile?: string;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  try {
    const s = await withTimeout(getSettings(["heroDesktop", "heroMobile"]), 12_000);
    cacheLife("hours");
    return { heroDesktop: s.heroDesktop || undefined, heroMobile: s.heroMobile || undefined };
  } catch (err) {
    console.error("[settings] database unavailable, using default hero:", err instanceof Error ? err.message : err);
    cacheLife("minutes");
    return {};
  }
}

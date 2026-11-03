import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getSettings } from "@/lib/repo/settings";
import { withTimeout } from "@/lib/db/client";
import { DEFAULT_NGN_PER_USD } from "@/lib/config/store";
import { parseTestimonials, type Testimonial } from "./testimonials";

export const SETTINGS_TAG = "site-settings";

export interface SiteSettings {
  /** Media key for the homepage hero background (desktop / wide screens). */
  heroDesktop?: string;
  /** Media key for the hero on phones (falls back to the desktop image). */
  heroMobile?: string;
  /** Naira per US dollar for the currency switcher (set in Admin → Store settings). */
  ngnPerUsd: number;
  /** Published client testimonials (the homepage section is hidden when empty). */
  testimonials: Testimonial[];
}

function parseRate(v?: string) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_NGN_PER_USD;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  try {
    const s = await withTimeout(getSettings(["heroDesktop", "heroMobile", "ngnPerUsd", "testimonials"]), 12_000);
    cacheLife("hours");
    return { heroDesktop: s.heroDesktop || undefined, heroMobile: s.heroMobile || undefined, ngnPerUsd: parseRate(s.ngnPerUsd), testimonials: parseTestimonials(s.testimonials).filter((t) => t.published) };
  } catch (err) {
    console.error("[settings] database unavailable, using default hero:", err instanceof Error ? err.message : err);
    cacheLife("minutes");
    return { ngnPerUsd: DEFAULT_NGN_PER_USD, testimonials: [] };
  }
}

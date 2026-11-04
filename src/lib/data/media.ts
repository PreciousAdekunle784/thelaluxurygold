import { mediaManifest } from "./media.generated";

/**
 * Media registry. Every image used on the site is referenced by a key, e.g.
 * "products/aurelia-band-1" → /public/images/laluxurygold/products/aurelia-band-1.webp.
 *
 * To replace imagery, drop a new file at the same path (keeping the aspect ratio),
 * then run `npm run media` to refresh dimensions and blur placeholders.
 */
export interface MediaAsset {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
}

/** Images from the previous library that may still be referenced in the database → their replacements. */
const LEGACY: Record<string, string> = {
  "editorial/hero": "campaign/campaign-editorial",
  "editorial/hero-mobile": "campaign/hero-mobile",
  "editorial/hero-loop": "campaign/hero-desktop",
  "editorial/hero-loop-mobile": "campaign/hero-mobile",
  "editorial/campaign": "campaign/campaign-burgundy",
  "editorial/investment": "campaign/gold-bars-wide",
  "editorial/story": "brand/our-story",
  "editorial/category-rings": "collections/collection-rings",
  "editorial/category-necklaces": "collections/collection-necklaces",
  "editorial/category-bracelets": "collections/collection-bracelets",
  "editorial/category-earrings": "collections/collection-earrings",
  "editorial/category-bars": "collections/collection-gold-bars",
  "editorial/social-1": "products/classic-hoops-2",
  "editorial/social-2": "products/corde-rope-chain-2",
  "editorial/social-3": "products/minted-gold-bar-10g-2",
  "editorial/social-4": "products/maison-signet-2",
  "editorial/social-5": "products/halo-bangle-2",
  "editorial/social-6": "details/premium-packaging",
};

export function media(key: string): MediaAsset {
  if (LEGACY[key]) key = LEGACY[key];
  // Images uploaded through the admin are stored in the database and served from /media/<id>.
  if (key.startsWith("uploads/")) return { src: `/media/${key.slice(8)}`, width: 1200, height: 1500 };
  const entry = mediaManifest[key];
  if (!entry) {
    if (process.env.NODE_ENV !== "production") console.warn(`[media] Unknown media key: ${key}`);
    return { src: "/images/placeholder.svg", width: 1200, height: 1500 };
  }
  const [width, height, blurDataURL] = entry;
  return { src: `/images/laluxurygold/${key}.webp`, width, height, blurDataURL };
}

/** Built-in image keys (for the admin image picker). */
export const builtInMediaKeys = Object.keys(mediaManifest);

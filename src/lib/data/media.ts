import { mediaManifest } from "./media.generated";

/**
 * Media registry. Every image used on the site is referenced by a key, e.g.
 * "products/aurelia-band-1" → /public/images/products/aurelia-band-1.webp.
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

export function media(key: string): MediaAsset {
  // Images uploaded through the admin are stored in the database and served from /media/<id>.
  if (key.startsWith("uploads/")) return { src: `/media/${key.slice(8)}`, width: 1200, height: 1500 };
  const entry = mediaManifest[key];
  if (!entry) {
    if (process.env.NODE_ENV !== "production") console.warn(`[media] Unknown media key: ${key}`);
    return { src: "/images/placeholder.svg", width: 1200, height: 1500 };
  }
  const [width, height, blurDataURL] = entry;
  return { src: `/images/${key}.webp`, width, height, blurDataURL };
}

/** Built-in image keys (for the admin image picker). */
export const builtInMediaKeys = Object.keys(mediaManifest);

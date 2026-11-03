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
  const entry = mediaManifest[key];
  if (!entry) {
    if (process.env.NODE_ENV !== "production") console.warn(`[media] Unknown media key: ${key}`);
    return { src: "/images/placeholder.svg", width: 1200, height: 1500 };
  }
  const [width, height, blurDataURL] = entry;
  return { src: `/images/${key}.webp`, width, height, blurDataURL };
}

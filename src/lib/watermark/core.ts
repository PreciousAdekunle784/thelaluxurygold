/**
 * The LA Luxury Gold watermark: the brand name ("LA LUXURY GOLD" in the wordmark's Cormorant lettering), faint and
 * centred, composited into an image's pixels.
 *
 * Shared by the upload pipeline (server) and scripts/watermark-images.mjs (built-in photos), so every
 * product image gets exactly the same treatment. No imports besides sharp, so Node can run this file
 * directly from the script.
 */
import sharp from "sharp";

/** The watermark's look (kept here, not in the admin: there is nothing to configure). */
export const WATERMARK_STYLE = {
  /** Wordmark width as a share of the width the website shows (see visibleRegion). */
  widthRatio: 0.62,
  /** Never taller than this share of the shown height. */
  maxHeightRatio: 0.2,
  /** Opacity of the letters: faint, so the jewellery stays the subject (dark letters show more, so they are fainter). */
  opacity: { ink: 0.17, ivory: 0.24 },
  /** Never smaller than this, so it stays legible on small images. */
  minWidthPx: 120,
} as const;

export interface WatermarkLogos {
  /** Wordmark with dark letters, for light photos. */
  ink: Buffer;
  /** Wordmark with light letters, for dark photos. */
  ivory: Buffer;
}

/** Decoded pixels: what the watermark is drawn onto. */
export interface RawImage {
  data: Buffer;
  width: number;
  height: number;
  channels: 1 | 2 | 3 | 4;
}

export interface Placement {
  left: number;
  top: number;
  width: number;
  height: number;
  tone: "ink" | "ivory";
}

/**
 * The website shows product photos in portrait frames that are filled edge to edge (CSS object-fit: cover,
 * centred): 4:5 on product cards and the product page, 5:6 for the main photo on wide screens. A photo of
 * another shape is trimmed to fit (a tall phone photo loses its top and bottom, a wide one its sides). This is
 * the centred part of the photo that every one of those frames shows; the wordmark is sized to fit inside it.
 */
export const DISPLAY_FRAMES = [4 / 5, 5 / 6] as const;

export function visibleRegion(imageWidth: number, imageHeight: number) {
  const narrowest = Math.min(...DISPLAY_FRAMES); // limits the width shown of wide photos
  const widest = Math.max(...DISPLAY_FRAMES); // limits the height shown of tall photos
  const width = Math.min(imageWidth, Math.round(imageHeight * narrowest));
  const height = Math.min(imageHeight, Math.round(imageWidth / widest));
  return { left: Math.floor((imageWidth - width) / 2), top: Math.floor((imageHeight - height) / 2), width, height };
}

/**
 * Where the wordmark goes for an image of this size: centred, about 62% of the width the website shows (see
 * visibleRegion), so the whole name is visible in every frame. The wordmark keeps its own proportions.
 */
export function placement(imageWidth: number, imageHeight: number, logoAspect: number): Omit<Placement, "tone"> {
  const s = WATERMARK_STYLE;
  const r = visibleRegion(imageWidth, imageHeight);
  let width = Math.max(s.minWidthPx, Math.round(r.width * s.widthRatio));
  if (width * logoAspect > r.height * s.maxHeightRatio) width = Math.round((r.height * s.maxHeightRatio) / logoAspect);
  width = Math.max(1, Math.min(width, imageWidth));
  const height = Math.max(1, Math.min(imageHeight, Math.round(width * logoAspect)));
  return {
    width,
    height,
    left: Math.max(0, Math.round(r.left + (r.width - width) / 2)),
    top: Math.max(0, Math.round(r.top + (r.height - height) / 2)),
  };
}

/**
 * Draw the watermark into the image and encode it as WebP (same size, same proportions, alpha kept).
 * The tone follows the photograph: dark letters where the middle of the photo is light, light letters where it is dark.
 */
export async function applyWatermark(img: RawImage, logos: WatermarkLogos, opts: { quality?: number } = {}) {
  const raw = { width: img.width, height: img.height, channels: img.channels };
  const logoMeta = await sharp(logos.ink).metadata();
  const aspect = (logoMeta.height ?? 1) / (logoMeta.width ?? 1);
  const p = placement(img.width, img.height, aspect);
  const tone = (await areaIsDark(img, p)) ? "ivory" : "ink";

  const logo = await sharp(tone === "ivory" ? logos.ivory : logos.ink)
    .resize({ width: p.width, height: p.height, fit: "fill", kernel: "lanczos3" }) // same proportions as the artwork
    .ensureAlpha()
    .linear([1, 1, 1, WATERMARK_STYLE.opacity[tone]], [0, 0, 0, 0]) // scale only the alpha channel: faint letters
    .png()
    .toBuffer();

  const out = await sharp(img.data, { raw })
    .composite([{ input: logo, left: p.left, top: p.top }])
    .webp({ quality: opts.quality ?? 90, effort: 5, alphaQuality: 100 })
    .toBuffer({ resolveWithObject: true });
  return { data: out.data, width: out.info.width, height: out.info.height, placement: { ...p, tone } satisfies Placement };
}

/** Average brightness of the area the wordmark will cover (transparent areas count as the site's light backgrounds). */
async function areaIsDark(img: RawImage, p: Omit<Placement, "tone">) {
  const region = sharp(img.data, { raw: { width: img.width, height: img.height, channels: img.channels } })
    .extract({ left: p.left, top: p.top, width: Math.min(p.width, img.width - p.left), height: Math.min(p.height, img.height - p.top) })
    .flatten({ background: "#f7f3ec" });
  const { channels } = await region.stats();
  const [r, g, b] = channels.length >= 3 ? [channels[0].mean, channels[1].mean, channels[2].mean] : [channels[0].mean, channels[0].mean, channels[0].mean];
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.5;
}

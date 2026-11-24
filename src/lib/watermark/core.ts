/**
 * The LA Luxury Gold watermark: the brand's LG monogram, composited into an image's pixels.
 *
 * Shared by the upload pipeline (server) and scripts/watermark-images.mjs (built-in photos), so every
 * product image gets exactly the same treatment. No imports besides sharp, so Node can run this file
 * directly from the script.
 */
import sharp from "sharp";

/** The watermark's look (kept here, not in the admin: there is nothing to configure). */
export const WATERMARK_STYLE = {
  /** Logo width as a share of the image width (the brief: about 12–15%). */
  widthRatio: 0.135,
  /** Never taller than this share of the image height (keeps it modest on wide, short images). */
  maxHeightRatio: 0.22,
  /** Distance from the right and bottom edges, as a share of the image's shorter side (about 3%). */
  marginRatio: 0.03,
  /** Opacity of the logo (about 40%). */
  opacity: 0.4,
  /** Never smaller than this, so it stays recognisable on small images. */
  minWidthPx: 24,
} as const;

export interface WatermarkLogos {
  /** Monogram with dark letters, for light backgrounds. */
  ink: Buffer;
  /** Monogram with light letters, for dark backgrounds. */
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
 * Where the logo goes for an image of this size: bottom-right, about 13.5% of the width (smaller on
 * very wide images), with a ~3% margin. The logo keeps its own proportions.
 */
export function placement(imageWidth: number, imageHeight: number, logoAspect: number): Omit<Placement, "tone"> {
  const s = WATERMARK_STYLE;
  let width = Math.max(s.minWidthPx, Math.round(imageWidth * s.widthRatio));
  if (width * logoAspect > imageHeight * s.maxHeightRatio) width = Math.max(s.minWidthPx, Math.round((imageHeight * s.maxHeightRatio) / logoAspect));
  width = Math.min(width, imageWidth);
  const height = Math.round(width * logoAspect);
  const margin = Math.round(Math.min(imageWidth, imageHeight) * s.marginRatio);
  return { width, height, left: Math.max(0, imageWidth - margin - width), top: Math.max(0, imageHeight - margin - height) };
}

/**
 * Draw the watermark into the image and encode it as WebP (same size, same proportions, alpha kept).
 * The logo tone follows the photograph: dark letters where the corner is light, light letters where it is dark.
 */
export async function applyWatermark(img: RawImage, logos: WatermarkLogos, opts: { quality?: number } = {}) {
  const raw = { width: img.width, height: img.height, channels: img.channels };
  const logoMeta = await sharp(logos.ink).metadata();
  const aspect = (logoMeta.height ?? 1) / (logoMeta.width ?? 1);
  const p = placement(img.width, img.height, aspect);
  const tone = (await cornerIsDark(img, p)) ? "ivory" : "ink";

  const logo = await sharp(tone === "ivory" ? logos.ivory : logos.ink)
    .resize({ width: p.width, kernel: "lanczos3" }) // height follows: proportions preserved
    .ensureAlpha()
    .linear([1, 1, 1, WATERMARK_STYLE.opacity], [0, 0, 0, 0]) // scale only the alpha channel: ~40% opacity
    .png()
    .toBuffer();

  const out = await sharp(img.data, { raw })
    .composite([{ input: logo, left: p.left, top: p.top }])
    .webp({ quality: opts.quality ?? 90, effort: 5, alphaQuality: 100 })
    .toBuffer({ resolveWithObject: true });
  return { data: out.data, width: out.info.width, height: out.info.height, placement: { ...p, tone } satisfies Placement };
}

/** Average brightness of the area the logo will cover (transparent areas count as the site's light backgrounds). */
async function cornerIsDark(img: RawImage, p: Omit<Placement, "tone">) {
  const region = sharp(img.data, { raw: { width: img.width, height: img.height, channels: img.channels } })
    .extract({ left: p.left, top: p.top, width: Math.min(p.width, img.width - p.left), height: Math.min(p.height, img.height - p.top) })
    .flatten({ background: "#f7f3ec" });
  const { channels } = await region.stats();
  const [r, g, b] = channels.length >= 3 ? [channels[0].mean, channels[1].mean, channels[2].mean] : [channels[0].mean, channels[0].mean, channels[0].mean];
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.5;
}

import "server-only";
import sharp from "sharp";
import { applyWatermark, type RawImage } from "@/lib/watermark/core";
import { watermarkLogos } from "./watermark-logos";

/** The uploaded file isn't a picture we can read. */
export class UnreadableImageError extends Error {}
/** The picture was read but the watermark could not be applied, so it must not be published. */
export class WatermarkError extends Error {}

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
  /** true when the LA Luxury Gold watermark is in the pixels */
  watermarked: boolean;
}

/**
 * Turn an uploaded picture, in whatever format, into the WebP the store shows. Product images get the
 * LA Luxury Gold watermark drawn into their pixels; the homepage hero (`watermark: false`) does not.
 * If the watermark can't be applied this throws WatermarkError: a product image is never returned without it.
 *
 * libvips (via sharp) reads JPEG, PNG, WebP, AVIF, GIF (first frame), TIFF and SVG. Two common formats it
 * can't read on hosted servers are handled here too: HEIC/HEIF photos from iPhones (HEVC needs a separate
 * decoder) and Windows BMP files.
 */
export async function processUpload(input: Buffer, opts: { large?: boolean; watermark?: boolean } = {}): Promise<ProcessedImage> {
  const pixels = await decodeForDisplay(input, !!opts.large);
  const raw = { width: pixels.width, height: pixels.height, channels: pixels.channels };
  if (!opts.watermark) {
    const out = await sharp(pixels.data, { raw }).webp({ quality: 84 }).toBuffer({ resolveWithObject: true });
    return { data: out.data, width: out.info.width, height: out.info.height, watermarked: false };
  }
  try {
    const out = await applyWatermark(pixels, watermarkLogos());
    if (out.width !== pixels.width || out.height !== pixels.height) throw new Error("watermarked image changed size");
    return { data: out.data, width: out.width, height: out.height, watermarked: true };
  } catch (err) {
    throw new WatermarkError(err instanceof Error ? err.message : String(err));
  }
}

/** Decode, turn upright, fit inside the display size (never enlarged, proportions kept) and convert to sRGB pixels. */
async function decodeForDisplay(input: Buffer, large: boolean): Promise<RawImage> {
  const box = large ? { width: 2800, height: 2800 } : { width: 1600, height: 2000 };
  const toPixels = (img: ReturnType<typeof sharp>) =>
    img
      .rotate() // respect the camera's orientation
      .resize({ ...box, fit: "inside", withoutEnlargement: !isSvg(input) })
      .toColorspace("srgb")
      .raw()
      .toBuffer({ resolveWithObject: true });

  let out: Awaited<ReturnType<typeof toPixels>> | null = null;
  try {
    out = await toPixels(sharp(input, { failOn: "none", density: isSvg(input) ? 300 : undefined }));
  } catch {
    const raw = isHeic(input) ? await decodeHeic(input) : isBmp(input) ? decodeBmp(input) : null;
    if (raw) out = await toPixels(sharp(raw.data, { raw: { width: raw.width, height: raw.height, channels: 4 } }));
  }
  if (!out) throw new UnreadableImageError("Unsupported or damaged image");
  return { data: out.data, width: out.info.width, height: out.info.height, channels: out.info.channels as RawImage["channels"] };
}

/** The format of an uploaded file, from its first bytes (recorded with the stored original). */
export function sniffImageType(b: Buffer) {
  const ascii = (from: number, to: number) => b.toString("latin1", from, to);
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (ascii(0, 8) === "\x89PNG\r\n\x1a\n") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(0, 4) === "GIF8") return "image/gif";
  if (ascii(0, 4) === "II*\0" || ascii(0, 4) === "MM\0*") return "image/tiff";
  if (ascii(0, 2) === "BM") return "image/bmp";
  if (ascii(4, 8) === "ftyp") return /^avi[fs]$/.test(ascii(8, 12)) ? "image/avif" : "image/heic";
  if (isSvg(b)) return "image/svg+xml";
  return "application/octet-stream";
}

const isSvg = (b: Buffer) => /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(b.subarray(0, 2048).toString("utf8"));

/** ISO-BMFF files from cameras and phones: `ftyp` box with a HEIF brand. */
function isHeic(b: Buffer) {
  if (b.length < 12 || b.toString("latin1", 4, 8) !== "ftyp") return false;
  return /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1|avci)$/.test(b.toString("latin1", 8, 12));
}

async function decodeHeic(b: Buffer) {
  try {
    const { default: decode } = await import("heic-decode");
    const img = await decode({ buffer: b });
    return { width: img.width, height: img.height, data: Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength) };
  } catch (err) {
    console.error("[upload] HEIC decode failed", err);
    return null;
  }
}

const isBmp = (b: Buffer) => b.length > 54 && b.toString("latin1", 0, 2) === "BM";

/** Minimal decoder for uncompressed 24/32-bit BMPs (what Paint and most tools save). */
function decodeBmp(b: Buffer) {
  try {
    const offset = b.readUInt32LE(10);
    const width = b.readInt32LE(18);
    const rawHeight = b.readInt32LE(22);
    const bpp = b.readUInt16LE(28);
    const compression = b.readUInt32LE(30);
    const height = Math.abs(rawHeight);
    if (width <= 0 || height === 0 || width * height > 100_000_000 || (bpp !== 24 && bpp !== 32) || (compression !== 0 && compression !== 3)) return null;
    const stride = Math.ceil((width * bpp) / 32) * 4;
    if (offset + stride * height > b.length) return null;
    const data = Buffer.alloc(width * height * 4);
    const bytes = bpp / 8;
    for (let y = 0; y < height; y++) {
      const row = offset + (rawHeight > 0 ? height - 1 - y : y) * stride; // positive height = stored bottom-up
      for (let x = 0; x < width; x++) {
        const s = row + x * bytes;
        const d = (y * width + x) * 4;
        data[d] = b[s + 2];
        data[d + 1] = b[s + 1];
        data[d + 2] = b[s];
        data[d + 3] = 255; // most 32-bit BMPs don't use their alpha byte, so treat them as opaque
      }
    }
    return { width, height, data };
  } catch {
    return null;
  }
}

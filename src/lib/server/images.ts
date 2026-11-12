import "server-only";
import sharp from "sharp";

/** The uploaded file isn't a picture we can read. */
export class UnreadableImageError extends Error {}

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
}

/**
 * Turn an uploaded picture, in whatever format, into an optimised WebP for the store.
 *
 * libvips (via sharp) reads JPEG, PNG, WebP, AVIF, GIF (first frame), TIFF and SVG. Two common formats it
 * can't read on hosted servers are handled here too: HEIC/HEIF photos from iPhones (HEVC needs a separate
 * decoder) and Windows BMP files.
 */
export async function processUpload(input: Buffer, opts: { large?: boolean } = {}): Promise<ProcessedImage> {
  const box = opts.large ? { width: 2800, height: 2800 } : { width: 1600, height: 2000 };
  const encode = (img: ReturnType<typeof sharp>) =>
    img
      .rotate() // respect the camera's orientation
      .resize({ ...box, fit: "inside", withoutEnlargement: !isSvg(input) })
      .toColorspace("srgb")
      .webp({ quality: 84 })
      .toBuffer({ resolveWithObject: true });

  let out: Awaited<ReturnType<typeof encode>> | null = null;
  try {
    out = await encode(sharp(input, { failOn: "none", density: isSvg(input) ? 300 : undefined }));
  } catch {
    const raw = isHeic(input) ? await decodeHeic(input) : isBmp(input) ? decodeBmp(input) : null;
    if (raw) out = await encode(sharp(raw.data, { raw: { width: raw.width, height: raw.height, channels: 4 } }));
  }
  if (!out) throw new UnreadableImageError("Unsupported or damaged image");
  return { data: out.data, width: out.info.width, height: out.info.height };
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

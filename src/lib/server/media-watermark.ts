import "server-only";
import { getMediaOriginal, getMediaState, preserveOriginal, setWatermarkedImage } from "@/lib/repo/misc";
import { WATERMARK_REVISION } from "@/lib/watermark/revision";
import { processUpload } from "./images";

const inFlight = new Map<string, Promise<boolean>>();

/**
 * Make sure a product upload's served image carries the current watermark.
 *
 *  - Homepage (hero) images are left as they are.
 *  - Already watermarked with the current revision: nothing to do.
 *  - Otherwise the watermarked image is rebuilt from the preserved ORIGINAL (for uploads made before
 *    watermarking, their stored image is preserved as the original first). It is never drawn onto an
 *    already watermarked image, so a watermark can't be applied twice.
 *
 * Returns false if the image doesn't exist. Throws if watermarking fails (the caller must not publish it).
 */
export function ensureWatermarked(id: string): Promise<boolean> {
  // Concurrent requests for the same image share one piece of work.
  let p = inFlight.get(id);
  if (!p) {
    p = run(id).finally(() => inFlight.delete(id));
    inFlight.set(id, p);
  }
  return p;
}

async function run(id: string) {
  const state = await getMediaState(id);
  if (!state) return false;
  if (state.purpose !== "product" || state.watermark === WATERMARK_REVISION) return true;
  await preserveOriginal(id);
  const original = await getMediaOriginal(id);
  if (!original) throw new Error(`No original stored for ${id}`);
  const img = await processUpload(original.bytes, { watermark: true });
  await setWatermarkedImage(id, { bytes: img.data, width: img.width, height: img.height }, WATERMARK_REVISION);
  return true;
}

/** Upload ids used by a product's images (keys like "uploads/m0123…"). */
export function uploadIds(images: { media: string }[]) {
  return [...new Set(images.map((i) => i.media).filter((k) => k.startsWith("uploads/")).map((k) => k.slice(8)))];
}

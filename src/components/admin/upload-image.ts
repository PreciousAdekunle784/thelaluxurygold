"use client";

import { uploadImageAction, uploadImageChunkAction } from "@/app/admin/(panel)/products/actions";

export type UploadPurpose = "product" | "hero";
export type UploadResult = { ok: true; key: string } | { ok: false; error: string };

/** What the file picker offers: every image type, plus extensions some systems don't map to image/*. */
export const IMAGE_ACCEPT = "image/*,.heic,.heif,.hif,.avif,.webp,.jpg,.jpeg,.jfif,.png,.gif,.tif,.tiff,.bmp,.svg";

/** Requests stay well under the ~4.5 MB limit of serverless hosts (Vercel). */
const PIECE = 3 * 1024 * 1024;
/** Formats the server stores as-is when small: no need to re-encode them in the browser first. */
const LIGHT_FORMATS = /^image\/(jpeg|png|webp|avif)$/;

/**
 * Upload a picture in any format. Whatever the browser can open is resized and converted here first, so
 * even very large photos upload quickly; anything else (e.g. HEIC in Chrome, TIFF) is sent as it is, in
 * pieces if needed, and converted on the server.
 */
export async function uploadImage(file: File, purpose: UploadPurpose = "product"): Promise<UploadResult> {
  if (!file.size) return { ok: false, error: `“${file.name}” is empty.` };
  let body: Blob = file;
  if (!(LIGHT_FORMATS.test(file.type) && file.size <= PIECE)) {
    const converted = await convertInBrowser(file, purpose === "hero" ? 3200 : 2400).catch(() => null);
    if (converted) body = converted;
  }
  try {
    if (body.size <= PIECE) {
      const fd = new FormData();
      fd.set("file", body, file.name);
      fd.set("name", file.name);
      fd.set("purpose", purpose);
      return await uploadImageAction(fd);
    }
    const uploadId = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
    const total = Math.ceil(body.size / PIECE);
    for (let index = 0; index < total; index++) {
      const fd = new FormData();
      fd.set("uploadId", uploadId);
      fd.set("index", String(index));
      fd.set("total", String(total));
      fd.set("name", file.name);
      fd.set("purpose", purpose);
      fd.set("chunk", body.slice(index * PIECE, (index + 1) * PIECE));
      const res = await uploadImageChunkAction(fd);
      if (!res.ok) return res;
      if (res.key) return { ok: true, key: res.key };
    }
    return { ok: false, error: "Upload failed. Please try again." };
  } catch {
    return { ok: false, error: `“${file.name}” didn’t finish uploading. Check your connection and try again.` };
  }
}

const isSvg = (f: File) => f.type === "image/svg+xml" || /\.svg$/i.test(f.name);

/** Decode with the browser, scale so the long edge is at most `maxEdge`, and re-encode (WebP, else JPEG). */
async function convertInBrowser(file: File, maxEdge: number): Promise<Blob | null> {
  const img = await decode(file);
  if (!img) return null;
  try {
    const { width: w, height: h } = img;
    if (!w || !h) return null;
    // vectors are drawn at full size; photos are only ever scaled down
    const scale = isSvg(file) ? maxEdge / Math.max(w, h) : Math.min(1, maxEdge / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img.source, 0, 0, canvas.width, canvas.height);
    const webp = await toBlob(canvas, "image/webp", 0.92);
    if (webp?.type === "image/webp") return webp;
    // browsers that can't write WebP (older Safari): JPEG on white, since JPEG has no transparency
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return await toBlob(canvas, "image/jpeg", 0.92);
  } finally {
    img.close();
  }
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void } | null> {
  if (!isSvg(file) && typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* not decodable this way; try an <img> below */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const el = new Image();
    el.src = url;
    await el.decode();
    // SVGs without a size report 0 (or 300×150): fall back to the 4:5 product proportion
    const width = el.naturalWidth || 1600;
    const height = el.naturalHeight || 2000;
    return { source: el, width, height, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

"use client";

import { uploadImageAction, uploadImageChunkAction } from "@/app/admin/(panel)/products/actions";

export type UploadPurpose = "product" | "hero";
export type UploadResult = { ok: true; key: string } | { ok: false; error: string };

/** What the file picker offers: every image type, plus extensions some systems don't map to image/*. */
export const IMAGE_ACCEPT = "image/*,.heic,.heif,.hif,.avif,.webp,.jpg,.jpeg,.jfif,.png,.gif,.tif,.tiff,.bmp,.svg";

/** Requests stay well under the ~4.5 MB limit of serverless hosts (Vercel). */
const PIECE = 3 * 1024 * 1024;

/**
 * Upload a picture in any format, exactly as it is: the server keeps this original untouched and makes the
 * image the site shows from it (watermarked for products). Large files are sent in pieces.
 */
export async function uploadImage(file: File, purpose: UploadPurpose = "product"): Promise<UploadResult> {
  if (!file.size) return { ok: false, error: `“${file.name}” is empty.` };
  const body: Blob = file;
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

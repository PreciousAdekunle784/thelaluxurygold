import "server-only";
import { NextResponse } from "next/server";
import { getMedia } from "@/lib/repo/misc";
import { WATERMARK_REVISION } from "@/lib/watermark/revision";
import { ensureWatermarked } from "./media-watermark";

/**
 * Serve an uploaded image. Product images are only ever served with the current watermark: one uploaded
 * before watermarking existed is watermarked (from its preserved original) on its first request, and if that
 * fails the response is an error, never the unwatermarked image.
 */
export async function serveMedia(id: string, cache: "immutable" | "short") {
  if (!/^m[a-f0-9]{16}$/.test(id)) return new NextResponse("Not found", { status: 404 });
  let m = await getMedia(id);
  if (!m) return new NextResponse("Not found", { status: 404 });
  if (m.purpose === "product" && m.watermark !== WATERMARK_REVISION) {
    try {
      await ensureWatermarked(id);
      m = await getMedia(id);
    } catch (err) {
      console.error("[media] watermark failed for", id, err);
      m = null;
    }
    if (!m || m.watermark !== WATERMARK_REVISION) {
      return new NextResponse("This image is being prepared. Please try again shortly.", { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "10" } });
    }
  }
  return new NextResponse(new Uint8Array(m.bytes), {
    headers: {
      "Content-Type": m.contentType,
      "Content-Length": String(m.bytes.length),
      // The versioned address (/media/<id>/<revision>) never changes content, so browsers and the CDN may keep it.
      // The bare /media/<id> address changes when the watermark revision does, so it is only cached briefly.
      "Cache-Control": cache === "immutable" ? "public, max-age=31536000, s-maxage=31536000, immutable" : "public, max-age=3600, s-maxage=3600",
    },
  });
}

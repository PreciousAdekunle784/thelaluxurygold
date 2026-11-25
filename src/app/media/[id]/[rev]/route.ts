import { connection, NextResponse, type NextRequest } from "next/server";
import { serveMedia } from "@/lib/server/serve-media";
import { WATERMARK_REVISION } from "@/lib/watermark/revision";

/** Uploaded image at its versioned address, e.g. /media/m0123…/w2 (cached for a year). */
export async function GET(req: NextRequest, ctx: RouteContext<"/media/[id]/[rev]">) {
  await connection();
  const { id, rev } = await ctx.params;
  // An address from an older watermark revision points to the current one.
  if (rev !== WATERMARK_REVISION) return NextResponse.redirect(new URL(`/media/${id}/${WATERMARK_REVISION}`, req.url), 308);
  return serveMedia(id, "immutable");
}

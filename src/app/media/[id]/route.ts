import { connection, NextResponse, type NextRequest } from "next/server";
import { getMedia } from "@/lib/repo/misc";

export async function GET(_req: NextRequest, ctx: RouteContext<"/media/[id]">) {
  await connection();
  const { id } = await ctx.params;
  if (!/^m[a-f0-9]{16}$/.test(id)) return new NextResponse("Not found", { status: 404 });
  const m = await getMedia(id);
  if (!m) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(m.bytes), {
    // Uploads are never changed in place (a new upload gets a new id), so browsers AND the CDN may keep them:
    // s-maxage lets Vercel's edge cache serve repeat requests without touching the database.
    headers: { "Content-Type": m.contentType, "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable", "Content-Length": String(m.bytes.length) },
  });
}

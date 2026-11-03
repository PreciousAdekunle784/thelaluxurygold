import { connection, NextResponse, type NextRequest } from "next/server";
import { getMedia } from "@/lib/repo/misc";

export async function GET(_req: NextRequest, ctx: RouteContext<"/media/[id]">) {
  await connection();
  const { id } = await ctx.params;
  if (!/^m[a-f0-9]{16}$/.test(id)) return new NextResponse("Not found", { status: 404 });
  const m = await getMedia(id);
  if (!m) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(m.bytes), {
    headers: { "Content-Type": m.contentType, "Cache-Control": "public, max-age=31536000, immutable", "Content-Length": String(m.bytes.length) },
  });
}

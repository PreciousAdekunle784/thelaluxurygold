import { connection, type NextRequest } from "next/server";
import { serveMedia } from "@/lib/server/serve-media";

/** Uploaded image at its plain address (older links). Pages use the versioned /media/<id>/<revision>. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/media/[id]">) {
  await connection();
  const { id } = await ctx.params;
  return serveMedia(id, "short");
}

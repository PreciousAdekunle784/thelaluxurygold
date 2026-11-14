import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { liveVisitors, recentViews } from "@/lib/repo/analytics";
import { adminBadgeCounts, listOrderSummaries } from "@/lib/repo/orders";

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const since = Number(req.nextUrl.searchParams.get("since")) || Date.now() - 30 * 60_000;
  const [live, views, orders, { pending, unread }] = await Promise.all([
    liveVisitors(),
    recentViews({ since, limit: 40 }),
    listOrderSummaries({ since, limit: 20 }),
    adminBadgeCounts(),
  ]);
  return NextResponse.json(
    {
      now: Date.now(),
      live: live.map((v) => ({ id: v.id, ts: v.ts, path: v.path, country: v.country, device: v.device, visitorId: v.visitorId.slice(0, 6), isNew: v.isNew })),
      views: views.map((v) => ({ id: v.id, ts: v.ts, path: v.path, country: v.country, device: v.device, referrer: v.referrer, visitorId: v.visitorId.slice(0, 6), isNew: v.isNew })),
      orders: orders.map((o) => ({ reference: o.reference, ts: o.createdAt, name: o.name, country: o.country, subtotal: o.subtotal, items: o.itemCount, hasPriceOnRequest: o.hasPriceOnRequest })),
      pending,
      unread,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

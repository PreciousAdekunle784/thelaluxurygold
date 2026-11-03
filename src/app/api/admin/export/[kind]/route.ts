import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { listCustomers, listOrders } from "@/lib/repo/orders";
import { listSubscribers } from "@/lib/repo/misc";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  // Escape quotes and neutralise spreadsheet formula injection.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};
const csv = (rows: unknown[][]) => rows.map((r) => r.map(cell).join(",")).join("\r\n");
const iso = (ts: number) => new Date(ts).toISOString();

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/admin/export/[kind]">) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { kind } = await ctx.params;
  let body = "";
  if (kind === "orders") {
    const orders = await listOrders({ limit: 10000 });
    body = csv([
      ["Reference", "Created", "Status", "Name", "Email", "Phone", "Country", "City", "Items", "Subtotal AED", "Price on request", "Lines"],
      ...orders.map((o) => [
        o.reference, iso(o.createdAt), o.status, o.name, o.email, o.phone, o.country, o.record.shipping.city, o.itemCount, o.subtotalAED, o.hasPriceOnRequest ? "yes" : "no",
        o.record.resolvedLines.map((l) => `${l.quantity}x ${l.name}${l.variant ? ` (${l.variant.value})` : ""}`).join("; "),
      ]),
    ]);
  } else if (kind === "customers") {
    const c = await listCustomers({ limit: 100000 });
    body = csv([["Name", "Email", "Phone", "Country", "Orders", "Total ordered AED", "Total paid AED", "First order", "Last order"], ...c.map((b) => [b.name, b.email, b.phone, b.country, b.orders, b.requestedAED, b.paidAED, iso(b.firstOrder), iso(b.lastOrder)])]);
  } else if (kind === "subscribers") {
    const s = await listSubscribers();
    body = csv([["Email", "Source", "Subscribed"], ...s.map((x) => [x.email, x.source, iso(x.createdAt)])]);
  } else {
    return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  }
  return new NextResponse("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="llg-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

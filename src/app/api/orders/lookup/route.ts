import { NextResponse } from "next/server";
import { getOrder, orderStatuses } from "@/lib/repo/orders";
import { shippingMethods } from "@/lib/config/store";

/** Best-effort throttle per IP: only failed lookups count, so order references can't be guessed in bulk. */
const failures = new Map<string, { n: number; since: number }>();
const WINDOW_MS = 10 * 60_000;
const MAX_FAILURES = 12;

function throttled(ip: string) {
  const a = failures.get(ip);
  return !!a && Date.now() - a.since <= WINDOW_MS && a.n >= MAX_FAILURES;
}
function recordFailure(ip: string) {
  const now = Date.now();
  const a = failures.get(ip);
  if (!a || now - a.since > WINDOW_MS) {
    if (failures.size > 5000) failures.clear();
    failures.set(ip, { n: 1, since: now });
  } else a.n += 1;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (throttled(ip)) return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes or contact us on WhatsApp." }, { status: 429 });

  let body: { reference?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const reference = String(body.reference ?? "").trim().toUpperCase().replace(/^(?!LLG-)/, "LLG-");
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^LLG-[A-F0-9]{8}$/.test(reference) || !email.includes("@")) {
    recordFailure(ip);
    return NextResponse.json({ error: "Enter your order reference (e.g. LLG-1A2B3C4D) and the email address used for the order." }, { status: 422 });
  }

  try {
    const o = await getOrder(reference);
    if (!o || o.email !== email) {
      recordFailure(ip);
      return NextResponse.json({ error: "We couldn't find an order with those details. Please check the reference and email address." }, { status: 404 });
    }
    const r = o.record;
    const label = (s: string) => orderStatuses.find((x) => x.id === s)?.label ?? s;
    return NextResponse.json({
      reference: o.reference,
      placedAt: o.createdAt,
      status: o.status,
      statusLabel: label(o.status),
      lines: r.resolvedLines.map((l) => ({ name: l.name, quantity: l.quantity, variant: l.variant, unitPrice: l.unitPrice })),
      subtotal: r.subtotal,
      shippingCost: r.shippingCost,
      shippingMethod: shippingMethods.find((m) => m.id === r.shippingMethodId)?.label ?? null,
      hasPriceOnRequest: r.hasPriceOnRequest,
      history: o.history.map((h) => ({ status: h.status, label: label(h.status), at: h.at })),
    });
  } catch (err) {
    console.error("[orders] lookup failed", err);
    return NextResponse.json({ error: "We couldn't look up your order right now. Please try again or contact us on WhatsApp." }, { status: 500 });
  }
}

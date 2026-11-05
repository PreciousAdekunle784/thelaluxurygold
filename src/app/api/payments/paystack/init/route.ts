import { NextResponse } from "next/server";
import { getOrder } from "@/lib/repo/orders";
import { isPaystackConfigured } from "@/lib/payments/paystack";
import { startPaystackPayment } from "@/lib/server/payments";

/** Retry online payment for an order that is still awaiting payment. */
export async function POST(request: Request) {
  if (!isPaystackConfigured()) return NextResponse.json({ error: "Online payment is not available right now." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { reference?: unknown };
  const reference = String(body.reference ?? "").toUpperCase();
  if (!/^LLG-[A-F0-9]{8}$/.test(reference)) return NextResponse.json({ error: "Invalid order reference." }, { status: 422 });
  const order = await getOrder(reference);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "awaiting_payment") return NextResponse.json({ error: "This order no longer needs payment online." }, { status: 409 });
  try {
    const authorizationUrl = await startPaystackPayment(order.record, new URL(request.url).origin);
    return NextResponse.json({ authorizationUrl });
  } catch (err) {
    console.error("[paystack] retry initialize failed", err);
    return NextResponse.json({ error: "We couldn't reach Paystack. Please try again in a moment, or contact us on WhatsApp." }, { status: 502 });
  }
}

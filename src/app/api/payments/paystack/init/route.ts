import { NextResponse } from "next/server";
import { getOrder } from "@/lib/repo/orders";
import { isPaystackConfigured, PaystackError } from "@/lib/payments/paystack";
import { startPaystackPayment } from "@/lib/server/payments";

/** Retry online payment for an order that is still awaiting payment. */
export async function POST(request: Request) {
  if (!isPaystackConfigured()) return NextResponse.json({ error: "Online payment is not available right now." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { reference?: unknown; currency?: unknown };
  // the shopper may switch currency (e.g. pay in naira if dollar payments aren't available)
  const currency = body.currency === "NGN" || body.currency === "USD" ? body.currency : undefined;
  const reference = String(body.reference ?? "").toUpperCase();
  if (!/^LLG-[A-F0-9]{8}$/.test(reference)) return NextResponse.json({ error: "Invalid order reference." }, { status: 422 });
  const order = await getOrder(reference);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "awaiting_payment") return NextResponse.json({ error: "This order no longer needs payment online." }, { status: 409 });
  try {
    const authorizationUrl = await startPaystackPayment(order.record, new URL(request.url).origin, currency);
    return NextResponse.json({ authorizationUrl });
  } catch (err) {
    console.error("[paystack] retry initialize failed", err);
    if (err instanceof PaystackError && err.currencyNotEnabled) {
      return NextResponse.json({ error: "Paying in US dollars isn't available right now. Please pay in naira, or confirm your order with our team.", code: "currency" }, { status: 409 });
    }
    return NextResponse.json({ error: "We couldn't reach Paystack. Please try again in a moment, or contact us on WhatsApp." }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { buildOrder, saveOrder, validateOrder, ValidationError } from "@/lib/server/orders";
import { startPaystackPayment } from "@/lib/server/payments";
import { PaystackError } from "@/lib/payments/paystack";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const input = await validateOrder(body);
    const reference = `LLG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const order = await buildOrder(input, reference, new Date().toISOString());
    if (order.paymentMethod === "paystack" && order.hasPriceOnRequest) {
      throw new ValidationError({ paymentMethod: "Pieces priced on request can't be paid online — choose “Confirm & pay with our team”." });
    }
    await saveOrder(order);

    if (order.paymentMethod === "paystack") {
      try {
        const authorizationUrl = await startPaystackPayment(order, new URL(request.url).origin);
        return NextResponse.json({ reference, status: order.status, authorizationUrl }, { status: 201 });
      } catch (err) {
        // The order is saved; the shopper can retry payment (or switch currency) from the completion page.
        console.error("[paystack] initialize failed", err);
        const reason = err instanceof PaystackError && err.currencyNotEnabled ? "currency" : "error";
        return NextResponse.json({ reference, status: order.status, paymentError: reason }, { status: 201 });
      }
    }
    return NextResponse.json({ reference, status: order.status, subtotal: order.subtotal, hasPriceOnRequest: order.hasPriceOnRequest }, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) return NextResponse.json({ error: err.message, fields: err.fields }, { status: 422 });
    console.error("[orders] failed", err);
    return NextResponse.json({ error: "We couldn't submit your order request. Please try again or contact us on WhatsApp." }, { status: 500 });
  }
}

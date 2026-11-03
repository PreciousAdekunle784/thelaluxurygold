import { NextResponse } from "next/server";
import { buildOrder, saveOrder, validateOrder, ValidationError } from "@/lib/server/orders";

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
    await saveOrder(order);
    return NextResponse.json({ reference, status: order.status, subtotal: order.subtotal, hasPriceOnRequest: order.hasPriceOnRequest }, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) return NextResponse.json({ error: err.message, fields: err.fields }, { status: 422 });
    console.error("[orders] failed", err);
    return NextResponse.json({ error: "We couldn't submit your order request. Please try again or contact us on WhatsApp." }, { status: 500 });
  }
}

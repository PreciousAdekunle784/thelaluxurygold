import { NextResponse } from "next/server";
import { orderReferenceFrom } from "@/lib/payments/paystack";
import { settlePaystack } from "@/lib/server/payments";

/**
 * Paystack sends the shopper back here (callback_url). The transaction is verified with Paystack on
 * the server, then the shopper is redirected to the order's status page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const paystackRef = url.searchParams.get("reference") || url.searchParams.get("trxref") || "";
  const order = orderReferenceFrom(paystackRef);
  let result = "unknown";
  try {
    const s = await settlePaystack(paystackRef);
    result = s.outcome;
  } catch (err) {
    console.error("[paystack] verify on return failed", err);
    result = order ? "pending" : "unknown";
  }
  const to = new URL("/checkout/complete", url.origin);
  if (order) to.searchParams.set("order", order);
  to.searchParams.set("result", result);
  return NextResponse.redirect(to, 303);
}

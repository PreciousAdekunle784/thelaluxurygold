import { NextResponse } from "next/server";
import { validWebhookSignature } from "@/lib/payments/paystack";
import { settlePaystack } from "@/lib/server/payments";

/**
 * Paystack webhook — set the URL https://<your-domain>/api/payments/paystack/webhook in
 * Paystack Dashboard → Settings → API Keys & Webhooks. Requests are accepted only with a valid
 * x-paystack-signature; the payment is then re-verified with Paystack before the order is marked paid.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!validWebhookSignature(raw, request.headers.get("x-paystack-signature"))) return new NextResponse("Invalid signature", { status: 401 });
  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
  if (event.event === "charge.success" && event.data?.reference) {
    try {
      await settlePaystack(event.data.reference);
    } catch (err) {
      console.error("[paystack] webhook settle failed", err);
      return new NextResponse("Retry later", { status: 500 }); // Paystack retries failed deliveries
    }
  }
  return NextResponse.json({ received: true });
}

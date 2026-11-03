/**
 * Payment gateway architecture.
 *
 * No provider is connected yet, so checkout submits an *order request* only and
 * never simulates a payment. To go live, implement `PaymentProvider` for the chosen
 * gateway (e.g. Network International / N-Genius, Checkout.com, Stripe, Telr), register
 * it in `getPaymentProvider`, and enable the "card" option in src/lib/config/store.ts.
 */
import type { OrderRecord } from "@/lib/server/orders";

export interface PaymentSession {
  /** URL of the provider-hosted payment page to redirect the customer to. */
  redirectUrl: string;
  providerReference: string;
}

export interface PaymentProvider {
  id: string;
  createSession(order: OrderRecord, opts: { successUrl: string; cancelUrl: string }): Promise<PaymentSession>;
  /** Verify a webhook from the provider and return the order reference it settles. */
  verifyWebhook(request: Request): Promise<{ reference: string; status: "paid" | "failed" } | null>;
}

export function getPaymentProvider(): PaymentProvider | null {
  // Example: if (process.env.PAYMENT_PROVIDER === "ngenius") return ngeniusProvider;
  return null;
}

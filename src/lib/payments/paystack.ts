import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { convert } from "@/lib/format";
import type { OrderRecord } from "@/lib/server/orders";

/*
 * Paystack (https://paystack.com/docs/api/) — hosted checkout.
 *
 * 1. The order is saved as "awaiting payment" and a transaction is initialised on the server with the
 *    SECRET key. The shopper is redirected to Paystack's own payment page (card, bank transfer, USSD…).
 * 2. Paystack sends them back to /checkout/complete?reference=…, where the server verifies the
 *    transaction with Paystack before marking the order paid.
 * 3. The webhook (/api/payments/paystack/webhook, signature-checked) settles payments even if the
 *    shopper closes the tab before returning.
 *
 * An order is only ever marked paid after Paystack itself confirms a successful charge for the exact
 * amount and currency that was requested.
 *
 * Environment:
 *   PAYSTACK_SECRET_KEY   sk_live_… (server only — never exposed to the browser)
 *   PAYSTACK_CURRENCY     NGN (default) or USD, if USD is enabled on the Paystack account
 */

const API = () => (process.env.PAYSTACK_API_BASE || "https://api.paystack.co").replace(/\/$/, "");
const secret = () => process.env.PAYSTACK_SECRET_KEY?.trim() || "";

export function isPaystackConfigured() {
  return /^sk_(live|test)_\w+$/.test(secret());
}

export type PaystackCurrency = "NGN" | "USD";
export function paystackCurrency(): PaystackCurrency {
  return process.env.PAYSTACK_CURRENCY?.toUpperCase() === "USD" ? "USD" : "NGN";
}

export interface PaymentInfo {
  provider: "paystack";
  /** Paystack transaction reference for the latest attempt. */
  reference: string;
  currency: PaystackCurrency;
  /** Amount requested, in the currency's subunit (kobo / cents). */
  amount: number;
  status: "initialized" | "success" | "failed" | "abandoned" | "mismatch";
  paidAt?: string;
  channel?: string;
}

/** What the shopper pays online: items plus any fixed delivery rate, in the charge currency. */
export function chargeFor(order: Pick<OrderRecord, "subtotal" | "shippingCost" | "ngnPerUsd">) {
  const usd = order.subtotal + (order.shippingCost ?? 0);
  const currency = paystackCurrency();
  if (currency === "USD") return { currency, amount: Math.round(usd * 100), major: Math.round(usd * 100) / 100 };
  const naira = convert(usd, "NGN", { USD: 1, NGN: order.ngnPerUsd }); // rounded to ₦100, exactly as shown in the store
  return { currency, amount: naira * 100, major: naira };
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || !body.status || !body.data) throw new Error(`Paystack ${path.split("?")[0]}: ${body.message ?? res.status}`);
  return body.data;
}

/** Start a Paystack transaction for an order; returns the hosted payment page URL. */
export async function initializePayment(order: OrderRecord, callbackUrl: string) {
  const { currency, amount } = chargeFor(order);
  const reference = `${order.reference}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const data = await call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: order.customer.email,
      amount,
      currency,
      reference,
      callback_url: callbackUrl,
      metadata: {
        order_reference: order.reference,
        custom_fields: [
          { display_name: "Order", variable_name: "order", value: order.reference },
          { display_name: "Customer", variable_name: "customer", value: `${order.customer.firstName} ${order.customer.lastName}`.trim() },
        ],
      },
    }),
  });
  const payment: PaymentInfo = { provider: "paystack", reference: data.reference, currency, amount, status: "initialized" };
  return { authorizationUrl: data.authorization_url, payment };
}

export interface PaystackTransaction {
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending" | "processing" | "queued" | "reversed";
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string | null;
  channel?: string;
  metadata?: { order_reference?: string } | string | null;
}

export function verifyTransaction(reference: string) {
  return call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Paystack signs webhook bodies with HMAC-SHA512 of the raw body, keyed with the secret key. */
export function validWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature || !isPaystackConfigured()) return false;
  const expected = createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Our order reference from a Paystack reference ("LLG-1A2B3C4D-9F8E7D" → "LLG-1A2B3C4D"). */
export function orderReferenceFrom(paystackReference: string) {
  return /^(LLG-[A-F0-9]{8})(-|$)/.exec(paystackReference)?.[1] ?? null;
}

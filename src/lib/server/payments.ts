import "server-only";
import { getOrder, markOrderPaid, setOrderPayment, type StoredOrder } from "@/lib/repo/orders";
import { initializePayment, orderReferenceFrom, verifyTransaction, type PaymentInfo } from "@/lib/payments/paystack";
import type { OrderRecord } from "./orders";

/** Start (or restart) online payment for an order awaiting payment. Returns Paystack's checkout URL. */
export async function startPaystackPayment(order: OrderRecord, origin: string) {
  const { authorizationUrl, payment } = await initializePayment(order, `${origin}/api/payments/paystack/callback`);
  await setOrderPayment(order.reference, payment);
  return authorizationUrl;
}

export type Settlement =
  | { outcome: "paid"; order: StoredOrder }
  | { outcome: "pending" | "failed"; order: StoredOrder }
  | { outcome: "unknown" };

/**
 * Confirm a Paystack transaction with Paystack and, if it succeeded for exactly the amount and
 * currency we asked for, mark the order paid. Safe to call repeatedly (redirect + webhook).
 */
export async function settlePaystack(paystackReference: string): Promise<Settlement> {
  const ref = orderReferenceFrom(paystackReference);
  if (!ref) return { outcome: "unknown" };
  const order = await getOrder(ref);
  if (!order) return { outcome: "unknown" };
  if (["paid", "shipped", "delivered"].includes(order.status)) return { outcome: "paid", order };

  const tx = await verifyTransaction(paystackReference);
  const requested = order.record.payment;
  const base: PaymentInfo = requested?.reference === paystackReference ? requested : { provider: "paystack", reference: paystackReference, currency: tx.currency as PaymentInfo["currency"], amount: tx.amount, status: "initialized" };

  if (tx.status === "success") {
    // Never trust the redirect: the charge must match what this order asked for.
    if (!requested || requested.reference !== paystackReference || tx.amount !== requested.amount || tx.currency !== requested.currency) {
      console.error(`[paystack] ${paystackReference}: amount/currency/reference mismatch — not marking ${ref} paid`, { tx: { amount: tx.amount, currency: tx.currency }, requested });
      await setOrderPayment(ref, { ...base, status: "mismatch" });
      return { outcome: "failed", order };
    }
    const amount = (tx.amount / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const note = `Paid online via Paystack (${tx.channel ?? "online"}) · ${tx.currency} ${amount} · ref ${paystackReference}`;
    const { order: updated } = await markOrderPaid(ref, { ...base, status: "success", paidAt: tx.paid_at ?? new Date().toISOString(), channel: tx.channel }, note);
    console.info(`[paystack] ${ref} paid (${paystackReference})`);
    return { outcome: "paid", order: updated };
  }
  if (tx.status === "failed" || tx.status === "abandoned" || tx.status === "reversed") {
    if (requested?.reference === paystackReference) await setOrderPayment(ref, { ...base, status: tx.status === "reversed" ? "failed" : tx.status });
    return { outcome: "failed", order };
  }
  return { outcome: "pending", order };
}

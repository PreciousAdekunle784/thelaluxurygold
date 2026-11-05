import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Check, Clock, X } from "lucide-react";
import { PageIntro } from "@/components/shop/PageIntro";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { RetryPayment } from "@/components/cart/RetryPayment";
import { getOrder, type StoredOrder } from "@/lib/repo/orders";
import type { Settlement } from "@/lib/server/payments";
import { redirect } from "next/navigation";
import { whatsappLink } from "@/lib/whatsapp";
import { chargeFor } from "@/lib/payments/paystack";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };

function money(order: StoredOrder) {
  const p = order.record.payment;
  if (!p) return null;
  return new Intl.NumberFormat(p.currency === "NGN" ? "en-NG" : "en-US", { style: "currency", currency: p.currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(p.amount / 100);
}

async function Result({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection(); // read the order at request time
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const paystackRef = one(sp.reference) || one(sp.trxref);
  if (paystackRef && !sp.order) redirect(`/api/payments/paystack/callback?reference=${encodeURIComponent(paystackRef)}`);
  const orderRef = one(sp.order).toUpperCase();

  // Verification already happened in /api/payments/paystack/callback; this page only reads the order.
  const hint = one(sp.result);
  const found = /^LLG-[A-F0-9]{8}$/.test(orderRef) ? await getOrder(orderRef).catch(() => null) : null;
  const s: Settlement = !found
    ? { outcome: "unknown" }
    : ["paid", "shipped", "delivered"].includes(found.status)
      ? { outcome: "paid", order: found }
      : { outcome: hint === "pending" ? "pending" : "failed", order: found };

  if (s.outcome === "unknown") {
    return (
      <Panel icon={<X size={24} strokeWidth={1.2} />} eyebrow="Payment" title="We couldn't find that payment">
        <p>If you were charged, please contact us with your order reference and we&rsquo;ll sort it out straight away.</p>
        <Actions>
          <a href={whatsappLink("Hello LA Luxury Gold, I need help with a payment.")} target="_blank" rel="noopener noreferrer" className={buttonClass("solid", "lg")}>
            <WhatsAppIcon width={17} height={17} /> Contact us on WhatsApp
          </a>
        </Actions>
      </Panel>
    );
  }

  const { order } = s;
  const amount = money(order);
  if (s.outcome === "paid") {
    return (
      <Panel icon={<Check size={26} strokeWidth={1.2} />} eyebrow="Payment received" title="Thank you">
        <p>
          Your payment{amount && <> of <strong className="font-semibold text-ink">{amount}</strong></>} for order <strong className="font-semibold text-ink">{order.reference}</strong> has been
          received. Our team will be in touch at {order.email} to arrange delivery.
        </p>
        <Actions>
          <ButtonLink href="/account" size="lg">Track your order</ButtonLink>
          <ButtonLink href="/shop" variant="outline" size="lg">Continue shopping</ButtonLink>
        </Actions>
      </Panel>
    );
  }
  if (s.outcome === "pending") {
    return (
      <Panel icon={<Clock size={24} strokeWidth={1.2} />} eyebrow="Almost there" title="Confirming your payment">
        <p>
          We&rsquo;re waiting for Paystack to confirm the payment for order <strong className="font-semibold text-ink">{order.reference}</strong>. This usually takes a moment — bank transfers can take a little longer.
        </p>
        <Actions>
          <Link href={`/checkout/complete?order=${order.reference}&result=pending`} prefetch={false} className={buttonClass("solid", "lg")}>Check again</Link>
          <ButtonLink href="/account" variant="outline" size="lg">Track your order</ButtonLink>
        </Actions>
      </Panel>
    );
  }
  // retry in the currency the shopper chose — or switch to the other currency
  const usedCurrency = order.record.payment?.currency ?? order.record.displayCurrency;
  const other = usedCurrency === "USD" ? "NGN" : "USD";
  const usdUnavailable = hint === "currency";
  const fmt = (c: "NGN" | "USD") => {
    const { major } = chargeFor(order.record, c);
    return new Intl.NumberFormat(c === "NGN" ? "en-NG" : "en-US", { style: "currency", currency: c, currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(major);
  };
  return (
    <Panel icon={<X size={24} strokeWidth={1.2} />} eyebrow="Payment not completed" title="Your order is saved">
      <p>
        {usdUnavailable ? (
          <>
            Paying in US dollars isn&rsquo;t available right now, so you have not been charged for order <strong className="font-semibold text-ink">{order.reference}</strong>. You can pay in
            naira instead, or ask our team to arrange payment with you.
          </>
        ) : (
          <>
            The payment for order <strong className="font-semibold text-ink">{order.reference}</strong> wasn&rsquo;t completed, so you have not been charged. You can try again, or ask our team to
            arrange payment with you.
          </>
        )}
      </p>
      <Actions>
        {order.status === "awaiting_payment" &&
          (usdUnavailable ? (
            <RetryPayment reference={order.reference} currency="NGN" label={`Pay ${fmt("NGN")} in naira`} />
          ) : (
            <>
              <RetryPayment reference={order.reference} currency={usedCurrency} label={`Pay ${fmt(usedCurrency)} with Paystack`} />
              <RetryPayment reference={order.reference} currency={other} variant="outline" label={`Pay ${fmt(other)} in ${other === "NGN" ? "naira" : "US dollars"}`} />
            </>
          ))}
        <a href={whatsappLink(`Hello LA Luxury Gold, I'd like help paying for order ${order.reference}.`)} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "lg")}>
          <WhatsAppIcon width={17} height={17} /> Pay with our team
        </a>
      </Actions>
    </Panel>
  );
}

function Panel({ icon, eyebrow, title, children }: { icon: React.ReactNode; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="container-luxe flex flex-col items-center pb-32 pt-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-champagne text-champagne">{icon}</span>
      <p className="eyebrow mt-8 text-champagne">{eyebrow}</p>
      <h2 className="display mt-4 text-5xl uppercase md:text-6xl">{title}</h2>
      <div className="mt-6 max-w-lg text-[0.98rem] leading-relaxed text-stone">{children}</div>
    </div>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">{children}</div>;
}

export default function PaymentCompletePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <>
      <PageIntro crumbs={[{ name: "Bag", href: "/cart" }, { name: "Payment" }]} title={<>Your <span className="script">order</span></>} />
      <Suspense fallback={<div className="container-luxe flex h-[40vh] items-center justify-center text-sm uppercase tracking-[0.2em] text-stone">Confirming your payment…</div>}>
        <Result searchParams={searchParams} />
      </Suspense>
    </>
  );
}

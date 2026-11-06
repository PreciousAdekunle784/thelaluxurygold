"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { Price } from "@/components/product/Price";
import { whatsappLink } from "@/lib/whatsapp";
import { cx } from "@/lib/format";

interface FoundOrder {
  reference: string;
  placedAt: number;
  status: string;
  statusLabel: string;
  lines: { name: string; quantity: number; variant?: { name: string; value: string }; unitPrice: number | null }[];
  subtotal: number;
  shippingCost: number | null;
  shippingMethod: string | null;
  hasPriceOnRequest: boolean;
  history: { status: string; label: string; at: number }[];
}

const journey = [
  { id: "pending_confirmation", label: "Order received" },
  { id: "confirmed", label: "Confirmed" },
  { id: "paid", label: "Paid" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

const date = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function OrderResult({ o }: { o: FoundOrder }) {
  const cancelled = o.status === "cancelled";
  const reached = o.status === "awaiting_payment" ? -1 : journey.findIndex((s) => s.id === o.status);
  return (
    <div className="mt-10 border border-line bg-white p-6 md:p-8" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-display text-2xl">{o.reference}</p>
        <p className="text-xs text-stone">Placed {date(o.placedAt)}</p>
      </div>
      <p className={cx("eyebrow mt-3 font-semibold", cancelled ? "text-burgundy" : "text-forest")}>{o.statusLabel}</p>

      {!cancelled && (
        <ol className="mt-6 grid grid-cols-5 gap-1" aria-label="Order progress">
          {journey.map((s, i) => {
            const done = i <= reached;
            const at = o.history.findLast((h) => h.status === s.id)?.at;
            return (
              <li key={s.id} className="text-center">
                <span className={cx("mx-auto flex h-7 w-7 items-center justify-center rounded-full border text-[0.6rem]", done ? "border-forest bg-forest text-ivory" : "border-line text-stone")}>
                  {done ? <Check size={13} /> : i + 1}
                </span>
                <span className={cx("mt-2 block text-[0.62rem] uppercase leading-tight tracking-[0.1em]", done ? "text-ink" : "text-stone")}>{s.label}</span>
                {at && <span className="mt-0.5 block text-[0.6rem] text-stone">{new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
              </li>
            );
          })}
        </ol>
      )}

      <ul className="mt-8 divide-y divide-line border-y border-line text-sm">
        {o.lines.map((l, i) => (
          <li key={i} className="flex justify-between gap-4 py-3">
            <span>
              {l.name} <span className="text-stone">× {l.quantity}</span>
              {l.variant && <span className="block text-xs text-stone">{l.variant.name}: {l.variant.value}</span>}
            </span>
            <Price amount={l.unitPrice == null ? null : l.unitPrice * l.quantity} />
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd><Price amount={o.subtotal} /></dd></div>
        <div className="flex justify-between">
          <dt className="text-stone">Delivery{o.shippingMethod && ` · ${o.shippingMethod}`}</dt>
          <dd>{o.shippingCost == null ? <span className="text-stone">Confirmed with your order</span> : <Price amount={o.shippingCost} />}</dd>
        </div>
      </dl>
      {o.hasPriceOnRequest && <p className="mt-4 text-xs text-stone">Includes price-on-request pieces — our team confirms the final amount with you.</p>}
      <a
        href={whatsappLink(`Hello LA Luxury Gold, I have a question about my order ${o.reference}.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 text-sm hover:text-forest"
      >
        <WhatsAppIcon width={17} height={17} /> Ask about this order on WhatsApp
      </a>
    </div>
  );
}

/** Order tracking: customers look up an order with its reference and the email used at checkout. */
export function AccountView() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<FoundOrder | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch("/api/orders/lookup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reference, email }) });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong. Please try again.");
      else setOrder(data);
    } catch {
      setError("We couldn't reach the server. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-luxe grid gap-16 pb-28 lg:grid-cols-[1.2fr_1fr] lg:gap-24">
      <div className="max-w-xl">
        <p className="text-[0.95rem] leading-relaxed text-ink/75">
          Enter the order reference from your confirmation (it starts with LLG-) and the email address you used at checkout.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <label className="block">
            <span className="mb-2 block text-[0.66rem] font-semibold uppercase tracking-[0.18em]">Order reference</span>
            <input name="reference" required value={reference} onChange={(e) => setReference(e.target.value)} placeholder="LLG-1A2B3C4D" autoCapitalize="characters" className="field-boxed uppercase" />
          </label>
          <label className="block">
            <span className="mb-2 block text-[0.66rem] font-semibold uppercase tracking-[0.18em]">Email address</span>
            <input name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-boxed" />
          </label>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} strokeWidth={1.4} />} Track order
          </Button>
          {error && <p role="alert" className="text-sm leading-relaxed text-burgundy">{error}</p>}
        </form>
        {order && <OrderResult o={order} />}
      </div>

      <div className="h-fit bg-linen p-8 md:p-12">
        <p className="eyebrow text-champagne">After you order</p>
        <h2 className="display mt-4 text-4xl uppercase">
          Every step, <span className="script">personally</span>
        </h2>
        <ol className="mt-10 space-y-5 text-sm leading-relaxed">
          <li><strong>Order received.</strong> Your piece is reserved while we review your order.</li>
          <li><strong>Confirmed.</strong> Our team contacts you to confirm price, delivery and payment.</li>
          <li><strong>Paid & prepared.</strong> Your piece is inspected and packed securely for its journey.</li>
          <li><strong>Shipped.</strong> Your piece is on its way, and this page shows its progress.</li>
        </ol>
        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/wishlist" className="link-underline eyebrow font-semibold">View wishlist</Link>
          <a href={whatsappLink("Hello LA Luxury Gold, I need help with an order.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm hover:text-forest">
            <WhatsAppIcon width={17} height={17} /> Order help on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { Card, PageHeader, StatusPill, countryLabel } from "@/components/admin/ui";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { getOrder, otherOrdersOf } from "@/lib/repo/orders";
import { shippingMethods } from "@/lib/config/store";
import { formatDateTime } from "@/lib/time";
import { formatMoney } from "@/lib/format";

export const instant = false;
export const metadata: Metadata = { title: "Order" };

export default async function OrderDetail({ params }: PageProps<"/admin/orders/[reference]">) {
  await connection();
  const { reference } = await params;
  const ref = decodeURIComponent(reference);
  const [order, others] = await Promise.all([getOrder(ref), otherOrdersOf(ref)]);
  if (!order) notFound();
  const r = order.record;
  const method = shippingMethods.find((m) => m.id === r.shippingMethodId);
  const phoneDigits = order.phone.replace(/[^\d]/g, "");
  const waText = encodeURIComponent(`Hello ${r.customer.firstName}, thank you for your LA Luxury Gold order ${order.reference}.`);

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-2 text-xs text-stone hover:text-ink">
        <ArrowLeft size={13} /> All orders
      </Link>
      <PageHeader title={order.reference} subtitle={<span className="flex flex-wrap items-center gap-3">Placed {formatDateTime(order.createdAt)} <StatusPill status={order.status} /></span>} />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card title="Items" pad={false}>
            <ul className="divide-y divide-line">
              {r.resolvedLines.map((l, i) => (
                <li key={i} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                  <div>
                    <p className="font-semibold">{l.name}</p>
                    <p className="text-xs text-stone">{l.variant ? `${l.variant.name}: ${l.variant.value} · ` : ""}Qty {l.quantity} × {l.unitPrice == null ? "price on request" : formatMoney(l.unitPrice)}</p>
                  </div>
                  <p className="tabular-nums">{l.unitPrice == null ? "On request" : formatMoney(l.unitPrice * l.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="tabular-nums">{formatMoney(r.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-stone">Shipping · {method?.label ?? r.shippingMethodId}</dt><dd>{r.shippingCost == null ? "To be confirmed" : formatMoney(r.shippingCost)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Order value</dt><dd className="tabular-nums">{formatMoney(r.subtotal + (r.shippingCost ?? 0))}{r.hasPriceOnRequest ? " + items on request" : ""}</dd></div>
            </dl>
          </Card>

          {r.notes && (
            <Card title="Customer notes">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{r.notes}</p>
            </Card>
          )}

          <Card title="History">
            <ol className="space-y-3">
              {[...order.history].reverse().map((h, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-champagne" />
                  <div>
                    <StatusPill status={h.status} /> <span className="ml-2 text-xs text-stone">{formatDateTime(h.at)}</span>
                    {h.note && <p className="mt-1 text-stone">{h.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Update order"><OrderStatusForm reference={order.reference} status={order.status} /></Card>
          <Card title="Buyer">
            <p className="font-semibold">{order.name}</p>
            <div className="mt-3 space-y-2 text-sm">
              <a href={`mailto:${order.email}?subject=${encodeURIComponent(`Your LA Luxury Gold order ${order.reference}`)}`} className="flex items-center gap-2 hover:underline"><Mail size={14} /> {order.email}</a>
              {order.phone && <a href={`tel:${order.phone}`} className="flex items-center gap-2 hover:underline"><Phone size={14} /> {order.phone}</a>}
              {phoneDigits.length > 6 && (
                <a href={`https://wa.me/${phoneDigits}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-forest hover:underline">
                  <WhatsAppIcon width={14} height={14} /> Message on WhatsApp
                </a>
              )}
            </div>
            <p className="mt-4 text-xs text-stone">{r.customer.marketing ? "Opted in to marketing emails" : "Not opted in to marketing"}</p>
            {others.length > 0 && (
              <div className="mt-4 border-t border-line pt-4 text-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone">Other orders from this buyer</p>
                {others.map((o) => (
                  <Link key={o.reference} href={`/admin/orders/${o.reference}`} className="flex justify-between py-1 hover:underline">
                    <span>{o.reference}</span>
                    <span className="tabular-nums text-stone">{formatMoney(o.subtotal)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
          <Card title="Delivery address">
            <address className="text-sm not-italic leading-relaxed">
              {order.name}
              <br />
              {r.shipping.address1}
              {r.shipping.address2 && <><br />{r.shipping.address2}</>}
              <br />
              {[r.shipping.city, r.shipping.region, r.shipping.postalCode].filter(Boolean).join(", ")}
              <br />
              {countryLabel(r.shipping.country)}
            </address>
            {r.displayCurrency === "NGN" && r.ngnPerUsd && (
              <p className="mt-3 text-xs text-stone">
                Shopper viewed prices in naira: {formatMoney(r.subtotal + (r.shippingCost ?? 0), "NGN", { USD: 1, NGN: r.ngnPerUsd })} at ₦{r.ngnPerUsd.toLocaleString("en-US")} per $1.
              </p>
            )}
            <p className="mt-3 text-xs text-stone">
              Payment option: {r.paymentMethod === "order-request" ? "Confirm & pay with the team (no online payment taken)" : r.paymentMethod === "paystack" ? "Paid online with Paystack" : r.paymentMethod}
            </p>
            {r.payment && (
              <dl className="mt-3 space-y-1 border-t border-line pt-3 text-xs">
                <div className="flex justify-between gap-4"><dt className="text-stone">Paystack status</dt><dd className="font-semibold">{{ success: "Paid — verified with Paystack", initialized: "Not paid yet", failed: "Failed", abandoned: "Abandoned", mismatch: "Amount mismatch — check in Paystack" }[r.payment.status]}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-stone">Amount</dt><dd className="tabular-nums">{formatMoney(r.payment.amount / 100, r.payment.currency, { USD: 1, NGN: 1 })}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-stone">Reference</dt><dd className="font-mono">{r.payment.reference}</dd></div>
                {r.payment.channel && <div className="flex justify-between gap-4"><dt className="text-stone">Channel</dt><dd>{r.payment.channel}</dd></div>}
                {r.payment.paidAt && <div className="flex justify-between gap-4"><dt className="text-stone">Paid at</dt><dd>{new Date(r.payment.paidAt).toLocaleString("en-GB")}</dd></div>}
              </dl>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

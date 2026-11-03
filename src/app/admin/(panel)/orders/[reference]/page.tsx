import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { Card, PageHeader, StatusPill, countryLabel } from "@/components/admin/ui";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { getOrder, listOrders } from "@/lib/repo/orders";
import { shippingMethods } from "@/lib/config/store";
import { formatDateTime } from "@/lib/time";
import { formatMoney } from "@/lib/format";

export const instant = false;
export const metadata: Metadata = { title: "Order" };

export default async function OrderDetail({ params }: PageProps<"/admin/orders/[reference]">) {
  await connection();
  const { reference } = await params;
  const order = await getOrder(decodeURIComponent(reference));
  if (!order) notFound();
  const r = order.record;
  const others = (await listOrders({ q: order.email, limit: 20 })).filter((o) => o.reference !== order.reference && o.email === order.email);
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
                    <p className="text-xs text-stone">{l.variant ? `${l.variant.name}: ${l.variant.value} · ` : ""}Qty {l.quantity} × {l.unitPriceAED == null ? "price on request" : formatMoney(l.unitPriceAED)}</p>
                  </div>
                  <p className="tabular-nums">{l.unitPriceAED == null ? "On request" : formatMoney(l.unitPriceAED * l.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="tabular-nums">{formatMoney(r.subtotalAED)}</dd></div>
              <div className="flex justify-between"><dt className="text-stone">Shipping · {method?.label ?? r.shippingMethodId}</dt><dd>{r.shippingAED == null ? "To be confirmed" : formatMoney(r.shippingAED)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Order value</dt><dd className="tabular-nums">{formatMoney(r.subtotalAED + (r.shippingAED ?? 0))}{r.hasPriceOnRequest ? " + items on request" : ""}</dd></div>
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
                    <span className="tabular-nums text-stone">{formatMoney(o.subtotalAED)}</span>
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
            <p className="mt-3 text-xs text-stone">Payment option: {r.paymentMethod === "order-request" ? "Reserve & confirm with the team (no online payment taken)" : r.paymentMethod}</p>
          </Card>
        </div>
      </div>
    </>
  );
}

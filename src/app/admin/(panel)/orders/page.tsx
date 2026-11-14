import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Download, Search } from "lucide-react";
import { Card, Empty, PageHeader, StatusPill, Table, Tabs, adminBtnOutline, DownloadLink, countryLabel } from "@/components/admin/ui";
import { countOrdersByStatus, listOrderSummaries, orderStatuses } from "@/lib/repo/orders";
import { formatDateTime } from "@/lib/time";
import { formatMoney } from "@/lib/format";

export const instant = false;
export const metadata: Metadata = { title: "Orders" };
const PAGE = 50;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await connection();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && orderStatuses.some((s) => s.id === sp.status) ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const [orders, byStatus] = await Promise.all([
    listOrderSummaries({ status: status || undefined, q: q || undefined, limit: PAGE + 1, offset: (page - 1) * PAGE }),
    countOrdersByStatus(),
  ]);
  const total = byStatus.all;
  const counts = orderStatuses.map((s) => byStatus[s.id] ?? 0);
  const rows = orders.slice(0, PAGE);
  const href = (p: Record<string, string | number>) => {
    const u = new URLSearchParams();
    const merged = { status, q, page: 1, ...p };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "page" && v === 1)) u.set(k, String(v));
    return `/admin/orders${u.size ? `?${u}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Every order placed on the website. Update the status as you confirm, take payment and ship."
        actions={<DownloadLink href="/api/admin/export/orders" className={adminBtnOutline}><Download size={14} /> Export CSV</DownloadLink>}
      />
      <Tabs
        active={status || "all"}
        items={[{ key: "all", label: "All", count: total, href: href({ status: "" }) }, ...orderStatuses.map((s, i) => ({ key: s.id, label: s.label, count: counts[i], href: href({ status: s.id }) }))]}
      />
      <form className="mb-5 flex max-w-md items-center border border-line bg-white px-3" action="/admin/orders">
        {status && <input type="hidden" name="status" value={status} />}
        <Search size={15} className="text-stone" />
        <input name="q" defaultValue={q} placeholder="Search reference, name, email or phone" className="w-full bg-transparent px-3 py-2.5 text-sm outline-none" />
      </form>
      <Card pad={false}>
        <Table head={["Reference", "Date", "Buyer", "Country", "Items", "Amount", "Status"]} empty={!rows.length && <Empty>{q || status ? "No orders match this filter." : "No orders yet."}</Empty>}>
          {rows.map((o) => (
            <tr key={o.reference} className="hover:bg-linen/60">
              <td className="px-4 py-3 font-semibold"><Link href={`/admin/orders/${o.reference}`} className="hover:underline">{o.reference}</Link></td>
              <td className="whitespace-nowrap px-4 py-3 text-stone">{formatDateTime(o.createdAt)}</td>
              <td className="px-4 py-3">{o.name}<span className="block text-xs text-stone">{o.email}</span></td>
              <td className="whitespace-nowrap px-4 py-3">{countryLabel(o.country)}</td>
              <td className="px-4 py-3 tabular-nums">{o.itemCount}</td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatMoney(o.subtotal)}{o.hasPriceOnRequest && <span className="block text-xs text-stone">+ price on request</span>}</td>
              <td className="px-4 py-3"><StatusPill status={o.status} /></td>
            </tr>
          ))}
        </Table>
        {(page > 1 || orders.length > PAGE) && (
          <div className="flex justify-between border-t border-line px-4 py-3 text-xs">
            {page > 1 ? <Link href={href({ page: page - 1 })} className="underline underline-offset-4">← Newer</Link> : <span />}
            {orders.length > PAGE && <Link href={href({ page: page + 1 })} className="underline underline-offset-4">Older →</Link>}
          </div>
        )}
      </Card>
    </>
  );
}

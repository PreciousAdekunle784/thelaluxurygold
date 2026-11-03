import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Card, PageHeader, Stat, StatusPill, Table, Empty, countryLabel } from "@/components/admin/ui";
import { ColumnChart } from "@/components/admin/charts";
import { BarList } from "@/components/admin/BarList";
import { LiveCount, LivePanel } from "@/components/admin/LivePanel";
import { trafficSeries, trafficSummary } from "@/lib/repo/analytics";
import { listOrders, orderStats } from "@/lib/repo/orders";
import { dayKey, formatDateTime, lastDays, requestTime } from "@/lib/time";
import { formatMoney } from "@/lib/format";

export const instant = false;
export const metadata: Metadata = { title: "Dashboard" };

const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default async function Dashboard() {
  await connection();
  const now = requestTime();
  const days14 = lastDays(14, now);
  const days7 = days14.slice(-7);
  const today = dayKey(now);

  const [series, todayTraffic, week, stats, recent] = await Promise.all([
    trafficSeries(days14),
    trafficSummary([today]),
    trafficSummary(days7),
    orderStats(days14),
    listOrders({ limit: 6 }),
  ]);
  const todayOrders = stats.series.find((s) => s.day === today)?.orders ?? 0;
  const aov = stats.paidOrders ? Math.round(stats.paidAED / stats.paidOrders) : 0;

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Today, ${shortDay(today)} · times shown in Dubai time`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LiveCount />
        <Stat label="Visitors today" value={todayTraffic.visitors.toLocaleString("en-US")} hint={`${todayTraffic.views.toLocaleString("en-US")} page views`} />
        <Stat label="Visitors · last 7 days" value={week.visitors.toLocaleString("en-US")} hint={`${week.newVisitors.toLocaleString("en-US")} first-time visitors`} />
        <Stat label="Orders today" value={todayOrders} hint={`${stats.pending} awaiting confirmation`} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat accent label="Revenue received" value={formatMoney(stats.paidAED)} hint={`${stats.paidOrders} paid / shipped / delivered orders`} />
        <Stat label="Value of all orders" value={formatMoney(stats.requestedAED)} hint="Excludes cancelled orders" />
        <Stat label="Buyers" value={stats.buyers.toLocaleString("en-US")} hint={`${stats.orders} orders in total`} />
        <Stat label="Average paid order" value={aov ? formatMoney(aov) : "—"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card title="Visitors per day · last 14 days">
            <ColumnChart title="Unique visitors per day" data={series.map((s) => ({ label: shortDay(s.day), short: shortDay(s.day), value: s.visitors }))} />
          </Card>
          <Card title="Order value per day · last 14 days (AED)">
            <ColumnChart title="Order value per day in AED" unit="aed" data={stats.series.map((s) => ({ label: `${shortDay(s.day)} · ${s.orders} order${s.orders === 1 ? "" : "s"}`, short: shortDay(s.day), value: s.value }))} />
          </Card>
        </div>
        <LivePanel />
      </div>

      <Card className="mt-6" title="Latest orders" action={<Link href="/admin/orders" className="text-xs underline underline-offset-4">All orders</Link>} pad={false}>
        <Table head={["Reference", "Date", "Buyer", "Country", "Items", "Amount", "Status"]} empty={!recent.length && <Empty>No orders yet. New orders appear here — and as a pop-up alert — the moment they are placed.</Empty>}>
          {recent.map((o) => (
            <tr key={o.reference} className="hover:bg-linen/60">
              <td className="px-4 py-3 font-semibold"><Link href={`/admin/orders/${o.reference}`} className="hover:underline">{o.reference}</Link></td>
              <td className="whitespace-nowrap px-4 py-3 text-stone">{formatDateTime(o.createdAt)}</td>
              <td className="px-4 py-3">{o.name}<span className="block text-xs text-stone">{o.email}</span></td>
              <td className="px-4 py-3">{countryLabel(o.country)}</td>
              <td className="px-4 py-3 tabular-nums">{o.itemCount}</td>
              <td className="px-4 py-3 tabular-nums">{formatMoney(o.subtotalAED)}{o.hasPriceOnRequest && <span className="block text-xs text-stone">+ price on request</span>}</td>
              <td className="px-4 py-3"><StatusPill status={o.status} /></td>
            </tr>
          ))}
        </Table>
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Top pages · 7 days"><BarList items={week.pages.map((p) => ({ key: p.key, value: p.visitors }))} /></Card>
        <Card title="Where visitors come from"><BarList items={week.referrers.map((p) => ({ key: p.key, value: p.visitors }))} /></Card>
        <Card title="Countries"><BarList items={week.countries.map((p) => ({ key: p.key, value: p.visitors }))} renderKey={(k) => countryLabel(k === "—" ? "" : k)} /></Card>
        <Card title="Devices"><BarList items={week.devices.map((p) => ({ key: p.key, value: p.visitors }))} /></Card>
      </div>
    </>
  );
}

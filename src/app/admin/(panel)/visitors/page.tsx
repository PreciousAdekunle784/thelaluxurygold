import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Card, Empty, PageHeader, Stat, Table, Tabs, countryLabel } from "@/components/admin/ui";
import { ColumnChart } from "@/components/admin/charts";
import { BarList } from "@/components/admin/BarList";
import { LivePanel } from "@/components/admin/LivePanel";
import { recentViews, trafficSeries, trafficSummary } from "@/lib/repo/analytics";
import { dayKey, formatDateTime, lastDays, requestTime } from "@/lib/time";

export const instant = false;
export const metadata: Metadata = { title: "Visitors" };

const PAGE = 50;
const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default async function VisitorsPage({ searchParams }: PageProps<"/admin/visitors">) {
  const sp = await searchParams;
  await connection();
  const range = sp.range === "today" ? "today" : sp.range === "30" ? "30" : "7";
  const page = Math.max(1, Number(sp.page) || 1);
  const now = requestTime();
  const days = range === "today" ? [dayKey(now)] : lastDays(Number(range), now);
  const [summary, series, views] = await Promise.all([
    trafficSummary(days),
    trafficSeries(range === "today" ? lastDays(7, now) : days),
    recentViews({ limit: PAGE + 1, offset: (page - 1) * PAGE, since: range === "today" ? undefined : now - Number(range) * 86_400_000, day: range === "today" ? days[0] : undefined }),
  ]);
  const hasMore = views.length > PAGE;
  const rows = views.slice(0, PAGE);
  const q = (p: number) => `/admin/visitors?range=${range}&page=${p}`;

  return (
    <>
      <PageHeader title="Visitors" subtitle="Every visit to the store is recorded anonymously — no IP addresses or personal data." />
      <Tabs
        active={range}
        items={[
          { key: "today", label: "Today", href: "/admin/visitors?range=today" },
          { key: "7", label: "Last 7 days", href: "/admin/visitors?range=7" },
          { key: "30", label: "Last 30 days", href: "/admin/visitors?range=30" },
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Unique visitors" value={summary.visitors.toLocaleString("en-US")} />
        <Stat label="First-time visitors" value={summary.newVisitors.toLocaleString("en-US")} hint={summary.visitors ? `${Math.round((summary.newVisitors / summary.visitors) * 100)}% of visitors` : undefined} />
        <Stat label="Visits (sessions)" value={summary.sessions.toLocaleString("en-US")} />
        <Stat label="Page views" value={summary.views.toLocaleString("en-US")} hint={summary.sessions ? `${(summary.views / summary.sessions).toFixed(1)} pages per visit` : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title={range === "today" ? "Visitors per day · last 7 days" : `Visitors per day · last ${range} days`}>
          <ColumnChart title="Unique visitors per day" data={series.map((s) => ({ label: `${shortDay(s.day)} · ${s.views} views`, short: shortDay(s.day), value: s.visitors }))} />
        </Card>
        <LivePanel />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Top pages"><BarList items={summary.pages.map((p) => ({ key: p.key, value: p.visitors }))} /></Card>
        <Card title="Referrers"><BarList items={summary.referrers.map((p) => ({ key: p.key, value: p.visitors }))} /></Card>
        <Card title="Countries"><BarList items={summary.countries.map((p) => ({ key: p.key, value: p.visitors }))} renderKey={(k) => countryLabel(k === "—" ? "" : k)} /></Card>
        <Card title="Devices"><BarList items={summary.devices.map((p) => ({ key: p.key, value: p.visitors }))} /></Card>
      </div>

      <Card className="mt-6" title="Visit log" pad={false}>
        <Table head={["Time", "Page", "Visitor", "Country", "Device", "Browser", "Came from"]} empty={!rows.length && <Empty>No visits recorded in this period yet.</Empty>}>
          {rows.map((v) => (
            <tr key={v.id} className="hover:bg-linen/60">
              <td className="whitespace-nowrap px-4 py-2.5 text-stone">{formatDateTime(v.ts)}</td>
              <td className="max-w-[260px] truncate px-4 py-2.5">{v.path}</td>
              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">
                {v.visitorId.slice(0, 6)}
                {v.isNew && <span className="ml-2 bg-sage-mist px-1.5 py-0.5 font-sans text-[0.6rem] font-semibold uppercase text-forest">New</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5">{countryLabel(v.country)}</td>
              <td className="px-4 py-2.5">{v.device}</td>
              <td className="px-4 py-2.5">{v.browser}</td>
              <td className="px-4 py-2.5 text-stone">{v.referrer}</td>
            </tr>
          ))}
        </Table>
        {(page > 1 || hasMore) && (
          <div className="flex justify-between border-t border-line px-4 py-3 text-xs">
            {page > 1 ? <Link href={q(page - 1)} className="underline underline-offset-4">← Newer</Link> : <span />}
            {hasMore && <Link href={q(page + 1)} className="underline underline-offset-4">Older →</Link>}
          </div>
        )}
      </Card>
      <p className="mt-4 text-xs text-stone">Country requires your host to provide a location header (Vercel and Cloudflare do this automatically). Your own visits while signed in to the admin are not counted.</p>
    </>
  );
}

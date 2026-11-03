import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Download, Search } from "lucide-react";
import { Card, Empty, PageHeader, Stat, Table, adminBtnOutline, DownloadLink, countryLabel } from "@/components/admin/ui";
import { listCustomers } from "@/lib/repo/orders";
import { formatDateTime } from "@/lib/time";
import { formatMoney } from "@/lib/format";

export const instant = false;
export const metadata: Metadata = { title: "Buyers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await connection();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const buyers = await listCustomers({ q: q || undefined });
  const paid = buyers.reduce((n, b) => n + b.paid, 0);
  const requested = buyers.reduce((n, b) => n + b.requested, 0);
  const repeat = buyers.filter((b) => b.orders > 1).length;

  return (
    <>
      <PageHeader
        title="Buyers"
        subtitle="Everyone who has placed an order, with how much they have ordered and paid."
        actions={<DownloadLink href="/api/admin/export/customers" className={adminBtnOutline}><Download size={14} /> Export CSV</DownloadLink>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat accent label="Buyers" value={buyers.length.toLocaleString("en-US")} />
        <Stat label="Repeat buyers" value={repeat} hint="More than one order" />
        <Stat label="Total paid" value={formatMoney(paid)} />
        <Stat label="Total ordered" value={formatMoney(requested)} hint="Excluding cancelled orders" />
      </div>
      <form className="mb-5 flex max-w-md items-center border border-line bg-white px-3" action="/admin/customers">
        <Search size={15} className="text-stone" />
        <input name="q" defaultValue={q} placeholder="Search name, email or phone" className="w-full bg-transparent px-3 py-2.5 text-sm outline-none" />
      </form>
      <Card pad={false}>
        <Table head={["Buyer", "Phone", "Country", "Orders", "Total ordered", "Total paid", "Last order"]} empty={!buyers.length && <Empty>No buyers yet.</Empty>}>
          {buyers.map((b) => (
            <tr key={b.email} className="hover:bg-linen/60">
              <td className="px-4 py-3">
                <Link href={`/admin/orders?q=${encodeURIComponent(b.email)}`} className="font-semibold hover:underline">{b.name}</Link>
                <span className="block text-xs text-stone">{b.email}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">{b.phone}</td>
              <td className="whitespace-nowrap px-4 py-3">{countryLabel(b.country)}</td>
              <td className="px-4 py-3 tabular-nums">{b.orders}</td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatMoney(b.requested)}</td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">{formatMoney(b.paid)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-stone">{formatDateTime(b.lastOrder)}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}

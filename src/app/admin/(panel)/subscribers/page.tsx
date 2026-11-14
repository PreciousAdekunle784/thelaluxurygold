import type { Metadata } from "next";
import { connection } from "next/server";
import { Download } from "lucide-react";
import { Card, Empty, PageHeader, Pager, Table, adminBtnOutline, DownloadLink } from "@/components/admin/ui";
import { RemoveSubscriber } from "@/components/admin/SmallActions";
import { countSubscribers, listSubscribers } from "@/lib/repo/misc";
import { formatDateTime } from "@/lib/time";

export const instant = false;
export const metadata: Metadata = { title: "Subscribers" };
const PAGE = 100;

export default async function SubscribersPage({ searchParams }: PageProps<"/admin/subscribers">) {
  await connection();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [list, total] = await Promise.all([listSubscribers({ limit: PAGE + 1, offset: (page - 1) * PAGE }), countSubscribers()]);
  const subs = list.slice(0, PAGE);
  return (
    <>
      <PageHeader
        title="Newsletter subscribers"
        subtitle={`${total.toLocaleString("en-US")} people have opted in to your emails.`}
        actions={<DownloadLink href="/api/admin/export/subscribers" className={adminBtnOutline}><Download size={14} /> Export CSV</DownloadLink>}
      />
      <Card pad={false}>
        <Table head={["Email", "Signed up from", "Date", ""]} empty={!subs.length && <Empty>No subscribers yet.</Empty>}>
          {subs.map((s) => (
            <tr key={s.email} className="hover:bg-linen/60">
              <td className="px-4 py-3"><a href={`mailto:${s.email}`} className="hover:underline">{s.email}</a></td>
              <td className="px-4 py-3 capitalize text-stone">{s.source}</td>
              <td className="whitespace-nowrap px-4 py-3 text-stone">{formatDateTime(s.createdAt)}</td>
              <td className="px-4 py-3 text-right"><RemoveSubscriber email={s.email} /></td>
            </tr>
          ))}
        </Table>
        <Pager page={page} hasMore={list.length > PAGE} href={(p) => (p > 1 ? `/admin/subscribers?page=${p}` : "/admin/subscribers")} note={`Page ${page} of ${Math.max(1, Math.ceil(total / PAGE))}`} />
      </Card>
    </>
  );
}

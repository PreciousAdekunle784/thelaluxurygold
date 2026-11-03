import type { Metadata } from "next";
import { connection } from "next/server";
import { Download } from "lucide-react";
import { Card, Empty, PageHeader, Table, adminBtnOutline, DownloadLink } from "@/components/admin/ui";
import { RemoveSubscriber } from "@/components/admin/SmallActions";
import { listSubscribers } from "@/lib/repo/misc";
import { formatDateTime } from "@/lib/time";

export const instant = false;
export const metadata: Metadata = { title: "Subscribers" };

export default async function SubscribersPage() {
  await connection();
  const subs = await listSubscribers();
  return (
    <>
      <PageHeader
        title="Newsletter subscribers"
        subtitle={`${subs.length.toLocaleString("en-US")} people have opted in to your emails.`}
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
      </Card>
    </>
  );
}

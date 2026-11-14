import type { Metadata } from "next";
import { connection } from "next/server";
import { Mail, Phone } from "lucide-react";
import { Card, Empty, PageHeader, Pager } from "@/components/admin/ui";
import { ReadToggle } from "@/components/admin/SmallActions";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { listMessages, messageCounts } from "@/lib/repo/misc";
import { formatDateTime } from "@/lib/time";
import { cx } from "@/lib/format";

export const instant = false;
export const metadata: Metadata = { title: "Messages" };
const PAGE = 25;

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await connection();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [list, { total, unread }] = await Promise.all([listMessages({ limit: PAGE + 1, offset: (page - 1) * PAGE }), messageCounts()]);
  const messages = list.slice(0, PAGE);
  return (
    <>
      <PageHeader title="Messages" subtitle={`Contact form messages · ${unread} unread`} />
      {messages.length === 0 && page === 1 ? (
        <Card><Empty>No messages yet. Messages sent through the contact page appear here.</Empty></Card>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => {
            const digits = m.phone.replace(/[^\d]/g, "");
            return (
              <li key={m.id} className={cx("border bg-white p-5", m.read ? "border-line" : "border-l-2 border-champagne border-y-line border-r-line")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{m.name} {!m.read && <span className="ml-2 bg-gold-pale px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase">New</span>}</p>
                    <p className="text-xs text-stone">{m.topic} · {formatDateTime(m.createdAt)}</p>
                  </div>
                  <ReadToggle id={m.id} read={m.read} />
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
                <div className="mt-4 flex flex-wrap gap-5 text-sm">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to LA Luxury Gold")}`} className="flex items-center gap-2 hover:underline"><Mail size={14} /> {m.email}</a>
                  {m.phone && <a href={`tel:${m.phone}`} className="flex items-center gap-2 hover:underline"><Phone size={14} /> {m.phone}</a>}
                  {digits.length > 6 && <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-forest hover:underline"><WhatsAppIcon width={14} height={14} /> WhatsApp</a>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {(page > 1 || list.length > PAGE) && (
        <div className="mt-4 border border-line bg-white">
          <Pager page={page} hasMore={list.length > PAGE} href={(p) => (p > 1 ? `/admin/messages?page=${p}` : "/admin/messages")} note={`Page ${page} of ${Math.max(1, Math.ceil(total / PAGE))} · ${total.toLocaleString("en-US")} messages`} />
        </div>
      )}
    </>
  );
}

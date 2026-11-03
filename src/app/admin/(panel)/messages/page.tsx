import type { Metadata } from "next";
import { connection } from "next/server";
import { Mail, Phone } from "lucide-react";
import { Card, Empty, PageHeader } from "@/components/admin/ui";
import { ReadToggle } from "@/components/admin/SmallActions";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { listMessages } from "@/lib/repo/misc";
import { formatDateTime } from "@/lib/time";
import { cx } from "@/lib/format";

export const instant = false;
export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  await connection();
  const messages = await listMessages();
  const unread = messages.filter((m) => !m.read).length;
  return (
    <>
      <PageHeader title="Messages" subtitle={`Contact form messages · ${unread} unread`} />
      {messages.length === 0 ? (
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
    </>
  );
}

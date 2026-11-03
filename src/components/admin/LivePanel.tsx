"use client";

import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { Monitor, ShoppingBag, Smartphone, Tablet } from "lucide-react";
import { useLive } from "./LiveProvider";
import { Card, Stat, countryLabel } from "./ui";
import { formatMoney } from "@/lib/format";
import { timeAgo } from "@/lib/time";

const DeviceIcon = ({ d }: { d: string }) => (d === "Mobile" ? <Smartphone size={13} /> : d === "Tablet" ? <Tablet size={13} /> : <Monitor size={13} />);

export function LiveCount() {
  const { live, connected } = useLive();
  return (
    <Stat
      accent
      label="On the site right now"
      value={
        <span className="flex items-center gap-3">
          {connected ? live.length : "…"}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
          </span>
        </span>
      }
      hint="Active in the last 5 minutes · updates every few seconds"
    />
  );
}

export function LivePanel() {
  const { live, feed, orders, now } = useLive();
  const activity = [
    ...feed.map((v) => ({ kind: "view" as const, ts: v.ts, key: v.id, v })),
    ...orders.map((o) => ({ kind: "order" as const, ts: o.ts, key: o.reference, o })),
  ]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 40);

  return (
    <div className="space-y-6">
      <Card title={`Live visitors (${live.length})`} pad={false}>
        {live.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-stone">Nobody is browsing right now.</p>
        ) : (
          <ul className="max-h-64 divide-y divide-line overflow-y-auto">
            {live.map((v) => (
              <li key={v.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <span className="text-stone"><DeviceIcon d={v.device} /></span>
                <span className="min-w-0 flex-1 truncate">{v.path}</span>
                <span className="shrink-0 text-xs text-stone">{countryLabel(v.country)}</span>
                <span className="w-14 shrink-0 text-right text-xs text-stone">{timeAgo(v.ts, now)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Activity stream" pad={false}>
        {activity.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-stone">Visits and orders from the last 30 minutes will stream in here.</p>
        ) : (
          <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
            <AnimatePresence initial={false}>
              {activity.map((a) => (
                <m.li key={a.key} initial={{ opacity: 0, backgroundColor: "#f6ecd6" }} animate={{ opacity: 1, backgroundColor: "#ffffff" }} transition={{ duration: 1.2 }} className="px-5 py-2.5 text-sm">
                  {a.kind === "order" ? (
                    <Link href={`/admin/orders/${a.o.reference}`} className="flex items-center gap-3">
                      <ShoppingBag size={14} className="shrink-0 text-champagne" />
                      <span className="min-w-0 flex-1 truncate">
                        <strong className="font-semibold">New order</strong> {a.o.reference} · {a.o.name}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">{a.o.hasPriceOnRequest && !a.o.subtotalAED ? "On request" : formatMoney(a.o.subtotalAED)}</span>
                      <span className="w-14 shrink-0 text-right text-xs text-stone">{timeAgo(a.ts, now)}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 text-stone"><DeviceIcon d={a.v.device} /></span>
                      <span className="min-w-0 flex-1 truncate">
                        {a.v.isNew ? <span className="mr-1.5 bg-sage-mist px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-forest">New</span> : null}
                        {a.v.path}
                        {a.v.referrer && a.v.referrer !== "Direct" ? <span className="text-stone"> · from {a.v.referrer}</span> : null}
                      </span>
                      <span className="shrink-0 text-xs text-stone">{countryLabel(a.v.country)}</span>
                      <span className="w-14 shrink-0 text-right text-xs text-stone">{timeAgo(a.ts, now)}</span>
                    </div>
                  )}
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>
    </div>
  );
}


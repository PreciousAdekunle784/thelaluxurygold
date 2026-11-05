import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/format";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl leading-none">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-stone">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, action, children, className, pad = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cx("border border-line bg-white", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
          {title && <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">{title}</h2>}
          {action}
        </div>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: ReactNode; accent?: boolean }) {
  return (
    <div className={cx("border border-line p-5", accent ? "bg-forest text-ivory" : "bg-white")}>
      <p className={cx("text-[0.62rem] font-semibold uppercase tracking-[0.18em]", accent ? "text-gold-pale" : "text-stone")}>{label}</p>
      <p className="mt-3 font-display text-[2.1rem] leading-none tabular-nums">{value}</p>
      {hint && <p className={cx("mt-2 text-xs", accent ? "text-ivory/70" : "text-stone")}>{hint}</p>}
    </div>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[0.62rem] uppercase tracking-[0.16em] text-stone">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-12 text-center text-sm text-stone">{children}</p>;
}

const statusStyles: Record<string, string> = {
  awaiting_payment: "border border-dashed border-stone text-stone",
  pending_confirmation: "bg-gold-pale text-ink",
  confirmed: "bg-sage-mist text-forest",
  paid: "bg-forest text-ivory",
  shipped: "border border-forest text-forest",
  delivered: "bg-ink text-ivory",
  cancelled: "bg-burgundy/10 text-burgundy",
};
const statusLabels: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  pending_confirmation: "Awaiting confirmation",
  confirmed: "Confirmed",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
export function StatusPill({ status }: { status: string }) {
  return <span className={cx("inline-flex whitespace-nowrap px-2 py-0.5 text-[0.68rem] font-semibold", statusStyles[status] ?? "bg-sand")}>{statusLabels[status] ?? status}</span>;
}

export function Tabs({ items, active }: { items: { href: string; label: string; count?: number; key: string }[]; active: string }) {
  return (
    <div className="no-scrollbar mb-5 flex gap-1 overflow-x-auto border-b border-line">
      {items.map((t) => (
        <Link key={t.key} href={t.href} className={cx("-mb-px shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold", active === t.key ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink")}>
          {t.label}
          {t.count != null && <span className="ml-1.5 text-stone">{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}

export const adminBtn = "inline-flex h-10 items-center justify-center gap-2 px-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em] transition-colors disabled:opacity-50";
export const adminBtnPrimary = `${adminBtn} bg-ink text-ivory hover:bg-forest`;
export const adminBtnOutline = `${adminBtn} border border-line bg-white hover:border-ink`;

const flags: Record<string, string> = {};
export function countryLabel(code: string) {
  if (!code) return "Unknown";
  if (flags[code]) return flags[code];
  let name = code;
  try {
    name = new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    /* ignore */
  }
  const flag = /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "";
  return (flags[code] = `${flag} ${name}`.trim());
}

/** Plain anchor for file downloads (CSV exports) — these are API routes, not pages. */
export function DownloadLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} download className={className}>
      {children}
    </a>
  );
}

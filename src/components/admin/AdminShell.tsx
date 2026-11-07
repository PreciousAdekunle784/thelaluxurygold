"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, ExternalLink, Gem, Inbox, KeyRound, LayoutDashboard, LogOut, Mail, Menu, Quote, Settings, ShoppingBag, Users, X } from "lucide-react";
import { Monogram } from "@/components/brand/Logo";
import { useLive, NotificationToggle } from "./LiveProvider";
import { logout } from "@/app/admin/actions";
import { cx } from "@/lib/format";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/visitors", label: "Visitors", icon: BarChart3 },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "pending" as const },
  { href: "/admin/customers", label: "Buyers", icon: Users },
  { href: "/admin/products", label: "Products", icon: Gem },
  { href: "/admin/messages", label: "Messages", icon: Inbox, badge: "unread" as const },
  { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
  { href: "/admin/private", label: "Private Access", icon: KeyRound },
  { href: "/admin/testimonials", label: "Testimonials", icon: Quote },
  { href: "/admin/settings", label: "Store settings", icon: Settings },
];

export function AdminShell({ children, dbNotice }: { children: ReactNode; dbNotice?: string | null }) {
  const pathname = usePathname();
  const live = useLive();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the mobile drawer on navigation
  useEffect(() => setOpen(false), [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col bg-forest text-ivory">
      <div className="flex items-center gap-3 border-b border-line-light px-6 py-6">
        <Monogram tone="ivory" className="h-10 w-auto" />
        <div>
          <p className="font-display text-lg leading-none tracking-[0.12em]">LA LUXURY GOLD</p>
          <p className="mt-1 text-[0.6rem] uppercase tracking-[0.3em] text-gold-pale">Admin</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-6 py-4 text-xs text-ivory/80">
        <span className={cx("relative flex h-2 w-2")}>
          {live.connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />}
          <span className={cx("relative inline-flex h-2 w-2 rounded-full", live.connected ? "bg-gold" : "bg-ivory/30")} />
        </span>
        {live.connected ? <span><strong className="font-semibold text-ivory">{live.live.length}</strong> on the site now</span> : "Connecting…"}
      </div>
      <nav className="flex-1 px-3" aria-label="Admin">
        <ul className="space-y-0.5">
          {nav.map((n) => {
            const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
            const count = n.badge === "pending" ? live.pending : n.badge === "unread" ? live.unread : 0;
            return (
              <li key={n.href}>
                <Link href={n.href} className={cx("flex items-center gap-3 px-3 py-2.5 text-sm transition-colors", active ? "bg-ivory/10 text-ivory" : "text-ivory/70 hover:bg-ivory/5 hover:text-ivory")}>
                  <n.icon size={17} strokeWidth={1.4} />
                  <span className="flex-1">{n.label}</span>
                  {count > 0 && <span className="rounded-full bg-champagne px-2 py-0.5 text-[0.65rem] font-semibold text-ink">{count}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-4 border-t border-line-light px-6 py-5">
        <NotificationToggle />
        <Link href="/" target="_blank" className="flex items-center gap-2 text-xs text-ivory/80 hover:text-ivory">
          <ExternalLink size={13} /> View store
        </Link>
        <form action={logout}>
          <button type="submit" className="flex items-center gap-2 text-xs text-ivory/80 hover:text-ivory">
            <LogOut size={13} /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      <div className="sticky top-0 z-40 flex items-center justify-between bg-forest px-4 py-3 text-ivory lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu" className="p-1">
          <Menu size={20} />
        </button>
        <span className="font-display tracking-[0.12em]">LLG ADMIN</span>
        <span className="text-xs text-ivory/80">{live.live.length} live</span>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[270px]">
            {sidebar}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-3 p-1 text-ivory">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      <div className="min-w-0">
        {dbNotice && <p className="border-b border-champagne/40 bg-gold-pale/40 px-6 py-2.5 text-xs text-ink/80">{dbNotice}</p>}
        <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}

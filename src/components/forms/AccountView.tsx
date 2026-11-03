"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { whatsappLink } from "@/lib/whatsapp";
import { cx } from "@/lib/format";

/**
 * Customer account UI.
 * Authentication is not connected yet. Plug an auth provider (e.g. Auth.js, Clerk,
 * Supabase Auth or your commerce platform's customer API) into `onSubmit` below and
 * gate an /account/orders route on the session.
 */
export function AccountView() {
  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [notice, setNotice] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("Customer accounts are being prepared and will open soon. In the meantime, our team can help with any order on WhatsApp.");
  };

  return (
    <div className="container-luxe grid gap-16 pb-28 lg:grid-cols-[1fr_1fr] lg:gap-24">
      <div className="max-w-md">
        <div className="flex gap-8 border-b border-line" role="tablist">
          {(["signin", "register"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => { setTab(t); setNotice(null); }} className={cx("-mb-px border-b pb-4 text-[0.7rem] font-semibold uppercase tracking-[0.22em] transition-colors", tab === t ? "border-ink" : "border-transparent text-stone hover:text-ink")}>
              {t === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="mt-10 space-y-6">
          {tab === "register" && (
            <div className="grid grid-cols-2 gap-5">
              <label className="block"><span className="mb-2 block text-[0.66rem] font-semibold uppercase tracking-[0.18em]">First name</span><input required autoComplete="given-name" className="field-boxed" /></label>
              <label className="block"><span className="mb-2 block text-[0.66rem] font-semibold uppercase tracking-[0.18em]">Last name</span><input required autoComplete="family-name" className="field-boxed" /></label>
            </div>
          )}
          <label className="block"><span className="mb-2 block text-[0.66rem] font-semibold uppercase tracking-[0.18em]">Email address</span><input type="email" required autoComplete="email" className="field-boxed" /></label>
          <label className="block"><span className="mb-2 block text-[0.66rem] font-semibold uppercase tracking-[0.18em]">Password</span><input type="password" required minLength={8} autoComplete={tab === "signin" ? "current-password" : "new-password"} className="field-boxed" /></label>
          <Button type="submit" size="lg" className="w-full">{tab === "signin" ? "Sign in" : "Create account"}</Button>
          <p role="status" className="min-h-5 text-sm leading-relaxed text-forest">{notice}</p>
        </form>
      </div>

      <div className="bg-linen p-8 md:p-12">
        <p className="eyebrow text-champagne">Your account</p>
        <h2 className="display mt-4 text-4xl uppercase">A personal <span className="font-light italic normal-case">space</span></h2>
        <ul className="mt-10 space-y-6 text-sm">
          <li className="flex gap-4"><Package size={20} strokeWidth={1.1} className="shrink-0 text-champagne" /> Track order requests and deliveries</li>
          <li className="flex gap-4"><Heart size={20} strokeWidth={1.1} className="shrink-0 text-champagne" /> Keep your wishlist across devices</li>
          <li className="flex gap-4"><ShoppingBag size={20} strokeWidth={1.1} className="shrink-0 text-champagne" /> Faster checkout with saved addresses</li>
        </ul>
        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/wishlist" className="link-underline eyebrow font-semibold">View wishlist</Link>
          <a href={whatsappLink("Hello LA Luxury Gold, I need help with an order.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm hover:text-forest">
            <WhatsAppIcon width={17} height={17} /> Order help on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

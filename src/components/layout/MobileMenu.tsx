"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { socialIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { useEscape, useScrollLock } from "@/lib/hooks/ui";
import { collectionsMenu, mainNav, shopMenu } from "@/lib/navigation";
import { store } from "@/lib/config/store";
import { whatsappLink, defaultWhatsappMessage } from "@/lib/whatsapp";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>("shop");
  useScrollLock(open);
  useEscape(open, onClose);

  const sub: Record<string, { label: string; href: string }[]> = {
    shop: shopMenu.categories,
    collections: collectionsMenu.map((c) => ({ label: c.label, href: c.href })),
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 left-0 flex w-full max-w-[420px] flex-col overflow-y-auto bg-ivory"
            aria-label="Mobile"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
              <Logo className="text-[11px]" />
              <button type="button" onClick={onClose} aria-label="Close menu" className="-mr-2 p-2">
                <X size={22} strokeWidth={1.2} />
              </button>
            </div>

            <ul className="flex-1 px-5 py-6">
              {mainNav.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="border-b border-line"
                >
                  {item.menu ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setExpanded((e) => (e === item.menu ? null : item.menu!))}
                        aria-expanded={expanded === item.menu}
                        className="flex w-full items-center justify-between py-4 font-display text-[1.9rem] leading-none"
                      >
                        {item.label}
                        {expanded === item.menu ? <Minus size={18} strokeWidth={1.1} /> : <Plus size={18} strokeWidth={1.1} />}
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded === item.menu && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            {sub[item.menu].map((l) => (
                              <li key={l.href}>
                                <Link href={l.href} onClick={onClose} className="block py-2.5 pl-1 text-[0.8rem] uppercase tracking-[0.18em] text-stone">
                                  {l.label}
                                </Link>
                              </li>
                            ))}
                            <li className="h-4" />
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link href={item.href} onClick={onClose} className="block py-4 font-display text-[1.9rem] leading-none">
                      {item.label}
                    </Link>
                  )}
                </motion.li>
              ))}
            </ul>

            <div className="space-y-6 border-t border-line bg-linen px-5 py-7">
              <div className="flex gap-6 text-[0.72rem] uppercase tracking-[0.2em]">
                <Link href="/account" onClick={onClose}>Account</Link>
                <Link href="/wishlist" onClick={onClose}>Wishlist</Link>
                <Link href="/cart" onClick={onClose}>Bag</Link>
              </div>
              <a
                href={whatsappLink(defaultWhatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm"
              >
                <WhatsAppIcon width={20} height={20} /> Chat with us on WhatsApp
              </a>
              <div className="flex items-center gap-4">
                {store.social.links.map((s) => {
                  const Icon = socialIcon[s.name];
                  return (
                    <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${s.name} ${store.social.handle}`} className="text-ink/80 hover:text-ink">
                      <Icon />
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>
  );
}

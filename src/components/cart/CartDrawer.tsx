"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { useCart } from "@/lib/state/cart";
import { useEscape, useScrollLock } from "@/lib/hooks/ui";
import { buttonClass } from "@/components/ui/Button";
import { Price } from "@/components/product/Price";
import { CartLineItem } from "./CartLineItem";

export function CartDrawer() {
  const { isOpen, close, lines, subtotalAED, count, hasPriceOnRequest } = useCart();
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  useScrollLock(isOpen);
  useEscape(isOpen, close);

  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  useEffect(() => {
    if (isOpen) panel.current?.focus();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Shopping bag">
          <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            ref={panel}
            tabIndex={-1}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col bg-ivory outline-none"
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-6 md:h-20">
              <p className="eyebrow font-semibold">
                Your bag <span className="text-stone">({count})</span>
              </p>
              <button type="button" onClick={close} aria-label="Close bag" className="-mr-2 p-2 hover:opacity-60">
                <X size={20} strokeWidth={1.2} />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <ShoppingBag size={34} strokeWidth={0.9} className="text-champagne" />
                <p className="mt-6 font-display text-3xl">Your bag is empty</p>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone">Discover pieces designed to stay with you.</p>
                <Link href="/shop" onClick={close} className={buttonClass("solid", "md", "mt-8")}>
                  Explore the collection
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
                  {lines.map((l) => (
                    <CartLineItem key={l.key} line={l} onNavigate={close} />
                  ))}
                </ul>
                <div className="border-t border-line bg-linen px-6 py-6">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow font-semibold">Subtotal</span>
                    <Price amountAED={subtotalAED} className="text-lg" />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-stone">
                    Shipping, duties and any applicable taxes are confirmed at checkout.
                    {hasPriceOnRequest && " Items priced on request are confirmed by our team."}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Link href="/cart" onClick={close} className={buttonClass("outline", "md")}>
                      View bag
                    </Link>
                    <Link href="/checkout" onClick={close} className={buttonClass("solid", "md")}>
                      Checkout
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

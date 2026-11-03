"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/state/cart";
import { buttonClass } from "@/components/ui/Button";
import { Price } from "@/components/product/Price";
import { CartLineItem } from "./CartLineItem";

export function CartView() {
  const { lines, subtotalAED, hydrated, hasPriceOnRequest, count } = useCart();

  if (!hydrated) {
    return (
      <div className="container-luxe grid gap-12 pb-28 lg:grid-cols-[1fr_400px]" aria-busy="true">
        <div className="space-y-6">{[0, 1].map((i) => <div key={i} className="h-36 animate-pulse bg-sand" />)}</div>
        <div className="h-64 animate-pulse bg-sand" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-luxe flex flex-col items-center pb-32 pt-6 text-center">
        <ShoppingBag size={38} strokeWidth={0.9} className="text-champagne" />
        <p className="mt-7 font-display text-4xl">Your bag is empty</p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone">Explore our jewellery and gold bars — your selections will be kept here between visits.</p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/shop" className={buttonClass("solid", "lg")}>Explore the collection</Link>
          <Link href="/wishlist" className={buttonClass("outline", "lg")}>View wishlist</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-luxe grid gap-12 pb-28 lg:grid-cols-[1fr_400px] lg:gap-16 xl:gap-24">
      <div>
        <div className="hidden grid-cols-[1fr_auto] border-b border-line pb-4 md:grid">
          <span className="eyebrow text-stone">Piece</span>
          <span className="eyebrow text-stone">Total</span>
        </div>
        <ul className="divide-y divide-line border-b border-line">
          {lines.map((l) => (
            <CartLineItem key={l.key} line={l} large />
          ))}
        </ul>
        <Link href="/shop" className="link-underline eyebrow mt-8 font-semibold">
          Continue shopping
        </Link>
      </div>

      <aside className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
        <div className="bg-linen p-7 md:p-9">
          <h2 className="eyebrow font-semibold">Order summary</h2>
          <dl className="mt-7 space-y-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone">Subtotal ({count} {count === 1 ? "item" : "items"})</dt>
              <dd><Price amountAED={subtotalAED} /></dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-stone">Shipping</dt>
              <dd className="text-right text-stone">Calculated at checkout</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-5 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold"><Price amountAED={subtotalAED} /></dd>
            </div>
          </dl>
          {hasPriceOnRequest && <p className="mt-4 text-xs leading-relaxed text-stone">Includes items priced on request — their price will be confirmed by our team.</p>}
          <Link href="/checkout" className={buttonClass("solid", "lg", "mt-8 w-full")}>
            Proceed to checkout
          </Link>
          <p className="mt-5 text-center text-xs leading-relaxed text-stone">Insured worldwide delivery · Prices in AED</p>
        </div>
      </aside>
    </div>
  );
}

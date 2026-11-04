"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/data/types";
import { Price } from "./Price";
import { cx } from "@/lib/format";

/** Phones: once the main "Add to bag" button scrolls away, keep price and a shortcut back to it within thumb reach. */
export function MobileBuyBar({ product }: { product: Product }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const btn = document.getElementById("add-to-bag");
    if (!btn || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(btn);
    return () => io.disconnect();
  }, []);
  const toPanel = () => document.getElementById("purchase-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <div
      aria-hidden={!show}
      className={cx(
        "fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-line bg-ivory/95 px-5 py-3 backdrop-blur transition-transform duration-500 ease-[var(--ease-luxe)] md:hidden",
        show ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-display text-lg leading-tight">{product.name}</p>
        <Price amount={product.price} className="text-sm text-stone" />
      </div>
      <button type="button" tabIndex={show ? 0 : -1} onClick={toPanel} className="h-11 shrink-0 bg-ink px-5 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-ivory">
        {product.variants?.length ? "Choose & add" : "Add to bag"}
      </button>
    </div>
  );
}

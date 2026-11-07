"use client";

import Link from "next/link";
import { MediaImage } from "@/components/ui/MediaImage";
import { Price } from "@/components/product/Price";
import { useCart, type ResolvedLine } from "@/lib/state/cart";
import { QuantitySelector } from "./QuantitySelector";
import { productHref } from "@/lib/links";

export function CartLineItem({ line, onNavigate, large }: { line: ResolvedLine; onNavigate?: () => void; large?: boolean }) {
  const { setQuantity, remove } = useCart();
  const p = line.product;
  return (
    <li className="flex gap-4 py-5 md:gap-6">
      <Link href={productHref(p)} onClick={onNavigate} className={`relative shrink-0 overflow-hidden bg-sand ${large ? "h-36 w-28 md:h-44 md:w-36" : "h-28 w-[5.5rem]"}`}>
        <MediaImage mediaKey={p.images[0].media} alt={p.images[0].alt} sizes="150px" className="object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={productHref(p)} onClick={onNavigate} className="font-display text-[1.2rem] leading-tight hover:text-champagne">
              {p.name}
            </Link>
            <p className="mt-1 text-[0.7rem] uppercase tracking-[0.16em] text-stone">
              {p.purity}
              {p.weightGrams ? ` · ${p.weightGrams} g` : ""}
              {line.variant ? ` · ${line.variant.name}: ${line.variant.value}` : ""}
            </p>
          </div>
          <Price amount={line.lineTotal} className="shrink-0 text-sm" />
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantitySelector size="sm" value={line.quantity} min={1} onChange={(n) => setQuantity(line.key, n)} label={`Quantity for ${p.name}`} />
          <button type="button" onClick={() => remove(line.key)} className="text-[0.68rem] uppercase tracking-[0.18em] text-stone underline-offset-4 hover:text-ink hover:underline">
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

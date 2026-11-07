"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import type { Product } from "@/lib/data/types";
import { MediaImage } from "@/components/ui/MediaImage";
import { useCart } from "@/lib/state/cart";
import { cx } from "@/lib/format";
import { whatsappLink, productEnquiry } from "@/lib/whatsapp";
import { Price } from "./Price";
import { WishlistButton } from "./WishlistButton";
import { productHref } from "@/lib/links";

export function ProductCard({ product, priority, sizes }: { product: Product; priority?: boolean; sizes?: string }) {
  const { add } = useCart();
  const [picking, setPicking] = useState(false);
  const [added, setAdded] = useState(false);
  // The hover photo is only fetched once someone actually hovers (desktop) — saves half the image bytes.
  const [hoverReady, setHoverReady] = useState(false);
  const variant = product.variants?.[0];
  const unavailable = product.availability === "out_of_stock";
  const href = productHref(product);

  const doAdd = (value?: string) => {
    add(product.id, 1, variant && value ? { name: variant.name, value } : undefined);
    setPicking(false);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="card-lift group/card relative flex flex-col" onPointerEnter={(e) => e.pointerType === "mouse" && setHoverReady(true)} onFocus={() => setHoverReady(true)}>
      <div className="relative">
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden bg-sand" aria-label={product.name}>
        <MediaImage
          mediaKey={product.images[0].media}
          alt={product.images[0].alt}
          priority={priority}
          sizes={sizes ?? "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"}
          className="object-cover transition-[transform,opacity] duration-[1400ms] ease-[var(--ease-luxe)] group-hover/card:scale-[1.035]"
        />
        {product.images[1] && hoverReady && (
          <MediaImage
            mediaKey={product.images[1].media}
            alt=""
            aria-hidden
            sizes={sizes ?? "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"}
            className="object-cover opacity-0 transition-opacity duration-[900ms] ease-[var(--ease-luxe)] group-hover/card:opacity-100 max-md:hidden"
          />
        )}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5 md:left-4 md:top-4">
          {product.isNew && <span className="bg-ivory/90 px-2 py-[3px] text-[0.58rem] font-semibold uppercase tracking-[0.2em]">New</span>}
          {product.availability === "low_stock" && (
            <span className="bg-ivory/90 px-2 py-[3px] text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-burgundy">Few left</span>
          )}
        </div>
      </Link>

      <WishlistButton
        productId={product.id}
        name={product.name}
        className="absolute right-2 top-2 h-10 w-10 text-ink hover:text-burgundy md:right-3 md:top-3"
      />

      {/* Quick add — revealed on hover (desktop), always visible on touch */}
        <div className="absolute inset-x-2 bottom-2 z-10 md:inset-x-3 md:bottom-3">
          <AnimatePresence>
            {picking && variant && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.35 }}
                className="mb-2 bg-ivory p-3 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.4)]"
              >
                <p className="eyebrow mb-2 text-stone">Select {variant.name.toLowerCase()}</p>
                <div className="flex flex-wrap gap-1.5">
                  {variant.options.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      disabled={o.available === false}
                      onClick={() => doAdd(o.value)}
                      className="min-w-10 border border-line px-2.5 py-2 text-xs transition-colors hover:border-ink hover:bg-ink hover:text-ivory disabled:opacity-30"
                    >
                      {o.value}
                    </button>
                  ))}
                </div>
              </m.div>
            )}
          </AnimatePresence>
          {product.price == null ? (
            <a
              href={whatsappLink(productEnquiry(product.name))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-full items-center justify-center bg-ivory/95 text-[0.62rem] font-semibold uppercase tracking-[0.22em] transition-all duration-500 hover:bg-ink hover:text-ivory md:h-11 md:translate-y-2 md:opacity-0 md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100 md:focus-visible:opacity-100"
            >
              Enquire
            </a>
          ) : (
            <button
              type="button"
              disabled={unavailable}
              onClick={() => (variant ? setPicking((v) => !v) : doAdd())}
              aria-expanded={variant ? picking : undefined}
              className={cx(
                "flex h-10 w-full items-center justify-center gap-2 bg-ivory/95 text-[0.62rem] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm transition-all duration-500 hover:bg-ink hover:text-ivory md:h-11 md:translate-y-2 md:opacity-0 md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100",
                (picking || added) && "md:translate-y-0 md:opacity-100",
              )}
            >
              {added ? <Check size={14} strokeWidth={1.5} /> : <Plus size={14} strokeWidth={1.5} />}
              {added ? "Added" : "Quick add"}
            </button>
          )}
        </div>
      </div>

      <Link href={href} className="mt-4 flex flex-col gap-1.5 md:mt-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[1.15rem] leading-tight md:text-[1.35rem]">{product.name}</h3>
        </div>
        <p className="flex flex-wrap items-center gap-x-2 text-[0.72rem] uppercase tracking-[0.16em] text-stone">
          <span>{product.purity} gold</span>
          {product.weightGrams != null && (
            <>
              <span className="h-[3px] w-[3px] rounded-full bg-champagne" aria-hidden />
              <span>{product.weightGrams} g</span>
            </>
          )}
        </p>
        <p className="flex items-center gap-2.5 text-[0.9rem]">
          <Price amount={product.price} />
        </p>
      </Link>
    </article>
  );
}

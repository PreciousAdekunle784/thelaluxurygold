"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/data/types";
import { ProductCard } from "@/components/product/ProductCard";
import { categories } from "@/lib/data/categories";
import { cx } from "@/lib/format";

/** The private pieces, large, with category filters when the collection spans several categories. */
export function PrivateGrid({ products }: { products: Product[] }) {
  const present = useMemo(() => categories.filter((c) => products.some((p) => p.category === c.slug)), [products]);
  const [cat, setCat] = useState<string | null>(null);
  const list = cat ? products.filter((p) => p.category === cat) : products;
  return (
    <>
      {present.length > 1 && (
        <div className="mb-12 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Filter the private collection">
          {[{ slug: null as string | null, name: "All" }, ...present.map((c) => ({ slug: c.slug as string | null, name: c.name }))].map((c) => (
            <button
              key={c.name}
              type="button"
              role="tab"
              aria-selected={cat === c.slug}
              onClick={() => setCat(c.slug)}
              className={cx(
                "h-10 border px-5 text-[0.64rem] font-semibold uppercase tracking-[0.2em] transition-colors",
                cat === c.slug ? "border-emerald-deep bg-emerald-deep text-ivory" : "border-line text-ink hover:border-emerald-deep",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      <ul className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p, i) => (
          <li key={p.id} className={i === 0 && list.length > 2 ? "sm:col-span-2 xl:col-span-2" : ""}>
            <ProductCard product={p} priority={i < 2} sizes={i === 0 ? "(min-width: 1280px) 64vw, (min-width: 640px) 100vw, 100vw" : "(min-width: 1280px) 32vw, (min-width: 640px) 50vw, 100vw"} />
          </li>
        ))}
      </ul>
    </>
  );
}

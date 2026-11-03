"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import type { Product } from "@/lib/data/types";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { cx } from "@/lib/format";

const tabs = [
  { key: "all", label: "All" },
  { key: "rings", label: "Rings" },
  { key: "necklaces", label: "Necklaces" },
  { key: "bracelets", label: "Bracelets" },
  { key: "earrings", label: "Earrings" },
] as const;

export function FeaturedCollection({ products }: { products: Product[] }) {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("all");
  const list = useMemo(() => {
    const jewellery = products.filter((p) => p.category !== "gold-bars");
    const featured = [...jewellery].sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.popularity - a.popularity);
    return (tab === "all" ? featured : featured.filter((p) => p.category === tab)).slice(0, 8);
  }, [products, tab]);

  return (
    <section className="bg-linen py-24 md:py-36" aria-labelledby="the-collection">
      <div className="container-luxe">
        <SectionHeading eyebrow="Featured" title={<span id="the-collection">The collection</span>} intro="Pieces that transcend trends. Gold designed to stay with you." />

        <div className="no-scrollbar mx-auto mt-12 flex max-w-full justify-start gap-1 overflow-x-auto sm:justify-center" role="tablist" aria-label="Filter featured pieces">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cx(
                "relative shrink-0 px-4 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.22em] transition-colors duration-300",
                tab === t.key ? "text-ink" : "text-stone hover:text-ink",
              )}
            >
              {t.label}
              {tab === t.key && <m.span layoutId="featured-tab" className="absolute inset-x-4 bottom-0 h-px bg-ink" transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />}
            </button>
          ))}
        </div>

        <div className="mt-12 md:mt-16">
          <AnimatePresence mode="wait">
            <m.ul
              key={tab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-y-16"
            >
              {list.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </m.ul>
          </AnimatePresence>
        </div>

        <div className="mt-16 flex justify-center md:mt-20">
          <ButtonLink href="/collections" variant="outline" size="lg">
            View all collections
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

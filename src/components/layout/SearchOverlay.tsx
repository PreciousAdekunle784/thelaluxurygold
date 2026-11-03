"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import { queryProducts } from "@/lib/data/catalogue";
import { useCatalogue } from "@/lib/state/catalogue";
import { MediaImage } from "@/components/ui/MediaImage";
import { Price } from "@/components/product/Price";

const suggestions = ["Rings", "Hoops", "Chain", "24K", "Gold bar", "Signet"];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { products } = useCatalogue();
  const results = useMemo(() => (q.trim().length > 1 ? queryProducts({ q }, products).slice(0, 6) : []), [q, products]);

  useEffect(() => {
    if (open) window.setTimeout(() => input.current?.focus(), 60);
  }, [open]);

  const submit = (term: string) => {
    if (!term.trim()) return;
    onClose();
    router.push(`/shop?q=${encodeURIComponent(term.trim())}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            className="fixed inset-0 top-[calc(var(--header-h)+36px)] -z-10 bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <m.div
            role="dialog"
            aria-label="Search the collection"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full border-b border-line bg-ivory text-ink"
          >
            <div className="container-luxe py-8 md:py-12">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(q);
                }}
                className="flex items-center gap-4 border-b border-ink/70 pb-3"
                role="search"
              >
                <Search size={22} strokeWidth={1.1} className="shrink-0" />
                <label htmlFor="site-search" className="sr-only">
                  Search products
                </label>
                <input
                  ref={input}
                  id="site-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search rings, chains, gold bars…"
                  className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-stone/60 md:text-4xl"
                  autoComplete="off"
                />
                <button type="button" onClick={onClose} aria-label="Close search" className="shrink-0 p-2 hover:opacity-60">
                  <X size={20} strokeWidth={1.2} />
                </button>
              </form>

              {results.length === 0 ? (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className="eyebrow mr-2 text-stone">{q.trim().length > 1 ? "No matches — try" : "Popular"}</span>
                  {suggestions.map((s) => (
                    <button key={s} type="button" onClick={() => setQ(s)} className="border border-line px-4 py-2 text-xs tracking-wide transition-colors hover:border-ink">
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-8">
                  <ul className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
                    {results.map((p) => (
                      <li key={p.id}>
                        <Link href={`/product/${p.slug}`} onClick={onClose} className="group block">
                          <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                            <MediaImage mediaKey={p.images[0].media} alt={p.images[0].alt} sizes="200px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                          </div>
                          <p className="mt-3 font-display text-[1.05rem] leading-tight">{p.name}</p>
                          <p className="mt-1 text-xs text-stone">
                            {p.purity} · <Price amountAED={p.priceAED} />
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => submit(q)} className="link-underline eyebrow mt-8 font-semibold">
                    View all results <ArrowRight size={14} strokeWidth={1.3} />
                  </button>
                </div>
              )}
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { queryProducts, sizeOptions, sortOptions, type SortKey } from "@/lib/data/catalogue";
import { useCatalogue } from "@/lib/state/catalogue";
import { useCurrency } from "@/lib/state/currency";
import { categories, collections, purities } from "@/lib/data/categories";
import type { CategorySlug, Purity } from "@/lib/data/types";
import { ProductCard } from "@/components/product/ProductCard";
import { useEscape, useScrollLock } from "@/lib/hooks/ui";
import { cx } from "@/lib/format";
import { Button } from "@/components/ui/Button";

/** Price bands in USD (the store's base currency); labels are shown in the shopper's currency. */
const pricePresets: { min: number | null; max: number | null }[] = [
  { min: null, max: 500 },
  { min: 500, max: 1000 },
  { min: 1000, max: 2500 },
  { min: 2500, max: null },
];

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);
const num = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : null);

export interface ShopPreset {
  category?: CategorySlug;
  /** Limit the page to several categories (e.g. fine jewellery = everything except gold bars). */
  categories?: CategorySlug[];
  collection?: string;
  /** Only pieces flagged as new (New Arrivals). */
  newOnly?: boolean;
  defaultSort?: SortKey;
}

/** Pieces shown per step of progressive loading. */
const PAGE = 12;

export function ShopView({ preset = {} }: { preset?: ShopPreset }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const { products } = useCatalogue();
  const { format } = useCurrency();
  const [drawer, setDrawer] = useState(false);
  useScrollLock(drawer);
  useEscape(drawer, () => setDrawer(false));

  const state = {
    q: params.get("q") ?? "",
    categories: preset.category ? [preset.category] : list(params.get("category")).length ? (list(params.get("category")) as CategorySlug[]) : (preset.categories ?? []),
    collections: preset.collection ? [preset.collection] : list(params.get("collection")),
    purities: list(params.get("purity")) as Purity[],
    minPrice: num(params.get("min")),
    maxPrice: num(params.get("max")),
    inStockOnly: params.get("stock") === "1",
    sizes: list(params.get("size")),
    newOnly: !!preset.newOnly,
    picked: list(params.get("category")) as CategorySlug[],
    sort: (params.get("sort") as SortKey) || preset.defaultSort || "featured",
  };
  // products this page can ever show (before shopper filters) — used to offer only relevant sizes
  const scope = useMemo(
    () => queryProducts({ categories: preset.category ? [preset.category] : preset.categories, collections: preset.collection ? [preset.collection] : undefined, newOnly: preset.newOnly }, products),
    [products, preset.category, preset.categories, preset.collection, preset.newOnly],
  );

  const results = useMemo(
    () => queryProducts(state, products),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, preset.category, preset.categories, preset.collection, preset.newOnly, products],
  );

  // progressive loading: render a page at a time, and the next page as the end of the grid scrolls into view
  const [shown, setShown] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);
  const paramsKey = params.toString();
  // eslint-disable-next-line react-hooks/set-state-in-effect -- start from the first page whenever the filters change
  useEffect(() => setShown(PAGE), [paramsKey]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || shown >= results.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setShown((n) => n + PAGE), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, results.length]);
  const visible = results.slice(0, shown);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const toggleIn = (key: string, current: string[], value: string) => {
    const set = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
    update({ [key]: set.join(",") || null });
  };

  const chips: { label: string; clear: () => void }[] = [
    ...(state.q ? [{ label: `“${state.q}”`, clear: () => update({ q: null }) }] : []),
    ...state.picked.map((c) => ({ label: categories.find((x) => x.slug === c)?.name ?? c, clear: () => toggleIn("category", state.picked, c) })),
    ...(!preset.collection ? state.collections.map((c) => ({ label: collections.find((x) => x.slug === c)?.name ?? c, clear: () => toggleIn("collection", state.collections, c) })) : []),
    ...state.purities.map((p) => ({ label: `${p} gold`, clear: () => toggleIn("purity", state.purities, p) })),
    ...(state.minPrice != null || state.maxPrice != null
      ? [{ label: state.minPrice != null && state.maxPrice != null ? `${format(state.minPrice)} – ${format(state.maxPrice)}` : state.maxPrice != null ? `Under ${format(state.maxPrice)}` : `Over ${format(state.minPrice ?? 0)}`, clear: () => update({ min: null, max: null }) }]
      : []),
    ...(state.inStockOnly ? [{ label: "Available now", clear: () => update({ stock: null }) }] : []),
    ...state.sizes.map((v) => ({ label: `Size ${v}`, clear: () => toggleIn("size", state.sizes, v) })),
  ];
  const clearAll = () => startTransition(() => router.replace(pathname, { scroll: false }));

  const filters = (
    <Filters
      preset={preset}
      state={state}
      sizeGroups={sizeOptions(scope)}
      onToggle={toggleIn}
      onUpdate={update}
      countFor={(patch) => queryProducts({ ...state, ...patch }, products).length}
    />
  );

  return (
    <div className="container-luxe pb-28">
      {/* toolbar */}
      <div className="sticky top-[var(--header-h)] z-30 -mx-5 flex items-center justify-between gap-4 border-y border-line bg-ivory/95 px-5 py-3 backdrop-blur md:-mx-10 md:px-10 lg:static lg:mx-0 lg:border-x-0 lg:bg-transparent lg:px-0 lg:py-5 lg:backdrop-blur-none">
        <div className="flex items-center gap-5">
          <button type="button" onClick={() => setDrawer(true)} className="flex items-center gap-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] lg:hidden">
            <SlidersHorizontal size={15} strokeWidth={1.3} /> Filters {chips.length > 0 && <span className="text-champagne">({chips.length})</span>}
          </button>
          <p className="text-[0.75rem] uppercase tracking-[0.18em] text-stone max-lg:hidden" aria-live="polite">
            {results.length} {results.length === 1 ? "piece" : "pieces"}
          </p>
        </div>
        <label className="flex items-center gap-3 text-[0.68rem] uppercase tracking-[0.2em]">
          <span className="text-stone max-sm:hidden">Sort by</span>
          <select
            value={state.sort}
            onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}
            className="cursor-pointer border-0 bg-transparent py-1 pr-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] outline-none"
            aria-label="Sort products"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8 grid gap-12 lg:mt-4 lg:grid-cols-[250px_1fr] xl:grid-cols-[270px_1fr] xl:gap-16">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-[calc(var(--header-h)+1.5rem)]">{filters}</div>
        </aside>

        <div>
          <p className="mb-6 text-[0.72rem] uppercase tracking-[0.18em] text-stone lg:hidden" aria-live="polite">
            {results.length} {results.length === 1 ? "piece" : "pieces"}
          </p>
          {chips.length > 0 && (
            <div className="mb-8 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button key={c.label} type="button" onClick={c.clear} className="flex items-center gap-2 border border-line bg-white/60 px-3 py-1.5 text-xs transition-colors hover:border-ink">
                  {c.label} <X size={12} strokeWidth={1.4} aria-label="Remove filter" />
                </button>
              ))}
              <button type="button" onClick={clearAll} className="ml-2 text-xs underline underline-offset-4 hover:text-champagne">
                Clear all
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <div className="flex flex-col items-center border border-dashed border-line px-6 py-24 text-center">
              <Search size={30} strokeWidth={0.9} className="text-champagne" />
              <p className="mt-6 font-display text-3xl">No pieces match your selection</p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone">Try removing a filter or searching for something else — or ask our team on WhatsApp for help finding a piece.</p>
              <Button variant="outline" className="mt-8" onClick={clearAll}>
                Clear filters
              </Button>
            </div>
          ) : (
            <m.ul layout className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:gap-y-16">
              <AnimatePresence initial={false}>
                {visible.map((p, i) => (
                  <m.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ProductCard product={p} priority={i < 2} sizes="(min-width: 1280px) 28vw, (min-width: 768px) 33vw, 50vw" />
                  </m.li>
                ))}
              </AnimatePresence>
            </m.ul>
          )}
          {results.length > shown && (
            <div ref={sentinel} className="mt-16 flex flex-col items-center gap-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone">
                Showing {shown} of {results.length}
              </p>
              <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
                Show more
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* mobile filter drawer */}
      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-[85] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <m.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <m.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col bg-ivory"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <p className="eyebrow font-semibold">Filter & refine</p>
                <button type="button" onClick={() => setDrawer(false)} aria-label="Close filters" className="-mr-2 p-2">
                  <X size={20} strokeWidth={1.2} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-6">{filters}</div>
              <div className="grid grid-cols-2 gap-3 border-t border-line px-5 py-4">
                <Button variant="outline" onClick={clearAll}>
                  Clear
                </Button>
                <Button onClick={() => setDrawer(false)}>Show {results.length}</Button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

type FilterState = {
  q: string;
  categories: CategorySlug[];
  collections: string[];
  purities: Purity[];
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  sizes: string[];
  newOnly: boolean;
  /** Categories the shopper ticked (as opposed to the page's own scope). */
  picked: CategorySlug[];
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line pb-7 pt-1 [&+&]:pt-7">
      <legend className="eyebrow mb-5 float-left w-full font-semibold">{title}</legend>
      <div className="clear-both space-y-3">{children}</div>
    </fieldset>
  );
}

function Check({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className={cx("group flex cursor-pointer items-center justify-between gap-3 text-[0.9rem]", count === 0 && !checked && "opacity-40")}>
      <span className="flex items-center gap-3">
        <span className={cx("flex h-4 w-4 items-center justify-center border transition-colors", checked ? "border-ink bg-ink" : "border-ink/30 group-hover:border-ink")}>
          {checked && <span className="h-1.5 w-1.5 bg-ivory" />}
        </span>
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        {label}
      </span>
      {count != null && <span className="text-xs tabular-nums text-stone">{count}</span>}
    </label>
  );
}

function Filters({
  preset,
  state,
  sizeGroups,
  onToggle,
  onUpdate,
  countFor,
}: {
  preset: ShopPreset;
  state: FilterState;
  sizeGroups: { name: string; values: string[] }[];
  onToggle: (key: string, current: string[], value: string) => void;
  onUpdate: (patch: Record<string, string | null>) => void;
  countFor: (patch: Partial<FilterState>) => number;
}) {
  const { format, currency, rates } = useCurrency();
  const rate = rates[currency] ?? 1;
  // Price inputs are typed in the shopper's currency; the filter itself works in USD.
  const toLocal = (usd: number | null) => (usd == null ? "" : String(Math.round(usd * rate)));
  const toUsd = (local: string) => (local ? String(Math.round(Number(local) / rate)) : null);
  const [q, setQ] = useState(state.q);
  const [min, setMin] = useState(toLocal(state.minPrice));
  const [max, setMax] = useState(toLocal(state.maxPrice));
  const presetLabel = (p: { min: number | null; max: number | null }) =>
    p.min == null ? `Under ${format(p.max!)}` : p.max == null ? `Over ${format(p.min)}` : `${format(p.min)} – ${format(p.max)}`;

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onUpdate({ q: q.trim() || null });
        }}
        className="mb-8 flex items-center border-b border-ink/40 focus-within:border-ink"
        role="search"
      >
        <Search size={15} strokeWidth={1.3} className="shrink-0 text-stone" />
        <label htmlFor="shop-q" className="sr-only">
          Search products
        </label>
        <input id="shop-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the collection" className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-stone" />
      </form>

      {!preset.category && (
        <Group title="Category">
          {categories
            .filter((c) => !preset.categories || preset.categories.includes(c.slug))
            .map((c) => (
              <Check
                key={c.slug}
                label={c.name}
                checked={state.picked.includes(c.slug)}
                onChange={() => onToggle("category", state.picked, c.slug)}
                count={countFor({ categories: [c.slug] })}
              />
            ))}
        </Group>
      )}

      <Group title="Gold purity">
        {purities.map((p) => (
          <Check key={p} label={`${p} gold`} checked={state.purities.includes(p)} onChange={() => onToggle("purity", state.purities, p)} count={countFor({ purities: [p] })} />
        ))}
      </Group>

      {sizeGroups.map((g) => (
        <Group key={g.name} title={g.name}>
          <div className="flex flex-wrap gap-2">
            {g.values.map((v) => {
              const on = state.sizes.includes(v);
              const n = countFor({ sizes: [v] });
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={on}
                  disabled={n === 0 && !on}
                  onClick={() => onToggle("size", state.sizes, v)}
                  className={cx(
                    "min-w-11 border px-2.5 py-1.5 text-xs tabular-nums transition-colors disabled:opacity-30",
                    on ? "border-ink bg-ink text-ivory" : "border-line bg-white/60 hover:border-ink",
                  )}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </Group>
      ))}

      <Group title="Price">
        <div className="space-y-2.5">
          {pricePresets.map((p) => {
            const active = state.minPrice === p.min && state.maxPrice === p.max;
            return (
              <Check
                key={`${p.min}-${p.max}`}
                label={presetLabel(p)}
                checked={active}
                onChange={() => {
                  onUpdate(active ? { min: null, max: null } : { min: p.min?.toString() ?? null, max: p.max?.toString() ?? null });
                  setMin(active ? "" : toLocal(p.min));
                  setMax(active ? "" : toLocal(p.max));
                }}
              />
            );
          })}
        </div>
        <form
          className="flex items-end gap-2 pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            onUpdate({ min: toUsd(min), max: toUsd(max) });
          }}
        >
          <label className="flex-1 text-[0.65rem] uppercase tracking-[0.16em] text-stone">
            Min ({currency})
            <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} className="field-boxed mt-1.5 px-3 py-2 text-sm normal-case tracking-normal text-ink" placeholder="0" />
          </label>
          <label className="flex-1 text-[0.65rem] uppercase tracking-[0.16em] text-stone">
            Max ({currency})
            <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} className="field-boxed mt-1.5 px-3 py-2 text-sm normal-case tracking-normal text-ink" placeholder="Any" />
          </label>
          <button type="submit" className="h-[38px] border border-ink px-3 text-[0.62rem] font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:text-ivory">
            Apply
          </button>
        </form>
      </Group>

      {!preset.collection && (
        <Group title="Collection">
          {collections.map((c) => (
            <Check key={c.slug} label={c.name} checked={state.collections.includes(c.slug)} onChange={() => onToggle("collection", state.collections, c.slug)} count={countFor({ collections: [c.slug] })} />
          ))}
        </Group>
      )}

      <Group title="Availability">
        <Check label="Available now" checked={state.inStockOnly} onChange={() => onUpdate({ stock: state.inStockOnly ? null : "1" })} count={countFor({ inStockOnly: true })} />
      </Group>
    </div>
  );
}

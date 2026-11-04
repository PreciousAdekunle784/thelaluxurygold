import type { Availability, CategorySlug, Product, Purity } from "./types";

/*
 * Pure catalogue helpers (search, filter, sort). The product list itself comes from
 * the database: on the server via `getCatalogue()` (src/lib/data/store-catalogue.ts),
 * in client components via `useCatalogue()` (src/lib/state/catalogue.tsx).
 */

export function getRelatedProducts(product: Product, source: Product[], limit = 4): Product[] {
  const same = source.filter((p) => p.id !== product.id && p.category === product.category);
  const shared = source.filter(
    (p) => p.id !== product.id && p.category !== product.category && p.collections.some((c) => product.collections.includes(c)),
  );
  return [...same, ...shared].slice(0, limit);
}

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "popular";

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export interface ProductQuery {
  q?: string;
  categories?: CategorySlug[];
  collections?: string[];
  purities?: Purity[];
  minPrice?: number | null;
  maxPrice?: number | null;
  inStockOnly?: boolean;
  /** Variant values (e.g. "54", "45 cm", "M · 17.5 cm"); a product matches if it offers any of them. */
  sizes?: string[];
  /** Only pieces flagged as new. */
  newOnly?: boolean;
  sort?: SortKey;
}

/** Size-type variant values offered across a list of products, grouped by variant name, in catalogue order. */
export function sizeOptions(source: Product[]) {
  const groups = new Map<string, string[]>();
  for (const p of source) {
    for (const v of p.variants ?? []) {
      if (v.name === "Weight") continue;
      const list = groups.get(v.name) ?? [];
      for (const o of v.options) if (o.available !== false && !list.includes(o.value)) list.push(o.value);
      groups.set(v.name, list);
    }
  }
  const numeric = (x: string) => parseFloat(x.replace(/[^0-9.]/g, "")) || 0;
  return [...groups.entries()].map(([name, values]) => ({ name, values: name === "Bracelet size" ? values : [...values].sort((a, b) => numeric(a) - numeric(b)) }));
}

const inStock: Availability[] = ["in_stock", "low_stock"];

export function normalise(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function searchScore(p: Product, q: string): number {
  const terms = normalise(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  const hay = {
    name: normalise(p.name),
    cat: normalise(`${p.category} ${p.category.replace(/s$/, "")}`),
    meta: normalise(`${p.purity} ${p.tagline} ${p.collections.join(" ")} ${p.weightGrams ?? ""}g`),
  };
  let score = 0;
  for (const t of terms) {
    if (hay.name.includes(t)) score += 3;
    else if (hay.cat.includes(t)) score += 2;
    else if (hay.meta.includes(t)) score += 1;
    else return 0;
  }
  return score;
}

export function queryProducts(query: ProductQuery, source: Product[]): Product[] {
  let list = source.filter((p) => {
    if (query.categories?.length && !query.categories.includes(p.category)) return false;
    if (query.collections?.length && !p.collections.some((c) => query.collections!.includes(c))) return false;
    if (query.purities?.length && !query.purities.includes(p.purity)) return false;
    if (query.inStockOnly && !inStock.includes(p.availability)) return false;
    if (query.newOnly && !p.isNew) return false;
    if (query.sizes?.length && !(p.variants ?? []).some((v) => v.options.some((o) => o.available !== false && query.sizes!.includes(o.value)))) return false;
    if (query.minPrice != null && (p.price == null || p.price < query.minPrice)) return false;
    if (query.maxPrice != null && (p.price == null || p.price > query.maxPrice)) return false;
    return true;
  });

  if (query.q?.trim()) {
    const scored = list.map((p) => [p, searchScore(p, query.q!)] as const).filter(([, s]) => s > 0);
    list = scored.sort((a, b) => b[1] - a[1]).map(([p]) => p);
    if (!query.sort || query.sort === "featured") return list;
  }

  const byPrice = (p: Product) => p.price ?? Number.POSITIVE_INFINITY;
  switch (query.sort ?? "featured") {
    case "newest":
      return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "popular":
      return [...list].sort((a, b) => b.popularity - a.popularity);
    case "price-asc":
      return [...list].sort((a, b) => byPrice(a) - byPrice(b));
    case "price-desc":
      return [...list].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    default:
      return [...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.popularity - a.popularity);
  }
}

export const availabilityLabel: Record<Availability, string> = {
  in_stock: "In stock",
  low_stock: "Only a few left",
  made_to_order: "Made to order",
  out_of_stock: "Currently unavailable",
};

export function priceBounds(list: Product[]) {
  const prices = list.map((p) => p.price).filter((x): x is number => x != null);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

import { getCatalogue } from "@/lib/data/store-catalogue";
import { queryProducts } from "@/lib/data/catalogue";
import { ProductCard } from "@/components/product/ProductCard";
import type { ShopPreset } from "./ShopView";

/**
 * Server-rendered first view of the shop: the real, unfiltered product grid (not a grey
 * skeleton), so products — and their images — appear in the very first HTML even on a
 * slow connection. The interactive <ShopView> (filters, sorting) takes over once loaded.
 */
export async function ShopSkeleton({ preset = {} }: { preset?: ShopPreset }) {
  const products = queryProducts(
    {
      categories: preset.category ? [preset.category] : preset.categories,
      collections: preset.collection ? [preset.collection] : undefined,
      newOnly: preset.newOnly,
      sort: preset.defaultSort,
    },
    await getCatalogue(),
  ).slice(0, 12);
  return (
    <div className="container-luxe pb-28">
      <div className="flex h-14 items-center border-y border-line text-[0.75rem] uppercase tracking-[0.18em] text-stone lg:border-x-0">
        Loading the collection…
      </div>
      <div className="mt-8 grid gap-12 lg:mt-4 lg:grid-cols-[250px_1fr] xl:grid-cols-[270px_1fr] xl:gap-16">
        <div className="hidden space-y-4 lg:block" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse bg-sand" style={{ width: `${60 + ((i * 17) % 35)}%` }} />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:gap-y-16">
          {products.map((p, i) => (
            <li key={p.id}>
              <ProductCard product={p} priority={i < 2} sizes="(min-width: 1280px) 28vw, (min-width: 768px) 33vw, 50vw" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { listProductRows } from "@/lib/repo/products";
import { products as seedProducts } from "./products";
import type { Product } from "./types";

export const CATALOGUE_TAG = "catalogue";

/** Published products, cached and invalidated by the admin whenever a product changes. */
export async function getCatalogue(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOGUE_TAG);
  try {
    return (await listProductRows()).map((r) => r.product);
  } catch (err) {
    console.error("[catalogue] database unavailable, serving bundled sample catalogue", err);
    return seedProducts;
  }
}

export async function getCatalogueProduct(slug: string) {
  return (await getCatalogue()).find((p) => p.slug === slug);
}

export async function getCatalogueProductById(id: string) {
  return (await getCatalogue()).find((p) => p.id === id);
}

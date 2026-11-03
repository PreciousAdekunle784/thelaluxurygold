import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { listProductRows } from "@/lib/repo/products";
import { withTimeout } from "@/lib/db/client";
import { products as seedProducts } from "./products";
import type { Product } from "./types";

export const CATALOGUE_TAG = "catalogue";

/** Published products, cached and invalidated by the admin whenever a product changes. */
export async function getCatalogue(): Promise<Product[]> {
  "use cache";
  cacheTag(CATALOGUE_TAG);
  try {
    const rows = await withTimeout(listProductRows(), 12_000);
    cacheLife("hours");
    return rows.map((r) => r.product);
  } catch (err) {
    // Database unreachable (e.g. wrong DATABASE_URL during a build): serve the bundled
    // catalogue, and check again within minutes rather than hours.
    console.error("[catalogue] database unavailable, serving the bundled starting catalogue:", err instanceof Error ? err.message : err);
    cacheLife("minutes");
    return seedProducts;
  }
}

export async function getCatalogueProduct(slug: string) {
  return (await getCatalogue()).find((p) => p.slug === slug);
}

export async function getCatalogueProductById(id: string) {
  return (await getCatalogue()).find((p) => p.id === id);
}

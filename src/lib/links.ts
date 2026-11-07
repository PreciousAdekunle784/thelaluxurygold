import type { Product } from "@/lib/data/types";

/** Where a product lives: private pieces only ever link inside the Private Collection. */
export function productHref(p: Pick<Product, "slug" | "private">) {
  return p.private ? `/private/product/${p.slug}` : `/product/${p.slug}`;
}

import type { Product } from "@/lib/data/types";

/** Unit price for a product + optional variant, in USD (null = price on request). Shared by client and server. */
export function unitPrice(product: Product, variant?: { name: string; value: string }) {
  if (product.price == null) return null;
  const delta = product.variants?.find((v) => v.name === variant?.name)?.options.find((o) => o.value === variant?.value)?.priceDelta ?? 0;
  return product.price + delta;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/data/types";

interface CatalogueValue {
  products: Product[];
  byId: (id: string) => Product | undefined;
  /** Make private pieces resolvable by id (used by the Private Collection pages, which already passed the access check). */
  addPrivate: (products: Product[]) => void;
}

const CatalogueContext = createContext<CatalogueValue | null>(null);

export function CatalogueProvider({ products, children }: { products: Product[]; children: ReactNode }) {
  // Invited customers: also load the Private Collection, so private pieces work in the bag, wishlist and checkout.
  // The server only answers with a valid private session; the hint cookie just avoids a pointless request.
  const [privateProducts, setPrivateProducts] = useState<Product[]>([]);
  const addPrivate = useCallback(
    (incoming: Product[]) =>
      setPrivateProducts((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        let changed = false;
        for (const p of incoming) {
          if (map.get(p.id) === p) continue;
          map.set(p.id, p);
          changed = true;
        }
        return changed ? [...map.values()] : prev;
      }),
    [],
  );
  useEffect(() => {
    if (!document.cookie.split("; ").some((c) => c === "llg_pc=1")) return;
    let alive = true;
    fetch("/api/private/products", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d: { products?: Product[] }) => alive && d.products?.length && addPrivate(d.products))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [addPrivate]);
  const value = useMemo(() => {
    const all = privateProducts.length ? [...products, ...privateProducts.filter((p) => !products.some((q) => q.id === p.id))] : products;
    const map = new Map(all.map((p) => [p.id, p]));
    // `products` stays the PUBLIC list (shop, search); private pieces are only resolvable by id
    return { products, byId: (id: string) => map.get(id), addPrivate };
  }, [products, privateProducts, addPrivate]);
  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue() {
  const ctx = useContext(CatalogueContext);
  if (!ctx) throw new Error("useCatalogue must be used inside <CatalogueProvider>");
  return ctx;
}

/** Rendered by the Private Collection pages: registers the pieces they show so the bag and wishlist can use them. */
export function RegisterPrivateProducts({ products }: { products: Product[] }) {
  const { addPrivate } = useCatalogue();
  useEffect(() => {
    if (products.length) addPrivate(products);
  }, [products, addPrivate]);
  return null;
}

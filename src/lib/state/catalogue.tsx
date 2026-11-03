"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Product } from "@/lib/data/types";

interface CatalogueValue {
  products: Product[];
  byId: (id: string) => Product | undefined;
}

const CatalogueContext = createContext<CatalogueValue | null>(null);

export function CatalogueProvider({ products, children }: { products: Product[]; children: ReactNode }) {
  const value = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return { products, byId: (id: string) => map.get(id) };
  }, [products]);
  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue() {
  const ctx = useContext(CatalogueContext);
  if (!ctx) throw new Error("useCatalogue must be used inside <CatalogueProvider>");
  return ctx;
}

"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { getProductById } from "@/lib/data/catalogue";
import type { Product } from "@/lib/data/types";
import { usePersistentState } from "./persisted";
import { unitPrice } from "./cart-math";

export interface CartLine {
  key: string;
  productId: string;
  variant?: { name: string; value: string };
  quantity: number;
}

export interface ResolvedLine extends CartLine {
  product: Product;
  unitPriceAED: number | null;
  lineTotalAED: number | null;
}

interface CartContextValue {
  lines: ResolvedLine[];
  count: number;
  subtotalAED: number;
  hasPriceOnRequest: boolean;
  hydrated: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (productId: string, quantity?: number, variant?: CartLine["variant"], opts?: { silent?: boolean }) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const MAX_QTY = 10;

export function lineKey(productId: string, variant?: CartLine["variant"]) {
  return variant ? `${productId}::${variant.name}=${variant.value}` : productId;
}

export { unitPrice };

export function CartProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw, hydrated] = usePersistentState<CartLine[]>("llg.cart.v1", []);
  const [isOpen, setOpen] = useState(false);

  const lines = useMemo<ResolvedLine[]>(
    () =>
      raw.flatMap((l) => {
        const product = getProductById(l.productId);
        if (!product) return [];
        const u = unitPrice(product, l.variant);
        return [{ ...l, product, unitPriceAED: u, lineTotalAED: u == null ? null : u * l.quantity }];
      }),
    [raw],
  );

  const add = useCallback<CartContextValue["add"]>(
    (productId, quantity = 1, variant, opts) => {
      const key = lineKey(productId, variant);
      setRaw((prev) => {
        const found = prev.find((l) => l.key === key);
        if (found) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l));
        return [...prev, { key, productId, variant, quantity: Math.min(MAX_QTY, quantity) }];
      });
      if (!opts?.silent) setOpen(true);
    },
    [setRaw],
  );

  const setQuantity = useCallback(
    (key: string, quantity: number) =>
      setRaw((prev) =>
        quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l)),
      ),
    [setRaw],
  );
  const remove = useCallback((key: string) => setRaw((prev) => prev.filter((l) => l.key !== key)), [setRaw]);
  const clear = useCallback(() => setRaw([]), [setRaw]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotalAED: lines.reduce((n, l) => n + (l.lineTotalAED ?? 0), 0),
      hasPriceOnRequest: lines.some((l) => l.unitPriceAED == null),
      hydrated,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, hydrated, isOpen, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

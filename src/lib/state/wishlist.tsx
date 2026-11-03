"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "./persisted";

interface WishlistValue {
  ids: string[];
  hydrated: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
}

const WishlistContext = createContext<WishlistValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds, hydrated] = usePersistentState<string[]>("llg.wishlist.v1", []);
  const toggle = useCallback((id: string) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), [setIds]);
  const remove = useCallback((id: string) => setIds((p) => p.filter((x) => x !== id)), [setIds]);
  const value = useMemo(() => ({ ids, hydrated, has: (id: string) => ids.includes(id), toggle, remove }), [ids, hydrated, toggle, remove]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}

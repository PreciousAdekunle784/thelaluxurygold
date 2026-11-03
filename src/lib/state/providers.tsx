"use client";

import type { ReactNode } from "react";
import type { Product } from "@/lib/data/types";
import type { Rates } from "@/lib/config/store";
import { CatalogueProvider } from "./catalogue";
import { LazyMotion, MotionConfig } from "framer-motion";
import { CartProvider } from "./cart";
import { CurrencyProvider } from "./currency";
import { WishlistProvider } from "./wishlist";

const loadMotion = () => import("@/lib/motion-features").then((r) => r.default);

export function Providers({ children, products, rates }: { children: ReactNode; products: Product[]; rates: Rates }) {
  return (
    <LazyMotion features={loadMotion}>
    <MotionConfig reducedMotion="user">
      <CatalogueProvider products={products}>
      <CurrencyProvider rates={rates}>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </CurrencyProvider>
      </CatalogueProvider>
    </MotionConfig>
    </LazyMotion>
  );
}

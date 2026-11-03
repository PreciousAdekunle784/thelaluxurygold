"use client";

import type { ReactNode } from "react";
import type { Product } from "@/lib/data/types";
import { CatalogueProvider } from "./catalogue";
import { MotionConfig } from "framer-motion";
import { CartProvider } from "./cart";
import { CurrencyProvider } from "./currency";
import { WishlistProvider } from "./wishlist";

export function Providers({ children, products }: { children: ReactNode; products: Product[] }) {
  return (
    <MotionConfig reducedMotion="user">
      <CatalogueProvider products={products}>
      <CurrencyProvider>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </CurrencyProvider>
      </CatalogueProvider>
    </MotionConfig>
  );
}

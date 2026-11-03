"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { CartProvider } from "./cart";
import { CurrencyProvider } from "./currency";
import { WishlistProvider } from "./wishlist";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <CurrencyProvider>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </CurrencyProvider>
    </MotionConfig>
  );
}

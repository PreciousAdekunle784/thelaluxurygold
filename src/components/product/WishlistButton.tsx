"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/state/wishlist";
import { cx } from "@/lib/format";

export function WishlistButton({ productId, name, className, size = 18, withLabel }: { productId: string; name: string; className?: string; size?: number; withLabel?: boolean }) {
  const { has, toggle, hydrated } = useWishlist();
  const active = hydrated && has(productId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
      className={cx("inline-flex items-center justify-center gap-2 transition-colors duration-300", className)}
    >
      <Heart size={size} strokeWidth={1.3} className={cx("transition-all duration-500", active ? "fill-burgundy stroke-burgundy" : "")} />
      {withLabel && <span className="eyebrow font-semibold">{active ? "Saved to wishlist" : "Add to wishlist"}</span>}
    </button>
  );
}

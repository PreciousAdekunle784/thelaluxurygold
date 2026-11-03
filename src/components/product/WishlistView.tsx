"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/state/wishlist";
import { useCatalogue } from "@/lib/state/catalogue";
import { buttonClass } from "@/components/ui/Button";
import { ProductCard } from "./ProductCard";

export function WishlistView() {
  const { ids, hydrated } = useWishlist();
  const { byId } = useCatalogue();
  const items = ids.map((id) => byId(id)).filter((p): p is NonNullable<typeof p> => !!p);

  if (!hydrated) return <div className="container-luxe grid grid-cols-2 gap-6 pb-28 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[4/5] animate-pulse bg-sand" />)}</div>;

  if (!items.length)
    return (
      <div className="container-luxe flex flex-col items-center pb-32 pt-6 text-center">
        <Heart size={36} strokeWidth={0.9} className="text-champagne" />
        <p className="mt-7 font-display text-4xl">Your wishlist is empty</p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone">Tap the heart on any piece to save it here. Your wishlist is kept on this device.</p>
        <Link href="/shop" className={buttonClass("solid", "lg", "mt-9")}>
          Discover the collection
        </Link>
      </div>
    );

  return (
    <div className="container-luxe pb-28">
      <p className="mb-8 text-[0.75rem] uppercase tracking-[0.18em] text-stone">
        {items.length} saved {items.length === 1 ? "piece" : "pieces"}
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {items.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}

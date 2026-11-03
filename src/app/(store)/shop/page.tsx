import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/shop/PageIntro";
import { ShopView } from "@/components/shop/ShopView";
import { ShopSkeleton } from "@/components/shop/ShopSkeleton";

export const metadata: Metadata = {
  title: "Shop Fine Gold Jewellery",
  description: "Browse 18K–24K gold rings, necklaces, bracelets, earrings and 24K gold bars from LA Luxury Gold, Dubai. Worldwide delivery.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <>
      <PageIntro
        crumbs={[{ name: "Home", href: "/" }, { name: "Shop" }]}
        eyebrow="The collection"
        title={
          <>
            Shop <span className="script">all</span> gold
          </>
        }
        intro="Rings, necklaces, bracelets and earrings in 18K to 22K gold, together with 24K gold bars. Filter by category, purity and price to find a piece made for you."
      />
      <Suspense fallback={<ShopSkeleton />}>
        <ShopView />
      </Suspense>
    </>
  );
}

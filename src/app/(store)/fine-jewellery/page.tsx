import type { Metadata } from "next";
import { ListingPage } from "@/components/shop/ListingPage";
import { jewelleryCategories } from "@/lib/data/categories";

export const metadata: Metadata = {
  title: "Fine Gold Jewellery",
  description: "Rings, necklaces, bracelets, earrings and jewellery sets in 18K, 21K and 22K gold from LA Luxury Gold, Dubai.",
  alternates: { canonical: "/fine-jewellery" },
};

export default function FineJewelleryPage() {
  return (
    <ListingPage
      crumb="Fine jewellery"
      eyebrow="Fine jewellery"
      title={
        <>
          Fine gold <span className="script">jewellery</span>
        </>
      }
      intro="Rings, necklaces, bracelets, earrings and sets in 18K to 22K gold. Filter by purity, size and price to find a piece made for you."
      media="campaign/campaign-editorial"
      alt="Gold rings, a bangle and a cable chain on travertine blocks in late-afternoon window light"
      preset={{ categories: jewelleryCategories }}
    />
  );
}

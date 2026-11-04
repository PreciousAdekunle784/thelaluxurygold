import type { Metadata } from "next";
import { ListingPage } from "@/components/shop/ListingPage";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The newest gold jewellery from LA Luxury Gold, Dubai — rings, necklaces, earrings and jewellery sets in 18K to 22K gold.",
  alternates: { canonical: "/new-arrivals" },
};

export default function NewArrivalsPage() {
  return (
    <ListingPage
      crumb="New arrivals"
      eyebrow="Just arrived"
      title={
        <>
          New <span className="script">arrivals</span>
        </>
      }
      intro="The latest pieces from the house, newest first."
      media="products/soleil-halo-set-2"
      alt="The Soleil Dome Ring and Halo Bangle on folds of burgundy silk"
      preset={{ newOnly: true, defaultSort: "newest" }}
    />
  );
}

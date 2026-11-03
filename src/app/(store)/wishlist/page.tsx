import type { Metadata } from "next";
import { PageIntro } from "@/components/shop/PageIntro";
import { WishlistView } from "@/components/product/WishlistView";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <>
      <PageIntro crumbs={[{ name: "Home", href: "/" }, { name: "Wishlist" }]} title={<>Your <span className="font-light italic normal-case">wishlist</span></>} />
      <WishlistView />
    </>
  );
}

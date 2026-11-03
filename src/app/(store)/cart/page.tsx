import type { Metadata } from "next";
import { PageIntro } from "@/components/shop/PageIntro";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Shopping Bag", robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageIntro crumbs={[{ name: "Home", href: "/" }, { name: "Shopping bag" }]} title={<>Your <span className="font-light italic normal-case">bag</span></>} />
      <CartView />
    </>
  );
}

import type { Metadata } from "next";
import { PageIntro } from "@/components/shop/PageIntro";
import { CheckoutView } from "@/components/cart/CheckoutView";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <PageIntro crumbs={[{ name: "Bag", href: "/cart" }, { name: "Checkout" }]} title={<>Secure <span className="script">checkout</span></>} />
      <CheckoutView />
    </>
  );
}

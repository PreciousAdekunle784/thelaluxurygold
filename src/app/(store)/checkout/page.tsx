import type { Metadata } from "next";
import { PageIntro } from "@/components/shop/PageIntro";
import { CheckoutView } from "@/components/cart/CheckoutView";
import { isPaystackConfigured } from "@/lib/payments/paystack";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  // Online payment is offered only when PAYSTACK_SECRET_KEY is configured on the server.
  const paystack = isPaystackConfigured();
  return (
    <>
      <PageIntro crumbs={[{ name: "Bag", href: "/cart" }, { name: "Checkout" }]} title={<>Secure <span className="script">checkout</span></>} />
      <CheckoutView paystack={paystack} />
    </>
  );
}

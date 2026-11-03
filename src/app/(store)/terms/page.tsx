import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/LegalPage";

export const metadata: Metadata = { title: "Terms & Conditions", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Terms & conditions" title={<>Terms <span className="font-light italic normal-case">& conditions</span></>} intro="The terms that apply when you use this website and order from LA Luxury Gold.">
      <h2>About these terms</h2>
      <p>These terms apply to your use of this website and to orders placed with LA Luxury Gold ([legal entity, trade licence and registered address]).</p>
      <h2>Products & information</h2>
      <p>We take care to describe each piece accurately, including gold purity and weight. Handcrafted pieces may vary slightly, and images are for illustration.</p>
      <h2>Prices</h2>
      <p>Prices are shown in UAE Dirham (AED). Prices of gold products may change in line with the market price of gold; the price confirmed with your order applies. [VAT treatment to be confirmed.]</p>
      <h2>Orders</h2>
      <p>Submitting an order request does not create a binding contract. A contract is formed when we confirm your order and payment is received. We may decline or cancel an order, for example if a piece is unavailable or a price was displayed in error.</p>
      <h2>Payment</h2>
      <p>[Accepted payment methods to be confirmed once the payment gateway is connected.] We may request identification for high-value or gold bullion purchases where required by law.</p>
      <h2>Delivery & risk</h2>
      <p>Delivery is described in our shipping information. Risk passes to you on delivery.</p>
      <h2>Returns</h2>
      <p>Please see our returns & exchange policy.</p>
      <h2>Governing law</h2>
      <p>[Governing law and jurisdiction to be confirmed, e.g. the laws of the Emirate of Dubai and the federal laws of the UAE.]</p>
    </LegalPage>
  );
}

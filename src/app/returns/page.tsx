import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shop/LegalPage";

export const metadata: Metadata = { title: "Returns & Exchanges", description: "LA Luxury Gold's returns and exchange policy for jewellery and gold bars.", alternates: { canonical: "/returns" } };

export default function ReturnsPage() {
  return (
    <LegalPage eyebrow="Returns & exchanges" title={<>Returns <span className="font-light italic normal-case">& exchanges</span></>} intro="We want you to love every piece. If something isn't right, we are here to help.">
      <h2>Eligibility</h2>
      <ul>
        <li>Requests must be made within [number] days of delivery.</li>
        <li>Items must be unworn, in their original condition and packaging, with any documentation supplied.</li>
        <li>Personalised, engraved, resized and made-to-order pieces [are / are not] eligible for return.</li>
        <li>Gold bars, whose value is linked to the market price of gold, are subject to [specific terms].</li>
      </ul>

      <h2>Exchanges</h2>
      <p>Exchanges for a different size or piece are offered [subject to availability and any price difference].</p>

      <h2>How to request a return</h2>
      <p>
        <Link href="/contact">Contact our team</Link> with your order reference. We will confirm eligibility and arrange insured collection or return shipping. [Who pays return shipping to be confirmed.]
      </p>

      <h2>Refunds</h2>
      <p>Once your return has been received and inspected, approved refunds are issued to the original payment method within [timeframe].</p>

      <h2>Your statutory rights</h2>
      <p>This policy does not affect your statutory rights under applicable consumer protection laws.</p>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shop/LegalPage";

export const metadata: Metadata = { title: "Returns & Exchanges", description: "LA Luxury Gold's returns and exchange policy for jewellery and gold bars.", alternates: { canonical: "/returns" } };

export default function ReturnsPage() {
  return (
    <LegalPage eyebrow="Returns & exchanges" title={<>Returns <span className="script">& exchanges</span></>} intro="We want you to love every piece. If something isn't right, we are here to help.">
      <h2>Returns within 14 days</h2>
      <p>You may return jewellery within 14 days of delivery for a refund or exchange, provided that:</p>
      <ul>
        <li>the piece is unworn, undamaged and in the condition you received it;</li>
        <li>it is returned in its original box and packaging, with any certificate, receipt or documentation supplied;</li>
        <li>you contact us before sending anything back, so we can arrange a safe, insured return.</li>
      </ul>

      <h2>Items that cannot be returned</h2>
      <ul>
        <li>Made-to-order, resized, engraved and personalised pieces, which are crafted to your specification.</li>
        <li>Earrings for pierced ears, for hygiene reasons, unless they are faulty.</li>
        <li>
          Gold bars and bullion. Their price is fixed to the gold market at the time of sale, so they cannot be returned for a refund once your order is confirmed
          and paid. If you would like to sell a bar back to us, speak to our team — we will gladly quote a buy-back price based on the market on the day.
        </li>
      </ul>

      <h2>Exchanges</h2>
      <p>
        Need a different size or would prefer another piece? We are happy to exchange eligible items within 14 days of delivery, subject to availability. If the
        new piece costs more, we will ask you to pay the difference; if it costs less, we will refund it.
      </p>

      <h2>Damaged or faulty items</h2>
      <p>
        Please check your parcel on arrival. If anything is damaged or not as described, contact us within 48 hours of delivery with your order reference and a few
        photos. We will arrange collection at our cost and repair, replace or refund the piece. This does not affect any rights you have under consumer law.
      </p>

      <h2>How to request a return</h2>
      <ol>
        <li>
          <Link href="/contact">Contact our team</Link> or message us on WhatsApp with your order reference and the reason for your return.
        </li>
        <li>We will confirm whether the piece is eligible and arrange insured collection or tell you how to send it back safely.</li>
        <li>Once the piece arrives, our team inspects it — usually within two business days — and lets you know the outcome.</li>
      </ol>
      <p>
        Return delivery for change-of-mind returns is paid by you; we cover it for faulty or incorrect items. Please do not send gold through ordinary post — always
        use the insured method we arrange or agree with you.
      </p>

      <h2>Refunds</h2>
      <p>
        Approved refunds are made to the original payment method, in the currency you paid, within 10 business days of inspection. Original delivery charges are
        refunded only when the item was faulty or incorrect. Your bank may take a few extra days to show the refund.
      </p>
    </LegalPage>
  );
}

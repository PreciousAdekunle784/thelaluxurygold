import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shop/LegalPage";

export const metadata: Metadata = { title: "Terms & Conditions", description: "The terms that apply when you use the LA Luxury Gold website and order from us.", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Terms & conditions" title={<>Terms <span className="script">& conditions</span></>} intro="The terms that apply when you use this website and order from LA Luxury Gold.">
      <h2>1. About these terms</h2>
      <p>
        These terms apply to your use of this website and to every order placed with LA Luxury Gold, a jewellery house based in Dubai, United Arab Emirates
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By placing an order you confirm that you are at least 18 years old and that you accept these terms. Please read them
        together with our <Link href="/shipping">shipping information</Link>, <Link href="/returns">returns & exchange policy</Link> and{" "}
        <Link href="/privacy">privacy policy</Link>.
      </p>

      <h2>2. Our products</h2>
      <p>
        We describe every piece as accurately as we can, including its gold purity (karat) and, where stated, its weight. Our jewellery is finished by hand, so
        small variations in weight, size and finish are natural. Photographs are styled to show each piece at its best; colours can look slightly different
        depending on your screen.
      </p>

      <h2>3. Prices & currency</h2>
      <p>
        Prices are set in US dollars (USD). Shoppers can also view prices in Nigerian naira (NGN); naira amounts are converted at our current exchange rate and
        rounded, and are shown for convenience. The amount you pay is the one confirmed by our team with your order.
      </p>
      <p>
        Because gold is traded daily, the price of gold bars and heavier pieces may move with the market. If the price of a piece has changed between your order
        request and our confirmation, we will tell you the updated price before you pay, and you are free to cancel. Delivery charges, and any import duties or
        taxes in your country, are not included in product prices unless we say otherwise.
      </p>

      <h2>4. Placing an order</h2>
      <p>
        When you submit an order on this website you are sending us an order request — no payment is taken at that stage. Our team will contact you, usually
        within one business day, to confirm availability, the final price, delivery and payment. A contract between us is formed only when we confirm your order
        and receive your payment in full.
      </p>
      <p>
        We may decline or cancel an order before it is confirmed — for example if a piece is no longer available, a price was shown in error, or we are unable to
        verify the order. If you have already paid, we will refund you in full.
      </p>

      <h2>5. Payment</h2>
      <p>
        Payment is arranged directly with our team once your order is confirmed, using a method agreed with you. We never ask for card details over WhatsApp,
        email or telephone. Pieces are reserved for you for a limited time after confirmation while payment is completed.
      </p>
      <p>
        For high-value purchases and gold bullion we may ask for proof of identity and, where required, information about the source of funds. This is a legal
        requirement for dealers in precious metals and helps protect you and us against fraud.
      </p>

      <h2>6. Made-to-order & personalised pieces</h2>
      <p>
        Pieces marked as made to order are crafted for you after payment. We will confirm the expected preparation time with your order. Because they are made to
        your specification, made-to-order, resized, engraved and personalised pieces cannot be cancelled once production has started, except where they are
        faulty.
      </p>

      <h2>7. Delivery & ownership</h2>
      <p>
        Every order is sent with insured, tracked delivery and requires a signature. Responsibility for the parcel passes to you when it is delivered and signed for.
        Ownership of the goods passes to you once we have received payment in full. Please see our <Link href="/shipping">shipping information</Link> for details.
      </p>

      <h2>8. Returns & faulty items</h2>
      <p>
        Our <Link href="/returns">returns & exchange policy</Link> explains how to return or exchange a piece. If an item arrives damaged or faulty, contact us
        within 48 hours of delivery and we will put it right.
      </p>

      <h2>9. Our responsibility to you</h2>
      <p>
        We are responsible for loss or damage you suffer that is a foreseeable result of us breaking these terms. We are not responsible for loss that is not
        foreseeable, for business losses, or for delays caused by events outside our reasonable control (such as courier disruption or customs inspections).
        Nothing in these terms limits any rights you have under consumer protection law.
      </p>

      <h2>10. Website content</h2>
      <p>
        All photographs, films, designs, text and the LA Luxury Gold name and logo on this website belong to LA Luxury Gold and may not be copied or used without
        our written permission.
      </p>

      <h2>11. Changes to these terms</h2>
      <p>We may update these terms from time to time. The version shown on this page when you place your order is the one that applies to it.</p>

      <h2>12. Governing law</h2>
      <p>
        These terms are governed by the laws of the Emirate of Dubai and the federal laws of the United Arab Emirates. If a dispute arises, please contact us first —
        most concerns can be resolved quickly and personally. If we cannot resolve it together, the courts of Dubai will have jurisdiction, without affecting any
        right you may have to bring a claim in the country where you live.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these terms or your order? <Link href="/contact">Contact our team</Link> — we usually respond fastest on WhatsApp.
      </p>
    </LegalPage>
  );
}

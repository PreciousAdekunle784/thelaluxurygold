import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shop/LegalPage";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Returns & Exchanges", description: "How to ask LA Luxury Gold about returns and exchanges.", alternates: { canonical: "/returns" } };

export default function ReturnsPage() {
  return (
    <LegalPage eyebrow="Returns & exchanges" title={<>Returns <span className="script">& exchanges</span></>} intro="If you have a question about returning or exchanging a piece, our team is here to help.">
      <h2>Our policy</h2>
      <p>
        LA Luxury Gold does not offer a standard return period. If you would like to know whether a particular piece could be returned or exchanged, please{" "}
        <Link href="/contact">contact our team</Link> before you order and we will tell you what is possible for that piece.
      </p>

      <h2>If something isn&rsquo;t right with your order</h2>
      <p>
        Please contact us as soon as possible after delivery with your order reference and a few photos, and our team will look into it with you. Please do not send
        anything back without speaking to us first.
      </p>

      <h2>Contact us</h2>
      <p>
        The quickest way to reach us is on{" "}
        <a href={whatsappLink("Hello LA Luxury Gold, I have a question about returns or exchanges.")} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        , or through the <Link href="/contact">contact page</Link>.
      </p>

      <h2>Your statutory rights</h2>
      <p>Nothing on this page affects any rights you have under the consumer law that applies to you.</p>
    </LegalPage>
  );
}

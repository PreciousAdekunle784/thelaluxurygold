import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shop/LegalPage";
import { shippingMethods } from "@/lib/config/store";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Shipping & Delivery", description: "Insured UAE and international delivery from Dubai, with information on customs, duties and taxes.", alternates: { canonical: "/shipping" } };

export default function ShippingPage() {
  return (
    <LegalPage eyebrow="Shipping & delivery" title={<>Shipping <span className="script">& delivery</span></>} intro="Every LA Luxury Gold order is dispatched from Dubai with insured, tracked delivery — within the UAE and worldwide.">
      <h2>Delivery options</h2>
      <ul>
        {shippingMethods.map((m) => (
          <li key={m.id}>
            <strong>{m.label}</strong> — {m.description} Rate: {m.rateAED == null ? "[confirmed at checkout / by our team]" : formatMoney(m.rateAED)}. Timeline: {m.estimate ?? "[to be confirmed]"}.
          </li>
        ))}
      </ul>
      <p>Shipping rates and timelines are managed in the store settings and shown at checkout once configured.</p>

      <h2>Processing</h2>
      <p>Orders are confirmed by our team before dispatch. Made-to-order and personalised pieces require additional preparation time, which is confirmed with your order. [Standard processing time to be confirmed.]</p>

      <h2>International customs, duties and taxes</h2>
      <p>International shipments may be subject to import duties, taxes (such as VAT/GST) and customs clearance procedures in the destination country. These charges are set by local authorities, are not included in our prices and are payable by the recipient unless stated otherwise at checkout.</p>
      <p>Some countries apply specific rules to the import of precious metals and gold bullion. Please check local regulations before ordering; our team is happy to help with documentation where possible.</p>

      <h2>Insurance & signature</h2>
      <p>Shipments are insured in transit and require a signature on delivery. Please inspect your parcel on arrival and contact us immediately if packaging appears damaged.</p>

      <h2>Questions</h2>
      <p>
        For delivery questions, <Link href="/contact">contact our team</Link> — we usually respond fastest on WhatsApp.
      </p>
    </LegalPage>
  );
}

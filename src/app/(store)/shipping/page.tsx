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
            <strong>{m.label}</strong> — {m.description} {m.rate != null && <>Rate: {formatMoney(m.rate)}. </>}
            {m.estimate && <>Usually {m.estimate}.</>}
          </li>
        ))}
      </ul>
      <p>
        Delivery charges depend on the destination and the value of your order, because every parcel is fully insured. Our team confirms the delivery charge and
        expected delivery date with you before you pay.
      </p>

      <h2>Processing & delivery times</h2>
      <p>
        Pieces in stock are usually dispatched within 1–2 business days of payment. Within the UAE most orders arrive 1–3 business days after dispatch;
        international express deliveries — including to Nigeria — usually take 3–7 business days, depending on customs clearance. Made-to-order and personalised
        pieces need additional preparation time, which we confirm with your order.
      </p>

      <h2>Tracking</h2>
      <p>Once your order has been dispatched we will send you the tracking details so you can follow it all the way to your door.</p>

      <h2>International customs, duties and taxes</h2>
      <p>
        International shipments may be subject to import duties, taxes (such as VAT/GST) and customs clearance procedures in the destination country. These charges
        are set by local authorities, are not included in our prices and are payable by the recipient unless we have agreed otherwise with you.
      </p>
      <p>
        Some countries apply specific rules to the import of precious metals and gold bullion. Please check local regulations before ordering; our team is happy to
        help with invoices and documentation for customs.
      </p>

      <h2>Insurance & signature</h2>
      <p>
        Shipments are insured in transit and require a signature on delivery — we cannot leave parcels unattended or with a neighbour. Please inspect your parcel on
        arrival and contact us within 48 hours if anything is wrong, or straight away if the packaging appears damaged.
      </p>

      <h2>Questions</h2>
      <p>
        For delivery questions, <Link href="/contact">contact our team</Link> — we usually respond fastest on WhatsApp.
      </p>
    </LegalPage>
  );
}

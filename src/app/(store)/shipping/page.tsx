import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shop/LegalPage";
import { shippingMethods } from "@/lib/config/store";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Shipping & Delivery", description: "Delivery from Dubai within the UAE and internationally, with information on customs, duties and taxes.", alternates: { canonical: "/shipping" } };

export default function ShippingPage() {
  return (
    <LegalPage eyebrow="Shipping & delivery" title={<>Shipping <span className="script">& delivery</span></>} intro="LA Luxury Gold delivers from Dubai, within the UAE and internationally.">
      <h2>Delivery options</h2>
      <ul>
        {shippingMethods.map((m) => (
          <li key={m.id}>
            <strong>{m.label}</strong> — {m.description} {m.rate != null && <>Rate: {formatMoney(m.rate)}. </>}
          </li>
        ))}
      </ul>
      <p>
        The delivery charge and expected timeline for your destination are confirmed by our team with your order. If you need a piece by a particular date,
        please <Link href="/contact">contact us</Link> before ordering.
      </p>

      <h2>Following your order</h2>
      <p>
        You can check the status of your order at any time on the <Link href="/account">track your order</Link> page, using your order reference and email address.
      </p>

      <h2>International customs, duties and taxes</h2>
      <p>
        International shipments may be subject to import duties, taxes (such as VAT/GST) and customs clearance procedures in the destination country. These charges
        are set by local authorities, are not included in our prices and are payable by the recipient unless we have agreed otherwise with you.
      </p>
      <p>
        Some countries apply specific rules to the import of precious metals and gold bullion. Please check local regulations before ordering; our team can help with
        invoices and documentation for customs.
      </p>

      <h2>Questions</h2>
      <p>
        For delivery questions, <Link href="/contact">contact our team</Link> — we usually respond fastest on WhatsApp.
      </p>
    </LegalPage>
  );
}

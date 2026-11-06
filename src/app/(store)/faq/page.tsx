import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/shop/PageIntro";
import { AccordionItem } from "@/components/ui/Accordion";

export const metadata: Metadata = { title: "Frequently Asked Questions", description: "Answers about gold purity, sizing, delivery, payment and care for LA Luxury Gold pieces.", alternates: { canonical: "/faq" } };

const faqs: { q: string; a: React.ReactNode }[] = [
  { q: "What gold purities do you offer?", a: "Our jewellery is offered in 18K, 21K and 22K gold, and our gold bars are 24K. The purity is shown on every product page and in your order summary." },
  { q: "What is the difference between 18K, 21K, 22K and 24K?", a: "Karat describes how much of the metal is pure gold: 24K is pure gold, 22K is about 91.6% gold, 21K about 87.5% and 18K about 75%. Lower karats are alloyed with other metals, which makes them harder and more durable for everyday jewellery; higher karats have a richer colour." },
  { q: "How do I find my ring size?", a: "Each ring lists the sizes available. If you are unsure, message us on WhatsApp and we will guide you through measuring at home." },
  { q: "Do you deliver internationally?", a: <>Yes — we deliver within the UAE and internationally, including Nigeria. The delivery charge and timeline are confirmed with your order, and import duties and taxes may apply on arrival. See <Link href="/shipping" className="underline underline-offset-4">shipping information</Link>.</> },
  { q: "How do I pay?", a: "At checkout you can pay straight away through Paystack's secure payment page — by card, bank transfer or USSD — or choose to confirm your order with our team first, who will arrange payment with you directly. Pieces priced on request are always confirmed with our team. We never ask for card details over WhatsApp, email or telephone." },
  { q: "Which currency are prices shown in?", a: "Prices are set in US dollars (USD). You can switch to Nigerian naira (NGN) at any time using the currency selector at the top of the page or in the menu; naira prices are converted at our current exchange rate. The amount you pay is the one our team confirms with your order." },
  { q: "How should I care for my gold jewellery?", a: "Store pieces separately in a soft pouch, remove them before swimming, exercising or using cleaning products, and clean gently with warm water, mild soap and a soft cloth." },
  { q: "Why can the price of gold bars change?", a: "Gold is traded daily, so the price of gold bars and heavier pieces follows the market. If a price changes between your order and our confirmation, we will tell you before you pay." },
  { q: "Can I return or exchange a piece?", a: <>We don&rsquo;t offer a standard return period. If you have a question about returning or exchanging a piece, please <Link href="/contact" className="underline underline-offset-4">contact our team</Link> before ordering.</> },
];

export default function FaqPage() {
  return (
    <>
      <PageIntro crumbs={[{ name: "Home", href: "/" }, { name: "FAQ" }]} eyebrow="Customer care" title={<>Questions <span className="script">& answers</span></>} />
      <section className="container-luxe max-w-3xl pb-28">
        {faqs.map((f, i) => (
          <AccordionItem key={f.q} title={f.q} defaultOpen={i === 0}>
            {f.a}
          </AccordionItem>
        ))}
        <p className="mt-10 text-sm text-stone">
          Can&rsquo;t find your answer? <Link href="/contact" className="underline underline-offset-4">Contact us</Link>.
        </p>
      </section>
    </>
  );
}

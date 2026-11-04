import Link from "next/link";
import { BadgeCheck, CreditCard, MessageCircle, PackageCheck, Quote, RotateCcw } from "lucide-react";
import { MediaImage } from "@/components/ui/MediaImage";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { store } from "@/lib/config/store";

/* Every statement here mirrors the published policies (shipping, returns, terms, FAQ). */
export function ClientConfidence({ reviews }: { reviews: number }) {
  const items = [
    {
      icon: BadgeCheck,
      title: "Purity, stated clearly",
      copy: "Each piece lists its karat — and its weight where we give one — on the product page and in your order summary.",
      href: "/faq",
      link: "About gold purity",
    },
    {
      icon: PackageCheck,
      title: "Insured, tracked delivery",
      copy: "Dispatched from Dubai with insurance, tracking and signature on delivery — within the UAE and worldwide.",
      href: "/shipping",
      link: "Shipping & delivery",
    },
    {
      icon: RotateCcw,
      title: "14-day returns",
      copy: "Unworn jewellery can be returned or exchanged within 14 days of delivery. Made-to-order pieces and gold bars excepted.",
      href: "/returns",
      link: "Returns & exchanges",
    },
    {
      icon: CreditCard,
      title: "Payment, personally confirmed",
      copy: "No payment is taken online. Our team confirms price, delivery and payment with you — and never asks for card details by message.",
      href: "/terms",
      link: "Terms of sale",
    },
    {
      icon: MessageCircle,
      title: "Personal assistance",
      copy: `Speak with our team on WhatsApp (${store.contact.whatsapp.display}) for sizing, availability or a piece you have in mind.`,
      href: "/contact",
      link: "Contact us",
    },
    ...(reviews > 0
      ? [{ icon: Quote, title: "In our clients' words", copy: "Read what clients have shared with us about their pieces and their experience.", href: "#testimonials", link: "Client reviews" }]
      : []),
  ];

  return (
    <section className="bg-white py-24 md:py-36" aria-labelledby="confidence">
      <div className="container-luxe grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <Reveal>
            <p className="eyebrow mb-6 flex items-center gap-3 text-champagne">
              <span className="h-px w-8 bg-current" /> With confidence
            </p>
            <h2 id="confidence" className="display text-[2.5rem] uppercase sm:text-5xl lg:text-[3.6rem]">
              Buying gold, <span className="script">simply</span>
            </h2>
          </Reveal>
          <ImageReveal className="relative mt-12 aspect-[4/5] overflow-hidden bg-sand max-lg:hidden" delay={0.1}>
            <MediaImage mediaKey="details/premium-packaging" alt="A signet ring in an open burgundy presentation box lined with ivory satin" sizes="30vw" className="object-cover" />
          </ImageReveal>
        </div>
        <ul className="grid gap-px self-start border border-line bg-line sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
          {items.map((it, i) => (
            <Reveal as="li" key={it.title} delay={(i % 2) * 0.08} className="flex flex-col bg-white p-8 sm:[&:last-child:nth-child(odd)]:col-span-2 md:p-10">
              <it.icon size={26} strokeWidth={1} className="text-champagne" aria-hidden />
              <h3 className="mt-7 font-display text-[1.6rem] leading-[1.1]">{it.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-stone">{it.copy}</p>
              <Link href={it.href} className="mt-7 self-start border-b border-line pb-1 text-[0.66rem] font-semibold uppercase tracking-[0.2em] transition-colors hover:border-ink">
                {it.link}
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

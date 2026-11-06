import Link from "next/link";
import { BadgeCheck, CreditCard, MessageCircle, Truck } from "lucide-react";
import { whatsappLink, defaultWhatsappMessage } from "@/lib/whatsapp";

/* A slim service strip — one line each, every point consistent with the published policies. */
export function ClientConfidence(_: { reviews?: number }) {
  const items = [
    { icon: BadgeCheck, title: "Purity stated on every piece", href: "/faq" },
    { icon: Truck, title: "Delivery in the UAE & worldwide", href: "/shipping" },
    { icon: CreditCard, title: "Secure checkout & payment", href: "/terms" },
    { icon: MessageCircle, title: "Personal help on WhatsApp", href: whatsappLink(defaultWhatsappMessage), external: true },
  ];
  return (
    <section className="border-y border-line bg-white" aria-label="Our service">
      <ul className="container-luxe grid grid-cols-2 lg:grid-cols-4">
        {items.map((it) => {
          const inner = (
            <>
              <it.icon size={22} strokeWidth={1} className="shrink-0 text-champagne" aria-hidden />
              <span className="text-[0.7rem] font-semibold uppercase leading-snug tracking-[0.14em] md:text-[0.74rem]">{it.title}</span>
            </>
          );
          const cls = "flex h-full items-center gap-4 px-2 py-7 transition-colors hover:text-champagne md:px-6 md:py-9";
          return (
            <li key={it.title} className="border-line [&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0">
              {it.external ? (
                <a href={it.href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {inner}
                </a>
              ) : (
                <Link href={it.href} className={cls}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

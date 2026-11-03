import Link from "next/link";
import { Logo, Monogram } from "@/components/brand/Logo";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { socialIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { footerNav } from "@/lib/navigation";
import { store } from "@/lib/config/store";
import { whatsappLink, defaultWhatsappMessage } from "@/lib/whatsapp";

function Column({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="eyebrow mb-6 text-gold-pale">{title}</p>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[0.88rem] text-ivory/75 transition-colors duration-300 hover:text-ivory">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-forest text-ivory">
      <Monogram tone="ivory" className="pointer-events-none absolute -right-20 -top-10 h-[540px] w-auto opacity-[0.05]" />
      <div className="container-luxe relative">
        <div className="grid gap-14 border-b border-line-light py-16 md:py-24 lg:grid-cols-[1.3fr_1fr] lg:gap-24">
          <div>
            <Logo tone="ivory" className="text-[15px]" />
            <p className="mt-8 max-w-md text-[0.92rem] leading-relaxed text-ivory/70">
              A Dubai jewellery house offering authentic 18K–24K gold jewellery and 24K gold bars — timeless pieces worth owning and cherishing,
              delivered worldwide.
            </p>
            <div className="mt-8 flex items-center gap-5">
              {store.social.links.map((s) => {
                const Icon = socialIcon[s.name];
                return (
                  <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`LA Luxury Gold on ${s.name}`} className="text-ivory/70 transition-colors hover:text-gold">
                    <Icon width={19} height={19} />
                  </a>
                );
              })}
              <span className="text-[0.72rem] tracking-[0.18em] text-ivory/50">{store.social.handle}</span>
            </div>
          </div>
          <div>
            <p className="display text-[2rem] uppercase leading-none md:text-[2.4rem]">A little luxury in your inbox</p>
            <p className="mb-6 mt-4 text-sm text-ivory/65">New collections, exclusive releases and special updates.</p>
            <NewsletterForm tone="ivory" source="footer" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-12 py-14 md:grid-cols-4 md:py-20">
          <Column title="Shop" links={footerNav.shop} />
          <Column title="Customer care" links={footerNav.service} />
          <Column title="The house" links={footerNav.house} />
          <div>
            <p className="eyebrow mb-6 text-gold-pale">Contact</p>
            <ul className="space-y-3 text-[0.88rem] text-ivory/75">
              {store.contact.phones.map((p) => (
                <li key={p.href}>
                  <a href={p.href} className="hover:text-ivory">
                    <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">{p.label}</span>
                    {p.display}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <a href={whatsappLink(defaultWhatsappMessage)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-ivory">
                  <WhatsAppIcon width={17} height={17} /> WhatsApp us
                </a>
              </li>
              <li className="text-ivory/55">{store.location}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line-light py-8 text-[0.72rem] text-ivory/50 md:flex-row md:items-center md:justify-between">
          <p>© {2026} LA Luxury Gold. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {footerNav.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-ivory">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shipping" className="hover:text-ivory">
                Shipping information
              </Link>
            </li>
            <li>
              <Link href="/returns" className="hover:text-ivory">
                Returns & exchanges
              </Link>
            </li>
          </ul>
          <p className="uppercase tracking-[0.2em]">{store.sampleMode ? "Preview · sample products & prices" : "Prices shown in AED"}</p>
        </div>
      </div>
    </footer>
  );
}

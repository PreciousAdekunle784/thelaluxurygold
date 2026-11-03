import type { Metadata } from "next";
import { PageIntro } from "@/components/shop/PageIntro";
import { ContactForm } from "@/components/forms/ContactForm";
import { WhatsAppIcon, socialIcon } from "@/components/ui/Icons";
import { store } from "@/lib/config/store";
import { whatsappLink, defaultWhatsappMessage } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact LA Luxury Gold in Dubai by WhatsApp, telephone or message — our team is here to help with jewellery, gold bars and orders.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageIntro
        crumbs={[{ name: "Home", href: "/" }, { name: "Contact" }]}
        eyebrow="Client services"
        title={<>We&rsquo;re here <span className="script">to help</span></>}
        intro="Whether you are choosing a gift, sizing a ring or asking about gold bars, our team will be glad to assist."
      />
      <section className="container-luxe grid gap-16 pb-28 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-10 lg:col-span-4">
          <a href={whatsappLink(defaultWhatsappMessage)} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between bg-forest p-7 text-ivory transition-colors hover:bg-forest-deep">
            <span>
              <span className="eyebrow text-gold-pale">Fastest response</span>
              <span className="mt-2 block font-display text-3xl">Chat on WhatsApp</span>
              <span className="mt-1 block text-sm text-ivory/70">{store.contact.whatsapp.display}</span>
            </span>
            <WhatsAppIcon width={30} height={30} className="transition-transform duration-500 group-hover:scale-110" />
          </a>
          <div>
            <p className="eyebrow mb-5 font-semibold">Telephone</p>
            <ul className="space-y-4">
              {store.contact.phones.map((p) => (
                <li key={p.href} className="flex items-baseline justify-between border-b border-line pb-4">
                  <span className="text-sm text-stone">{p.label}</span>
                  <a href={p.href} className="font-display text-xl hover:text-champagne">{p.display}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-5 font-semibold">Follow {store.social.handle}</p>
            <ul className="flex flex-wrap gap-3">
              {store.social.links.map((s) => {
                const Icon = socialIcon[s.name];
                return (
                  <li key={s.name}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-line px-4 py-2.5 text-xs transition-colors hover:border-ink">
                      <Icon width={15} height={15} /> {s.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="text-sm leading-relaxed text-stone">Based in {store.location}. Serving clients worldwide with insured international delivery.</p>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <p className="eyebrow mb-8 font-semibold">Send us a message</p>
          <ContactForm />
        </div>
      </section>
    </>
  );
}

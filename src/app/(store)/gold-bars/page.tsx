import type { Metadata } from "next";
import { queryProducts } from "@/lib/data/catalogue";
import { getCatalogue } from "@/lib/data/store-catalogue";
import { MediaImage } from "@/components/ui/MediaImage";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { Breadcrumbs } from "@/components/shop/PageIntro";
import { AccordionItem } from "@/components/ui/Accordion";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "24K Gold Bars",
  description: "Explore 24K minted and cast gold bars from LA Luxury Gold, Dubai — a timeless way to own a piece of enduring value. Delivered worldwide.",
  alternates: { canonical: "/gold-bars" },
};

export default async function GoldBarsPage() {
  const bars = queryProducts({ categories: ["gold-bars"], sort: "price-asc" }, await getCatalogue());
  return (
    <>
      <section className="relative overflow-hidden bg-emerald-deep text-ivory">
        <div className="grid min-h-[620px] lg:grid-cols-2">
          <div className="container-luxe flex flex-col justify-center py-16 lg:py-24 lg:pr-16">
            <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Gold Bars" }]} />
            <Reveal className="mt-14 max-w-xl xl:ml-[8%]">
              <p className="eyebrow mb-6 text-gold">24K gold bars</p>
              <h1 className="display text-[3rem] uppercase sm:text-6xl lg:text-[5.2rem]">
                Own something <span className="script text-gold-pale">that lasts.</span>
              </h1>
              <p className="mt-8 max-w-md text-[1rem] leading-[1.85] text-ivory/70">
                Explore our collection of 24K gold bars. A timeless way to own a piece of enduring value — for yourself, for the next generation,
                or as a gift that endures.
              </p>
            </Reveal>
          </div>
          <div className="relative min-h-[360px]">
            <MediaImage mediaKey="campaign/gold-bars-wide" alt="A 24K cast gold bar beside minted bars of several weights, reflected on polished obsidian" priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[38%_55%]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,#0e3326_0%,transparent_30%)] lg:bg-[linear-gradient(90deg,#0e3326_0%,transparent_30%)]" />
          </div>
        </div>
      </section>

      <section className="container-luxe py-20 md:py-28" aria-labelledby="bars">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 id="bars" className="display text-4xl uppercase md:text-5xl">
            The <span className="script">bars</span>
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-stone">Minted bars with a polished, engraved face, and traditionally cast bars. Larger weights are available on request.</p>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-5">
          {bars.map((p, i) => (
            <li key={p.id}>
              <ProductCard product={p} priority={i < 2} sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw" />
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line bg-linen py-20 md:py-28">
        <div className="container-luxe grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-5 text-champagne">Good to know</p>
            <h2 className="display text-4xl uppercase md:text-5xl">
              Buying <span className="script">gold bars</span>
            </h2>
            <a href={whatsappLink("Hello LA Luxury Gold, I would like to ask about your 24K gold bars.")} target="_blank" rel="noopener noreferrer" className="mt-10 inline-flex h-14 items-center gap-3 bg-ink px-8 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-ivory transition-colors hover:bg-forest">
              <WhatsAppIcon width={18} height={18} /> Speak with our team
            </a>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <AccordionItem title="What purity are the bars?" defaultOpen>
              All gold bars in our collection are 24K gold. The exact fineness and any accompanying documentation are listed on each product page once
              confirmed for that bar.
            </AccordionItem>
            <AccordionItem title="How are prices set?">
              Gold bar prices are linked to the market price of gold and may change. The price shown, or confirmed by our team for bars priced on
              request, applies to your order at the time it is confirmed.
            </AccordionItem>
            <AccordionItem title="How are bars delivered?">
              Bars are dispatched from Dubai; the delivery charge and timeline are confirmed with your order. International shipments may be subject to customs
              declarations, import duties and local regulations for precious metals in the destination country.
            </AccordionItem>
            <AccordionItem title="Is this investment advice?">
              No. The value of gold can go down as well as up, and past performance is not a reliable indicator of future results. Please seek
              independent financial advice before making investment decisions.
            </AccordionItem>
          </div>
        </div>
      </section>
    </>
  );
}

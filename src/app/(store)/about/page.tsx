import type { Metadata } from "next";
import { MediaImage } from "@/components/ui/MediaImage";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/shop/PageIntro";
import { Monogram } from "@/components/brand/Logo";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";

export const metadata: Metadata = {
  title: "About Us",
  description: "LA Luxury Gold is a Dubai-based luxury jewellery house offering authentic 18K–24K gold jewellery and 24K gold bars, with worldwide delivery.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="container-luxe pt-10 md:pt-14">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "About us" }]} />
        <Reveal className="mx-auto mt-16 max-w-4xl text-center md:mt-24">
          <Monogram className="mx-auto h-20 w-auto" />
          <p className="eyebrow mt-10 text-champagne">The house of LA Luxury Gold</p>
          <h1 className="display mt-6 text-[3rem] uppercase sm:text-6xl lg:text-[5.6rem]">
            More than gold. <span className="script">A legacy.</span>
          </h1>
        </Reveal>
      </section>

      <section className="container-luxe mt-16 md:mt-24">
        <ImageReveal className="relative aspect-[4/5] overflow-hidden bg-forest sm:aspect-[16/9] lg:aspect-[21/9]">
          <MediaImage mediaKey="editorial/hero" alt="Gold jewellery and a gold bar arranged on travertine plinths" priority sizes="100vw" className="object-cover object-[65%_50%]" />
        </ImageReveal>
      </section>

      <section className="container-luxe grid gap-14 py-24 md:py-36 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow text-champagne">Who we are</p>
          <h2 className="display mt-5 text-4xl uppercase md:text-5xl">A jewellery house <span className="script">in Dubai</span></h2>
        </Reveal>
        <Reveal delay={0.1} className="space-y-6 text-[1.05rem] leading-[1.9] text-ink/75 lg:col-span-6 lg:col-start-7">
          <p>
            LA Luxury Gold is a luxury jewellery brand based in Dubai, offering beautiful, authentic gold jewellery and premium gold products. We
            specialise in 18K–24K gold, featuring elegant rings, necklaces, bracelets, earrings and 24K gold bars.
          </p>
          <p>
            Our mission is to make quality gold accessible while providing exceptional products and customer service. Whether you are shopping for
            yourself, buying a gift or investing in gold, LA Luxury Gold offers timeless pieces worth owning and cherishing.
          </p>
          <p>We serve customers around the world with international delivery from Dubai.</p>
        </Reveal>
      </section>

      <section className="bg-burgundy text-ivory">
        <div className="grid lg:grid-cols-2">
          <div className="relative aspect-square lg:aspect-auto lg:min-h-[720px]">
            <MediaImage mediaKey="editorial/story" alt="Stacked gold rings on a travertine block" sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="container-luxe flex items-center py-20 lg:px-20">
            <Reveal className="max-w-lg">
              <p className="eyebrow text-gold-pale">What we believe</p>
              <p className="display mt-6 text-[2.2rem] font-light leading-[1.15] md:text-[2.8rem]">
                Gold represents milestones, memories, love and lasting value. Every piece should be worth keeping — and worth passing on.
              </p>
              <ul className="mt-12 space-y-5 border-t border-line-light pt-10 text-[0.95rem] text-ivory/80">
                <li><span className="font-display text-2xl text-gold-pale">Quality</span> — gold you can trust, with purity stated for every piece.</li>
                <li><span className="font-display text-2xl text-gold-pale">Authenticity</span> — honest, clear information about what you buy.</li>
                <li><span className="font-display text-2xl text-gold-pale">Elegance</span> — timeless design over passing trends.</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <WhyChooseUs />

      <section className="container-luxe flex flex-col items-center py-24 text-center md:py-32">
        <h2 className="display text-4xl uppercase md:text-6xl">Discover <span className="script">the collection</span></h2>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/shop" size="lg">Shop jewellery</ButtonLink>
          <ButtonLink href="/gold-bars" variant="outline" size="lg">Explore gold bars</ButtonLink>
        </div>
      </section>
    </>
  );
}

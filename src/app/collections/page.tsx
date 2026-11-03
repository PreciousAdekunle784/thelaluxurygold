import type { Metadata } from "next";
import Link from "next/link";
import { categories, collections } from "@/lib/data/categories";
import { getProducts, queryProducts } from "@/lib/data/catalogue";
import { MediaImage } from "@/components/ui/MediaImage";
import { Reveal } from "@/components/ui/Reveal";
import { PageIntro } from "@/components/shop/PageIntro";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore LA Luxury Gold's categories and curated collections — from everyday gold essentials to signature pieces and 24K gold bars.",
  alternates: { canonical: "/collections" },
};

export default function CollectionsPage() {
  const all = getProducts();
  return (
    <>
      <PageIntro
        crumbs={[{ name: "Home", href: "/" }, { name: "Collections" }]}
        eyebrow="Discover"
        title={
          <>
            The <span className="font-light italic normal-case">collections</span>
          </>
        }
        intro="Explore by category, or discover our curated edits — each one a different way to wear, gift and keep gold."
      />

      <section className="container-luxe pb-24" aria-labelledby="by-category">
        <h2 id="by-category" className="eyebrow mb-8 font-semibold">
          By category
        </h2>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-6">
          {categories.map((c, i) => {
            const count = queryProducts({ categories: [c.slug] }, all).length;
            return (
              <Reveal as="li" key={c.slug} delay={i * 0.06}>
                <Link href={c.slug === "gold-bars" ? "/gold-bars" : `/collections/${c.slug}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                    <MediaImage mediaKey={c.media} alt={c.name} sizes="(min-width: 1024px) 20vw, 50vw" className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-luxe)] group-hover:scale-105" />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <h3 className="font-display text-2xl">{c.name}</h3>
                    <span className="text-xs text-stone">{count}</span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </section>

      <section className="bg-linen py-24 md:py-32" aria-labelledby="curated">
        <div className="container-luxe">
          <h2 id="curated" className="eyebrow mb-12 font-semibold">
            Curated edits
          </h2>
          <ul className="grid gap-x-8 gap-y-16 md:grid-cols-2">
            {collections.map((c, i) => (
              <Reveal as="li" key={c.slug} delay={(i % 2) * 0.1} className={i % 2 === 1 ? "md:mt-24" : ""}>
                <Link href={`/collections/${c.slug}`} className="group block">
                  <div className="relative aspect-[5/4] overflow-hidden bg-sand">
                    <MediaImage mediaKey={c.media} alt={c.name} sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-luxe)] group-hover:scale-105" />
                  </div>
                  <div className="mt-7 flex items-start justify-between gap-8">
                    <div>
                      <h3 className="display text-4xl uppercase md:text-5xl">{c.name}</h3>
                      <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-stone">{c.intro}</p>
                    </div>
                    <span className="eyebrow mt-3 shrink-0 font-semibold">{queryProducts({ collections: [c.slug] }, all).length} pieces</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

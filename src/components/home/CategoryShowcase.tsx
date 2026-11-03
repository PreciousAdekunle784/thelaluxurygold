import Link from "next/link";
import { categories } from "@/lib/data/categories";
import { MediaImage } from "@/components/ui/MediaImage";
import { Reveal } from "@/components/ui/Reveal";
import { TextLink } from "@/components/ui/Button";

const offsets = ["lg:mt-0", "lg:mt-20", "lg:mt-8", "lg:mt-28", "lg:mt-4"];

export function CategoryShowcase() {
  return (
    <section className="pb-24 pt-14 md:py-36" aria-labelledby="shop-by-category">
      <div className="container-luxe">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-5 flex items-center gap-3 text-champagne">
              <span className="h-px w-8 bg-current" /> Shop by category
            </p>
            <h2 id="shop-by-category" className="display text-[2.6rem] uppercase sm:text-5xl lg:text-[4.25rem]">
              Gold for every <span className="script">moment</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="max-w-sm md:pb-2">
            <p className="text-[0.95rem] leading-relaxed text-stone">
              Rings, necklaces, bracelets and earrings in 18K to 22K gold, alongside 24K gold bars.
            </p>
            <div className="mt-6">
              <TextLink href="/collections">All categories</TextLink>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="mt-14 md:mt-20">
        <ul className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:px-10 lg:container-luxe lg:grid lg:grid-cols-5 lg:gap-6 lg:overflow-visible lg:pb-0 xl:gap-8">
          {categories.map((c, i) => {
            const href = c.slug === "gold-bars" ? "/gold-bars" : `/collections/${c.slug}`;
            return (
              <Reveal as="li" key={c.slug} delay={i * 0.08} className={`w-[72vw] shrink-0 snap-start sm:w-[44vw] lg:w-auto ${offsets[i]}`}>
                <Link href={href} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                    <MediaImage
                      mediaKey={c.media}
                      alt={`${c.name} by LA Luxury Gold`}
                      sizes="(min-width: 1024px) 20vw, (min-width: 640px) 44vw, 72vw"
                      className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-luxe)] group-hover:scale-[1.06]"
                    />
                    <span className="absolute left-4 top-4 font-display text-sm text-ivory/90 mix-blend-difference">0{i + 1}</span>
                  </div>
                  <div className="mt-5 flex items-baseline justify-between gap-3 border-b border-line pb-4">
                    <h3 className="font-display text-[1.7rem] leading-none transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:translate-x-1">{c.name}</h3>
                    <span className="eyebrow text-stone transition-colors group-hover:text-ink">Explore</span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

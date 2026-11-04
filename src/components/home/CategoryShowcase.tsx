import Link from "next/link";
import { categories } from "@/lib/data/categories";
import { MediaImage } from "@/components/ui/MediaImage";
import { Reveal } from "@/components/ui/Reveal";
import { TextLink } from "@/components/ui/Button";
import { cx } from "@/lib/format";

/* Each category has its own proportion, offset and caption treatment, so the grid reads as an
   editorial spread rather than a row of identical cards. */
const layout: Record<string, { cell: string; aspect: string; caption: "below" | "overlay"; note: string }> = {
  rings: { cell: "lg:col-span-5", aspect: "aspect-[4/5]", caption: "below", note: "Bands · Signets · Domes" },
  necklaces: { cell: "lg:col-span-4 lg:mt-24", aspect: "aspect-[3/4]", caption: "below", note: "Chains · Pendants" },
  bracelets: { cell: "lg:col-span-3 lg:mt-48", aspect: "aspect-[2/3]", caption: "below", note: "Bangles · Cuffs · Links" },
  earrings: { cell: "lg:col-span-3", aspect: "aspect-[2/3]", caption: "below", note: "Hoops · Huggies · Drops" },
  sets: { cell: "lg:col-span-4 lg:mt-20", aspect: "aspect-[3/4]", caption: "below", note: "Presented together" },
  "gold-bars": { cell: "lg:col-span-5 lg:mt-6", aspect: "aspect-[4/5]", caption: "overlay", note: "24K · Minted & cast" },
};

export function CategoryShowcase() {
  return (
    <section className="bg-white pb-24 pt-24 md:py-40" aria-labelledby="shop-by-category">
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
            <p className="text-[0.95rem] leading-relaxed text-stone">Rings, necklaces, bracelets, earrings and jewellery sets in 18K to 22K gold, alongside 24K gold bars.</p>
            <div className="mt-6">
              <TextLink href="/collections">All categories</TextLink>
            </div>
          </Reveal>
        </div>
      </div>

      <ul className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mt-20 md:px-10 lg:container-luxe lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-14 lg:overflow-visible lg:pb-0">
        {categories.map((c, i) => {
          const href = c.slug === "gold-bars" ? "/gold-bars" : `/collections/${c.slug}`;
          const l = layout[c.slug] ?? layout.rings;
          return (
            <Reveal as="li" key={c.slug} delay={(i % 3) * 0.08} className={cx("w-[74vw] shrink-0 snap-start sm:w-[44vw] lg:w-auto", l.cell)}>
              <Link href={href} className="group block">
                <div className={cx("relative overflow-hidden bg-sand", l.aspect)}>
                  <MediaImage
                    mediaKey={c.media}
                    alt={`${c.name} by LA Luxury Gold`}
                    sizes="(min-width: 1024px) 38vw, (min-width: 640px) 44vw, 74vw"
                    className="object-cover transition-transform duration-[1800ms] ease-[var(--ease-luxe)] group-hover:scale-[1.05]"
                  />
                  <span className="absolute left-4 top-4 font-display text-sm text-ivory/90 mix-blend-difference">{String(i + 1).padStart(2, "0")}</span>
                  {l.caption === "overlay" && (
                    <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(17,16,15,0.85),rgba(17,16,15,0))] p-6 pt-24 text-ivory md:p-8 md:pt-28">
                      <p className="eyebrow text-gold-pale">{l.note}</p>
                      <h3 className="mt-3 font-display text-[2.2rem] leading-none md:text-[2.8rem]">{c.name}</h3>
                      <span className="mt-5 inline-block border-b border-ivory/50 pb-1 text-[0.66rem] font-semibold uppercase tracking-[0.22em] transition-colors group-hover:border-gold-pale group-hover:text-gold-pale">
                        Explore
                      </span>
                    </div>
                  )}
                </div>
                {l.caption === "below" && (
                  <div className="mt-5 flex items-baseline justify-between gap-3 border-b border-line pb-4">
                    <div>
                      <h3 className="font-display text-[1.75rem] leading-none transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:translate-x-1">{c.name}</h3>
                      <p className="mt-2 text-[0.72rem] uppercase tracking-[0.18em] text-stone">{l.note}</p>
                    </div>
                    <span className="eyebrow text-stone transition-colors group-hover:text-ink">Explore</span>
                  </div>
                )}
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}

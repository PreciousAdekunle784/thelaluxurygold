import Link from "next/link";
import { categories } from "@/lib/data/categories";
import { MediaImage } from "@/components/ui/MediaImage";
import { ImageReveal } from "@/components/ui/Reveal";
import { cx } from "@/lib/format";

/* Image-first collection mosaic: each category is one large photograph with its name on it.
   Gold bars have their own section further down the page. */
const layout: Record<string, { cell: string; aspect: string }> = {
  rings: { cell: "col-span-2 lg:col-span-7", aspect: "aspect-[4/5] lg:aspect-[6/7]" },
  necklaces: { cell: "col-span-1 lg:col-span-5 lg:mt-28", aspect: "aspect-[3/4] lg:aspect-[4/5]" },
  bracelets: { cell: "col-span-1 lg:col-span-4", aspect: "aspect-[3/4]" },
  earrings: { cell: "col-span-1 lg:col-span-4 lg:mt-20", aspect: "aspect-[3/4]" },
  sets: { cell: "col-span-1 lg:col-span-4 lg:mt-40", aspect: "aspect-[3/4]" },
};

export function CategoryShowcase() {
  const list = categories.filter((c) => layout[c.slug]);
  return (
    <section className="bg-white pb-24 pt-20 md:pb-36 md:pt-28" aria-labelledby="collections-heading">
      <div className="container-luxe flex items-end justify-between gap-6">
        <h2 id="collections-heading" className="display text-[2.5rem] uppercase sm:text-5xl lg:text-[3.8rem]">
          The <span className="script">collections</span>
        </h2>
        <Link href="/collections" className="link-underline eyebrow mb-2 shrink-0 font-semibold">
          View all
        </Link>
      </div>

      <ul className="container-luxe mt-10 grid grid-cols-2 gap-3 md:mt-16 md:gap-5 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-10">
        {list.map((c, i) => {
          const l = layout[c.slug];
          return (
            <li key={c.slug} className={l.cell}>
              <Link href={`/collections/${c.slug}`} className="group relative block overflow-hidden bg-sand">
                <ImageReveal className={cx("relative", l.aspect)} delay={(i % 3) * 0.08}>
                  <MediaImage
                    mediaKey={c.media}
                    alt={`${c.name} by LA Luxury Gold`}
                    sizes={i === 0 ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 40vw, 50vw"}
                    className="object-cover transition-transform duration-[2000ms] ease-[var(--ease-luxe)] group-hover:scale-[1.06]"
                  />
                </ImageReveal>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian/75 via-obsidian/25 to-transparent p-4 pt-20 text-ivory md:p-7 md:pt-28">
                  <h3 className="font-display text-[1.5rem] leading-none sm:text-[2rem] lg:text-[2.6rem]">{c.name}</h3>
                  <span className="mt-3 inline-flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ivory/85 transition-colors group-hover:text-gold-pale md:text-[0.66rem]">
                    Explore<span className="max-sm:hidden"> collection</span>
                    <svg width="16" height="8" viewBox="0 0 18 8" aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
                      <path d="M0 4h16M13 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

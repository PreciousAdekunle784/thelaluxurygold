import Link from "next/link";
import type { Product } from "@/lib/data/types";
import { MediaImage } from "@/components/ui/MediaImage";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { Price } from "@/components/product/Price";
import { TextLink } from "@/components/ui/Button";
import { cx } from "@/lib/format";

/** Preferred pieces for the edit, in order; any that are hidden or deleted are replaced by featured pieces. */
const EDIT = ["soleil-dome-ring", "halo-bangle", "goutte-drop-earrings", "corde-rope-chain", "arc-cuff"];

function pick(products: Product[]) {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const chosen = EDIT.map((s) => bySlug.get(s)).filter((p): p is Product => !!p);
  const rest = products
    .filter((p) => p.category !== "gold-bars" && !chosen.includes(p))
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.popularity - a.popularity);
  return [...chosen, ...rest].slice(0, 5);
}

function Piece({ product, aspect, sizes, className, tone = "light", index }: { product: Product; aspect: string; sizes: string; className?: string; tone?: "light" | "dark"; index: number }) {
  const styled = product.images[1] ?? product.images[0];
  const studio = product.images[0];
  return (
    <Reveal className={className} delay={0.05 * index}>
      <Link href={`/product/${product.slug}`} className="group block">
        <ImageReveal className={cx("relative overflow-hidden bg-sand", aspect)}>
          <MediaImage mediaKey={styled.media} alt={styled.alt} sizes={sizes} className="object-cover transition-transform duration-[1800ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04]" />
          {studio !== styled && (
            <MediaImage
              mediaKey={studio.media}
              alt=""
              aria-hidden
              loading="lazy"
              sizes={sizes}
              className="object-cover opacity-0 transition-opacity duration-[1100ms] ease-[var(--ease-luxe)] group-hover:opacity-100 max-md:hidden"
            />
          )}
          <span className="absolute left-4 top-4 font-display text-sm text-ivory/90 mix-blend-difference">{String(index + 1).padStart(2, "0")}</span>
        </ImageReveal>
        <div className={cx("mt-5 flex items-start justify-between gap-6", tone === "dark" ? "text-ivory" : "text-ink")}>
          <div>
            <p className="eyebrow text-champagne">{product.purity} gold</p>
            <h3 className="mt-2 font-display text-[1.6rem] leading-[1.05] transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:translate-x-1 md:text-[1.9rem]">{product.name}</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-stone">{product.tagline}</p>
          </div>
          <Price amount={product.price} className="shrink-0 pt-6 text-sm" />
        </div>
      </Link>
    </Reveal>
  );
}

export function EditorialShowcase({ products }: { products: Product[] }) {
  const [a, b, c, d, e] = pick(products);
  if (!a) return null;
  return (
    <section className="overflow-hidden bg-linen py-24 md:py-40" aria-labelledby="the-edit">
      <div className="container-luxe">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <Reveal className="md:col-span-7">
            <p className="eyebrow mb-6 flex items-center gap-3 text-champagne">
              <span className="h-px w-8 bg-current" /> The Edit
            </p>
            <h2 id="the-edit" className="display text-[2.7rem] uppercase sm:text-[3.6rem] lg:text-[4.6rem]">
              Pieces with <span className="script">presence</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="md:col-span-4 md:col-start-9 md:pb-3">
            <p className="text-[0.98rem] leading-[1.8] text-stone">
              Sculpted domes, rope chains and bangles of rich 22K gold — a selection from the house, chosen for the way each piece holds the light.
            </p>
            <div className="mt-6">
              <TextLink href="/shop">Shop the collection</TextLink>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-x-8 gap-y-20 md:mt-24 md:grid-cols-12">
          <Piece product={a} index={0} aspect="aspect-[4/5]" sizes="(min-width: 768px) 55vw, 100vw" className="md:col-span-7" />
          {b && (
            <div className="md:col-span-4 md:col-start-9 md:pt-40">
              <Reveal>
                <p className="mb-14 max-w-xs font-display text-[1.9rem] italic leading-[1.2] text-ink/80 max-md:hidden">“Gold that gathers light and keeps it.”</p>
              </Reveal>
              <Piece product={b} index={1} aspect="aspect-[3/4]" sizes="(min-width: 768px) 32vw, 85vw" className="max-md:ml-auto max-md:w-[85%]" />
            </div>
          )}
          {c && <Piece product={c} index={2} aspect="aspect-square" sizes="(min-width: 768px) 30vw, 80vw" className="md:col-span-4 md:-mt-8 max-md:w-[80%]" />}
          {d && <Piece product={d} index={3} aspect="aspect-[4/5]" sizes="(min-width: 768px) 30vw, 100vw" className="md:col-span-4 md:mt-28" />}
          {e && <Piece product={e} index={4} aspect="aspect-[3/4]" sizes="(min-width: 768px) 25vw, 85vw" className="md:col-span-3 md:col-start-10 md:mt-12 max-md:ml-auto max-md:w-[85%]" />}
        </div>
      </div>
    </section>
  );
}

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
        <div className={cx("mt-4 flex items-end justify-between gap-6", tone === "dark" ? "text-ivory" : "text-ink")}>
          <div>
            <h3 className="font-display text-[1.45rem] leading-[1.05] md:text-[1.8rem]">{product.name}</h3>
            <p className="mt-1.5 text-[0.72rem] uppercase tracking-[0.18em] text-stone">
              {product.purity} · <Price amount={product.price} className="normal-case tracking-normal text-ink" />
            </p>
          </div>
          <span className="shrink-0 border-b border-current pb-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] transition-colors group-hover:text-champagne">View product</span>
        </div>
      </Link>
    </Reveal>
  );
}

export function EditorialShowcase({ products }: { products: Product[] }) {
  const [a, b, c, d, e] = pick(products);
  if (!a) return null;
  return (
    <section className="overflow-hidden bg-linen py-20 md:py-32" aria-labelledby="the-edit">
      <div className="container-luxe">
        <div className="flex items-end justify-between gap-6">
          <Reveal>
            <h2 id="the-edit" className="display text-[2.5rem] uppercase sm:text-5xl lg:text-[3.8rem]">
              Featured <span className="script">pieces</span>
            </h2>
          </Reveal>
          <TextLink href="/shop" className="mb-2 shrink-0">
            Shop all
          </TextLink>
        </div>

        <div className="mt-12 grid gap-x-8 gap-y-16 md:mt-16 md:grid-cols-12">
          <Piece product={a} index={0} aspect="aspect-[4/5]" sizes="(min-width: 768px) 55vw, 100vw" className="md:col-span-7" />
          {b && (
            <div className="md:col-span-5 md:col-start-8 md:pt-32">
              <Piece product={b} index={1} aspect="aspect-[3/4]" sizes="(min-width: 768px) 40vw, 88vw" className="max-md:ml-auto max-md:w-[88%]" />
            </div>
          )}
          {c && <Piece product={c} index={2} aspect="aspect-[4/5]" sizes="(min-width: 768px) 40vw, 85vw" className="md:col-span-5 md:-mt-8 max-md:w-[85%]" />}
          {d && <Piece product={d} index={3} aspect="aspect-[4/5]" sizes="(min-width: 768px) 30vw, 100vw" className="md:col-span-4 md:mt-28" />}
          {e && <Piece product={e} index={4} aspect="aspect-[3/4]" sizes="(min-width: 768px) 25vw, 85vw" className="md:col-span-3 md:mt-12 max-md:ml-auto max-md:w-[85%]" />}
        </div>
      </div>
    </section>
  );
}

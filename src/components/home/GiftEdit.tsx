import Link from "next/link";
import { MediaImage } from "@/components/ui/MediaImage";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import type { Product } from "@/lib/data/types";

/** Preferred gift pieces; any that are hidden, deleted or moved to the Private Collection are replaced from the public catalogue. */
const GIFTS = ["riviera-cable-set", "medaille-coin-pendant"];

function pickGifts(products: Product[]) {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const chosen = GIFTS.map((s) => bySlug.get(s)).filter((p): p is Product => !!p);
  const rest = products
    .filter((p) => p.category !== "gold-bars" && !chosen.includes(p) && p.collections.includes("gifting"))
    .concat(products.filter((p) => p.category !== "gold-bars" && !chosen.includes(p)))
    .filter((p, i, all) => all.indexOf(p) === i);
  return [...chosen, ...rest].slice(0, 2);
}

/** Gifting, told almost entirely in photographs. `products` must be the public catalogue. */
export function GiftEdit({ products }: { products: Product[] }) {
  const gifts = pickGifts(products);
  return (
    <section className="overflow-hidden bg-sage-mist py-20 md:py-32" aria-labelledby="gift-edit">
      <div className="container-luxe grid gap-4 md:grid-cols-12 md:gap-6">
        <Link href="/collections/gifting" className="group relative block overflow-hidden bg-sand md:col-span-7 md:row-span-2">
          <ImageReveal className="relative aspect-[4/5] md:h-full md:min-h-[640px] md:aspect-auto">
            <MediaImage
              mediaKey="details/premium-packaging"
              alt="A gold signet ring in an open burgundy presentation box"
              sizes="(min-width: 768px) 58vw, 100vw"
              className="object-cover transition-transform duration-[2000ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
            />
          </ImageReveal>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian/70 to-transparent p-6 pt-28 text-ivory md:p-10">
            <p className="eyebrow text-gold-pale">Gifting</p>
            <h2 id="gift-edit" className="display mt-3 text-[2.6rem] uppercase leading-[0.92] md:text-[4rem]">
              The gift <span className="script text-gold-pale">edit</span>
            </h2>
            <span className="mt-6 inline-flex h-11 items-center bg-ivory px-6 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-ink transition-colors group-hover:bg-gold-pale">
              Shop gifts
            </span>
          </div>
        </Link>

        <Link href="/collections/sets" className="group relative block overflow-hidden bg-sand md:col-span-5">
          <ImageReveal className="relative aspect-[5/4] md:aspect-[4/3]" delay={0.1}>
            <MediaImage mediaKey="collections/collection-sets" alt="A pendant and hoops in a lined gift box" sizes="(min-width: 768px) 40vw, 100vw" className="object-cover object-[50%_60%] transition-transform duration-[2000ms] ease-[var(--ease-luxe)] group-hover:scale-[1.05]" />
          </ImageReveal>
          <span className="absolute bottom-4 left-4 bg-ivory/90 px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink">Jewellery sets</span>
        </Link>

        <Reveal className="grid grid-cols-2 gap-4 md:col-span-5 md:gap-6" delay={0.15}>
          {gifts.map((p) => {
            const img = p.images[1] ?? p.images[0];
            return (
              <Link key={p.id} href={`/product/${p.slug}`} className="group relative block aspect-square overflow-hidden bg-sand">
                {img && <MediaImage mediaKey={img.media} alt={`The ${p.name}`} sizes="(min-width: 768px) 20vw, 50vw" className="object-cover transition-transform duration-[2000ms] ease-[var(--ease-luxe)] group-hover:scale-[1.06]" />}
                <span className="absolute bottom-3 left-3 bg-ivory/90 px-2.5 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink">View product</span>
              </Link>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

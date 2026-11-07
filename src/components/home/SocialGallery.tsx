import { MediaImage } from "@/components/ui/MediaImage";
import { Reveal } from "@/components/ui/Reveal";
import { InstagramIcon } from "@/components/ui/Icons";
import { store } from "@/lib/config/store";

/* A gallery of the house's imagery, linking to the brand's Instagram profile.
   Alt texts describe the scene without naming products, so a piece moved into the Private Collection is never named here. */
const tiles = [
  { media: "products/maison-signet-2", alt: "A gold signet ring on polished obsidian", cls: "col-span-2 row-span-2 aspect-square" },
  { media: "products/corda-twist-2", alt: "A twisted gold ring beside a stone drum", cls: "aspect-square" },
  { media: "products/riviera-cable-bracelet-2", alt: "A gold cable bracelet on burgundy silk", cls: "aspect-square" },
  { media: "products/goutte-teardrop-pendant-2", alt: "A gold teardrop pendant on ivory silk", cls: "aspect-square" },
  { media: "products/corde-rope-chain-3", alt: "Close detail of a gold rope chain", cls: "aspect-square" },
  { media: "products/petite-huggies-2", alt: "Gold huggie earrings on a stone drum", cls: "col-span-2 aspect-[2/1] lg:col-span-1 lg:aspect-square" },
  { media: "products/minted-gold-bar-20g-2", alt: "24K minted gold bars on obsidian", cls: "aspect-square max-lg:hidden" },
];

export function SocialGallery() {
  const instagram = store.social.links.find((l) => l.name === "Instagram");
  if (!instagram) return null;
  return (
    <section className="bg-ivory py-20 md:py-28" aria-labelledby="social">
      <div className="container-luxe">
        <Reveal className="mb-10 flex flex-col items-center gap-4 text-center md:mb-14">
          <InstagramIcon width={22} height={22} className="text-champagne" />
          <h2 id="social" className="display text-[2.3rem] uppercase sm:text-5xl">
            <a href={instagram.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-champagne">
              {store.social.handle}
            </a>
          </h2>
        </Reveal>
        <ul className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-5">
          {tiles.map((t, i) => (
            <Reveal as="li" key={t.media} delay={(i % 4) * 0.06} className={t.cls}>
              <a href={instagram.href} target="_blank" rel="noopener noreferrer" className="group relative block h-full w-full overflow-hidden bg-sand" aria-label={`${t.alt} — follow ${store.social.handle} on Instagram`}>
                <MediaImage mediaKey={t.media} alt={t.alt} sizes={t.cls.includes("row-span-2") ? "(min-width: 1024px) 40vw, 100vw" : "(min-width: 1024px) 20vw, 50vw"} className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-luxe)] group-hover:scale-110" />
                <span className="absolute inset-0 flex items-center justify-center bg-obsidian/0 text-ivory opacity-0 transition-all duration-500 group-hover:bg-obsidian/35 group-hover:opacity-100">
                  <InstagramIcon width={26} height={26} />
                </span>
              </a>
            </Reveal>
          ))}
        </ul>
        <div className="mt-10 flex justify-center">
          <a href={instagram.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-3 border border-ink/80 px-7 text-[0.68rem] font-semibold uppercase tracking-[0.24em] transition-colors hover:bg-ink hover:text-ivory">
            Follow us on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}

import { MediaImage } from "@/components/ui/MediaImage";
import { Reveal } from "@/components/ui/Reveal";
import { InstagramIcon } from "@/components/ui/Icons";
import { TextLink } from "@/components/ui/Button";
import { store } from "@/lib/config/store";

const tiles = [
  { media: "editorial/social-1", alt: "Classic gold hoop on sage" },
  { media: "editorial/social-3", alt: "24K minted gold bar on deep green" },
  { media: "editorial/social-2", alt: "Twisted gold rope chain" },
  { media: "editorial/social-4", alt: "Signet ring on burgundy" },
  { media: "editorial/social-5", alt: "Stacked gold bangles" },
  { media: "editorial/social-6", alt: "LG monogram medallion on silk" },
];

export function SocialGrid() {
  const instagram = store.social.links.find((l) => l.name === "Instagram")!;
  return (
    <section className="py-24 md:py-36" aria-labelledby="world-of">
      <div className="container-luxe">
        <div className="mb-14 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <Reveal>
            <p className="eyebrow mb-5 flex items-center gap-3 text-champagne">
              <span className="h-px w-8 bg-current" /> {store.social.handle}
            </p>
            <h2 id="world-of" className="display max-w-3xl text-[2.4rem] uppercase sm:text-5xl lg:text-[4rem]">
              The world of <span className="script">LA Luxury Gold</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <TextLink href={instagram.href}>Follow {store.social.handle}</TextLink>
          </Reveal>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
          {tiles.map((t, i) => (
            <Reveal as="li" key={t.media} delay={i * 0.06} className={i % 2 === 1 ? "lg:mt-10" : ""}>
              <a href={instagram.href} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden bg-sand" aria-label={`${t.alt} — view on Instagram`}>
                <MediaImage mediaKey={t.media} alt={t.alt} sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw" className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-luxe)] group-hover:scale-110" />
                <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-ivory opacity-0 transition-all duration-500 group-hover:bg-ink/30 group-hover:opacity-100">
                  <InstagramIcon width={26} height={26} />
                </span>
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

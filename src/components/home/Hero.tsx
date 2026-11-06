import { getImageProps } from "next/image";
import { media } from "@/lib/data/media";
import { getSiteSettings } from "@/lib/data/site-settings";
import { ButtonLink } from "@/components/ui/Button";
import { HeroLine, HeroFade } from "./HeroMotion";
import { HeroSlides, type HeroSlide } from "./HeroSlides";

/*
 * Campaign slideshow. Each slide has a landscape image for tablets/desktop (pieces in the right
 * third, dark space on the left for type) and a portrait image for phones (pieces in the lower half,
 * dark headroom above the centred headline). All five are dark, so the ivory type always reads.
 */
const CAMPAIGN = [
  {
    desktop: "campaign/hero-desktop",
    mobile: "campaign/hero-mobile",
    alt: "Layered gold chains and a sun medallion on a burgundy velvet display bust, lit against obsidian",
    position: "object-[50%_100%] md:object-[72%_50%] xl:object-[64%_50%]",
  },
  {
    desktop: "campaign/campaign-burgundy",
    mobile: "campaign/campaign-burgundy-mobile",
    alt: "A 22K bangle, an open cuff and a rope chain on folds of burgundy silk",
    position: "object-[50%_100%] md:object-[66%_50%]",
  },
  {
    desktop: "campaign/emerald-desktop",
    mobile: "campaign/emerald-mobile",
    alt: "Stacked 22K bangles, an open cuff and a cable bracelet on emerald velvet",
    position: "object-[50%_100%] md:object-[70%_50%]",
  },
  {
    desktop: "campaign/gold-bars-wide",
    mobile: "campaign/gold-bars-mobile",
    alt: "A 24K cast gold bar beside minted bars of several weights, reflected on polished obsidian",
    position: "object-[50%_100%] md:object-[62%_50%]",
  },
  {
    desktop: "details/gold-texture",
    mobile: "campaign/gold-texture-mobile",
    alt: "Macro detail of a 22K gold rope chain on dark silk",
    position: "object-[50%_100%] md:object-[58%_50%]",
  },
];

function slide(desktopKey: string, mobileKey: string, alt: string, position: string, priority: boolean): HeroSlide {
  const d = media(desktopKey);
  const m = media(mobileKey);
  const common = { alt, sizes: "100vw", quality: 82, ...(priority ? { priority: true } : {}) };
  const desktop = getImageProps({ ...common, src: d.src, width: d.width, height: d.height }).props;
  const mobile = getImageProps({ ...common, src: m.src, width: m.width, height: m.height }).props;
  return { alt, desktop: desktop.srcSet ?? "", mobile: mobile.srcSet ?? "", src: desktop.src, width: d.width, height: d.height, position };
}

export async function Hero() {
  const settings = await getSiteSettings();
  const slides: HeroSlide[] = [];
  // A photo uploaded in Admin → Store settings leads the slideshow, replacing the first campaign image.
  if (settings.heroDesktop) {
    slides.push(slide(settings.heroDesktop, settings.heroMobile ?? settings.heroDesktop, "LA Luxury Gold campaign", "object-center", true));
  }
  CAMPAIGN.slice(settings.heroDesktop ? 1 : 0).forEach((c) => slides.push(slide(c.desktop, c.mobile, c.alt, c.position, slides.length === 0)));

  return (
    <section className="relative -mt-[var(--header-h)] flex h-[100svh] max-h-[1080px] min-h-[640px] overflow-hidden bg-obsidian text-ivory" aria-label="Introduction">
      <HeroSlides slides={slides} />

      {/* Phones: type sits centred in the dark headroom above the piece. Desktop: a soft obsidian veil on the left. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(17,16,15,0.72)_0%,rgba(17,16,15,0.4)_48%,rgba(17,16,15,0)_64%),linear-gradient(0deg,rgba(17,16,15,0.55)_0%,rgba(17,16,15,0)_16%)] md:bg-[linear-gradient(90deg,rgba(17,16,15,0.92)_0%,rgba(17,16,15,0.72)_36%,rgba(17,16,15,0)_66%),linear-gradient(180deg,rgba(17,16,15,0.5)_0%,rgba(17,16,15,0)_22%)]" />
      {/* a hairline frame gives the composition a printed, editorial edge */}
      <div className="pointer-events-none absolute inset-4 hidden border border-ivory/10 md:inset-6 md:block" />

      <div className="container-luxe relative flex w-full flex-col items-center justify-start pb-16 pt-[calc(var(--header-h)+2.5rem)] text-center md:items-start md:justify-center md:pb-16 md:pt-[calc(var(--header-h)+2rem)] md:text-left">
        <div className="flex max-w-[44rem] flex-col items-center md:items-start">
          <HeroFade delay={0.45}>
            <p className="eyebrow mb-5 flex items-center justify-center gap-3 text-gold-pale md:mb-8 md:justify-start">
              <span className="h-px w-8 bg-current md:w-10" /> The Burgundy Edit · Dubai <span className="h-px w-8 bg-current md:hidden" />
            </p>
          </HeroFade>
          <h1 className="display text-[2.7rem] uppercase leading-[0.92] sm:text-[4.2rem] lg:text-[5rem] xl:text-[5.6rem]">
            <HeroLine delay={0.55}>Gold,</HeroLine>
            <HeroLine delay={0.68}>
              <span className="script normal-case text-gold-pale">beyond</span>
            </HeroLine>
            <HeroLine delay={0.81}>
              <span className="whitespace-nowrap">the ordinary.</span>
            </HeroLine>
          </h1>
          <HeroFade delay={1.05}>
            <p className="mx-auto mt-4 max-w-[19rem] text-[0.9rem] leading-relaxed text-ivory/80 md:mx-0 md:mt-8 md:max-w-[24rem] md:text-[1.05rem]">
              Exceptional pieces. Enduring presence.
            </p>
          </HeroFade>
          <HeroFade delay={1.2} className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3 md:mt-10 md:justify-start">
            <ButtonLink href="/shop" variant="gold" size="lg" className="max-sm:h-10 max-sm:px-4 max-sm:text-[0.6rem] max-sm:tracking-[0.18em]">
              Shop now
            </ButtonLink>
            <ButtonLink href="/collections" variant="outline-light" size="lg" className="max-sm:h-10 max-sm:px-4 max-sm:text-[0.6rem] max-sm:tracking-[0.18em]">
              Explore collections
            </ButtonLink>
          </HeroFade>
        </div>
      </div>

      <HeroFade delay={1.5} className="pointer-events-none absolute inset-x-0 bottom-0 hidden md:block">
        <div className="container-luxe flex items-end justify-end pb-10 text-[0.62rem] uppercase tracking-[0.3em] text-ivory/60">
          <span>18K — 24K gold · Delivered worldwide</span>
        </div>
      </HeroFade>
    </section>
  );
}

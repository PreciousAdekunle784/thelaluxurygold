import { getImageProps } from "next/image";
import { media } from "@/lib/data/media";
import { getSiteSettings } from "@/lib/data/site-settings";
import { ButtonLink } from "@/components/ui/Button";
import { HeroMotion, HeroLine, HeroFade } from "./HeroMotion";

/**
 * Signature campaign hero. Desktop and phone use separately composed images: on wide screens the
 * piece sits in the right third with dark space on the left for type; on phones it sits low in the
 * frame with headroom above, and the headline is anchored to the bottom.
 * A photo uploaded in Admin → Store settings replaces the campaign image.
 */
export async function Hero() {
  const settings = await getSiteSettings();
  const custom = !!settings.heroDesktop;
  const d = media(settings.heroDesktop ?? "campaign/hero-desktop");
  const m = media(settings.heroMobile ?? settings.heroDesktop ?? "campaign/hero-mobile");
  const common = {
    alt: custom ? "LA Luxury Gold campaign" : "Layered gold chains and a sun medallion on a burgundy velvet display bust, lit against obsidian",
    sizes: "100vw",
    fetchPriority: "high" as const,
    loading: "eager" as const,
    quality: 82,
  };
  const { props: { srcSet: desktop, ...rest } } = getImageProps({ ...common, src: d.src, width: d.width, height: d.height, blurDataURL: d.blurDataURL });
  const { props: { srcSet: mobile } } = getImageProps({ ...common, src: m.src, width: m.width, height: m.height });

  return (
    <section className="relative -mt-[var(--header-h)] flex h-[100svh] max-h-[1080px] min-h-[640px] overflow-hidden bg-obsidian text-ivory" aria-label="Introduction">
      <HeroMotion>
        <picture>
          <source media="(max-width: 767px)" srcSet={mobile} />
          <source media="(min-width: 768px)" srcSet={desktop} />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is supplied via getImageProps */}
          <img
            {...rest}
            className={custom ? "absolute inset-0 h-full w-full object-cover object-center" : "absolute inset-0 h-full w-full object-cover object-[50%_100%] md:object-[72%_50%] xl:object-[64%_50%]"}
          />
        </picture>
      </HeroMotion>

      {/* Phones: type sits in the dark headroom above the piece. Desktop: a soft obsidian veil on the left. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(17,16,15,0.7)_0%,rgba(17,16,15,0.35)_45%,rgba(17,16,15,0)_62%),linear-gradient(0deg,rgba(17,16,15,0.55)_0%,rgba(17,16,15,0)_16%)] md:bg-[linear-gradient(90deg,rgba(17,16,15,0.88)_0%,rgba(17,16,15,0.55)_34%,rgba(17,16,15,0)_62%),linear-gradient(180deg,rgba(17,16,15,0.5)_0%,rgba(17,16,15,0)_22%)]" />
      {/* a hairline frame gives the composition a printed, editorial edge */}
      <div className="pointer-events-none absolute inset-4 hidden border border-ivory/10 md:inset-6 md:block" />

      <div className="container-luxe relative flex w-full flex-col justify-start pb-10 pt-[calc(var(--header-h)+2.25rem)] md:justify-center md:pb-16 md:pt-[calc(var(--header-h)+2rem)]">
        <div className="max-w-[44rem]">
          <HeroFade delay={0.45}>
            <p className="eyebrow mb-4 flex items-center gap-3 text-gold-pale md:mb-8">
              <span className="h-px w-10 bg-current" /> The Burgundy Edit · Dubai
            </p>
          </HeroFade>
          <h1 className="display text-[2.6rem] uppercase leading-[0.9] sm:text-[4.2rem] lg:text-[5rem] xl:text-[5.6rem]">
            <HeroLine delay={0.55}>Gold,</HeroLine>
            <HeroLine delay={0.68}>
              <span className="script normal-case text-gold-pale">beyond</span>
            </HeroLine>
            <HeroLine delay={0.81}>
              <span className="whitespace-nowrap">the ordinary.</span>
            </HeroLine>
          </h1>
          <HeroFade delay={1.05}>
            <p className="mt-3 max-w-[20rem] text-[0.88rem] leading-relaxed text-ivory/80 md:mt-8 md:max-w-[24rem] md:text-[1.05rem]">
              Exceptional pieces. Enduring presence. A personal expression of luxury.
            </p>
          </HeroFade>
          <HeroFade delay={1.2} className="mt-5 flex flex-wrap gap-2 sm:gap-3 md:mt-10">
            <ButtonLink href="/shop" variant="gold" size="lg" className="max-sm:h-10 max-sm:px-4 max-sm:text-[0.6rem] max-sm:tracking-[0.18em]">
              Explore the collection
            </ButtonLink>
            <ButtonLink href="/about" variant="outline-light" size="lg" className="max-sm:h-10 max-sm:px-4 max-sm:text-[0.6rem] max-sm:tracking-[0.18em]">
              Discover our story
            </ButtonLink>
          </HeroFade>
        </div>
      </div>

      <HeroFade delay={1.5} className="absolute inset-x-0 bottom-0 hidden md:block">
        <div className="container-luxe flex items-end justify-end pb-10 text-[0.62rem] uppercase tracking-[0.3em] text-ivory/60">
          <span>18K — 24K gold · Insured worldwide delivery</span>
        </div>
      </HeroFade>
    </section>
  );
}

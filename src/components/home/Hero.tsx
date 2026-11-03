import { getImageProps } from "next/image";
import { media } from "@/lib/data/media";
import { ButtonLink } from "@/components/ui/Button";
import { HeroMotion, HeroLine, HeroFade } from "./HeroMotion";

export function Hero() {
  const d = media("editorial/hero");
  const m = media("editorial/hero-mobile");
  const common = { alt: "Gold rope chain draped over a travertine plinth beside signet rings and a 24K gold bar", sizes: "100vw", fetchPriority: "high" as const, loading: "eager" as const };
  const { props: { srcSet: desktop, ...rest } } = getImageProps({ ...common, src: d.src, width: d.width, height: d.height });
  const { props: { srcSet: mobile } } = getImageProps({ ...common, src: m.src, width: m.width, height: m.height });

  return (
    <section className="relative -mt-[var(--header-h)] flex min-h-[640px] overflow-hidden bg-forest text-ivory h-[100svh] max-h-[1040px]" aria-label="Introduction">
      <HeroMotion>
        <picture>
          <source media="(max-width: 767px)" srcSet={mobile} />
          <source media="(min-width: 768px)" srcSet={desktop} />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is supplied via getImageProps */}
          <img {...rest} className="absolute inset-0 h-full w-full object-cover object-[70%_50%] md:object-[60%_50%]" />
        </picture>
      </HeroMotion>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(27,42,35,0.94)_0%,rgba(27,42,35,0.82)_42%,rgba(27,42,35,0.15)_72%,rgba(27,42,35,0)_100%)] md:bg-[linear-gradient(90deg,rgba(27,42,35,0.7)_0%,rgba(27,42,35,0.15)_48%,rgba(27,42,35,0)_70%)]" />

      <div className="container-luxe relative flex w-full flex-col pb-10 pt-[calc(var(--header-h)+2.5rem)] md:justify-center md:pb-16">
        <div className="max-w-[50rem]">
          <HeroFade delay={0.5}>
            <p className="eyebrow mb-7 flex items-center gap-3 text-gold-pale md:mb-9">
              <span className="h-px w-10 bg-current" /> Fine gold jewellery · Dubai
            </p>
          </HeroFade>
          <h1 className="display text-[2.9rem] uppercase leading-[0.9] sm:text-[4.6rem] lg:text-[6.2rem] xl:text-[7rem]">
            <HeroLine delay={0.6}>The art of</HeroLine>
            <HeroLine delay={0.72}>
              <span className="font-light italic normal-case text-gold-pale">timeless</span>
            </HeroLine>
            <HeroLine delay={0.84}>gold.</HeroLine>
          </h1>
          <HeroFade delay={1.1}>
            <p className="mt-5 max-w-[26rem] text-[0.92rem] leading-relaxed text-ivory/80 md:mt-9 md:text-base">
              Discover exceptional gold jewellery crafted to celebrate every moment, every milestone and every legacy.
            </p>
          </HeroFade>
          <HeroFade delay={1.25} className="mt-7 flex flex-col gap-3 sm:flex-row md:mt-11">
            <ButtonLink href="/shop" variant="light" size="lg" className="max-sm:h-12">
              Explore the collection
            </ButtonLink>
            <ButtonLink href="/about" variant="outline-light" size="lg" className="max-sm:h-12">
              Discover LA Luxury Gold
            </ButtonLink>
          </HeroFade>
        </div>
      </div>

      <HeroFade delay={1.6} className="absolute inset-x-0 bottom-0 hidden md:block">
        <div className="container-luxe flex items-end justify-between pb-8 text-[0.62rem] uppercase tracking-[0.3em] text-ivory/70">
          <span className="flex items-center gap-4">
            <span className="relative block h-12 w-px overflow-hidden bg-ivory/20">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.4s_ease-in-out_infinite] bg-ivory" />
            </span>
            Scroll
          </span>
          <span>18K — 24K Gold · Worldwide delivery</span>
        </div>
      </HeroFade>
    </section>
  );
}

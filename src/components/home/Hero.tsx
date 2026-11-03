import { getImageProps } from "next/image";
import { media } from "@/lib/data/media";
import { getSiteSettings } from "@/lib/data/site-settings";
import { ButtonLink } from "@/components/ui/Button";
import { HeroMotion, HeroLine, HeroFade } from "./HeroMotion";
import { HeroVideo } from "./HeroVideo";

export async function Hero() {
  const settings = await getSiteSettings();
  // A photo uploaded in /admin/settings replaces the film; otherwise the looping brand film
  // plays over its own first frame (used as the instant-loading poster).
  const custom = !!settings.heroDesktop;
  const d = media(settings.heroDesktop ?? "editorial/hero-loop");
  const m = media(settings.heroMobile ?? settings.heroDesktop ?? "editorial/hero-loop-mobile");
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
          <img {...rest} className={custom ? "absolute inset-0 h-full w-full object-cover object-center" : "absolute inset-0 h-full w-full object-cover md:object-[8%_50%]"} />
        </picture>
        {!custom && (
          <HeroVideo
            desktop={{ mp4: "/videos/hero-desktop.mp4", webm: "/videos/hero-desktop.webm" }}
            mobile={{ mp4: "/videos/hero-mobile.mp4", webm: "/videos/hero-mobile.webm" }}
          />
        )}
      </HeroMotion>
      {/* Phones: text sits at the bottom over a deep fade (jewellery shows above it). Desktop: fade from the left. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(27,42,35,0.97)_0%,rgba(27,42,35,0.88)_34%,rgba(27,42,35,0.25)_58%,rgba(27,42,35,0)_72%),linear-gradient(180deg,rgba(27,42,35,0.6)_0%,rgba(27,42,35,0)_20%)] md:bg-[linear-gradient(90deg,rgba(27,42,35,0.72)_0%,rgba(27,42,35,0.18)_48%,rgba(27,42,35,0)_70%)]" />

      <div className="container-luxe relative flex w-full flex-col justify-end pb-9 pt-[calc(var(--header-h)+2rem)] md:justify-center md:pb-16 md:pt-[calc(var(--header-h)+2.5rem)]">
        <div className="max-w-[50rem]">
          <HeroFade delay={0.5}>
            <p className="eyebrow mb-5 flex items-center gap-3 text-gold-pale md:mb-9">
              <span className="h-px w-10 bg-current" /> Fine gold jewellery · Dubai
            </p>
          </HeroFade>
          <h1 className="display text-[2.9rem] uppercase leading-[0.9] sm:text-[4.6rem] lg:text-[5.6rem] xl:text-[6.3rem]">
            <HeroLine delay={0.6}>The art of</HeroLine>
            <HeroLine delay={0.72}>
              <span className="script text-gold-pale">timeless</span>
            </HeroLine>
            <HeroLine delay={0.84}>gold.</HeroLine>
          </h1>
          <HeroFade delay={1.1}>
            <p className="mt-4 max-w-[26rem] text-[0.92rem] leading-relaxed text-ivory/80 md:mt-9 md:text-base">
              Discover exceptional gold jewellery crafted to celebrate every moment, every milestone and every legacy.
            </p>
          </HeroFade>
          <HeroFade delay={1.25} className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:gap-3 md:mt-11">
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

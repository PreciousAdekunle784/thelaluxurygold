"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/format";

export interface HeroSlide {
  alt: string;
  /** srcSet for phones (portrait image) and for tablets/desktop (landscape image). */
  mobile: string;
  desktop: string;
  src: string;
  width: number;
  height: number;
  /** object-position classes for the image on each breakpoint. */
  position: string;
}

const INTERVAL = 6000;

/**
 * Crossfading campaign slideshow behind the hero headline.
 * Only the first image loads with the page; the rest load once the page has finished loading,
 * so the slideshow never slows the first paint. Pauses while the tab is hidden and stays on the
 * first image for visitors who prefer reduced motion (the dots still work).
 */
export function HeroSlides({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [auto, setAuto] = useState(true);

  // load the remaining slides after the page (and its hero image) has loaded
  useEffect(() => {
    if (slides.length < 2) return;
    const go = () => window.setTimeout(() => setReady(true), 800);
    if (document.readyState === "complete") {
      const t = go();
      return () => window.clearTimeout(t);
    }
    let t: number | undefined;
    const onLoad = () => (t = go());
    window.addEventListener("load", onLoad, { once: true });
    return () => {
      window.removeEventListener("load", onLoad);
      if (t) window.clearTimeout(t);
    };
  }, [slides.length]);

  useEffect(() => {
    if (!ready || !auto || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setActive((i) => (i + 1) % slides.length);
    }, INTERVAL);
    return () => window.clearInterval(id);
  }, [ready, auto, slides.length]);

  return (
    <>
      <div className="hero-settle absolute inset-0">
        {slides.map((s, i) => {
          if (i > 0 && !ready) return null;
          const on = i === active;
          return (
            <picture key={s.src} aria-hidden={!on || undefined}>
              <source
                media="(max-width: 767px)"
                srcSet={s.mobile}
                sizes="100vw"
              />
              <source
                media="(min-width: 768px)"
                srcSet={s.desktop}
                sizes="100vw"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- responsive art direction via <picture> */}
              <img
                src={s.src}
                width={s.width}
                height={s.height}
                alt={on ? s.alt : ""}
                decoding="async"
                loading="eager"
                fetchPriority={i === 0 ? "high" : "low"}
                className={cx(
                  "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] ease-[var(--ease-luxe)] [transition-duration:1600ms,9000ms]",
                  s.position,
                  on ? "scale-100 opacity-100" : "scale-[1.06] opacity-0",
                )}
              />
            </picture>
          );
        })}
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-2 md:bottom-10 md:left-[max(4rem,calc((100vw-1520px)/2+4rem))] md:right-auto md:justify-start">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => {
                setReady(true);
                setActive(i);
                setAuto(false);
              }}
              aria-label={`Show campaign image ${i + 1} of ${slides.length}`}
              aria-current={i === active || undefined}
              className="group flex h-8 items-center"
            >
              <span
                className={cx(
                  "block h-px transition-all duration-700 ease-[var(--ease-luxe)]",
                  i === active
                    ? "w-10 bg-gold-pale"
                    : "w-5 bg-ivory/40 group-hover:bg-ivory/80",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

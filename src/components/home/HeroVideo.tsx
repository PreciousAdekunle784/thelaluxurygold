"use client";

import { useEffect, useRef, useState } from "react";

export interface HeroVideoSource {
  mp4: string;
  webm?: string;
}

/**
 * Looping background film for the hero. The server renders the poster image (the first
 * frame) so the page paints instantly; the video is attached after hydration, fades in
 * once it is actually playing, pauses when scrolled out of view, and is skipped for
 * visitors who prefer reduced motion or have data saver enabled.
 */
export function HeroVideo({ desktop, mobile }: { desktop: HeroVideoSource; mobile: HeroVideoSource }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<HeroVideoSource | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string; downlink?: number } }).connection;
    // Slow or metered connections keep the poster: the film is decoration, never a cost.
    const slow = !!conn && (conn.saveData || /(^|-)2g|3g/.test(conn.effectiveType ?? "") || (conn.downlink != null && conn.downlink < 2));
    if (reduce.matches || slow) return;
    const small = window.matchMedia("(max-width: 767px)");
    const pick = () => {
      const next = small.matches ? mobile : desktop;
      setSrc((cur) => {
        if (cur?.mp4 === next.mp4) return cur;
        setPlaying(false);
        return next;
      });
    };
    // Start fetching only after the page has fully loaded and the browser is idle, so the
    // video never competes with the page's own HTML, CSS, fonts and images.
    let cancelled = false;
    let idle: number | undefined;
    const start = () => {
      const run = () => !cancelled && pick();
      const w = window as Window & typeof globalThis;
      idle = typeof w.requestIdleCallback === "function" ? w.requestIdleCallback(run, { timeout: 2500 }) : w.setTimeout(run, 800);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    small.addEventListener("change", pick);
    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      const w = window as Window & typeof globalThis;
      if (idle !== undefined) {
        if (typeof w.cancelIdleCallback === "function") w.cancelIdleCallback(idle);
        else w.clearTimeout(idle);
      }
      small.removeEventListener("change", pick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sources are static; compare by URL
  }, [desktop.mp4, mobile.mp4]);

  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;
    v.load();
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tryPlay() : v.pause()), { threshold: 0.05 });
    io.observe(v);
    const onVis = () => (document.visibilityState === "visible" ? tryPlay() : v.pause());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [src]);

  if (!src) return null;
  return (
    <video
      ref={ref}
      key={src.mp4}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      disablePictureInPicture
      aria-hidden
      tabIndex={-1}
      onPlaying={() => setPlaying(true)}
      className="absolute inset-0 h-full w-full object-cover md:object-[8%_50%] transition-opacity duration-[1200ms] ease-[var(--ease-luxe)]"
      style={{ opacity: playing ? 1 : 0 }}
    >
      {src.webm && <source src={src.webm} type="video/webm" />}
      <source src={src.mp4} type="video/mp4" />
    </video>
  );
}

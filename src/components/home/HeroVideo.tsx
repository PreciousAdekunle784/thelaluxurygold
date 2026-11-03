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
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduce.matches || saveData) return;
    const small = window.matchMedia("(max-width: 767px)");
    const pick = () => {
      const next = small.matches ? mobile : desktop;
      setSrc((cur) => {
        if (cur?.mp4 === next.mp4) return cur;
        setPlaying(false);
        return next;
      });
    };
    pick();
    small.addEventListener("change", pick);
    return () => small.removeEventListener("change", pick);
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

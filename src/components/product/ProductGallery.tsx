"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { ProductImage } from "@/lib/data/types";
import { MediaImage } from "@/components/ui/MediaImage";
import { useEscape, useScrollLock } from "@/lib/hooks/ui";
import { cx } from "@/lib/format";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);
  useScrollLock(zoom !== null);
  useEscape(zoom !== null, () => setZoom(null));

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const on = () => setActive(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (zoom === null) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setZoom((z) => (z === null ? z : (z + 1) % images.length));
      if (e.key === "ArrowLeft") setZoom((z) => (z === null ? z : (z - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [zoom, images.length]);

  return (
    <div>
      {/* mobile: swipeable */}
      <div className="relative -mx-5 md:hidden">
        <div ref={track} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" aria-label={`${name} images`}>
          {images.map((img, i) => (
            <button key={img.media} type="button" onClick={() => setZoom(i)} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-sand" aria-label={`View image ${i + 1} of ${images.length} full screen`}>
              <MediaImage mediaKey={img.media} alt={img.alt} priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2" aria-hidden>
          {images.map((_, i) => (
            <span key={i} className={cx("h-px transition-all duration-500", i === active ? "w-8 bg-ink" : "w-4 bg-ink/30")} />
          ))}
        </div>
      </div>

      {/* desktop: editorial stack */}
      <div className="hidden gap-3 md:grid md:grid-cols-2">
        {images.map((img, i) => (
          <button
            key={img.media}
            type="button"
            onClick={() => setZoom(i)}
            className={cx("group relative cursor-zoom-in overflow-hidden bg-sand", i === 0 ? "col-span-2 aspect-[4/5] lg:aspect-[5/6]" : "aspect-[4/5]")}
            aria-label={`Enlarge image ${i + 1} of ${images.length}`}
          >
            <MediaImage mediaKey={img.media} alt={img.alt} priority={i === 0} sizes={i === 0 ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 29vw, 50vw"} className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-luxe)] group-hover:scale-[1.03]" />
            <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-ivory/80 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <Expand size={15} strokeWidth={1.3} />
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {zoom !== null && (
          <m.div className="fixed inset-0 z-[95] flex items-center justify-center bg-ivory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={`${name} image viewer`}>
            <div className="relative h-full w-full max-w-[min(100vw,82vh)]">
              <AnimatePresence mode="wait">
                <m.div key={zoom} className="absolute inset-0" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                  <MediaImage mediaKey={images[zoom].media} alt={images[zoom].alt} sizes="100vw" className="object-contain" />
                </m.div>
              </AnimatePresence>
            </div>
            <button type="button" onClick={() => setZoom(null)} className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-ivory/80 hover:bg-sand" aria-label="Close image viewer">
              <X size={20} strokeWidth={1.2} />
            </button>
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => setZoom((zoom - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/80 hover:bg-sand" aria-label="Previous image">
                  <ChevronLeft size={20} strokeWidth={1.2} />
                </button>
                <button type="button" onClick={() => setZoom((zoom + 1) % images.length)} className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/80 hover:bg-sand" aria-label="Next image">
                  <ChevronRight size={20} strokeWidth={1.2} />
                </button>
                <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs tabular-nums tracking-[0.2em] text-stone">
                  {zoom + 1} / {images.length}
                </p>
              </>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

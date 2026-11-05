"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Product } from "@/lib/data/types";
import { ProductCard } from "@/components/product/ProductCard";
import { TextLink } from "@/components/ui/Button";

const SPEED = 32; // px per second

/**
 * New arrivals rail that glides continuously. It is a real scroll container, so shoppers can still
 * swipe, drag or use the arrows; auto-scrolling pauses on hover, touch and keyboard focus, stops while
 * off screen, and is off entirely for visitors who prefer reduced motion. The list is rendered twice
 * (the copy is hidden from screen readers) so the loop never shows an end.
 */
export function NewArrivals({ products }: { products: Product[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const firstCopy = useRef<HTMLUListElement>(null);
  const paused = useRef(false);
  const resumeAt = useRef(0);

  useEffect(() => {
    const el = rail.current;
    if (!el || products.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    let raf = 0;
    let last = performance.now();
    let carry = 0;
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const loop = firstCopy.current?.offsetWidth ?? 0;
      if (visible && !paused.current && now > resumeAt.current && loop > 0 && !document.hidden) {
        carry += (SPEED * dt) / 1000;
        const step = Math.floor(carry);
        if (step >= 1) {
          carry -= step;
          el.scrollLeft += step;
        }
      }
      // once the first copy has scrolled past, jump back by exactly its width — the copy looks identical
      if (loop > 0 && el.scrollLeft >= loop) el.scrollLeft -= loop;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [products.length]);

  const pause = () => (paused.current = true);
  const resume = (delay = 0) => {
    paused.current = false;
    resumeAt.current = performance.now() + delay;
  };
  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    resumeAt.current = performance.now() + 4000;
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 16), behavior: "smooth" });
  };

  if (!products.length) return null;
  const cards = (copy: boolean) =>
    products.map((p, i) => (
      <li key={`${copy ? "b" : "a"}-${p.id}`} className="w-[66vw] shrink-0 sm:w-[40vw] md:w-[30vw] lg:w-[22vw] xl:w-[19vw]" >
        <ProductCard product={p} priority={!copy && i < 2} sizes="(min-width: 1280px) 19vw, (min-width: 1024px) 22vw, (min-width: 768px) 30vw, 66vw" />
      </li>
    ));

  return (
    <section className="overflow-hidden bg-ivory pb-20 pt-16 md:pb-28 md:pt-24" aria-labelledby="new-arrivals">
      <div className="container-luxe flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-4 flex items-center gap-3 text-champagne">
            <span className="h-px w-8 bg-current" /> Just arrived
          </p>
          <h2 id="new-arrivals" className="display text-[2.5rem] uppercase sm:text-5xl lg:text-[3.8rem]">
            New <span className="script">arrivals</span>
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <TextLink href="/new-arrivals">View all new pieces</TextLink>
          <div className="hidden gap-2 md:flex">
            <button type="button" onClick={() => nudge(-1)} aria-label="Previous pieces" className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/25 transition-colors hover:bg-ink hover:text-ivory">
              <ArrowLeft size={16} strokeWidth={1.3} />
            </button>
            <button type="button" onClick={() => nudge(1)} aria-label="More pieces" className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/25 transition-colors hover:bg-ink hover:text-ivory">
              <ArrowRight size={16} strokeWidth={1.3} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={rail}
        className="no-scrollbar mt-10 flex overflow-x-auto pl-5 md:mt-14 md:pl-10 xl:pl-16"
        onPointerEnter={(e) => e.pointerType === "mouse" && pause()}
        onPointerLeave={(e) => e.pointerType === "mouse" && resume()}
        onTouchStart={pause}
        onTouchEnd={() => resume(3500)}
        onFocus={pause}
        onBlur={() => resume(1500)}
        onWheel={() => (resumeAt.current = performance.now() + 2500)}
        aria-label="New arrivals"
        role="region"
      >
        <ul ref={firstCopy} className="flex shrink-0 gap-4 pr-4">
          {cards(false)}
        </ul>
        {products.length > 1 && (
          <ul className="flex shrink-0 gap-4 pr-4" aria-hidden>
            {cards(true)}
          </ul>
        )}
      </div>
    </section>
  );
}

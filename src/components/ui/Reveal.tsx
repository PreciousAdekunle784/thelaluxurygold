"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/lib/format";

/*
 * Scroll reveals in plain CSS + one shared IntersectionObserver (no animation library),
 * so they cost almost nothing to download and work smoothly on slow phones.
 * Content is visible by default if JavaScript hasn't run yet (see globals.css).
 */

let observer: IntersectionObserver | null = null;
function observe(el: Element) {
  if (typeof IntersectionObserver === "undefined") {
    el.classList.add("is-in");
    return () => {};
  }
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          observer?.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  observer.observe(el);
  return () => observer?.unobserve(el);
}

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already on screen at load: leave it visible (no flash). Only arm what is below the fold.
    // Items outside the viewport horizontally (e.g. in a swipeable carousel) are never armed,
    // so a fast swipe can't leave a card invisible.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92 || r.left >= window.innerWidth || r.right <= 0) return;
    el.classList.add("reveal-armed");
    return observe(el);
  }, []);
  return ref;
}

type Tag = "div" | "li" | "section" | "article";

export function Reveal({ children, delay = 0, className, as = "div" }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: Tag }) {
  const ref = useReveal<HTMLElement>();
  const Comp = as as "div";
  const style = delay ? ({ "--reveal-delay": `${delay}s` } as CSSProperties) : undefined;
  return (
    <Comp ref={ref as React.Ref<HTMLDivElement>} className={cx("reveal", className)} style={style}>
      {children}
    </Comp>
  );
}

/** Image reveal: a soft scale-down with a fade, used on editorial imagery. */
export function ImageReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useReveal<HTMLDivElement>();
  const style = delay ? ({ "--reveal-delay": `${delay}s` } as CSSProperties) : undefined;
  return (
    <div ref={ref} className={cx("reveal-image", className)} style={style}>
      {children}
    </div>
  );
}

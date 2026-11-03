import type { ReactNode } from "react";

/* Hero entrance animations in pure CSS (see globals.css), so the headline animates in
   on first paint without waiting for JavaScript — important on slow connections. */

export function HeroMotion({ children }: { children: ReactNode }) {
  return <div className="hero-settle absolute inset-0">{children}</div>;
}

export function HeroLine({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <span className="block overflow-hidden pb-[0.14em] pt-[0.04em]">
      <span className="hero-rise block" style={{ animationDelay: `${delay}s` }}>
        {children}
      </span>
    </span>
  );
}

export function HeroFade({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`hero-fade ${className ?? ""}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

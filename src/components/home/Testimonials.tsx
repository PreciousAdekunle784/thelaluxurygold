"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Testimonial } from "@/lib/data/testimonials";
import { Reveal } from "@/components/ui/Reveal";

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const [i, setI] = useState(0);
  const t = testimonials[i % testimonials.length];
  const go = (d: number) => setI((n) => (n + d + testimonials.length) % testimonials.length);

  return (
    <section className="bg-sage-mist py-24 md:py-36" aria-labelledby="testimonials">
      <div className="container-luxe">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow mb-5 flex items-center gap-3 text-forest">
              <span className="h-px w-8 bg-current" /> Client words
            </p>
            <h2 id="testimonials" className="display text-[2.4rem] uppercase sm:text-5xl">
              In their <span className="script">words</span>
            </h2>
          </Reveal>

          <div className="lg:col-span-7 lg:col-start-6">
            <div className="relative min-h-[300px] md:min-h-[280px]">
              <AnimatePresence mode="wait">
                <m.figure
                  key={i}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span aria-hidden className="block font-display text-7xl leading-[0.5] text-champagne">“</span>
                  <blockquote className="mt-4 font-display text-[1.75rem] font-normal leading-[1.3] text-forest md:text-[2.4rem]">{t.quote}</blockquote>
                  <figcaption className="mt-8 flex flex-wrap items-center gap-3 text-[0.72rem] uppercase tracking-[0.2em] text-forest/80">
                    <span>{t.name}</span>
                    {t.detail && <span className="text-forest/60">· {t.detail}</span>}
                  </figcaption>
                </m.figure>
              </AnimatePresence>
            </div>
            {testimonials.length > 1 && (
            <div className="mt-10 flex items-center gap-6">
              <button type="button" onClick={() => go(-1)} aria-label="Previous testimonial" className="flex h-12 w-12 items-center justify-center rounded-full border border-forest/30 text-forest transition-colors hover:bg-forest hover:text-ivory">
                <ArrowLeft size={16} strokeWidth={1.3} />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next testimonial" className="flex h-12 w-12 items-center justify-center rounded-full border border-forest/30 text-forest transition-colors hover:bg-forest hover:text-ivory">
                <ArrowRight size={16} strokeWidth={1.3} />
              </button>
              <span className="text-xs tabular-nums tracking-[0.2em] text-forest/70">
                {String((i % testimonials.length) + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
              </span>
            </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

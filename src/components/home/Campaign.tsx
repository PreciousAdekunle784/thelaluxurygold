"use client";

import { useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { MediaImage } from "@/components/ui/MediaImage";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";

export function Campaign() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);

  return (
    <section ref={ref} className="relative flex min-h-[620px] items-end overflow-hidden bg-burgundy-deep text-ivory md:min-h-[760px] lg:h-[92vh] lg:max-h-[980px]" aria-labelledby="campaign">
      <m.div style={{ y }} className="absolute -inset-y-[8%] inset-x-0">
        <MediaImage mediaKey="campaign/campaign-burgundy" alt="A 22K bangle, an open cuff and a rope chain resting on folds of burgundy silk" sizes="100vw" quality={82} className="object-cover object-[62%_50%]" />
      </m.div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(44,9,21,0.92)_0%,rgba(44,9,21,0.25)_50%,transparent_75%)] md:bg-[linear-gradient(90deg,rgba(44,9,21,0.85)_0%,rgba(44,9,21,0.2)_45%,transparent_65%)]" />
      <div className="container-luxe relative pb-14 md:pb-20">
        <Reveal className="max-w-2xl">
          <p className="eyebrow mb-6 flex items-center gap-3 text-gold-pale">
            <span className="h-px w-8 bg-current" /> The campaign
          </p>
          <h2 id="campaign" className="display text-[2.9rem] uppercase sm:text-6xl lg:text-[5.4rem]">
            Made to be <span className="script text-gold-pale">cherished.</span>
          </h2>
          <p className="mt-7 max-w-md text-[1rem] leading-relaxed text-ivory/80">Celebrate the moments that matter with gold that never goes out of style — bangles, cuffs and chains in 18K to 22K gold.</p>
          <div className="mt-10">
            <ButtonLink href="/collections/bracelets" variant="light" size="lg">
              Discover bracelets
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

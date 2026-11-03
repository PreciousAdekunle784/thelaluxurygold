import { MediaImage } from "@/components/ui/MediaImage";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { Monogram } from "@/components/brand/Logo";

export function BrandStory() {
  return (
    <section className="overflow-hidden py-24 md:py-40" aria-labelledby="brand-story">
      <div className="container-luxe grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="relative lg:col-span-6 xl:col-span-5 xl:col-start-2">
          <ImageReveal className="arch relative aspect-[4/5] overflow-hidden bg-burgundy">
            <MediaImage mediaKey="editorial/story" alt="Stacked gold rings on a travertine block against deep burgundy" sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </ImageReveal>
          <Reveal delay={0.3} className="absolute -bottom-10 -right-2 w-[38%] sm:-right-8 lg:-right-16">
            <div className="relative aspect-square overflow-hidden border-[6px] border-ivory bg-burgundy shadow-[0_30px_60px_-30px_rgba(17,17,17,0.45)]">
              <MediaImage mediaKey="editorial/social-4" alt="Close view of the Maison signet ring" sizes="20vw" className="object-cover" />
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-6 lg:pl-10 xl:col-span-5 xl:col-start-8 xl:pl-0">
          <Reveal>
            <Monogram className="mb-10 h-16 w-auto" />
            <p className="eyebrow mb-6 flex items-center gap-3 text-champagne">
              <span className="h-px w-8 bg-current" /> Our house
            </p>
            <h2 id="brand-story" className="display text-[2.6rem] uppercase sm:text-5xl lg:text-[4rem]">
              More than gold.
              <br />
              <span className="script">A legacy.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15} className="mt-10 max-w-lg space-y-5 text-[1rem] leading-[1.85] text-ink/75">
            <p>
              At LA Luxury Gold, we believe gold is more than a precious metal. It represents milestones, memories, love and lasting value.
            </p>
            <p>
              From beautifully crafted jewellery to investment-worthy gold, every piece reflects our commitment to quality, authenticity and timeless
              elegance.
            </p>
          </Reveal>
          <Reveal delay={0.25} className="mt-12">
            <ButtonLink href="/about" variant="outline" size="lg">
              Our story
            </ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

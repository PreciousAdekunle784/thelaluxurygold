import { MediaImage } from "@/components/ui/MediaImage";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { TextLink } from "@/components/ui/Button";

/* Karat is a fixed definition — parts of pure gold in 24 — so these figures are not marketing claims. */
const purity = [
  { k: "18K", parts: "18 / 24", pct: "75.0%", use: "Rings, chains, earrings — hard-wearing for every day" },
  { k: "21K", parts: "21 / 24", pct: "87.5%", use: "Signets and medallions with a deeper yellow" },
  { k: "22K", parts: "22 / 24", pct: "91.7%", use: "Bangles and domes in rich, warm gold" },
  { k: "24K", parts: "24 / 24", pct: "Pure", use: "Gold bars" },
];

export function GoldExperience() {
  return (
    <section className="relative overflow-hidden bg-obsidian text-ivory" aria-labelledby="gold-experience">
      <div className="container-luxe grid gap-16 py-24 md:py-36 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <ImageReveal className="relative aspect-[10/7] overflow-hidden bg-obsidian-soft">
            <MediaImage mediaKey="details/gold-texture" alt="Macro detail of a 22K gold rope chain, its twisted links catching the light" sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </ImageReveal>
          <div className="mt-6 grid grid-cols-5 gap-6">
            <ImageReveal className="relative col-span-3 aspect-[10/7] overflow-hidden bg-obsidian-soft" delay={0.15}>
              <MediaImage mediaKey="details/jewellery-craftsmanship" alt="A polished signet ring standing above a cable chain on travertine" sizes="(min-width: 1024px) 30vw, 60vw" className="object-cover" />
            </ImageReveal>
            <Reveal delay={0.25} className="col-span-2 self-end">
              <p className="text-[0.8rem] leading-relaxed text-ivory/55">Polished faces, crisp edges and links that move freely — the details worth looking at closely.</p>
            </Reveal>
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8 lg:pt-10">
          <Reveal>
            <p className="eyebrow mb-6 flex items-center gap-3 text-champagne">
              <span className="h-px w-8 bg-current" /> The gold experience
            </p>
            <h2 id="gold-experience" className="display text-[2.6rem] uppercase sm:text-5xl lg:text-[4.1rem]">
              Know your <span className="script text-gold-pale">gold</span>
            </h2>
            <p className="mt-8 max-w-md text-[1rem] leading-[1.85] text-ivory/70">
              Karat tells you how much of a piece is pure gold. Every LA Luxury Gold product states its purity, and its weight where we list it — on the product page and again in
              your order summary.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <dl className="mt-12 border-t border-line-light">
              {purity.map((p) => (
                <div key={p.k} className="grid grid-cols-[4.5rem_1fr_auto] items-baseline gap-4 border-b border-line-light py-5">
                  <dt className="font-display text-[1.9rem] leading-none text-gold-pale">{p.k}</dt>
                  <dd className="text-[0.82rem] leading-relaxed text-ivory/60">{p.use}</dd>
                  <dd className="text-right">
                    <span className="block font-display text-xl leading-none">{p.pct}</span>
                    <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.2em] text-ivory/40">{p.parts}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal delay={0.25} className="mt-10">
            <TextLink href="/faq" light>
              Questions about purity
            </TextLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

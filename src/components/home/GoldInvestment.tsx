import { MediaImage } from "@/components/ui/MediaImage";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { getCatalogue } from "@/lib/data/store-catalogue";

export async function GoldInvestment() {
  const weights = (await getCatalogue())
    .filter((p) => p.category === "gold-bars" && p.weightGrams)
    .map((p) => p.weightGrams!)
    .sort((a, b) => a - b);

  return (
    <section className="relative overflow-hidden bg-[#141c18] text-ivory" aria-labelledby="gold-investment">
      <div className="grid lg:min-h-[760px] lg:grid-cols-2">
        <div className="relative order-1 aspect-[10/7] lg:order-2 lg:aspect-auto">
          <ImageReveal className="absolute inset-0">
            <MediaImage mediaKey="editorial/investment" alt="24K minted gold bars fanned beside a cast gold bar on dark stone" sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </ImageReveal>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,#141c18_0%,transparent_30%)] lg:bg-[linear-gradient(90deg,#141c18_0%,transparent_28%)]" />
        </div>

        <div className="container-luxe order-2 flex items-center py-20 lg:order-1 lg:py-28 lg:pr-16">
          <div className="max-w-xl xl:ml-[8%]">
            <Reveal>
              <p className="eyebrow mb-6 flex items-center gap-3 text-gold">
                <span className="h-px w-8 bg-current" /> 24K gold bars
              </p>
              <h2 id="gold-investment" className="display text-[2.7rem] uppercase sm:text-5xl lg:text-[4.4rem]">
                Own something
                <br />
                <span className="font-light italic normal-case text-gold-pale">that lasts.</span>
              </h2>
              <p className="mt-8 max-w-md text-[1rem] leading-[1.85] text-ivory/70">
                Explore our collection of 24K gold bars. A timeless way to own a piece of enduring value.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <dl className="mt-12 grid grid-cols-3 border-y border-line-light">
                <div className="py-6 pr-4">
                  <dt className="eyebrow text-ivory/50">Purity</dt>
                  <dd className="mt-2 font-display text-3xl">24K</dd>
                </div>
                <div className="border-l border-line-light px-4 py-6">
                  <dt className="eyebrow text-ivory/50">Weights</dt>
                  <dd className="mt-2 font-display text-3xl">
                    {weights.length ? `${weights[0]}–${weights[weights.length - 1]} g` : "—"}
                  </dd>
                </div>
                <div className="border-l border-line-light py-6 pl-4">
                  <dt className="eyebrow text-ivory/50">Finish</dt>
                  <dd className="mt-2 font-display text-3xl">Minted · Cast</dd>
                </div>
              </dl>
            </Reveal>

            <Reveal delay={0.25} className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-center">
              <ButtonLink href="/gold-bars" variant="gold" size="lg">
                Explore gold bars
              </ButtonLink>
            </Reveal>
            <p className="mt-10 max-w-md text-[0.72rem] leading-relaxed text-ivory/45">
              The value of gold can go down as well as up. Nothing on this website is financial advice; please seek independent advice before
              making investment decisions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArtImage } from "@/components/ui/ArtImage";
import { Reveal } from "@/components/ui/Reveal";
import { getCatalogue } from "@/lib/data/store-catalogue";

/** 24K gold bars: one full-bleed photograph, the weights as shortcuts, one clear action. */
export async function GoldInvestment() {
  const bars = (await getCatalogue()).filter((p) => p.category === "gold-bars" && p.weightGrams).sort((a, b) => a.weightGrams! - b.weightGrams!);

  return (
    <section className="relative overflow-hidden bg-obsidian text-ivory" aria-labelledby="gold-investment">
      <div className="relative h-[92svh] max-h-[980px] min-h-[600px]">
        <div className="parallax-img absolute inset-0">
          <ArtImage
            desktop="campaign/bars-feature-desktop"
            mobile="campaign/bars-feature-mobile"
            alt="A 24K cast gold bar beside a stack of minted bars, reflected on polished obsidian"
            className="h-full w-full object-cover object-[65%_50%]"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-obsidian/85 via-obsidian/30 to-transparent to-60% md:bg-gradient-to-r md:from-obsidian/90 md:via-obsidian/45 md:to-transparent md:to-70%" />
        <div className="container-luxe relative flex h-full flex-col justify-start pt-16 text-center md:items-start md:justify-center md:pt-0 md:text-left">
          <Reveal>
            <p className="eyebrow text-gold-pale">24K · Minted & cast</p>
            <h2 id="gold-investment" className="display mt-5 text-[3rem] uppercase leading-[0.9] sm:text-6xl lg:text-[5.6rem]">
              Gold <span className="script text-gold-pale">bars</span>
            </h2>
            {bars.length > 0 && (
              <ul className="mt-8 flex flex-wrap justify-center gap-2 md:justify-start" aria-label="Gold bar weights">
                {bars.map((b) => (
                  <li key={b.id}>
                    <Link href={`/product/${b.slug}`} className="inline-flex h-10 min-w-16 items-center justify-center border border-ivory/35 px-4 text-[0.72rem] tabular-nums tracking-[0.12em] transition-colors hover:border-gold-pale hover:bg-gold-pale hover:text-ink">
                      {b.weightGrams} g
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/gold-bars" className="mt-8 inline-flex h-12 items-center bg-champagne px-7 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-ink transition-colors hover:bg-gold">
              Discover gold bars
            </Link>
          </Reveal>
        </div>
      </div>
      <p className="container-luxe py-4 text-center text-[0.62rem] leading-relaxed text-ivory/45 md:text-left">
        The value of gold can go down as well as up. Nothing on this website is financial advice.
      </p>
    </section>
  );
}

import Link from "next/link";
import { ArtImage } from "@/components/ui/ArtImage";
import { Reveal } from "@/components/ui/Reveal";
import { cx } from "@/lib/format";

/**
 * Full-width campaign photograph that separates major sections. The whole image is a link,
 * with a two-line headline and one clear shopping action; the photo drifts gently on scroll.
 */
export function CampaignBand({
  desktop,
  mobile,
  alt,
  eyebrow,
  title,
  script,
  cta,
  href,
  align = "left",
  tone = "dark",
}: {
  desktop: string;
  mobile?: string;
  alt: string;
  eyebrow: string;
  title: string;
  script?: string;
  cta: string;
  href: string;
  align?: "left" | "right";
  tone?: "dark" | "burgundy" | "emerald";
}) {
  const veil = {
    dark: "from-obsidian/80",
    burgundy: "from-burgundy-deep/85",
    emerald: "from-emerald-deep/85",
  }[tone];
  return (
    <section className="relative" aria-label={`${title}${script ? ` ${script}` : ""}`}>
      <Link href={href} className="group relative block h-[88svh] max-h-[960px] min-h-[560px] overflow-hidden bg-obsidian text-ivory">
        <div className="parallax-img absolute inset-0">
          <ArtImage
            desktop={desktop}
            mobile={mobile}
            alt={alt}
            className="h-full w-full object-cover transition-transform duration-[2400ms] ease-[var(--ease-luxe)] group-hover:scale-[1.03]"
          />
        </div>
        {/* phones: a fade at the top behind the type; desktop: a fade from the text side */}
        <div
          className={cx(
            "pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent to-55% md:to-50%",
            veil,
            align === "left" ? "md:bg-gradient-to-r" : "md:bg-gradient-to-l",
          )}
        />
        <div className={cx("container-luxe relative flex h-full flex-col justify-start pt-16 text-center md:justify-center md:pt-0", align === "left" ? "md:items-start md:text-left" : "md:items-end md:text-right")}>
          <Reveal>
            <p className="eyebrow text-gold-pale">{eyebrow}</p>
            <h2 className="display mt-5 text-[2.9rem] uppercase leading-[0.9] sm:text-6xl lg:text-[5.4rem]">
              {title}
              {script && (
                <>
                  <br />
                  <span className="script text-gold-pale">{script}</span>
                </>
              )}
            </h2>
            <span className="mt-9 inline-flex h-12 items-center gap-3 border border-ivory/70 px-7 text-[0.68rem] font-semibold uppercase tracking-[0.24em] transition-colors duration-500 group-hover:bg-ivory group-hover:text-ink">
              {cta}
              <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
                <path d="M0 4h16M13 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
            </span>
          </Reveal>
        </div>
      </Link>
    </section>
  );
}

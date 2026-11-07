import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Monogram } from "@/components/brand/Logo";
import { ArtImage } from "@/components/ui/ArtImage";
import { UnlockForm } from "@/components/private/UnlockForm";
import { hasPrivateAccess } from "@/lib/private/access";

export const instant = false;
export const metadata: Metadata = { title: "Private Access", robots: { index: false, follow: false } };

/** The entrance to the Private Collection. Reveals nothing about the collection itself. */
export default async function PrivateAccessPage() {
  if (await hasPrivateAccess()) redirect("/private/collection");
  return (
    <section className="relative -mt-[var(--header-h)] flex min-h-[100svh] items-center overflow-hidden bg-emerald-deep text-ivory" aria-label="Private access">
      <div className="absolute inset-0 opacity-40">
        <ArtImage desktop="campaign/emerald-desktop" mobile="campaign/emerald-mobile" alt="" className="h-full w-full scale-105 object-cover blur-[2px]" priority />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,51,38,0.55)_0%,rgba(14,51,38,0.92)_65%,#0b291f_100%)]" />
      <div className="pointer-events-none absolute inset-x-5 bottom-5 top-[calc(var(--header-h)+0.5rem)] border border-gold-pale/15 md:inset-x-8 md:bottom-8 md:top-[calc(var(--header-h)+1rem)]" />

      <div className="container-luxe relative py-[calc(var(--header-h)+3rem)] text-center">
        <div className="hero-fade" style={{ animationDelay: "0.2s" }}>
          <Monogram tone="ivory" className="mx-auto h-16 w-auto md:h-20" />
          <p className="eyebrow mt-10 text-gold-pale">LaLuxuryGold · Private Access</p>
        </div>
        <h1 className="display mx-auto mt-6 max-w-3xl text-[2.6rem] uppercase leading-[0.95] sm:text-6xl lg:text-[4.6rem]">
          <span className="hero-rise block" style={{ animationDelay: "0.35s" }}>
            An experience
          </span>
          <span className="hero-rise block" style={{ animationDelay: "0.5s" }}>
            <span className="script text-gold-pale">reserved for you</span>
          </span>
        </h1>
        <div className="hero-fade" style={{ animationDelay: "0.8s" }}>
          <p className="mx-auto mt-7 max-w-md text-[0.95rem] leading-relaxed text-ivory/75">
            You have been invited to explore our private collection. Enter your exclusive access code to continue.
          </p>
          <UnlockForm />
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { ArtImage } from "@/components/ui/ArtImage";
import { PrivateGrid } from "@/components/private/PrivateGrid";
import { hasPrivateAccess, privateSession } from "@/lib/private/access";
import { listProductRows } from "@/lib/repo/products";
import { RegisterPrivateProducts } from "@/lib/state/catalogue";
import { whatsappLink } from "@/lib/whatsapp";

export const instant = false;
export const metadata: Metadata = { title: "The Private Collection", robots: { index: false, follow: false } };

export default async function PrivateCollectionPage() {
  if (!(await hasPrivateAccess())) redirect("/private");
  const [session, rows] = await Promise.all([privateSession(), listProductRows({ visibility: "private" })]);
  const products = rows.map((r) => r.product);
  const firstName = session?.name?.split(" ")[0];

  return (
    <>
      <RegisterPrivateProducts products={products} />
      <section className="relative -mt-[var(--header-h)] flex min-h-[78svh] items-end overflow-hidden bg-emerald-deep text-ivory" aria-labelledby="private-title">
        <div className="parallax-img absolute inset-0">
          <ArtImage desktop="campaign/band-necklace-desktop" mobile="campaign/band-necklace-mobile" alt="" className="h-full w-full object-cover opacity-70" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep via-emerald-deep/60 to-emerald-deep/20 md:bg-gradient-to-r md:from-emerald-deep md:via-emerald-deep/70 md:to-transparent" />
        <div className="container-luxe relative pb-16 pt-[calc(var(--header-h)+4rem)] md:pb-24">
          <p className="eyebrow hero-fade text-gold-pale" style={{ animationDelay: "0.2s" }}>
            The Private Collection{firstName ? ` · Welcome, ${firstName}` : ""}
          </p>
          <h1 id="private-title" className="display mt-6 max-w-3xl text-[2.8rem] uppercase leading-[0.92] sm:text-6xl lg:text-[5.2rem]">
            <span className="hero-rise block" style={{ animationDelay: "0.3s" }}>
              Beyond the ordinary.
            </span>
            <span className="hero-rise block" style={{ animationDelay: "0.45s" }}>
              <span className="script text-gold-pale">Reserved for you.</span>
            </span>
          </h1>
        </div>
      </section>

      <section className="bg-ivory py-16 md:py-24" aria-label="Private pieces">
        <div className="container-luxe">
          {products.length ? (
            <PrivateGrid products={products} />
          ) : (
            <div className="mx-auto max-w-md py-16 text-center">
              <p className="font-display text-3xl">New private pieces are being prepared</p>
              <p className="mt-4 text-sm leading-relaxed text-stone">Our team will share them with you personally.</p>
              <a href={whatsappLink("Hello LA Luxury Gold, I'd like to hear about the Private Collection.")} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] hover:text-forest">
                <MessageCircle size={16} strokeWidth={1.3} /> Speak with our team
              </a>
            </div>
          )}
          <form action="/api/private/leave" method="post" className="mt-20 flex justify-center">
            <button type="submit" className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-stone underline underline-offset-4 hover:text-ink">
              Leave the private collection
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

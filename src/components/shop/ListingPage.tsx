import { Suspense } from "react";
import type { ReactNode } from "react";
import { PageIntro } from "./PageIntro";
import { ShopView, type ShopPreset } from "./ShopView";
import { ShopSkeleton } from "./ShopSkeleton";
import { MediaImage } from "@/components/ui/MediaImage";

/** A shop listing with an editorial banner image, used by the curated listing routes. */
export function ListingPage({ crumb, eyebrow, title, intro, media, alt, preset }: { crumb: string; eyebrow: string; title: ReactNode; intro: string; media: string; alt: string; preset: ShopPreset }) {
  return (
    <>
      <section className="relative h-[42vh] min-h-[320px] overflow-hidden bg-obsidian md:h-[52vh]">
        <MediaImage mediaKey={media} alt={alt} priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,16,15,0.45)_0%,rgba(17,16,15,0)_40%)]" />
      </section>
      <PageIntro crumbs={[{ name: "Home", href: "/" }, { name: crumb }]} eyebrow={eyebrow} title={title} intro={intro} />
      <Suspense fallback={<ShopSkeleton preset={preset} />}>
        <ShopView preset={preset} />
      </Suspense>
    </>
  );
}

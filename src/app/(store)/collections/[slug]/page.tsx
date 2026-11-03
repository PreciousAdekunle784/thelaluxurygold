import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { categories, collections, getCategory, getCollection } from "@/lib/data/categories";
import { PageIntro } from "@/components/shop/PageIntro";
import { ShopView } from "@/components/shop/ShopView";
import { ShopSkeleton } from "@/components/shop/ShopSkeleton";
import { MediaImage } from "@/components/ui/MediaImage";
import type { CategorySlug } from "@/lib/data/types";

export function generateStaticParams() {
  return [...categories.filter((c) => c.slug !== "gold-bars").map((c) => ({ slug: c.slug })), ...collections.map((c) => ({ slug: c.slug }))];
}

function resolve(slug: string) {
  const category = getCategory(slug);
  if (category) return { kind: "category" as const, name: category.name, intro: category.intro, media: category.media };
  const collection = getCollection(slug);
  if (collection) return { kind: "collection" as const, name: collection.name, intro: collection.intro, media: collection.media };
  return null;
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = resolve(slug);
  if (!r) return { title: "Collection not found" };
  return {
    title: r.kind === "category" ? `Gold ${r.name}` : r.name,
    description: r.intro,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: { images: [{ url: `/images/${r.media}.webp` }] },
  };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const r = resolve(slug);
  if (!r) notFound();
  const preset = r.kind === "category" ? { category: slug as CategorySlug } : { collection: slug };

  return (
    <>
      <section className="relative h-[46vh] min-h-[340px] overflow-hidden bg-forest md:h-[56vh]">
        <MediaImage mediaKey={r.media} alt="" priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.35)_0%,rgba(17,17,17,0)_40%)]" />
      </section>
      <PageIntro
        crumbs={[{ name: "Home", href: "/" }, { name: "Collections", href: "/collections" }, { name: r.name }]}
        eyebrow={r.kind === "category" ? "Category" : "Curated edit"}
        title={r.name}
        intro={r.intro}
      />
      <Suspense fallback={<ShopSkeleton preset={preset} />}>
        <ShopView preset={preset} />
      </Suspense>
    </>
  );
}

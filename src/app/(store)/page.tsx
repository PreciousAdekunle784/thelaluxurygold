import { Hero } from "@/components/home/Hero";
import { NewArrivals } from "@/components/home/NewArrivals";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { EditorialShowcase } from "@/components/home/EditorialShowcase";
import { ClientConfidence } from "@/components/home/ClientConfidence";
import { GoldInvestment } from "@/components/home/GoldInvestment";
import { Testimonials } from "@/components/home/Testimonials";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { getCatalogue } from "@/lib/data/store-catalogue";
import { getSiteSettings } from "@/lib/data/site-settings";
import type { Product } from "@/lib/data/types";

/** Pieces flagged "new", newest first — topped up with the latest additions if there are only a few. */
function newArrivals(products: Product[]) {
  const newest = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const flagged = newest.filter((p) => p.isNew);
  return [...flagged, ...newest.filter((p) => !p.isNew && p.category !== "gold-bars")].slice(0, Math.max(flagged.length, 6));
}

/* Rhythm: dark hero → ivory new arrivals → white categories → ivory edit → white confidence →
   emerald gold bars → (testimonials) → newsletter. */
export default async function HomePage() {
  const [products, settings] = await Promise.all([getCatalogue(), getSiteSettings()]);
  const arrivals = newArrivals(products);
  return (
    <>
      <Hero />
      <NewArrivals products={arrivals} />
      <CategoryShowcase />
      <EditorialShowcase products={products.filter((p) => !arrivals.includes(p))} />
      <ClientConfidence reviews={settings.testimonials.length} />
      <GoldInvestment />
      {settings.testimonials.length > 0 && <Testimonials testimonials={settings.testimonials} />}
      <NewsletterSection />
    </>
  );
}

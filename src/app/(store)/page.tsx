import { Hero } from "@/components/home/Hero";
import { NewArrivals } from "@/components/home/NewArrivals";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { EditorialShowcase } from "@/components/home/EditorialShowcase";
import { ClientConfidence } from "@/components/home/ClientConfidence";
import { CampaignBand } from "@/components/home/CampaignBand";
import { GiftEdit } from "@/components/home/GiftEdit";
import { SocialGallery } from "@/components/home/SocialGallery";
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

/* Image-first rhythm: cinematic hero → new arrivals → collections → campaign → featured pieces →
   campaign → gifting → 24K gold bars → service strip → (testimonials) → social gallery → newsletter. */
export default async function HomePage() {
  const [products, settings] = await Promise.all([getCatalogue(), getSiteSettings()]);
  const arrivals = newArrivals(products);
  return (
    <>
      <Hero />
      <NewArrivals products={arrivals} />
      <CategoryShowcase />
      <CampaignBand
        desktop="campaign/band-necklace-desktop"
        mobile="campaign/band-necklace-mobile"
        alt="Layered gold chains and a sun medallion on burgundy velvet"
        eyebrow="Necklaces"
        title="Layered"
        script="in gold"
        cta="Shop necklaces"
        href="/collections/necklaces"
        align="left"
        tone="dark"
      />
      <EditorialShowcase products={products.filter((p) => !arrivals.includes(p))} />
      <CampaignBand
        desktop="campaign/band-earrings-desktop"
        mobile="campaign/band-earrings-mobile"
        alt="Gold hoops, drop earrings and a huggie on burgundy velvet"
        eyebrow="Earrings"
        title="Made to be"
        script="cherished"
        cta="Shop earrings"
        href="/collections/earrings"
        align="left"
        tone="burgundy"
      />
      <GiftEdit products={products} />
      <GoldInvestment />
      <ClientConfidence />
      {settings.testimonials.length > 0 && <Testimonials testimonials={settings.testimonials} />}
      <SocialGallery />
      <NewsletterSection />
    </>
  );
}

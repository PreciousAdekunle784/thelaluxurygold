import { Hero } from "@/components/home/Hero";
import { EditorialShowcase } from "@/components/home/EditorialShowcase";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { GoldExperience } from "@/components/home/GoldExperience";
import { BrandStory } from "@/components/home/BrandStory";
import { Campaign } from "@/components/home/Campaign";
import { ClientConfidence } from "@/components/home/ClientConfidence";
import { GoldInvestment } from "@/components/home/GoldInvestment";
import { Testimonials } from "@/components/home/Testimonials";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { getCatalogue } from "@/lib/data/store-catalogue";
import { getSiteSettings } from "@/lib/data/site-settings";

/* Rhythm: dark hero → ivory edit → white categories → obsidian gold → linen story →
   burgundy campaign → white confidence → emerald bars → (testimonials) → newsletter. */
export default async function HomePage() {
  const [products, settings] = await Promise.all([getCatalogue(), getSiteSettings()]);
  return (
    <>
      <Hero />
      <EditorialShowcase products={products} />
      <CategoryShowcase />
      <GoldExperience />
      <BrandStory />
      <Campaign />
      <ClientConfidence reviews={settings.testimonials.length} />
      <GoldInvestment />
      {settings.testimonials.length > 0 && <Testimonials testimonials={settings.testimonials} />}
      <NewsletterSection />
    </>
  );
}

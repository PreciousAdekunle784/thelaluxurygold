import { Hero } from "@/components/home/Hero";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { BrandStory } from "@/components/home/BrandStory";
import { GoldInvestment } from "@/components/home/GoldInvestment";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { Campaign } from "@/components/home/Campaign";
import { Testimonials } from "@/components/home/Testimonials";
import { SocialGrid } from "@/components/home/SocialGrid";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { getProducts } from "@/lib/data/catalogue";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryShowcase />
      <FeaturedCollection products={getProducts()} />
      <BrandStory />
      <GoldInvestment />
      <WhyChooseUs />
      <Campaign />
      <Testimonials />
      <SocialGrid />
      <NewsletterSection />
    </>
  );
}

import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autorec - AI-Powered Web Scraping Solution",
  description: "Extract structured data from any website with our advanced AI-powered scraping tool.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
    </>
  );
}

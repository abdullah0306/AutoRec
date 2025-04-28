import { PricingSection } from "@/components/landing/pricing-section";

export const metadata = {
  title: "Pricing - Autorec AI",
  description: "Choose the subscription plan that fits your needs",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">      
      <PricingSection />
    </div>
  );
}

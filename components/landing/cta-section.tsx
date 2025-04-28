import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 bg-primary text-white">
      <div className="container mx-auto max-w-6xl px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to start scraping?</h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
          Sign up now and get access to all features with a free trial.
          No credit card required.
        </p>
        <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/20">
          <Link href="/register">Get Started For Free</Link>
        </Button>
      </div>
    </section>
  );
}

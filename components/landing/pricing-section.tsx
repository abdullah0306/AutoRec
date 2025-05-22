"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Subscription, SubscriptionPackage } from "@/types/subscription";
import { subscriptions } from "@/lib/api";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";

export function PricingSection() {
  const t = useTranslations("Marketing.pricing");
  const common = useTranslations("Common");
  
  const { isAuthenticated } = useAuth();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching packages...');
        const packagesData = await subscriptions.getPackages();
        console.log('Raw packages data:', packagesData);
        const filteredPackages = packagesData.filter((pkg: SubscriptionPackage) => pkg.isActive);
        console.log('Filtered packages:', filteredPackages);
        setPackages(filteredPackages);
        
        // Only fetch subscription if authenticated
        if (isAuthenticated) {
          const subscription = await subscriptions.getCurrentSubscription();
          console.log('Current subscription:', subscription);
          setCurrentSubscription(subscription);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(common("somethingWentWrong"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, common]);

  // Features to display for each package
  const packageFeatures = [
    { key: "maxCandidateProfiles", label: "candidateProfiles" },
    { key: "maxProfilesPerBatch", label: "profilesPerBatch" },
    { key: "maxMonthlyScrapes", label: "monthlyScrapes" },
    { key: "maxUrlsPerBatch", label: "urlsPerBatch" },
    { key: "maxPagesPerSite", label: "pagesPerSite" },
    { key: "concurrentSites", label: "concurrentSites" },
    { key: "maxMonthlyEmails", label: "monthlyEmails" },
    { key: "maxEmailsPerSite", label: "emailsPerSite" }
  ];

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              {common("retry")}
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[...packages].sort((a, b) => {
              const order: Record<string, number> = { 'Basic': 1, 'Professional': 2, 'Enterprise': 3 };
              return (order[a.name] ?? 99) - (order[b.name] ?? 99);
            }).map((pkg) => {
              console.log('Rendering package:', pkg);
              const isCurrentPlan = currentSubscription?.package?.id === pkg.id;
              return (
                <Card 
                  key={pkg.id} 
                  className={`flex flex-col transition-all duration-300 hover:shadow-lg ${
                    isCurrentPlan 
                      ? "border-primary shadow-md" 
                      : "hover:border-primary/50"
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{pkg.name}</CardTitle>
                      {isCurrentPlan && (
                        <Badge className="bg-primary text-primary-foreground">
                          {t("currentPlan")}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{pkg.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">
                        ${pkg.price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground ml-1">{t("month")}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-2">
                      {packageFeatures.map(feature => (
                        <li key={feature.key} className="flex items-center">
                          <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                          <span>
                            {/* @ts-ignore - We know this property exists on the package */}
                            {pkg[feature.key]} {t(`features.${feature.label}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      asChild 
                      className="w-full"
                      variant={isCurrentPlan ? "secondary" : "default"}
                    >
                      <Link href={isCurrentPlan ? "/profile" : `/subscribe/${pkg.id}`}>
                        {isCurrentPlan ? t("cta.manageSubscription") : t("cta.getStarted")}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Contact Sales section commented out as per request
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            {t("enterprise.description")}
          </p>
          <Button asChild variant="outline">
            <Link href="/contact">{t("enterprise.contactSales")}</Link>
          </Button>
        </div>
        */}
      </div>
    </section>
  );
}

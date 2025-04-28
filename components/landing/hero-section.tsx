import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, Code, Globe, CheckCircle } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
  const t = useTranslations("Marketing.hero");
  
  // List of benefits for cleaner rendering
  const benefits = [
    "noCreditCard",
    "freePlan",
    "apiAccess",
    "exportFormats"
  ];
  
  // Feature items for rendering
  const featureItems = [
    {
      icon: <Database className="h-10 w-10 text-primary mb-3" />,
      key: "structuredData"
    },
    {
      icon: <Code className="h-10 w-10 text-primary mb-3" />,
      key: "simpleApi"
    },
    {
      icon: <Globe className="h-10 w-10 text-primary mb-3" />,
      key: "anyWebsite"
    }
  ];
  
  return (
    <div className="relative overflow-hidden bg-background py-24 md:py-36">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px] dark:bg-primary/20" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[100px] dark:bg-accent/20" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[300px] w-[800px] bg-gradient-to-r from-primary/5 to-accent/5 blur-[60px] dark:from-primary/10 dark:to-accent/10" />
      </div>
      
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 px-4 py-1.5 mb-8 text-sm font-medium bg-background/80 backdrop-blur-sm dark:bg-background/30 shadow-sm">
            <span className="text-muted-foreground">{t("newFeature")}</span>
            <span className="ml-1.5 text-primary font-semibold">{t("aiPowered")}</span>
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            {t("title")}{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
              {t("titleHighlight")}
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            {t("subtitle")}
          </p>
          
          {/* Enhanced CTA section */}
          <div className="w-full max-w-4xl mb-20 relative">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 p-8 rounded-2xl shadow-lg border border-border/50 backdrop-blur-sm">
              <div className="flex flex-col lg:flex-row gap-8 items-center">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-4">{t("startToday")}</h3>
                  <ul className="space-y-3 mb-6">
                    {benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span>{t(`benefits.${benefit}`)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <Button asChild size="lg" className="text-base px-8 gap-2 h-12 shadow-md hover:shadow-lg transition-all">
                      <Link href="/register">
                        {t("cta.getStarted")} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="text-base px-8 h-12 border-primary/20 hover:bg-primary/5 dark:hover:bg-primary/10">
                      <Link href="/docs">
                        {t("cta.documentation")}
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="flex-1 relative">
                  <div className="bg-card rounded-lg border p-2 shadow-xl dark:shadow-primary/5 w-full max-w-[360px] mx-auto">
                    {/* This would ideally be an actual screenshot/image of your app interface */}
                    <div className="aspect-video bg-muted rounded flex items-center justify-center text-muted-foreground p-4">
                      <p className="text-sm text-center">Your app screenshot or demo visualization here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
            {featureItems.map((feature, i) => (
              <div key={i} className="flex flex-col items-center p-6 rounded-xl border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors shadow-sm hover:shadow-md">
                {feature.icon}
                <h3 className="text-lg font-semibold mb-2">{t(`features.${feature.key}.title`)}</h3>
                <p className="text-sm text-muted-foreground text-center">{t(`features.${feature.key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

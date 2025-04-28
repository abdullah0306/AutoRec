import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { 
  Layers, 
  Code, 
  Database, 
  Cloud, 
  LineChart, 
  Workflow 
} from "lucide-react";

interface FeatureProps {
  title: string;
  description: string;
  icon: ReactNode;
}

function Feature({ title, description, icon }: FeatureProps) {
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-5">
        <div className="text-primary w-6 h-6">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  const t = useTranslations("Marketing.features");
  
  const featureKeys = [
    {
      icon: <Database className="h-10 w-10 text-primary" />,
      key: "dataExtraction"
    },
    {
      icon: <Layers className="h-10 w-10 text-primary" />,
      key: "exportFormats"
    },
    {
      icon: <Code className="h-10 w-10 text-primary" />,
      key: "developerApi"
    },
    {
      icon: <Cloud className="h-10 w-10 text-primary" />,
      key: "cloudProcessing"
    },
    {
      icon: <LineChart className="h-10 w-10 text-primary" />,
      key: "monitoring"
    },
    {
      icon: <Workflow className="h-10 w-10 text-primary" />,
      key: "scheduling"
    }
  ];

  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-8 shadow-sm border hover:shadow-md transition-all"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">
                {t(`items.${feature.key}.title`)}
              </h3>
              <p className="text-muted-foreground">
                {t(`items.${feature.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { useTranslations } from "next-intl";

export const metadata = {
  title: "Authentication - Autorec",
  description: "Authentication pages for Autorec",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Auth");
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        
        {children}
        
        <p className="text-center text-sm text-muted-foreground">
          {t("agreement")}{" "}
          <Link
            href="/terms-of-service"
            className="font-medium hover:text-primary underline underline-offset-4"
          >
            {t("terms")}
          </Link>{" "}
          {t("and")}{" "}
          <Link
            href="/privacy-policy"
            className="font-medium hover:text-primary underline underline-offset-4"
          >
            {t("privacy")}
          </Link>
        </p>
      </div>
    </div>
  );
}

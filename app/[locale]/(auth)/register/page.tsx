"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { register as registerUser } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { AuthCard } from "@/components/auth/auth-card";
import { SocialButtons } from "@/components/auth/social-buttons";

export default function RegisterPage() {
  const t = useTranslations("RegisterPage");
  const common = useTranslations("Common");
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const registerSchema = z.object({
    email: z.string().email(common("invalidEmail")),
    password: z.string().min(6, common("passwordMinLength")),
    firstName: z.string().min(2, t("firstNameRequired")),
    lastName: z.string().min(2, t("lastNameRequired")),
  });

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
    mode: "onChange",
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
      await registerUser(values);
      toast({
        title: common("successTitle"),
        description: t("successMessage"),
      });
      router.push("/login");
    } catch (error) {
      toast({
        variant: "error",
        title: common("errorTitle"),
        description: error instanceof Error ? error.message : t("registrationFailed"),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      header={
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
      }
      footer={
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground">
                {common("orContinueWith")}
              </span>
            </div>
          </div>
          <SocialButtons />
          <p className="text-sm text-center text-muted-foreground">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              className="font-medium hover:text-primary underline underline-offset-4"
            >
              {t("signIn")}
            </Link>
          </p>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">{common("firstName")}</Label>
              <Input
                id="first_name"
                placeholder={t("firstNamePlaceholder")}
                disabled={isLoading}
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">{common("lastName")}</Label>
              <Input
                id="last_name"
                placeholder={t("lastNamePlaceholder")}
                disabled={isLoading}
                {...form.register("lastName")}
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">{common("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={common("emailPlaceholder")}
              disabled={isLoading}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">{common("password")}</Label>
            <Input
              id="password"
              type="password"
              disabled={isLoading}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full mt-2" 
          disabled={isLoading || !form.formState.isValid}
        >
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          {t("createAccount")}
        </Button>
      </form>
    </AuthCard>
  );
}

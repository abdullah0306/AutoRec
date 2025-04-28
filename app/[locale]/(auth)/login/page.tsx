"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { AuthCard } from "@/components/auth/auth-card";
import { SocialButtons } from "@/components/auth/social-buttons";

export default function LoginPage() {
  const t = useTranslations("LoginPage");
  const common = useTranslations("Common");
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const { toast } = useToast();
  const { login, isAuthLoading } = useAuth();

  const loginSchema = z.object({
    username: z.string().email(common("invalidEmail")),
    password: z.string().min(6, common("passwordMinLength")),
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onChange",
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setErrorMessage(null);

    try {
      await login(values);
      toast({
        title: common("successTitle"),
        description: t("successMessage"),
      });
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);

      const message =
        error instanceof Error
          ? error.message
          : t("unexpectedError");

      setErrorMessage(message);

      toast({
        variant: "error",
        title: t("loginFailedTitle"),
        description: message,
      });
    }
  }

  return (
    <AuthCard
      header={
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
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
            {t("noAccount")}{" "}
            <Link
              href="/register"
              className="font-medium hover:text-primary underline underline-offset-4"
            >
              {t("signUp")}
            </Link>
          </p>
        </>
      }
    >
      {errorMessage && (
        <div className="bg-destructive/15 text-destructive rounded-md p-3 mb-4 text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{common("email")}</Label>
            <Input
              id="username"
              type="email"
              placeholder={common("emailPlaceholder")}
              disabled={isAuthLoading}
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <p className="text-sm text-destructive">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{common("password")}</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              disabled={isAuthLoading}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
        </div>
        <Button type="submit" className="w-full mt-2" disabled={isAuthLoading}>
          {isAuthLoading && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          {t("signIn")}
        </Button>
      </form>
    </AuthCard>
  );
}

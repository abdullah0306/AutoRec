"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { AuthCard } from "@/components/auth/auth-card";
import { useToast } from "@/components/ui/use-toast";
import { forgotPassword } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPasswordPage");
  const common = useTranslations("Common");
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const forgotPasswordSchema = z.object({
    email: z.string().email(common("invalidEmail")),
  });

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsLoading(true);
    try {
      await forgotPassword(values.email);
      toast({
        title: t("checkEmailTitle"),
        description: t("checkEmailDescription"),
      });
      router.push("/login");
    } catch (error) {
      toast({
        variant: "error",
        title: common("errorTitle"),
        description:
          error instanceof Error ? error.message : common("somethingWentWrong"),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      header={
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
      }
      footer={
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/login"
              className="hover:text-primary underline underline-offset-4"
            >
              {common("backToLogin")}
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2.5">
          <Label className="text-sm font-medium" htmlFor="email">
            {t("emailLabel")}
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={common("emailPlaceholder")}
            className="h-11"
            disabled={isLoading}
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full h-11"
          disabled={isLoading || !form.formState.isValid}
        >
          {isLoading && <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />}
          {t("sendResetInstructions")}
        </Button>
      </form>
    </AuthCard>
  );
}

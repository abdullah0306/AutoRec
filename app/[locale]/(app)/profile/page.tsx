"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/api";
import ProtectedRoute from "@/components/protected-route";
import { Progress } from "@/components/ui/progress";
import { Subscription } from "@/types/subscription";
import { subscriptions } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

// Schema for profile update form
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] =
    useState<Subscription | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);

  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
    mode: "onChange",
  });

  // Update form when user data becomes available
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user, form]);

  // Fetch subscription details
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;

      setIsLoadingSubscription(true);
      try {
        const subscription = await subscriptions.getCurrentSubscription();
        setSubscriptionDetails(subscription);
      } catch (error) {
        console.error("Failed to fetch subscription details:", error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    fetchSubscription();
  }, [user]);

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    try {
      // Call API to update profile
      await auth.updateProfile(data);

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Render subscription card content
  const renderSubscriptionContent = () => {
    if (isLoadingSubscription) {
      return (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      );
    }

    if (!subscriptionDetails) {
      return (
        <div className="py-4 text-center">
          <p className="text-muted-foreground">No subscription found.</p>
          <Button asChild className="mt-4">
            <a href="/pricing">View Plans</a>
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Current Plan:{" "}
              <span className="font-bold text-primary">
                {subscriptionDetails.package?.name}
              </span>
            </h3>
            <Badge
              variant={
                subscriptionDetails.is_active ? "default" : "destructive"
              }
            >
              {subscriptionDetails.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Usage Statistics */}
        <div className="space-y-4">
          <h4 className="font-medium">Monthly Usage</h4>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Scrapes Used</span>
              <span className="font-medium">
                {subscriptionDetails.monthly_usage} /{" "}
                {subscriptionDetails.max_monthly_scrapes}
              </span>
            </div>
            <Progress
              value={
                (subscriptionDetails.monthly_usage /
                  subscriptionDetails.max_monthly_scrapes) *
                100
              }
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Emails Collected</span>
              <span className="font-medium">
                {subscriptionDetails.monthly_email_usage} /{" "}
                {subscriptionDetails.max_monthly_emails}
              </span>
            </div>
            <Progress
              value={
                (subscriptionDetails.monthly_email_usage /
                  subscriptionDetails.max_monthly_emails) *
                100
              }
              className="h-2"
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium">Monthly Scrapes</h4>
            <p className="text-sm text-muted-foreground">
              {subscriptionDetails.package?.max_monthly_scrapes} scrapes per
              month
            </p>
            <p className="text-sm font-medium text-primary mt-1">
              {subscriptionDetails.remaining_scrapes} remaining
            </p>
          </div>
          <div>
            <h4 className="font-medium">Monthly Emails</h4>
            <p className="text-sm text-muted-foreground">
              {subscriptionDetails.package?.max_monthly_emails} emails per month
            </p>
            <p className="text-sm font-medium text-primary mt-1">
              {subscriptionDetails.remaining_emails} remaining
            </p>
          </div>
          <div>
            <h4 className="font-medium">URLs per Batch</h4>
            <p className="text-sm text-muted-foreground">
              Up to {subscriptionDetails.package?.max_urls_per_batch} URLs
            </p>
          </div>
          <div>
            <h4 className="font-medium">Pages per Site</h4>
            <p className="text-sm text-muted-foreground">
              Up to {subscriptionDetails.package?.max_pages_per_site} pages
            </p>
          </div>
          <div>
            <h4 className="font-medium">Concurrent Sites</h4>
            <p className="text-sm text-muted-foreground">
              {subscriptionDetails.package?.concurrent_sites} sites
            </p>
          </div>
          <div>
            <h4 className="font-medium">Emails per Site</h4>
            <p className="text-sm text-muted-foreground">
              Up to {subscriptionDetails.package?.max_emails_per_site} emails
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="container py-10 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

        <div className="space-y-8">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your personal information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your full name as it will appear on your account.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your email"
                            type="email"
                            {...field}
                            disabled
                          />
                        </FormControl>
                        <FormDescription>
                          Your email address is used for login and cannot be
                          changed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving changes
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Subscription Information */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Information about your current subscription plan.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderSubscriptionContent()}</CardContent>
            <CardFooter className="flex gap-4">
              <Button variant="outline" asChild className="flex-1">
                <a href="/pricing">View All Plans</a>
              </Button>
              <Button variant="default" asChild className="flex-1">
                <a href="/pricing">Upgrade Plan</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

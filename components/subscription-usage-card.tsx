"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Package, AlertCircle } from "lucide-react";
import { Subscription } from "@/types/subscription";
import { subscriptions } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SubscriptionUsageCard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        setIsLoading(true);
        const data = await subscriptions.getCurrentSubscription();
        setSubscription(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch subscription:", err);
        setError(err.message || "Could not load subscription data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Usage</CardTitle>
          <CardDescription>Your current plan and usage</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Usage</CardTitle>
          <CardDescription>Your current plan and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-center py-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/pricing">View Plans</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display a different UI for users with no subscription
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>Subscribe to get started with scraping</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-6">
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <Package className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-1">
              <p className="text-sm">You don't have an active subscription yet</p>
              <p className="text-xs text-muted-foreground">Choose a plan to start scraping websites</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/pricing">Subscribe Now</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const scraperUsagePercent = (subscription.monthly_usage / subscription.max_monthly_scrapes) * 100;
  const emailUsagePercent = (subscription.monthly_email_usage / subscription.package.max_monthly_emails) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Subscription Usage</CardTitle>
            <CardDescription>
              {subscription.package.name} Plan
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
            <Link href="/profile">
              <span>Manage</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Scraping Usage</span>
            <span className="text-xs font-medium">{subscription.monthly_usage}/{subscription.max_monthly_scrapes}</span>
          </div>
          <Progress value={scraperUsagePercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {subscription.remaining_scrapes} remaining this month
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Email Collection</span>
            <span className="text-xs font-medium">{subscription.monthly_email_usage}/{subscription.package.max_monthly_emails}</span>
          </div>
          <Progress value={emailUsagePercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {subscription.remaining_emails} remaining this month
          </p>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/pricing">Upgrade Plan</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

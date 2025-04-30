"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { subscriptions } from "@/lib/api";
import { SubscriptionPackage } from "@/types/subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, AlertCircle, Loader2, PackageCheck } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

interface Params {
  planId: string;
}

export default function SubscribePage() {
  const params = useParams() as Params;
  const router = useRouter();
  const { user, isAuthLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [packageData, setPackageData] = useState<SubscriptionPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any | null>(null);
  const [isPackageNotFound, setIsPackageNotFound] = useState(false);

  // Check authentication and fetch package data
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        // Redirect to login page if not authenticated
        router.push(`/login?redirect=/subscribe/${planId}`);
        return;
      }

      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        setIsPackageNotFound(false);
        
        try {
          // First try to get all packages
          const allPackages = await subscriptions.getPackages();
          
          // Find the package with matching ID
          const selectedPackage = allPackages.find((pkg: any) => pkg.id === params.planId);
          
          if (!selectedPackage) {
            setIsPackageNotFound(true);
            throw new Error("Subscription package not found or inactive");
          }
          
          setPackageData(selectedPackage);
          
          // Check if user has an active subscription
          try {
            const userSubscription = await subscriptions.getCurrentSubscription();
            setCurrentSubscription(userSubscription);
          } catch (subsError) {
            // Subscription fetch failed but package fetch succeeded, so continue
            console.error("Failed to fetch current subscription:", subsError);
          }
        } catch (err: any) {
          console.error("Failed to fetch package details:", err);
          if (err.message === "Subscription package not found or inactive") {
            setIsPackageNotFound(true);
          }
          setError(err.message || "Failed to load subscription package");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [isAuthLoading, isAuthenticated, params.planId, router]);

  const handleSubscribe = async () => {
    if (!packageData) return;
    
    setIsSubscribing(true);
    setSubscribeError(null);
    
    try {
      const response = await subscriptions.subscribe(packageData.id);
      console.log('Stripe response:', response);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.url) {
        console.log('Redirecting to Stripe:', response.url);
        // Add a small delay to ensure console logs are visible
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.href = response.url;
        return;
      }

      throw new Error('No checkout URL received');
    } catch (err) {
      const error = err as Error;
      console.error("Subscription failed:", error);
      setSubscribeError(error.message || "Failed to process subscription");
      toast({
        title: "Subscription failed",
        description: error.message || "There was an error processing your subscription.",
        variant: "error",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  // Show loading state while checking auth or fetching data
  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Preparing your subscription details</p>
        </div>
      </div>
    );
  }

  // Show package not found state
  if (isPackageNotFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Package Not Available</AlertTitle>
            <AlertDescription>This subscription package does not exist or is currently inactive.</AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/pricing">View Available Plans</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there was an error fetching the package
  if (error || !packageData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Subscription package not found"}</AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/pricing">Back to Pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Subscribe to {packageData.name}</h1>
          <p className="text-muted-foreground mt-2">
            Review your subscription details before confirming
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Package details card */}
          <Card>
            <CardHeader>
              <CardTitle>{packageData.name}</CardTitle>
              <CardDescription>{packageData.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">${packageData.price.toFixed(2)}</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span>{packageData.max_monthly_scrapes} monthly scrapes</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span>Up to {packageData.max_urls_per_batch} URLs per batch</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span>Up to {packageData.max_pages_per_site} pages per site</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span>{packageData.concurrent_sites} concurrent sites</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span>Up to {packageData.max_monthly_emails} monthly emails</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span>Up to {packageData.max_emails_per_site} emails per site</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Subscription confirmation card */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Summary</CardTitle>
              <CardDescription>Review and confirm your subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Account</p>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
              <div>
                <p className="font-medium">Billing</p>
                <p className="text-muted-foreground">Monthly billing at ${packageData.price.toFixed(2)}/month</p>
              </div>
              <div>
                <p className="font-medium">First Billing Date</p>
                <p className="text-muted-foreground">Today</p>
              </div>
              
              {currentSubscription && (
                <Alert variant="warning" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>You already have an active subscription</AlertTitle>
                  <AlertDescription>
                    Your current subscription to {currentSubscription.package.name} is active. 
                    Subscribing to a new plan will replace your current subscription.
                  </AlertDescription>
                </Alert>
              )}
              
              {subscribeError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Subscription Error</AlertTitle>
                  <AlertDescription>{subscribeError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                className="w-full" 
                onClick={handleSubscribe} 
                disabled={isSubscribing}
              >
                {isSubscribing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PackageCheck className="h-4 w-4 mr-2" />
                    {currentSubscription ? `Switch to ${packageData.name}` : `Subscribe to ${packageData.name}`}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                asChild
              >
                <Link href="/pricing">Cancel</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
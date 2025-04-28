// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { Package, Loader2 } from "lucide-react";

// // UI Components
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// // Page Components
// import { DashboardHeader } from "@/components/dashboard-header";
// import { DashboardShell } from "@/components/dashboard-shell";

// // API
// import { subscriptions } from "@/lib/api";

// // Simple placeholder component for dashboard widgets
// const PlaceholderCard = ({ title }: { title: string }) => (
//   <Card>
//     <CardHeader>
//       <CardTitle>{title}</CardTitle>
//     </CardHeader>
//     <CardContent className="h-32 flex items-center justify-center">
//       <p className="text-muted-foreground">Data will load after page hydration</p>
//     </CardContent>
//   </Card>
// );

// // Loading component
// const LoadingState = () => (
//   <div className="w-full flex justify-center py-8">
//     <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//   </div>
// );

// // Declare this page as requiring client-side rendering
// export const dynamic = "force-dynamic";
// export const fetchCache = "force-no-store";

// export default function DashboardPage() {
//   const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isClient, setIsClient] = useState(false);

//   // Check if we're on the client
//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   // Load subscription data
//   useEffect(() => {
//     if (!isClient) return;

//     async function checkSubscription() {
//       try {
//         const subscription = await subscriptions.getCurrentSubscription();
//         setHasSubscription(!!subscription);
//       } catch (err) {
//         console.error("Failed to load subscription:", err);
//         setHasSubscription(false);
//       } finally {
//         setIsLoading(false);
//       }
//     }

//     checkSubscription();
//   }, [isClient]);

//   // If we're not on client yet, show a minimal shell
//   if (!isClient) {
//     return (
//       <DashboardShell>
//         <div className="mx-auto space-y-6 p-0 md:p-2">
//           <DashboardHeader
//             heading="Dashboard"
//             text="Overview of your web scraping activities"
//           />
//           <LoadingState />
//         </div>
//       </DashboardShell>
//     );
//   }

//   return (
//     <DashboardShell>
//       <div className="mx-auto space-y-6 p-0 md:p-2">
//         <DashboardHeader
//           heading="Dashboard"
//           text="Overview of your web scraping activities"
//         />
        
//         {isLoading ? (
//           <LoadingState />
//         ) : (
//           <>
//             {hasSubscription === false && (
//               <Card className="mb-6 border-dashed border-2 border-muted-foreground/20">
//                 <CardHeader>
//                   <CardTitle>Get Started with a Subscription</CardTitle>
//                   <CardDescription>
//                     You don't have an active subscription. Subscribe to start scraping websites.
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="flex flex-col items-center justify-center py-6 gap-4">
//                     <Package className="h-12 w-12 text-muted-foreground" />
//                     <p className="text-center text-muted-foreground max-w-md">
//                       Choose a subscription plan to access our web scraping features including email extraction, 
//                       contact information scraping, and more.
//                     </p>
//                   </div>
//                 </CardContent>
//                 <CardFooter>
//                   <Button asChild className="w-full sm:w-auto">
//                     <Link href="/pricing">View Subscription Plans</Link>
//                   </Button>
//                 </CardFooter>
//               </Card>
//             )}

//             <div className="grid gap-6">
//               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//                 {Array(4).fill(0).map((_, i) => (
//                   <PlaceholderCard key={i} title={`Metric ${i+1}`} />
//                 ))}
//               </div>
//               <div className="grid gap-4 lg:grid-cols-7">
//                 <div className="lg:col-span-4">
//                   <PlaceholderCard title="Usage Overview" />
//                 </div>
//                 <div className="lg:col-span-3">
//                   <PlaceholderCard title="Subscription Details" />
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </DashboardShell>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { OverviewCards } from "@/components/overview-cards";
import { SubscriptionUsageCard } from "@/components/subscription-usage-card";
import { Button } from "@/components/ui/button";
import { subscriptions } from "@/lib/api";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function DashboardPage() {
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkSubscription() {
      try {
        const subscription = await subscriptions.getCurrentSubscription();
        setHasSubscription(!!subscription);
      } catch (err) {
        // If there's an error, assume no subscription
        setHasSubscription(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkSubscription();
  }, []);

  return (
    <DashboardShell>
      <div className="mx-auto space-y-6 p-0 md:p-2">
        <DashboardHeader
          heading="Dashboard"
          text="Overview of your web scraping activities"
        />
        
        {!isLoading && hasSubscription === false && (
          <Card className="mb-6 border-dashed border-2 border-muted-foreground/20">
            <CardHeader>
              <CardTitle>Get Started with a Subscription</CardTitle>
              <CardDescription>
                You don't have an active subscription. Subscribe to start scraping websites.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 gap-4">
                <Package className="h-12 w-12 text-muted-foreground" />
                <p className="text-center text-muted-foreground max-w-md">
                  Choose a subscription plan to access our web scraping features including email extraction, 
                  contact information scraping, and more.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/pricing">View Subscription Plans</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <OverviewCards />
          </div>
          <div className="grid gap-4 lg:grid-cols-7">
            <div className="lg:col-span-3 space-y-6">
              <SubscriptionUsageCard />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
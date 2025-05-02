export interface SubscriptionPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  maxMonthlyScrapes: number;
  maxUrlsPerBatch: number;
  maxPagesPerSite: number;
  concurrentSites: number;
  isActive: boolean;
  maxMonthlyEmails: number;
  maxEmailsPerSite: number;
  maxCandidateProfiles: number;
  maxProfilesPerBatch: number;
  stripeProductId?: string;
  stripePriceId?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  packageId: string;
  package?: SubscriptionPackage;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  monthlyUsage: number;
  monthlyEmailUsage: number;
  monthlyCandidateUsage: number;
  lastUsageReset: string;
}

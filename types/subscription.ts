export interface SubscriptionPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  max_monthly_scrapes: number;
  max_urls_per_batch: number;
  max_pages_per_site: number;
  concurrent_sites: number;
  is_active: boolean;
  max_monthly_emails: number;
  max_emails_per_site: number;
}

export interface Subscription {
  max_monthly_emails: number;
  id: string;
  user_id: string;
  package: SubscriptionPackage;
  status: 'active' | 'canceled' | 'expired' | 'trial';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  monthly_usage: number;
  max_monthly_scrapes: number;
  remaining_scrapes: number;
  monthly_email_usage: number;
  remaining_emails: number;
}

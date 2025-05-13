import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { RecentContactScrapingJobs } from "@/components/recent-contact-scraping-jobs";
import { ContactScrapingResultsView } from "@/components/contact-scraping-results-view";
import { ContactResultsProvider } from "@/contexts/contact-results-context";

export default function ResultsPage() {
  return (
    <ContactResultsProvider>
      <DashboardShell>
        <DashboardHeader heading="Results" text="View and export your scraping results" />
        <RecentContactScrapingJobs className="mb-6" />
        
        <ContactScrapingResultsView />
      </DashboardShell>
    </ContactResultsProvider>
  )
}


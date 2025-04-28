import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
// import { ScrapingResults } from "@/components/scraping-results"
import { RecentScrapingJobs } from "@/components/recent-scraping-jobs";
import { ScrapingResultsView } from "@/components/scraping-results-view";


export default function ResultsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Results" text="View and export your scraping results" />
      {/* <ScrapingResults /> */}
      <RecentScrapingJobs />
      <ScrapingResultsView />
    </DashboardShell>
  )
}


import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { ScrapingAnalytics } from "@/components/scraping-analytics"

export default function AnalyticsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Analytics" text="Analyze your scraping data" />
      <ScrapingAnalytics />
    </DashboardShell>
  )
}


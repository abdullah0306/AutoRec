import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { ScrapingForm } from "@/components/scraping-form"
import { WebsiteList } from "@/components/website-list"

export default function ClientsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Clients" text="Start new scraping jobs and view current status" />
      <div className="grid gap-4 md:grid-cols-2">
        <ScrapingForm />
        <WebsiteList />
      </div>
    </DashboardShell>
  )
}


"use client";

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { ScrapingForm } from "@/components/scraping-form"
import { WebsiteList } from "@/components/website-list"
import { useScrapingContext } from "@/contexts/scraping-context"
import { useEffect } from "react"

export default function ClientsPage() {
  const { fetchAllBatches } = useScrapingContext();

  useEffect(() => {
    fetchAllBatches();
  }, [fetchAllBatches]);

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
"use client";

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
// import { ScrapingResults } from "@/components/scraping-results"
import { RecentScrapingJobs } from "@/components/recent-scraping-jobs";
import { ScrapingResultsView } from "@/components/scraping-results-view";
import { useScrapingContext } from "@/contexts/scraping-context";
import { useEffect } from "react";

export default function ResultsPage() {
  const { fetchAllBatches } = useScrapingContext();

  useEffect(() => {
    fetchAllBatches();
  }, [fetchAllBatches]);

  return (
    <DashboardShell>
      <DashboardHeader heading="Results" text="View and export your scraping results" />
      {/* <ScrapingResults /> */}
      <RecentScrapingJobs />
      <ScrapingResultsView />
    </DashboardShell>
  )
}

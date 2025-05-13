"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { ContactScrapingForm } from "@/components/contact-scraping-form"
import { ContactWebsiteList } from "@/components/contact-website-list"
import { ContactScrapingProvider } from "@/contexts/contact-scraping-context"

export default function ClientsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Clients" text="Extract contact information from websites" />
      
      <ContactScrapingProvider>
        <div className="grid gap-4 md:grid-cols-2">
          <ContactScrapingForm />
          <ContactWebsiteList />
        </div>
      </ContactScrapingProvider>
    </DashboardShell>
  )
}


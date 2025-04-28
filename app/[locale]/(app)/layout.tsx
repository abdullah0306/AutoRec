import type React from "react";
import type { Metadata } from "next";
import { ScrapingProvider } from "@/contexts/scraping-context";
import { Sidebar } from "@/components/sidebar";
import ProtectedRoute from "@/components/protected-route";

export const metadata: Metadata = {
  title: "Autorec Dashboard",
  description: "Professional web scraping and data analysis tool",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScrapingProvider>
      <ProtectedRoute>
        <div className="relative min-h-screen bg-background">
          <Sidebar />
          <div className="md:pl-[280px]">
            <main className="min-h-screen flex-1 overflow-y-auto p-6 md:p-8">
              {children}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </ScrapingProvider>
  );
}

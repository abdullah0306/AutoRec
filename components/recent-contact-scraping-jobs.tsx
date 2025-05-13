"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ExternalLink, CheckCircle2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContactResults } from "@/contexts/contact-results-context";
import { useState, useEffect } from "react";
import { ContactResultsDialog } from "@/components/contact-results-dialog";
import Link from "next/link";
import type { ContactProfile } from "@/lib/api/contact-scraper";

interface RecentContactScrapingJobsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function RecentContactScrapingJobs({
  className,
  ...props
}: RecentContactScrapingJobsProps) {
  const { results, isLoading, fetchResults } = useContactResults();
  const [refreshing, setRefreshing] = useState(false);
  
  // Refresh the results data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchResults();
    } catch (error) {
      console.error('Error refreshing results:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Auto-refresh on mount and every 30 seconds
  useEffect(() => {
    handleRefresh();
    
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);
  
  // Get the most recent 5 results
  const recentResults = results?.slice(0, 5) || [];

  // Find contacts for the selected website
  const selectedContacts = selectedWebsite && results && results.length > 0
    ? results.find(result => result.url === selectedWebsite)
    : null;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const openResultsDialog = (websiteUrl: string) => {
    setSelectedWebsite(websiteUrl);
  };

  const closeResultsDialog = () => {
    setSelectedWebsite(null);
  };

  // Extract contacts for a specific result and convert to ContactProfile[] format
  const getContactsFromResult = (result: any): ContactProfile[] | null => {
    if (!result) return null;
    
    try {
      // Get the arrays from the result
      const emails = Array.isArray(result.emails) ? result.emails : [];
      const phones = Array.isArray(result.phones) ? result.phones : [];
      
      // If we have no data, return null
      if (emails.length === 0 && phones.length === 0) return null;
      
      // Create a ContactProfile for each email
      const emailContacts = emails.map((email: string) => ({
        name: '',
        position: '',
        company: '',
        email: email,
        phone: '',
        website: result.url || '',
        linkedIn: '',
        twitter: '',
        facebook: '',
        instagram: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        industry: '',
        companySize: '',
        foundedYear: '',
        description: '',
        source: result.url || ''
      }));
      
      // Create a ContactProfile for each phone
      const phoneContacts = phones.map((phone: string) => ({
        name: '',
        position: '',
        company: '',
        email: '',
        phone: phone,
        website: result.url || '',
        linkedIn: '',
        twitter: '',
        facebook: '',
        instagram: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        industry: '',
        companySize: '',
        foundedYear: '',
        description: '',
        source: result.url || ''
      }));
      
      // Combine the contacts
      return [...emailContacts, ...phoneContacts];
    } catch (error) {
      console.error('Error processing contact data:', error);
      return null;
    }
  };

  return (
    <>
      <Card className={cn("overflow-hidden", className)} {...props}>
        <CardHeader className="border-b bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">
                Recent Scraping Jobs
              </CardTitle>
              <CardDescription className="text-sm">
                Manage and monitor your scraping activities
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing || isLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <ScrollArea className="h-[400px]">
          <CardContent className="p-0">
            <div className="divide-y">
              {recentResults.map((result) => {
                // Skip if result is invalid
                if (!result || !result.url) return null;
                return (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-green-500/10">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{result.url}</p>
                          <Badge variant="secondary" className="capitalize shrink-0 text-green-500">
                            Completed
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed {formatDate(result.completed_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pr-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openResultsDialog(result.url)}
                        className="text-xs h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        View Results
                      </Button>
                    </div>
                  </div>
                );
              })}

              {recentResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <ExternalLink className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm font-medium">No recent scraping jobs</p>
                  <p className="text-xs mt-1">
                    Start a new scraping job to see it here
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    asChild
                  >
                    <Link href="/clients">Start a new scraping job</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </ScrollArea>
      </Card>

      {selectedWebsite && (
        <ContactResultsDialog
          contacts={selectedContacts ? getContactsFromResult(selectedContacts) : null}
          isOpen={!!selectedWebsite}
          onClose={closeResultsDialog}
          websiteUrl={selectedWebsite || ''}
        />
      )}
    </>
  );
}

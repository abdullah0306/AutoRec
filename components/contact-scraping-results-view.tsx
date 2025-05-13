"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Mail, Phone, MapPin, Hash, Globe } from "lucide-react";
import { useContactResults } from "@/contexts/contact-results-context";
import type { ContactScrapingResult } from "@/contexts/contact-results-context";
import { downloadCSV } from "@/utils/export-utils";

interface ResultsSummaryProps {
  results: ContactScrapingResult[];
}

function ResultsSummary({ results }: ResultsSummaryProps) {
  const totalEmails = results?.reduce(
    (sum, result) => sum + result.emails.length,
    0
  );
  const totalPhones = results?.reduce(
    (sum, result) => sum + result.phones.length,
    0
  );
  const totalAddresses = results?.reduce(
    (sum, result) => sum + result.addresses.length,
    0
  );
  const totalPostalCodes = results?.reduce(
    (sum, result) => sum + result.postal_codes.length,
    0
  );

  const stats = [
    {
      title: "Total Emails",
      value: totalEmails,
      icon: Mail,
      color: "text-blue-500",
    },
    {
      title: "Total Phones",
      value: totalPhones,
      icon: Phone,
      color: "text-green-500",
    },
    {
      title: "Total Addresses",
      value: totalAddresses,
      icon: MapPin,
      color: "text-purple-500",
    },
    {
      title: "Total Postal Codes",
      value: totalPostalCodes,
      icon: Hash,
      color: "text-orange-500",
    },
  ];

  const handleExportAll = () => {
    if (results && results.length > 0) {
      const csv = resultsToCSV(results);
      downloadCSV(csv, "all-contact-scraping-results.csv");
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          onClick={handleExportAll}
          disabled={!results || results.length === 0}
        >
          <FileDown className="h-4 w-4 mr-2" />
          Export All Results
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, color }) => (
          <Card key={title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Icon className={`h-8 w-8 ${color}`} />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {title}
                  </p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function ResultsTable({ result }: { result: ContactScrapingResult }) {
  // Ensure all arrays exist to prevent "Cannot read property 'length' of undefined" errors
  const safeResult = {
    ...result,
    emails: Array.isArray(result.emails) ? result.emails : [],
    phones: Array.isArray(result.phones) ? result.phones : [],
    addresses: Array.isArray(result.addresses) ? result.addresses : [],
    postal_codes: Array.isArray(result.postal_codes) ? result.postal_codes : [],
    linkedins: Array.isArray(result.linkedins) ? result.linkedins : [],
    twitters: Array.isArray(result.twitters) ? result.twitters : [],
    facebooks: Array.isArray(result.facebooks) ? result.facebooks : [],
    instagrams: Array.isArray(result.instagrams) ? result.instagrams : []
  };
  
  const sections = [
    {
      title: "Emails",
      items: safeResult.emails,
      icon: Mail,
      color: "text-blue-500",
    },
    {
      title: "Phone Numbers",
      items: safeResult.phones,
      icon: Phone,
      color: "text-green-500",
    },
    {
      title: "Addresses",
      items: safeResult.addresses,
      icon: MapPin,
      color: "text-purple-500",
    },
    {
      title: "Postal Codes",
      items: safeResult.postal_codes,
      icon: Hash,
      color: "text-orange-500",
    },
    // Add social media sections
    {
      title: "LinkedIn Profiles",
      items: safeResult.linkedins,
      icon: Globe,
      color: "text-blue-700",
    },
    {
      title: "Twitter Profiles",
      items: safeResult.twitters,
      icon: Globe,
      color: "text-blue-400",
    },
    {
      title: "Facebook Profiles",
      items: safeResult.facebooks,
      icon: Globe,
      color: "text-blue-600",
    },
    {
      title: "Instagram Profiles",
      items: safeResult.instagrams,
      icon: Globe,
      color: "text-pink-500",
    },
  ];

  const handleExport = () => {
    try {
      const csv = resultToCSV(safeResult);
      const filename = `contact-scraping-${safeResult.url ? safeResult.url.replace(/[^a-zA-Z0-9]/g, "-") : "export"}.csv`;
      downloadCSV(csv, filename);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="pb-3 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-base font-medium break-all">
            {result.url}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full sm:w-auto" 
            onClick={handleExport}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map(({ title, items, icon: Icon, color }) => (
          <div key={title} className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Icon className={`h-4 w-4 ${color} shrink-0`} />
              {title} ({items.length})
            </h4>
            {items.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center p-2 rounded-md bg-muted/50 hover:bg-muted group"
                  >
                    <span className="text-sm break-all">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No {title.toLowerCase()} found
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Helper function to convert results to CSV format
function resultsToCSV(results: ContactScrapingResult[]) {
  const headers = ["URL", "Email", "Phone", "Address", "Postal Code"];
  const rows: string[][] = [];

  results.forEach((result) => {
    // Add a row for each combination of data
    const maxLength = Math.max(
      result.emails.length,
      result.phones.length,
      result.addresses.length,
      result.postal_codes.length
    );

    if (maxLength === 0) {
      // Add a row with just the URL if there's no data
      rows.push([result.url, "", "", "", ""]);
    } else {
      for (let i = 0; i < maxLength; i++) {
        rows.push([
          result.url,
          result.emails[i] || "",
          result.phones[i] || "",
          result.addresses[i] || "",
          result.postal_codes[i] || "",
        ]);
      }
    }
  });

  // Convert to CSV
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return csvContent;
}

// Helper function to convert a single result to CSV
function resultToCSV(result: ContactScrapingResult) {
  return resultsToCSV([result]);
}

export function ContactScrapingResultsView() {
  const { results, isLoading } = useContactResults();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!results?.length) {
    return null;
  }

  // Calculate totals for statistics
  const totalEmails = results?.reduce(
    (sum, result) => sum + (Array.isArray(result.emails) ? result.emails.length : 0),
    0
  );
  const totalPhones = results?.reduce(
    (sum, result) => sum + (Array.isArray(result.phones) ? result.phones.length : 0),
    0
  );
  const totalAddresses = results?.reduce(
    (sum, result) => sum + (Array.isArray(result.addresses) ? result.addresses.length : 0),
    0
  );
  const totalPostalCodes = results?.reduce(
    (sum, result) => sum + (Array.isArray(result.postal_codes) ? result.postal_codes.length : 0),
    0
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Scraping Results</CardTitle>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                try {
                  if (results && results.length > 0) {
                    // Create safe results array with guaranteed arrays for all properties
                    const safeResults = results.map(result => ({
                      ...result,
                      emails: Array.isArray(result.emails) ? result.emails : [],
                      phones: Array.isArray(result.phones) ? result.phones : [],
                      addresses: Array.isArray(result.addresses) ? result.addresses : [],
                      postal_codes: Array.isArray(result.postal_codes) ? result.postal_codes : [],
                      linkedins: Array.isArray(result.linkedins) ? result.linkedins : [],
                      twitters: Array.isArray(result.twitters) ? result.twitters : [],
                      facebooks: Array.isArray(result.facebooks) ? result.facebooks : [],
                      instagrams: Array.isArray(result.instagrams) ? result.instagrams : []
                    }));
                    
                    const csv = resultsToCSV(safeResults);
                    downloadCSV(csv, "all-contact-scraping-results.csv");
                  }
                } catch (error) {
                  console.error('Error exporting all results:', error);
                  alert('Failed to export all results. Please try again.');
                }
              }}
              disabled={!results || results.length === 0}
              className="text-xs h-8"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export All Results
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="w-full justify-start px-6 pt-4">
              <TabsTrigger value="summary" className="flex-1 sm:flex-none">
                Summary
              </TabsTrigger>
              <TabsTrigger value="detailed" className="flex-1 sm:flex-none">
                Detailed Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="p-6 pt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Mail className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Emails
                        </p>
                        <p className="text-2xl font-bold">{totalEmails}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Phone className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Phones
                        </p>
                        <p className="text-2xl font-bold">{totalPhones}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <MapPin className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Addresses
                        </p>
                        <p className="text-2xl font-bold">{totalAddresses}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Hash className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Postal Codes
                        </p>
                        <p className="text-2xl font-bold">{totalPostalCodes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="border-0 p-0">
              <div className="px-6 py-4">
                <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px] pr-4">
                  <div className="space-y-4">
                    {results?.map((result, index) => (
                      <ResultsTable key={index} result={result} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Mail, Phone, MapPin, Hash } from "lucide-react";
import { useScrapingContext } from "@/contexts/scraping-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ScrapingResults() {
  const { results, isLoadingResults } = useScrapingContext();

  const stats = [
    {
      title: "Total Emails",
      value: results?.statistics.total_emails || 0,
      icon: Mail,
      color: "text-blue-500",
    },
    {
      title: "Total Phones",
      value: results?.statistics.total_phones || 0,
      icon: Phone,
      color: "text-green-500",
    },
    {
      title: "Total Addresses",
      value: results?.statistics.total_addresses || 0,
      icon: MapPin,
      color: "text-purple-500",
    },
    {
      title: "Total Postal Codes",
      value: results?.statistics.total_postal_codes || 0,
      icon: Hash,
      color: "text-orange-500",
    },
  ];

  if (isLoadingResults) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading results...</span>
      </div>
    );
  }

  if (!results) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scraping Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Results</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map(({ title, value, icon: Icon, color }) => (
                <Card key={title}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${color}`} />
                      <div>
                        <div className="text-sm font-medium">{title}</div>
                        <div className="text-2xl font-bold">{value}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details">
            <ScrollArea className="h-[400px]">
              {results.results.map((result) => (
                <Card key={result.url} className="mb-4">
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">{result.url}</h3>
                    {/* Display emails, phones, etc. */}
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

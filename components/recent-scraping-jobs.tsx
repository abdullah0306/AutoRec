"use client";

import { useScrapingContext } from "@/contexts/scraping-context";

// Helper function to safely format dates
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return new Date().toLocaleString(); // Use current date as fallback
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // If invalid, use current date instead of showing N/A
      return new Date().toLocaleString();
    }
    return date.toLocaleString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return new Date().toLocaleString(); // Use current date as fallback
  }
};
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  PlayCircle,
  PauseCircle,
  StopCircle,
  RefreshCcw,
  Trash2,
  ExternalLink,
  FileText,
  LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";
import { ResultsDialog } from "@/components/results-dialog";
import type { Website, ScrapingJob, WebsiteStatus as WebsiteStatusType } from "@/types/api";

interface RecentScrapingJobsProps
  extends React.HTMLAttributes<HTMLDivElement> {}

interface StatusConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}

const getStatusConfig = (status: WebsiteStatusType): StatusConfig => {
  switch (status) {
    case "completed":
      return {
        icon: CheckCircle2,
        color: "text-green-500",
        bgColor: "bg-green-500/10 dark:bg-green-500/20",
        borderColor: "border-green-500/20",
      };
    case "scraping":
      return {
        icon: Loader2,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
        borderColor: "border-blue-500/20",
      };
    case "pending":
      return {
        icon: Clock,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10 dark:bg-yellow-500/20",
        borderColor: "border-yellow-500/20",
      };
    case "failed":
      return {
        icon: AlertCircle,
        color: "text-red-500",
        bgColor: "bg-red-500/10 dark:bg-red-500/20",
        borderColor: "border-red-500/20",
      };
    case "paused":
      return {
        icon: PauseCircle,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/20",
      };
    case "stopped":
      return {
        icon: StopCircle,
        color: "text-gray-500",
        bgColor: "bg-gray-500/10",
        borderColor: "border-gray-500/20",
      };
  }
};

function getProgressPercentage(website: Website, currentJob: ScrapingJob | null): number {
  if (!currentJob || website.batchId !== currentJob.batch_id) return 0;
  
  const total = currentJob.total_sites;
  const completed = currentJob.completed_sites;
  
  if (website.status === "completed") return 100;
  if (website.status === "failed") return 0;
  if (website.status === "scraping") return Math.round((completed / total) * 100);
  return 0;
}

interface WebsiteStatusProps {
  website: Website;
  currentJob: ScrapingJob | null;
}

function WebsiteStatus({ website, currentJob }: WebsiteStatusProps) {
  const statusConfig = getStatusConfig(website.status);
  const progress = getProgressPercentage(website, currentJob);
  
  return (
    <div className="flex items-center gap-2">
      <div className={cn("p-2 rounded-full", statusConfig.bgColor)}>
        <statusConfig.icon
          className={cn(
            "h-4 w-4",
            statusConfig.color,
            website.status === "scraping" && "animate-spin"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{website.url}</p>
          <Badge
            variant="secondary"
            className={cn("capitalize shrink-0", statusConfig.color)}
          >
            {website.status}
          </Badge>
        </div>
        {website.status === "scraping" && (
          <div className="mt-2 w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {website.status === "completed" ? (
            `Completed ${formatDate(website.endTime)}`
          ) : website.status === "scraping" ? (
            `In progress - ${progress}% complete`
          ) : (
            `Started ${formatDate(website.startTime)}`
          )}
        </p>
      </div>
    </div>
  );
}

export function RecentScrapingJobs({
  className,
  ...props
}: RecentScrapingJobsProps) {
  const {
    websites,
    updateWebsiteStatus,
    deleteWebsite,
    results,
    currentJob,
    fetchResults,
    isLoadingResults,
    batches,
    isBatchesLoading,
    fetchAllBatches
  } = useScrapingContext();

  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  
  // Fetch batches and results when component mounts
  useEffect(() => {
    const initializeData = async () => {
      await fetchAllBatches();
      
      // Fetch results for completed websites
      const completedWebsites = websites.filter(website => 
        website.status === "completed" && website.batchId
      );
      
      // Use a Set to avoid duplicate batch IDs
      const uniqueBatchIds = new Set(completedWebsites.map(website => website.batchId));
      
      // Fetch results for each unique batch ID
      for (const batchId of uniqueBatchIds) {
        if (batchId) {
          await fetchResults(batchId);
        }
      }
    };

    initializeData();
  }, [fetchAllBatches, websites, fetchResults]);

  // Find result for selected URL
  const selectedResult = results?.results?.find(
    (result) => result.url === selectedUrl
  ) || null;  // Convert undefined to null

  // Track completion status using currentJob from WebSocket
  const updateJobStatus = useCallback(
    (website: any) => {
      if (currentJob?.batch_id === website.batchId && currentJob) {
        const newStatus = (() => {
          if (
            currentJob.failed_sites > 0 &&
            currentJob.active_sites.includes(website.url)
          ) {
            return "failed";
          } else if (currentJob.active_sites.includes(website.url)) {
            return "scraping";
          } else if (currentJob.completed_sites === currentJob.total_sites) {
            return "completed";
          } else if (
            currentJob.pending_sites > 0 &&
            !currentJob.active_sites.includes(website.url)
          ) {
            return "pending";
          }
          return website.status;
        })();

        if (newStatus !== website.status) {
          updateWebsiteStatus(website.id, newStatus);
          if (newStatus === "completed") {
            fetchResults(website.batchId!);
          }
        }
      }
    },
    [currentJob, updateWebsiteStatus, fetchResults]
  );

  // Update status whenever currentJob changes
  useEffect(() => {
    if (currentJob) {
      websites.forEach((website) => {
        if (website.batchId === currentJob.batch_id) {
          updateJobStatus(website);
        }
      });
    }
  }, [currentJob?.batch_id, websites.length]); // Only depend on batch_id and websites length

  const handleJobAction = async (
    websiteId: string,
    action: "pause" | "resume" | "stop" | "retry" | "delete"
  ) => {
    try {
      switch (action) {
        case "pause":
          await fetch(`/api/scraping/${websiteId}/pause`, { method: "POST" });
          updateWebsiteStatus(websiteId, "paused");
          break;
        case "resume":
          await fetch(`/api/scraping/${websiteId}/resume`, { method: "POST" });
          updateWebsiteStatus(websiteId, "scraping");
          break;
        case "stop":
          await fetch(`/api/scraping/${websiteId}/stop`, { method: "POST" });
          updateWebsiteStatus(websiteId, "stopped");
          break;
        case "retry":
          await fetch(`/api/scraping/${websiteId}/retry`, { method: "POST" });
          updateWebsiteStatus(websiteId, "pending");
          break;
        case "delete":
          await fetch(`/api/scraping/${websiteId}`, { method: "DELETE" });
          deleteWebsite(websiteId);
          break;
      }
    } catch (error) {
      toast({
        title: "Action Failed",
        description: `Failed to ${action} the scraping job.`,
        variant: "error",
      });
    }
  };

  const JobControls = ({ website }: { website: any }) => (
    <div className="flex items-center gap-2 pr-4">
      {website.status === "completed" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSelectedUrl(website.url)}
            >
              <FileText className="h-4 w-4 text-blue-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View Results</TooltipContent>
        </Tooltip>
      )}
      {website.status !== "completed" && website.status !== "failed" && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() =>
                  handleJobAction(
                    website.id,
                    website.status === "paused" ? "resume" : "pause"
                  )
                }
              >
                {website.status === "paused" ? (
                  <PlayCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <PauseCircle className="h-4 w-4 text-orange-500" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {website.status === "paused" ? "Resume" : "Pause"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleJobAction(website.id, "stop")}
              >
                <StopCircle className="h-4 w-4 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Stop</TooltipContent>
          </Tooltip>
        </>
      )}

      {(website.status === "failed" || website.status === "stopped") && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleJobAction(website.id, "retry")}
            >
              <RefreshCcw className="h-4 w-4 text-blue-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Retry</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleJobAction(website.id, "delete")}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <>
      <Card className={cn("overflow-hidden", className)} {...props}>
        <CardHeader className="border-b bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="text-xl font-semibold">
                  Recent Scraping Jobs
                </CardTitle>
                <CardDescription className="text-sm">
                  Manage and monitor your scraping activities
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    fetchAllBatches();
                    // Refresh all completed jobs
                    const completedWebsites = websites.filter(website => 
                      website.status === "completed" && website.batchId
                    );
                    const uniqueBatchIds = new Set(completedWebsites.map(website => website.batchId));
                    uniqueBatchIds.forEach(batchId => {
                      if (batchId) {
                        fetchResults(batchId, true); // Force refresh
                      }
                    });
                  }}
                  disabled={isLoadingResults || isBatchesLoading}
                >
                  <RefreshCcw className={`h-4 w-4 mr-2 ${isLoadingResults || isBatchesLoading ? 'animate-spin' : ''}`} />
                  {isLoadingResults || isBatchesLoading ? 'Refreshing...' : 'Refresh All'}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <ScrollArea className="h-[400px]">
          <CardContent className="p-0">
            <div className="divide-y">
              {isBatchesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {batches.length > 0 ? (
                    batches.map((batch) => (
                      <div
                        key={batch.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              Batch: {batch.id}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {batch.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span>URLs: {batch.totalUrls}</span>
                            <span className="mx-2">•</span>
                            <span>Success: {batch.successfulUrls || 0}</span>
                            <span className="mx-2">•</span>
                            <span>Failed: {batch.failedUrls || 0}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span>Emails: {batch.totalEmails || 0}</span>
                            <span className="mx-2">•</span>
                            <span>Phones: {batch.totalPhones || 0}</span>
                            <span className="mx-2">•</span>
                            <span>Addresses: {batch.totalAddresses || 0}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Set the selected URL to view results
                            const website = websites.find(w => w.batchId === batch.id);
                            if (website) {
                              setSelectedUrl(website.url);
                            }
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      </div>
                    ))
                  ) : websites.length > 0 ? (
                    websites.slice(0, 5).map((website) => (
                      <div
                        key={website.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <WebsiteStatus website={website} currentJob={currentJob} />
                        <JobControls website={website} />
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <Clock className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-sm font-medium">No recent scraping jobs</p>
                      <p className="text-xs mt-1">
                        Start a new scraping job to see it here
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </ScrollArea>
      </Card>

      {selectedUrl && (
        <ResultsDialog
          result={selectedResult}
          isOpen={true}
          onClose={() => setSelectedUrl(null)}
        />
      )}
    </>
  );
}

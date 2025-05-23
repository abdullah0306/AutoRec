"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { scraping } from "@/lib/api";
import { WebSocketService } from "@/lib/websocket";
import type {
  ScrapingJob,
  ScrapingError,
  BatchResults,
  WebSocketMessage,
  Website,
  WebsiteStatus,
} from "@/types/api";
import { toast } from "@/components/ui/use-toast";
import { checkInitialContactScrapingCredits, deductCreditsForContactResults } from "@/lib/api/subscription-usage";

interface ScrapingState {
  isLoading: boolean;
  error: ScrapingError | null;
  currentJob: ScrapingJob | null;
  websites: Website[];
  results: BatchResults | { results: any[] } | null;
  isLoadingResults: boolean;
  hasSavedResults: boolean;
  batches: any[];
  isBatchesLoading: boolean;
}

interface ScrapingContextType extends ScrapingState {
  startScraping: (urls: string[]) => Promise<void>;
  stopScraping: () => Promise<void>;
  pauseScraping: () => Promise<void>;
  resumeScraping: () => Promise<void>;
  updateWebsiteStatus: (id: string, status: WebsiteStatus) => void;
  deleteWebsite: (id: string) => void;
  clearError: () => void;
  fetchResults: (batchId: string, forceRefresh?: boolean) => Promise<void>;
  fetchAllBatches: () => Promise<void>;
}

const ScrapingContext = createContext<ScrapingContextType | undefined>(
  undefined
);

export function ScrapingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ScrapingState>({
    isLoading: false,
    error: null,
    currentJob: null,
    batches: [],
    isBatchesLoading: false,
    websites: [],
    results: null,
    isLoadingResults: false,
    hasSavedResults: false,
  });
  

  const [wsService, setWsService] = useState<WebSocketService | null>(null);
  // Track which batches have already had credits deducted (using ref to persist across renders)
  const processedBatches = useRef<Set<string>>(new Set());

  // Function to handle credit deduction
  const handleCreditDeduction = useCallback(async (batchId: string, results: any[]) => {
    // Only process credits if we haven't processed this batch before
    if (processedBatches.current.has(batchId)) {
      console.log('Skipping credit deduction for already processed batch:', batchId);
      return;
    }

    // Skip if no results
    if (!results || !Array.isArray(results) || results.length === 0) {
      console.log('No results to process for batch:', batchId);
      return;
    }

    const email = localStorage.getItem('email');
    if (!email) {
      console.warn('User email not found in localStorage, skipping credit deduction');
      return;
    }

    try {
      // Calculate credits to deduct based on actual results
      const resultCounts = results.reduce((acc, result) => {
        // Only process results with actual data
        if (!result) return acc;
        
        const hasEmail = (result.emails?.length || 0) > 0 ? 1 : 0;
        const hasPhone = (result.phones?.length || 0) > 0 ? 1 : 0;
        const hasAddress = (result.addresses?.length || 0) > 0 ? 1 : 0;
        const hasPostalCode = (result.postal_codes?.length || 0) > 0 ? 1 : 0;
        
        // Only count if we have at least one valid result
        if (hasEmail || hasPhone || hasAddress || hasPostalCode) {
          acc.emails += hasEmail;
          acc.phones += hasPhone;
          acc.addresses += hasAddress;
          acc.postalCodes += hasPostalCode;
        }
        
        return acc;
      }, { emails: 0, phones: 0, addresses: 0, postalCodes: 0 });
      
      // Only proceed with deduction if we have at least one result
      const totalResults = resultCounts.emails + resultCounts.phones + 
                          resultCounts.addresses + resultCounts.postalCodes;
      
      if (totalResults === 0) {
        console.log('No valid results found to deduct credits for batch:', batchId);
        return;
      }
      
      console.log('Deducting credits for batch:', batchId, 'with counts:', resultCounts);
      
      // Mark this batch as processed before making the API call to prevent race conditions
      processedBatches.current.add(batchId);
      
      const deductionResult = await deductCreditsForContactResults(email, resultCounts);
      
      if (deductionResult.success) {
        console.log('Successfully deducted credits for batch:', batchId, 'Credits deducted:', deductionResult.creditsDeducted);
      } else {
        // If deduction failed, remove from processed batches so we can retry
        processedBatches.current.delete(batchId);
        console.warn('Failed to deduct credits for batch:', batchId, 'Error:', deductionResult.error);
      }
    } catch (error) {
      // If there's an error, remove from processed batches so we can retry
      processedBatches.current.delete(batchId);
      console.error('Error during credit deduction:', error);
    }
  }, []);

  const fetchAllBatches = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isBatchesLoading: true }));
      const email = localStorage.getItem('email');
      if (!email) {
        console.warn('No email found in localStorage');
        return;
      }

      const response = await fetch('/api/scraping-batches', {
        headers: {
          'Authorization': `Bearer ${email}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scraping batches');
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        batches: data,
        isBatchesLoading: false
      }));
    } catch (error) {
      console.error('Error fetching scraping batches:', error);
      setState(prev => ({
        ...prev,
        isBatchesLoading: false,
        error: { message: 'Failed to load scraping batches' }
      }));
    }
  }, []);

  // Initial fetch of batches
  useEffect(() => {
    fetchAllBatches();
  }, [fetchAllBatches]);

  const handleError = (error: any) => {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    setState((prev) => ({
      ...prev,
      error: { message: errorMessage },
      isLoading: false,
    }));
    toast({
      title: "Error",
      description: errorMessage,
      variant: "error",
    });
  };

  // Function to fetch saved results from the database
  const fetchSavedResults = useCallback(async (batchId: string) => {
    try {
      const email = localStorage.getItem('email');
      if (!email) return [];

      const response = await fetch(`/api/contact-scraper/results?batchId=${batchId}`, {
        headers: {
          'Authorization': `Bearer ${email}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch saved results');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching saved results:', error);
      return [];
    }
  }, []);

  const fetchResults = useCallback(async (batchId: string, forceRefresh = false) => {
    try {
      setState((prev) => ({ ...prev, isLoadingResults: true }));
      
      // Only check saved results if we're not forcing a refresh
      if (!forceRefresh) {
        const savedResults = await fetchSavedResults(batchId);
        
        if (savedResults && savedResults.length > 0) {
          console.log('Using saved results from database');
          setState((prev) => ({
            ...prev,
            results: { results: savedResults },
            isLoadingResults: false,
            hasSavedResults: true
          }));
          return;
        }
      }

      // If no saved results, fetch from scraping service
      const results = await scraping.getResults(batchId);
      
      // Update state with results (even if empty)
      setState((prev) => ({
        ...prev,
        results: results || { results: [] },
        isLoadingResults: false,
        hasSavedResults: false
      }));
      
      // Only process credits and save results if we have actual data
      if (results?.results?.length > 0) {
        // Process credits for the batch
        await handleCreditDeduction(batchId, results.results);
        
        // Now save results to the database
        try {
          const email = localStorage.getItem('email');
          if (!email) {
            console.warn('User email not found in localStorage, skipping save to database');
            return;
          }
          
          // Create or update batch record first
          const batchResponse = await fetch('/api/scraping-batches', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${email}`,
            },
            body: JSON.stringify({
              batchId,
              totalUrls: results.total_urls || 1,
              successfulUrls: results.successful_urls || 0,
              failedUrls: results.failed_urls || 0,
              totalEmails: results.statistics?.total_emails || 0,
              totalPhones: results.statistics?.total_phones || 0,
              totalAddresses: results.statistics?.total_addresses || 0,
              totalPostalCodes: results.statistics?.total_postal_codes || 0,
              status: 'completed',
              startedAt: results.start_time || new Date().toISOString(),
              completedAt: results.end_time || new Date().toISOString(),
            }),
          });

          if (!batchResponse.ok) {
            const errorData = await batchResponse.json().catch(() => ({}));
            throw new Error(`Failed to create batch: ${JSON.stringify(errorData)}`);
          }

          console.log('Raw results from scraper:', JSON.stringify(results, null, 2));
          
          // Prepare results for batch save
          const resultsToSave = results.results.map(result => {
            console.log('Processing result:', {
              url: result.url,
              hasPostalCodes: 'postal_codes' in result || 'postalCodes' in result,
              keys: Object.keys(result)
            });
            
            return {
              batchId,
              url: result.url,
              emails: result.emails || [],
              phones: result.phones || [],
              addresses: result.addresses || [],
              postalCodes: result.postal_codes || result.postal_codes || [],
              status: result.status || 'completed',
              error: result.error || null,
              completedAt: new Date().toISOString(),
            };
          });
          
          console.log('Processed results to save:', JSON.stringify(resultsToSave, null, 2));

          // Save all results in a single request
          const saveResponse = await fetch('/api/contact-scraper/save-results', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${email}`,
            },
            body: JSON.stringify({ results: resultsToSave }),
          });

          if (!saveResponse.ok) {
            const errorData = await saveResponse.json().catch(() => ({}));
            throw new Error(`Failed to save results: ${JSON.stringify(errorData)}`);
          }

          console.log('Successfully saved all scraping results to database');
          
          // Update the UI with the saved results
          setState(prev => ({
            ...prev,
            results: { results: resultsToSave },
            hasSavedResults: true
          }));
        } catch (saveError) {
          console.error('Failed to save results to database:', saveError);
        }
      }
    } catch (error) {
      handleError(error);
      setState((prev) => ({ ...prev, isLoadingResults: false }));
    }
  }, []);

  const updateWebsiteStatus = useCallback(
    (id: string, status: WebsiteStatus) => {
      setState((prev) => ({
        ...prev,
        websites: prev.websites.map((website) =>
          website.id === id
            ? {
                ...website,
                status,
                endTime: ["completed", "failed", "stopped"].includes(status)
                  ? new Date().toISOString()
                  : website.endTime,
              }
            : website
        ),
      }));
    },
    []
  );

  const deleteWebsite = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      websites: prev.websites.filter((website) => website.id !== id),
    }));
  }, []);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === "status_update") {
      setState((prev) => {
        // Update current job status
        const updatedJob = {
          ...message.data,
        };

        // Update website statuses based on active and completed sites
        const updatedWebsites = prev.websites.map(website => {
          if (website.batchId === updatedJob.batch_id) {
            if (updatedJob.active_sites.includes(website.url)) {
              return { 
                ...website, 
                status: "scraping" as const,
                startTime: updatedJob.start_time || website.startTime
              };
            } else if (updatedJob.completed_sites > 0 && !updatedJob.active_sites.includes(website.url)) {
              return { 
                ...website, 
                status: "completed" as const,
                endTime: updatedJob.end_time || new Date().toISOString()
              };
            } else if (updatedJob.failed_sites > 0 && !updatedJob.active_sites.includes(website.url)) {
              return {
                ...website,
                status: "failed" as const,
                endTime: updatedJob.end_time || new Date().toISOString()
              };
            } else if (updatedJob.pending_sites > 0) {
              return {
                ...website,
                status: "pending" as const
              };
            }
          }
          return website;
        });

        // If job is completed, fetch detailed results
        if (updatedJob.completed_sites === updatedJob.total_sites || updatedJob.end_time) {
          fetchResults(updatedJob.batch_id);
        }

        return {
          ...prev,
          currentJob: updatedJob,
          websites: updatedWebsites,
        };
      });
    }
  }, [fetchResults]);

  const handleWebSocketError = useCallback((error: Error) => {
    handleError(error);
  }, []);

  const startScraping = useCallback(
    async (urls: string[]) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        
        const email = localStorage.getItem('email');
        if (!email) {
          throw new Error('User not authenticated');
        }

        const job = await scraping.startScraping({
          urls,
          max_pages_per_site: 100,
          concurrent_sites: 5,
        });

        // Initialize WebSocket connection
        if (wsService) {
          wsService.disconnect();
        }

        const newWsService = new WebSocketService(
          job.batch_id,
          handleWebSocketMessage,
          handleWebSocketError
        );
        newWsService.connect();
        setWsService(newWsService);

        // Add websites to state
        const newWebsites: Website[] = urls.map((url) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          url,
          status: "pending",
          startTime: new Date().toISOString(),
          batchId: job.batch_id,
        }));

        setState((prev) => ({
          ...prev,
          currentJob: job,
          isLoading: false,
          websites: [...newWebsites, ...prev.websites],
        }));

        toast({
          title: "Scraping Started",
          description: `Processing ${job.total_sites} sites`,
        });
      } catch (error) {
        handleError(error);
      }
    },
    [wsService, handleWebSocketMessage, handleWebSocketError]
  );

  const pollJobStatus = useCallback(async (batchId: string) => {
    try {
      const job = await scraping.getStatus(batchId);
      setState((prev) => ({ ...prev, currentJob: job }));

      if (job.pending_sites > 0 || job.active_sites.length > 0) {
        setTimeout(() => pollJobStatus(batchId), 5000); // Poll every 5 seconds
      }
    } catch (error) {
      handleError(error);
    }
  }, []);

  const stopScraping = useCallback(async () => {
    if (!state.currentJob?.batch_id) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await scraping.stopScraping(state.currentJob.batch_id);
      setState((prev) => ({ ...prev, isLoading: false }));
      toast({ title: "Scraping Stopped" });
    } catch (error) {
      handleError(error);
    }
  }, [state.currentJob]);

  const pauseScraping = useCallback(async () => {
    if (!state.currentJob?.batch_id) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await scraping.pauseScraping(state.currentJob.batch_id);
      setState((prev) => ({ ...prev, isLoading: false }));
      toast({ title: "Scraping Paused" });
    } catch (error) {
      handleError(error);
    }
  }, [state.currentJob]);

  const resumeScraping = useCallback(async () => {
    if (!state.currentJob?.batch_id) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await scraping.resumeScraping(state.currentJob.batch_id);
      setState((prev) => ({ ...prev, isLoading: false }));
      toast({ title: "Scraping Resumed" });
    } catch (error) {
      handleError(error);
    }
  }, [state.currentJob]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    return () => {
      if (wsService) {
        wsService.disconnect();
      }
    };
  }, [wsService]);

  return (
    <ScrapingContext.Provider
      value={{
        ...state,
        startScraping,
        stopScraping,
        pauseScraping,
        resumeScraping,
        updateWebsiteStatus,
        deleteWebsite,
        clearError,
        fetchResults,
        fetchAllBatches,
      }}
    >
      {children}
    </ScrapingContext.Provider>
  );
}

export function useScrapingContext() {
  const context = useContext(ScrapingContext);
  if (context === undefined) {
    throw new Error(
      "useScrapingContext must be used within a ScrapingProvider"
    );
  }
  return context;
}

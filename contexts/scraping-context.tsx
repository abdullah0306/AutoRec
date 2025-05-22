"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
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
      setState((prev) => ({
        ...prev,
        results,
        isLoadingResults: false,
        hasSavedResults: false
      }));

      // Save results to the database if we have new results
      if (results?.results?.length > 0) {
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
              postalCodes: result.postal_codes || result.postalCodes || [],
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
      const { data } = message;
      
      setState(prev => ({ 
        ...prev, 
        currentJob: data,
        websites: prev.websites.map(website => {
          if (website.batchId === data.batch_id) {
            // Website is currently being scraped
            if (data.active_sites.includes(website.url)) {
              return { 
                ...website, 
                status: "scraping" as const,
                startTime: data.start_time || website.startTime
              };
            } 
            // Website scraping is completed
            else if (data.completed_sites > 0 && !data.active_sites.includes(website.url)) {
              return { 
                ...website, 
                status: "completed" as const,
                endTime: data.end_time || new Date().toISOString()
              };
            }
            // Website is failed
            else if (data.failed_sites > 0 && !data.active_sites.includes(website.url)) {
              return {
                ...website,
                status: "failed" as const,
                endTime: data.end_time || new Date().toISOString()
              };
            }
            // Website is pending
            else if (data.pending_sites > 0) {
              return {
                ...website,
                status: "pending" as const
              };
            }
          }
          return website;
        })
      }));

      // If job is completed, fetch detailed results
      if (data.completed_sites === data.total_sites || data.end_time) {
        fetchResults(data.batch_id);
      }
    }
  }, [fetchResults]);

  const handleWebSocketError = useCallback((error: Error) => {
    handleError(error);
  }, []);

  const startScraping = useCallback(
    async (urls: string[]) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

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

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";

export interface ContactScrapingResult {
  id: string | number;
  url: string;
  emails: string[];
  phones: string[];
  addresses: string[];
  postal_codes: string[];
  linkedins: string[];
  twitters: string[];
  facebooks: string[];
  instagrams: string[];
  completed_at: string;
  created_at: string;
}

interface ContactResultsContextType {
  results: ContactScrapingResult[];
  isLoading: boolean;
  error: string | null;
  fetchResults: () => Promise<void>;
}

const ContactResultsContext = createContext<ContactResultsContextType | undefined>(undefined);

export function ContactResultsProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<ContactScrapingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchResults = async () => {
    if (!user || !user.email) {
      console.log('No user or email available, skipping fetch');
      return;
    }
    
    const email = user.email;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching contact scraping results...');
      
      try {
        // First try to fetch from the database
        const dbResponse = await fetch("/api/contact-scraper/results", {
          headers: {
            "Authorization": `Bearer ${email}`
          },
          cache: 'no-store'
        });
        
        if (dbResponse.ok) {
          const dbResults = await dbResponse.json();
          console.log(`Successfully fetched ${dbResults.length} results from database`);
          setResults(dbResults);
          setIsLoading(false);
          return;
        } else {
          console.log('Failed to fetch results from database, falling back to JSON file');
        }
      } catch (dbError) {
        console.error('Error fetching from database:', dbError);
        console.log('Falling back to JSON file');
      }
      
      // Fallback to the old JSON file API
      const response = await fetch("/api/results/contact-scraping", {
        headers: {
          "Authorization": `Bearer ${email}`
        },
        // Add cache busting to prevent caching
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        throw new Error(`Failed to fetch contact scraping results: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Raw API response:', data);
      
      // Make sure we have results
      if (!data) {
        console.error("No data returned from API");
        setResults([]);
        return;
      }
      
      // Handle both array response and {results: []} response
      const resultsArray = Array.isArray(data) ? data : (data.results || []);
      
      if (!Array.isArray(resultsArray)) {
        console.error("Invalid response format, expected array:", data);
        setResults([]);
        return;
      }
      
      // Parse JSON strings in the results if needed
      const parsedResults = resultsArray.map((result: any) => {
        // Skip invalid results
        if (!result || typeof result !== 'object') return null;
        
        // Handle string JSON fields that might need parsing
        const parseJsonField = (field: any) => {
          if (typeof field === 'string') {
            try {
              return JSON.parse(field);
            } catch (e) {
              return [field]; // If it's not valid JSON, treat as single item array
            }
          }
          return Array.isArray(field) ? field : [];
        };
        
        return {
          ...result,
          id: result.id || Date.now().toString(),
          url: result.url || '',
          emails: parseJsonField(result.emails),
          phones: parseJsonField(result.phones),
          addresses: parseJsonField(result.addresses),
          postal_codes: parseJsonField(result.postal_codes),
          completed_at: result.completed_at || result.created_at || new Date().toISOString(),
          created_at: result.created_at || new Date().toISOString()
        };
      }).filter(Boolean); // Remove any null results
      
      console.log("Fetched and parsed contact scraping results:", parsedResults);
      setResults(parsedResults);
    } catch (err) {
      console.error("Error fetching contact scraping results:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to fetch contact scraping results",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.email) {
      fetchResults();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Add a periodic refresh
  useEffect(() => {
    if (!user || !user.email) return;
    
    // Initial fetch
    fetchResults();
    
    // Set up interval for periodic refresh
    const intervalId = setInterval(() => {
      fetchResults();
    }, 15000); // Refresh every 15 seconds
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ContactResultsContext.Provider
      value={{
        results,
        isLoading,
        error,
        fetchResults
      }}
    >
      {children}
    </ContactResultsContext.Provider>
  );
}

export function useContactResults() {
  const context = useContext(ContactResultsContext);
  if (context === undefined) {
    throw new Error("useContactResults must be used within a ContactResultsProvider");
  }
  return context;
}

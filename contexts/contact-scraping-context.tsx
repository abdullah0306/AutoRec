"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { searchContacts } from "@/lib/api/contact-scraper";
import type { ContactProfile } from "@/lib/api/contact-scraper";
import { checkAndDeductContactScrapingCredits } from "@/lib/api/subscription-usage";
import { toast } from "@/components/ui/use-toast";

interface ContactWebsite {
  id: string;
  url: string;
  status: "pending" | "scraping" | "completed" | "failed" | "paused" | "stopped";
  startTime: string;
  endTime?: string;
  batchId?: string;
}

interface ContactScrapingOptions {
  maxPages: number;
  maxLinkDepth: number;
  includeEmail: boolean;
  includePhone: boolean;
  includeSocial: boolean;
}

interface ContactBatchResults {
  batchId: string;
  contacts: ContactProfile[];
  totalContacts: number;
  timestamp: string;
}

interface ContactScrapingState {
  isLoading: boolean;
  error: { message: string } | null;
  message: string;
  websites: ContactWebsite[];
  results: ContactBatchResults | null;
  allResults: ContactBatchResults[];
  isLoadingResults: boolean;
}

interface ContactScrapingContextType {
  startScraping: (urls: string[], options: ContactScrapingOptions) => Promise<void>;
  updateWebsiteStatus: (id: string, status: ContactWebsite["status"]) => void;
  deleteWebsite: (id: string) => void;
  clearError: () => void;
  isLoading: boolean;
  error: { message: string } | null;
  message: string;
  websites: ContactWebsite[];
  results: ContactBatchResults | null;
  allResults: ContactBatchResults[];
  isLoadingResults: boolean;
}

const ContactScrapingContext = createContext<ContactScrapingContextType | undefined>(
  undefined
);

export function ContactScrapingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ContactScrapingState>({
    isLoading: false,
    error: null,
    message: "",
    websites: [],
    results: null,
    allResults: [],
    isLoadingResults: false,
  });
  
  // Load all recent results when the component mounts
  useEffect(() => {
    const loadAllResults = async () => {
      try {
        // Get email from localStorage for authentication
        const email = localStorage.getItem('email');
        if (!email) {
          console.log('Not authenticated. Cannot load previous results.');
          return;
        }
        
        setState(prev => ({ ...prev, isLoadingResults: true }));
        
        // Fetch all results from the database
        const response = await fetch('/api/contact-scraper/results', {
          headers: {
            'Authorization': `Bearer ${email}`
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          console.log('Failed to load previous results');
          setState(prev => ({ ...prev, isLoadingResults: false }));
          return;
        }
        
        const resultsData = await response.json();
        
        if (resultsData && resultsData.length > 0) {
          console.log(`Loaded ${resultsData.length} contact scraping results`);
          
          // Process all results
          const allBatchResults: ContactBatchResults[] = [];
          
          // Set the most recent result as the current result
          const mostRecent = resultsData[0];
          const contacts = [];
          
          // Create a contact for each email in the most recent result
          for (const email of mostRecent.emails || []) {
            contacts.push({
              name: '',
              position: '',
              company: '',
              website: mostRecent.url || '',
              address: '',
              city: '',
              state: '',
              country: '',
              zipCode: '',
              industry: '',
              companySize: '',
              foundedYear: '',
              description: '',
              source: mostRecent.url || '',
              email: email,
              phone: '',
              linkedIn: '',
              twitter: '',
              facebook: '',
              instagram: ''
            });
          }
          
          // Create a contact for each phone
          for (const phone of mostRecent.phones || []) {
            contacts.push({
              name: '',
              position: '',
              company: '',
              website: mostRecent.url || '',
              address: '',
              city: '',
              state: '',
              country: '',
              zipCode: '',
              industry: '',
              companySize: '',
              foundedYear: '',
              description: '',
              source: mostRecent.url || '',
              email: '',
              phone: phone,
              linkedIn: '',
              twitter: '',
              facebook: '',
              instagram: ''
            });
          }
          
          // Create contacts for social media links
          for (const linkedin of mostRecent.linkedins || []) {
            contacts.push({
              name: '', position: '', company: '', website: mostRecent.url || '',
              address: '', city: '', state: '', country: '', zipCode: '',
              industry: '', companySize: '', foundedYear: '', description: '',
              source: mostRecent.url || '', email: '', phone: '',
              linkedIn: linkedin, twitter: '', facebook: '', instagram: ''
            });
          }
          
          for (const twitter of mostRecent.twitters || []) {
            contacts.push({
              name: '', position: '', company: '', website: mostRecent.url || '',
              address: '', city: '', state: '', country: '', zipCode: '',
              industry: '', companySize: '', foundedYear: '', description: '',
              source: mostRecent.url || '', email: '', phone: '',
              linkedIn: '', twitter: twitter, facebook: '', instagram: ''
            });
          }
          
          for (const facebook of mostRecent.facebooks || []) {
            contacts.push({
              name: '', position: '', company: '', website: mostRecent.url || '',
              address: '', city: '', state: '', country: '', zipCode: '',
              industry: '', companySize: '', foundedYear: '', description: '',
              source: mostRecent.url || '', email: '', phone: '',
              linkedIn: '', twitter: '', facebook: facebook, instagram: ''
            });
          }
          
          for (const instagram of mostRecent.instagrams || []) {
            contacts.push({
              name: '', position: '', company: '', website: mostRecent.url || '',
              address: '', city: '', state: '', country: '', zipCode: '',
              industry: '', companySize: '', foundedYear: '', description: '',
              source: mostRecent.url || '', email: '', phone: '',
              linkedIn: '', twitter: '', facebook: '', instagram: instagram
            });
          }
          
          // If no contacts were created, add a default one
          if (contacts.length === 0) {
            contacts.push({
              name: '',
              position: '',
              company: '',
              website: mostRecent.url || '',
              address: '',
              city: '',
              state: '',
              country: '',
              zipCode: '',
              industry: '',
              companySize: '',
              foundedYear: '',
              description: '',
              source: mostRecent.url || '',
              email: '',
              phone: '',
              linkedIn: '',
              twitter: '',
              facebook: '',
              instagram: ''
            });
          }
          
          // Create a batch result for the most recent result
          const batchResult: ContactBatchResults = {
            batchId: mostRecent.id.toString(),
            contacts: contacts,
            totalContacts: contacts.length,
            timestamp: mostRecent.createdAt || new Date().toISOString()
          };
          
          // Process all results to create website entries and batch results
          const websites: ContactWebsite[] = [];
          
          // Process each result into a website entry and batch result
          for (const result of resultsData) {
            // Create a website entry
            const website: ContactWebsite = {
              id: result.id.toString(),
              url: result.url,
              status: 'completed',
              startTime: result.createdAt || new Date().toISOString(),
              endTime: result.completedAt || new Date().toISOString(),
              batchId: result.id.toString()
            };
            
            websites.push(website);
            
            // Create contacts for this result
            const resultContacts = [];
            
            // Process all data types for this result
            // 1. Process emails
            for (const email of result.emails || []) {
              resultContacts.push({
                name: '',
                position: '',
                company: '',
                website: result.url || '',
                address: '',
                city: '',
                state: '',
                country: '',
                zipCode: '',
                industry: '',
                companySize: '',
                foundedYear: '',
                description: '',
                source: result.url || '',
                email: email,
                phone: '',
                linkedIn: '',
                twitter: '',
                facebook: '',
                instagram: ''
              });
            }
            
            // 2. Process phone numbers
            for (const phone of result.phones || []) {
              resultContacts.push({
                name: '',
                position: '',
                company: '',
                website: result.url || '',
                address: '',
                city: '',
                state: '',
                country: '',
                zipCode: '',
                industry: '',
                companySize: '',
                foundedYear: '',
                description: '',
                source: result.url || '',
                email: '',
                phone: phone,
                linkedIn: '',
                twitter: '',
                facebook: '',
                instagram: ''
              });
            }
            
            // 3. Process LinkedIn links
            for (const linkedin of result.linkedins || []) {
              resultContacts.push({
                name: '',
                position: '',
                company: '',
                website: result.url || '',
                address: '',
                city: '',
                state: '',
                country: '',
                zipCode: '',
                industry: '',
                companySize: '',
                foundedYear: '',
                description: '',
                source: result.url || '',
                email: '',
                phone: '',
                linkedIn: linkedin,
                twitter: '',
                facebook: '',
                instagram: ''
              });
            }
            
            // 4. Process Twitter links
            for (const twitter of result.twitters || []) {
              resultContacts.push({
                name: '',
                position: '',
                company: '',
                website: result.url || '',
                address: '',
                city: '',
                state: '',
                country: '',
                zipCode: '',
                industry: '',
                companySize: '',
                foundedYear: '',
                description: '',
                source: result.url || '',
                email: '',
                phone: '',
                linkedIn: '',
                twitter: twitter,
                facebook: '',
                instagram: ''
              });
            }
            
            // 5. Process Facebook links
            for (const facebook of result.facebooks || []) {
              resultContacts.push({
                name: '',
                position: '',
                company: '',
                website: result.url || '',
                address: '',
                city: '',
                state: '',
                country: '',
                zipCode: '',
                industry: '',
                companySize: '',
                foundedYear: '',
                description: '',
                source: result.url || '',
                email: '',
                phone: '',
                linkedIn: '',
                twitter: '',
                facebook: facebook,
                instagram: ''
              });
            }
            
            // 6. Process Instagram links
            for (const instagram of result.instagrams || []) {
              resultContacts.push({
                name: '',
                position: '',
                company: '',
                website: result.url || '',
                address: '',
                city: '',
                state: '',
                country: '',
                zipCode: '',
                industry: '',
                companySize: '',
                foundedYear: '',
                description: '',
                source: result.url || '',
                email: '',
                phone: '',
                linkedIn: '',
                twitter: '',
                facebook: '',
                instagram: instagram
              });
            }
            
            // 7. Process addresses and postal codes if needed
            // We can add this later if required
            
            // Create a batch result for this result
            const resultBatch: ContactBatchResults = {
              batchId: result.id.toString(),
              contacts: resultContacts,
              totalContacts: resultContacts.length,
              timestamp: result.createdAt || new Date().toISOString()
            };
            
            allBatchResults.push(resultBatch);
          }
          
          setState(prev => ({
            ...prev,
            websites: websites,
            results: batchResult, // Most recent result as the current result
            allResults: allBatchResults, // All results
            isLoadingResults: false
          }));
          
          console.log(`Loaded ${websites.length} contact scraping results`);
        } else {
          console.log('No previous results found');
          setState(prev => ({ ...prev, isLoadingResults: false }));
        }
      } catch (error) {
        console.error('Error loading contact scraping results:', error);
        setState(prev => ({ ...prev, isLoadingResults: false }));
      }
    };
    
    loadAllResults();
  }, []);

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

  const updateWebsiteStatus = useCallback(
    (id: string, status: ContactWebsite["status"]) => {
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

  const startScraping = useCallback(
    async (urls: string[], options: ContactScrapingOptions) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Get email from localStorage for authentication
        const email = localStorage.getItem('email');
        if (!email) {
          throw new Error("Not authenticated. Please log in.");
        }
        
        // Check if user has enough credits for scraping
        // Each website scrape costs a fixed number of credits (15 for all packages)
        const usageCheck = await checkAndDeductContactScrapingCredits(email, urls.length, true);
        
        if (!usageCheck.success) {
          throw new Error(usageCheck.error || "Subscription check failed");
        }
        
        // Show credit usage information
        const creditsPerScrape = usageCheck.creditsPerScrape || 15;
        const creditsNeeded = urls.length * creditsPerScrape;
        const remainingAfter = (usageCheck.remainingCredits || 0) - creditsNeeded;
        
        if (remainingAfter < 0) {
          throw new Error(`Not enough credits. You need ${creditsNeeded} credits to scrape ${urls.length} website(s), but you only have ${usageCheck.remainingCredits} credits remaining.`);
        }
        
        toast({
          title: "Credit Check",
          description: `Your ${usageCheck.packageName} package uses ${creditsPerScrape} credits per website. This operation will use ${creditsNeeded} credits. You will have ${remainingAfter} credits remaining.`,
          duration: 5000
        });

        // Generate a unique batch ID
        const batchId = Date.now().toString() + Math.random().toString(36).substring(2, 9);

        // Add websites to state with pending status
        const newWebsites: ContactWebsite[] = urls.map((url) => ({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          url,
          status: "pending",
          startTime: new Date().toISOString(),
          batchId,
        }));

        setState((prev) => ({
          ...prev,
          websites: [...newWebsites, ...prev.websites],
        }));

        // Actually deduct the credits before starting the scraping process
        const deductCredits = await checkAndDeductContactScrapingCredits(email, urls.length, false);
        
        if (!deductCredits.success) {
          throw new Error(deductCredits.error || "Failed to deduct credits. Please try again.");
        }
        
        // Process each URL sequentially
        const allContacts: ContactProfile[] = [];
        
        for (const website of newWebsites) {
          try {
            // Update status to scraping
            updateWebsiteStatus(website.id, "scraping");
            
            console.log(`Starting scraping for ${website.url} with max pages: ${options.maxPages}`);
            
            // Show a toast notification that scraping has started
            toast({
              title: "Contact Scraping Started",
              description: `Scraping ${website.url} - this may take a few minutes`,
              duration: 5000
            });
            
            // Call the contact scraper API with increased timeout
            const result = await searchContacts(
              {
                url: website.url,
                maxPages: options.maxPages,
                includeEmail: options.includeEmail,
                includePhone: options.includePhone,
                includeSocial: options.includeSocial,
              },
              email
            );
            
            console.log(`Scraping completed for ${website.url}, found ${result.contacts?.length || 0} contacts`);
            
            // Add contacts to the results
            if (result.contacts && Array.isArray(result.contacts)) {
              allContacts.push(...result.contacts);
              
              // Show a toast notification with the results
              toast({
                title: "Contact Scraping Completed",
                description: `Found ${result.contacts.length} contacts from ${website.url}`,
                duration: 5000
              });
            } else {
              console.error('Invalid contacts data structure:', result.contacts);
              toast({
                title: "Contact Scraping Issue",
                description: `No valid contacts found for ${website.url}`,
                variant: "error",
                duration: 5000
              });
            }
            
            // Update status to completed
            updateWebsiteStatus(website.id, "completed");
          } catch (error) {
            console.error(`Error scraping ${website.url}:`, error);
            updateWebsiteStatus(website.id, "failed");
            
            // Show a toast notification with the error
            toast({
              title: "Contact Scraping Failed",
              description: `Error scraping ${website.url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              variant: "error",
              duration: 5000
            });
          }
        }

        // Store the results
        const timestamp = new Date().toISOString();
        setState((prev) => ({
          ...prev,
          isLoading: false,
          results: {
            batchId,
            contacts: allContacts,
            totalContacts: allContacts.length,
            timestamp,
          },
        }));

        // Save results to database for the Results page
        try {
          console.log('Preparing to save contact results, total contacts found:', allContacts.length);
          
          if (allContacts.length === 0) {
            console.warn('No contacts found to save');
          }
          
          // Group data by type
          const emails = allContacts.flatMap(contact => contact.email ? [contact.email] : []);
          const phones = allContacts.flatMap(contact => contact.phone ? [contact.phone] : []);
          const addresses = allContacts.flatMap(contact => {
            const addressParts = [contact.address, contact.city, contact.state, contact.country, contact.zipCode]
              .filter(Boolean);
            return addressParts.length > 0 ? [addressParts.join(', ')] : [];
          });
          const postalCodes = allContacts.flatMap(contact => contact.zipCode ? [contact.zipCode] : []);
          
          // Extract social media links
          const linkedins = allContacts.flatMap(contact => contact.linkedIn ? [contact.linkedIn] : []);
          const twitters = allContacts.flatMap(contact => contact.twitter ? [contact.twitter] : []);
          const facebooks = allContacts.flatMap(contact => contact.facebook ? [contact.facebook] : []);
          const instagrams = allContacts.flatMap(contact => contact.instagram ? [contact.instagram] : []);

          // Remove duplicates
          const uniqueEmails = [...new Set(emails)];
          const uniquePhones = [...new Set(phones)];
          const uniqueAddresses = [...new Set(addresses)];
          const uniquePostalCodes = [...new Set(postalCodes)];
          const uniqueLinkedins = [...new Set(linkedins)];
          const uniqueTwitters = [...new Set(twitters)];
          const uniqueFacebooks = [...new Set(facebooks)];
          const uniqueInstagrams = [...new Set(instagrams)];
          
          console.log('Processed data for saving:', {
            emails: uniqueEmails.length,
            phones: uniquePhones.length,
            addresses: uniqueAddresses.length,
            postalCodes: uniquePostalCodes.length,
            linkedins: uniqueLinkedins.length,
            twitters: uniqueTwitters.length,
            facebooks: uniqueFacebooks.length,
            instagrams: uniqueInstagrams.length
          });

          // Save to database for each URL
          for (const url of urls) {
            console.log(`Saving results for ${url}`);
            
            try {
              // Save to the new database API endpoint
              const dbResponse = await fetch('/api/contact-scraper/save-results', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${email}`
                },
                body: JSON.stringify({
                  url,
                  emails: uniqueEmails,
                  phones: uniquePhones,
                  addresses: uniqueAddresses,
                  postalCodes: uniquePostalCodes,
                  linkedins: uniqueLinkedins,
                  twitters: uniqueTwitters,
                  facebooks: uniqueFacebooks,
                  instagrams: uniqueInstagrams,
                  completedAt: timestamp
                })
              });
              
              if (!dbResponse.ok) {
                const errorText = await dbResponse.text();
                console.error(`Error saving results to database for ${url}:`, dbResponse.status, errorText);
              } else {
                const dbResult = await dbResponse.json();
                console.log(`Successfully saved results to database for ${url}. Result ID: ${dbResult.resultId}`);
              }
              
              // Also save to the old JSON file API for backward compatibility
              const jsonResponse = await fetch('/api/results/contact-scraping', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${email}`
                },
                body: JSON.stringify({
                  url,
                  emails: uniqueEmails,
                  phones: uniquePhones,
                  addresses: uniqueAddresses,
                  postalCodes: uniquePostalCodes,
                  linkedins: uniqueLinkedins,
                  twitters: uniqueTwitters,
                  facebooks: uniqueFacebooks,
                  instagrams: uniqueInstagrams,
                  completedAt: timestamp
                })
              });
              
              if (!jsonResponse.ok) {
                const errorText = await jsonResponse.text();
                console.error(`Error saving results to JSON file for ${url}:`, jsonResponse.status, errorText);
              } else {
                console.log(`Successfully saved results to JSON file for ${url}`);
              }
            } catch (saveError) {
              console.error(`Error saving results for ${url}:`, saveError);
            }
          }
        } catch (saveError) {
          console.error('Error saving contact results to database:', saveError);
          // Don't block the UI if saving fails
        }

        toast({
          title: "Contact Scraping Completed",
          description: `Found ${allContacts.length} contacts from ${urls.length} websites`,
        });
      } catch (error) {
        handleError(error);
      }
    },
    [updateWebsiteStatus]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <ContactScrapingContext.Provider
      value={{
        isLoading: state.isLoading,
        error: state.error,
        message: state.message,
        websites: state.websites,
        results: state.results,
        allResults: state.allResults,
        isLoadingResults: state.isLoadingResults,
        startScraping,
        updateWebsiteStatus,
        deleteWebsite,
        clearError,
      }}
    >
      {children}
    </ContactScrapingContext.Provider>
  );
}

export function useContactScrapingContext() {
  const context = useContext(ContactScrapingContext);
  if (context === undefined) {
    throw new Error(
      "useContactScrapingContext must be used within a ContactScrapingProvider"
    );
  }
  return context;
}

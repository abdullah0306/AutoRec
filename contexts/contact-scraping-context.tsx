"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { searchContacts, checkActiveScrapingJobs } from "@/lib/api/contact-scraper";
import type { ContactProfile, ActiveJobInfo } from "@/lib/api/contact-scraper";
import { checkInitialContactScrapingCredits, deductCreditsForContactResults } from "@/lib/api/subscription-usage";
import { toast } from "@/components/ui/use-toast";
import { url } from "inspector";

// Helper function to ensure valid date strings
const formatDateString = (dateStr: string | undefined | null): string => {
  if (!dateStr) return new Date().toISOString();
  
  try {
    // Check if it's a valid date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // If invalid, return current date
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (e) {
    // If any error occurs, return current date
    return new Date().toISOString();
  }
};

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
  
  // Load all recent results and restore scraping state when the component mounts
  useEffect(() => {
    // First, try to restore any in-progress scraping from localStorage
    const restoreScrapingState = () => {
      try {
        const savedState = localStorage.getItem('contactScrapingState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // Only restore if there are active scraping websites (pending or scraping)
          const activeWebsites = parsedState.websites?.filter((w: { status: string; }) => 
            w.status === 'pending' || w.status === 'scraping'
          );
          
          if (activeWebsites && activeWebsites.length > 0) {
            console.log('Restoring in-progress scraping state:', activeWebsites.length, 'active websites');
            setState(prev => ({
              ...prev,
              websites: parsedState.websites || [],
              isLoading: parsedState.isLoading || false,
              // Don't restore error state to avoid showing old errors
            }));
            
            // Resume scraping for websites that were in progress
            activeWebsites.forEach((website: ContactWebsite) => {
              // We'll implement the resumeScraping function later
              // This will be called after state is fully initialized
              setTimeout(() => resumeScraping(website), 1000);
            });
          }
        }
      } catch (error) {
        console.error('Error restoring scraping state:', error);
        // Clear potentially corrupted state
        localStorage.removeItem('contactScrapingState');
      }
    };
    
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
        
        // First restore any saved scraping state
        restoreScrapingState();
        
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
            timestamp: formatDateString(mostRecent.createdAt) || new Date().toISOString()
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
              startTime: formatDateString(result.createdAt) || new Date().toISOString(),
              endTime: formatDateString(result.completedAt) || new Date().toISOString(),
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
              timestamp: formatDateString(result.createdAt) || new Date().toISOString()
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

  // Save scraping state to localStorage whenever it changes
  useEffect(() => {
    // Only save if there are websites in the state
    if (state.websites.length > 0) {
      try {
        // Only save essential data to avoid localStorage size limits
        const stateToSave = {
          websites: state.websites,
          isLoading: state.isLoading
        };
        localStorage.setItem('contactScrapingState', JSON.stringify(stateToSave));
      } catch (error) {
        console.error('Error saving scraping state:', error);
      }
    }
  }, [state.websites, state.isLoading]);
  
  // Function to resume scraping for a website that was in progress
  const resumeScraping = async (website: ContactWebsite) => {
    try {
      // Get email from localStorage for authentication
      const email = localStorage.getItem('email');
      if (!email) {
        throw new Error("Not authenticated. Please log in.");
      }
      
      console.log(`Checking if ${website.url} is already being scraped...`);
      
      // First check if this URL is already being scraped
      const activeJobsCheck = await checkActiveScrapingJobs(website.url);
      
      if (activeJobsCheck.success && Object.keys(activeJobsCheck.active_jobs).length > 0) {
        // This URL is already being scraped, just update the UI
        console.log(`${website.url} is already being scraped, updating UI only`);
        
        const activeJob = activeJobsCheck.active_jobs[website.url];
        const startTime = new Date(activeJob.start_time * 1000).toLocaleTimeString();
        
        // If the job has a completion time, update the website status to completed
        if (activeJob.completion_time && activeJob.status === 'COMPLETED') {
          // Update the website with the actual completion time
          updateWebsiteWithCompletionTime(website.id, activeJob.completion_time);
          
          toast({
            title: "Contact Scraping Completed",
            description: `Scraping for ${website.url} completed at ${new Date(activeJob.completion_time * 1000).toLocaleTimeString()}`,
            duration: 5000
          });
          
          return; // Don't start a new scraping job
        }
        
        // Update status to scraping
        updateWebsiteStatus(website.id, "scraping");
        
        // Show a toast notification that scraping is already in progress
        toast({
          title: "Contact Scraping In Progress",
          description: `${website.url} is already being scraped (started at ${startTime}). Results will be available soon.`,
          duration: 5000
        });
        
        return; // Don't start a new scraping job
      }
      
      console.log(`Resuming scraping for ${website.url}`);
      
      // Update status to scraping
      updateWebsiteStatus(website.id, "scraping");
      
      // Show a toast notification that scraping has resumed
      toast({
        title: "Contact Scraping Resumed",
        description: `Resuming scraping for ${website.url}`,
        duration: 5000
      });
      
      // Call the contact scraper API
      const result = await searchContacts(
        {
          url: website.url,
          maxPages: 10, // Default value since we don't have the original options
          includeEmail: true,
          includePhone: true,
          includeSocial: true,
        },
        email
      );
      
      console.log(`Scraping completed for ${website.url}, found ${result.contacts?.length || 0} contacts`);
      
      // Process the results as in the startScraping function
      if (result.contacts && Array.isArray(result.contacts)) {
        // Group data by type
        const emails = result.contacts.flatMap(contact => contact.email ? [contact.email] : []);
        const phones = result.contacts.flatMap(contact => contact.phone ? [contact.phone] : []);
        const addresses = result.contacts.flatMap(contact => {
          const addressParts = [contact.address, contact.city, contact.state, contact.country, contact.zipCode]
            .filter(Boolean);
          return addressParts.length > 0 ? [addressParts.join(', ')] : [];
        });
        const postalCodes = result.contacts.flatMap(contact => contact.zipCode ? [contact.zipCode] : []);
        
        // Extract social media links
        const linkedins = result.contacts.flatMap(contact => contact.linkedIn ? [contact.linkedIn] : []);
        const twitters = result.contacts.flatMap(contact => contact.twitter ? [contact.twitter] : []);
        const facebooks = result.contacts.flatMap(contact => contact.facebook ? [contact.facebook] : []);
        const instagrams = result.contacts.flatMap(contact => contact.instagram ? [contact.instagram] : []);

        // Remove duplicates
        const uniqueEmails = [...new Set(emails)];
        const uniquePhones = [...new Set(phones)];
        const uniqueAddresses = [...new Set(addresses)];
        const uniquePostalCodes = [...new Set(postalCodes)];
        const uniqueLinkedins = [...new Set(linkedins)];
        const uniqueTwitters = [...new Set(twitters)];
        const uniqueFacebooks = [...new Set(facebooks)];
        const uniqueInstagrams = [...new Set(instagrams)];
        
        // Save results to database
        try {
          const saveResponse = await fetch('/api/contact-scraper/results', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${email}`
            },
            body: JSON.stringify({
              url: website.url,
              emails: uniqueEmails,
              phones: uniquePhones,
              addresses: uniqueAddresses,
              postalCodes: uniquePostalCodes,
              linkedins: uniqueLinkedins,
              twitters: uniqueTwitters,
              facebooks: uniqueFacebooks,
              instagrams: uniqueInstagrams
            })
          });
          
          if (!saveResponse.ok) {
            console.error('Failed to save contact scraping results:', await saveResponse.text());
          } else {
            console.log('Successfully saved contact scraping results');
          }
        } catch (saveError) {
          console.error('Error saving contact scraping results:', saveError);
        }
        
        // Check if this is an API connection error (special flag in email field)
        const hasConnectionError = result.contacts.some(contact => 
          contact.email === 'actor_failed_to_start'
        );
        
        if (hasConnectionError) {
          console.log('API connection error detected, no credits will be deducted');
          updateWebsiteStatus(website.id, "failed");
          toast({
            title: "Contact Scraping Failed",
            description: `The scraping service is currently unavailable. No credits have been deducted.`,
            duration: 5000
          });
          return; // Exit early, don't process results or deduct credits
        }
        
        // Extract all contacts from the result
        const allContacts = result.contacts;
        const batchResult: ContactBatchResults = {
          batchId: website.id,
          contacts: allContacts,
          totalContacts: allContacts.length,
          timestamp: formatDateString(new Date().toISOString())
        };
        
        // Update the state with the new results
        setState(prev => ({
          ...prev,
          results: batchResult,
          allResults: [batchResult, ...prev.allResults]
        }));
        
        // Show a toast notification with the results
        toast({
          title: "Contact Scraping Completed",
          description: `Found ${result.contacts.length} contacts from ${website.url}`,
          duration: 5000
        });
        
        // Update status to completed
        updateWebsiteStatus(website.id, "completed");
      } else {
        console.log('No contacts found for this website:', website.url);
        updateWebsiteStatus(website.id, "completed");
        toast({
          title: "No Contacts Found",
          description: `This website contains no contact data. No credits have been deducted.`,
          duration: 5000
        });
      }
    } catch (error) {
      console.error(`Error resuming scraping for ${website.url}:`, error);
      updateWebsiteStatus(website.id, "failed");
      
      // Check if the error is due to the actor failing to start
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isActorFailure = errorMessage.includes('actor_failed_to_start');
      
      if (isActorFailure) {
        toast({
          title: "Contact Scraping Failed",
          description: `The scraping service is currently unavailable. No credits have been deducted.`,
          variant: "error",
          duration: 5000
        });
      } else {
        toast({
          title: "Contact Scraping Failed",
          description: `Error scraping ${website.url}: ${errorMessage}`,
          variant: "error",
          duration: 5000
        });
      }
    }
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
                  ? formatDateString(new Date().toISOString())
                  : website.endTime,
              }
            : website
        ),
      }));
    },
    []
  );
  
  // Function to update a website with the actual completion time from the API
  const updateWebsiteWithCompletionTime = useCallback(
    (id: string, completionTime: number) => {
      setState((prev) => ({
        ...prev,
        websites: prev.websites.map((website) =>
          website.id === id
            ? {
                ...website,
                status: "completed",
                endTime: formatDateString(new Date(completionTime * 1000).toISOString()),
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
        
        // Check if user has enough credits for scraping using the new credit system
        // Credits are now charged based on actual results (emails, phones, social links)
        const usageCheck = await checkInitialContactScrapingCredits(email, urls.length);
        
        if (!usageCheck.success) {
          throw new Error(usageCheck.error || "Subscription check failed");
        }
        
        // Show credit usage information with the new system
        const estimatedCreditsNeeded = usageCheck.estimatedCreditsNeeded || urls.length * 10; // Conservative estimate
        const remainingCredits = usageCheck.remainingCredits || 0;
        
        toast({
          title: "Credit Check",
          description: `Your ${usageCheck.packageName} package uses 1 credit per contact found (email, phone, or social link). Estimated credits needed: ${estimatedCreditsNeeded}. You have ${remainingCredits} credits available.`,
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

        // We'll deduct credits after we get the results, not before scraping
        // This is handled later in the code after we have the actual contact counts
        
        // Process each URL sequentially
        const allContacts: ContactProfile[] = [];
        
        // Variable to track if we should skip credit deduction due to actor failure
        let skipCreditDeduction = false;
        
        // First check if any of these URLs are already being scraped
        const urlsToCheck = newWebsites.map(website => website.url);
        const activeJobsCheck = await checkActiveScrapingJobs(urlsToCheck);
        
        for (const website of newWebsites) {
          try {
            // Check if this URL is already being scraped
            if (activeJobsCheck.success && activeJobsCheck.active_jobs[website.url]) {
              // This URL is already being scraped, just update the UI
              console.log(`${website.url} is already being scraped, skipping new job`);
              
              const activeJob = activeJobsCheck.active_jobs[website.url];
              const startTime = new Date(activeJob.start_time * 1000).toLocaleTimeString();
              
              // If the job has a completion time, update the website status to completed
              if (activeJob.completion_time && activeJob.status === 'COMPLETED') {
                // Update the website with the actual completion time
                updateWebsiteWithCompletionTime(website.id, activeJob.completion_time);
                
                toast({
                  title: "Contact Scraping Completed",
                  description: `Scraping for ${website.url} completed at ${new Date(activeJob.completion_time * 1000).toLocaleTimeString()}`,
                  duration: 5000
                });
                
                continue; // Skip to next URL
              }
              
              // Update status to scraping
              updateWebsiteStatus(website.id, "scraping");
              
              // Show a toast notification that scraping is already in progress
              toast({
                title: "Contact Scraping In Progress",
                description: `${website.url} is already being scraped (started at ${startTime}). Results will be available soon.`,
                duration: 5000
              });
              
              continue; // Skip to next URL
            }
            
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
            
            // Check if this is an API connection error (special flag in email field)
            if (result.contacts && Array.isArray(result.contacts) && 
                result.contacts.some(contact => contact.email === 'actor_failed_to_start')) {
              
              console.log('API connection error detected in startScraping, no credits will be deducted');
              updateWebsiteStatus(website.id, "failed");
              toast({
                title: "Contact Scraping Failed",
                description: `The scraping service is currently unavailable. No credits have been deducted.`,
                duration: 5000
              });
              
              // Skip credit deduction for this website
              skipCreditDeduction = true;
              continue; // Skip to next URL
            }
            
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
              console.log('No contacts found for this website:', website.url);
              toast({
                title: "No Contacts Found",
                description: `This website contains no contact data. No credits have been deducted.`,
                duration: 5000
              });
            }
            
            // Update status to completed
            updateWebsiteStatus(website.id, "completed");
          } catch (error) {
            console.error(`Error scraping ${website.url}:`, error);
            updateWebsiteStatus(website.id, "failed");
            
            // Check if the error is due to the actor failing to start
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const isActorFailure = errorMessage.includes('actor_failed_to_start');
            
            if (isActorFailure) {
              // Show a toast notification for actor failure (no credit deduction)
              toast({
                title: "Contact Scraping Failed",
                description: `The scraping service is currently unavailable. No credits have been deducted.`,
                variant: "error",
                duration: 5000
              });
              
              // Skip credit deduction for this website
              skipCreditDeduction = true;
            } else {
              // Show a toast notification with the general error
              toast({
                title: "Contact Scraping Failed",
                description: `Error scraping ${website.url}: ${errorMessage}`,
                variant: "error",
                duration: 5000
              });
            }
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
          
          // Calculate total social links for credit deduction
          const totalSocialLinks = uniqueLinkedins.length + uniqueTwitters.length + 
                                  uniqueFacebooks.length + uniqueInstagrams.length;
          
          // Calculate total results found
          const totalResults = uniqueEmails.length + uniquePhones.length + totalSocialLinks;
          
          if (totalResults === 0 || skipCreditDeduction) {
            // No results found or actor failed to start, no credits deducted
            if (skipCreditDeduction) {
              console.log('Skipping credit deduction due to actor failure');
            } else {
              console.log('No results found, no credits will be deducted');
              toast({
                title: "No Results Found",
                description: `No contact information was found for ${url}. No credits have been deducted.`,
                duration: 5000
              });
            }
          } else {
            // Now deduct credits based on actual results
            const deductResult = await deductCreditsForContactResults(email, {
              emails: uniqueEmails.length,
              phones: uniquePhones.length,
              socialLinks: totalSocialLinks
            });
            
            if (!deductResult.success) {
              console.error('Failed to deduct credits:', deductResult.error);
              toast({
                title: "Credit Deduction Issue",
                description: `Warning: ${deductResult.error || 'There was an issue deducting credits'}`,
                variant: "error",
                duration: 5000
              });
            } else {
              // Show how many credits were used
              toast({
                title: "Credits Used",
                description: `Used ${deductResult.creditsDeducted} credits (${uniqueEmails.length} emails + ${uniquePhones.length} phones + ${totalSocialLinks} social links). You have ${deductResult.remainingCredits} credits remaining.`,
                duration: 5000
              });
            }
          }
          
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

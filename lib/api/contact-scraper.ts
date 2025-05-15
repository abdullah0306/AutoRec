import axios from 'axios';

// Flask API configuration
const FLASK_API_ENDPOINT = 'https://628c-2a02-4780-28-6eb6-00-1.ngrok-free.app/api/scrape-contacts';
const FLASK_API_STATUS_ENDPOINT = 'https://628c-2a02-4780-28-6eb6-00-1.ngrok-free.app/api/scrape-contacts/status';

// Set longer timeout for API call
const API_TIMEOUT = 600000; // 10 minutes timeout for the API call

export interface ContactProfile {
  name: string;
  position: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  linkedIn: string;
  twitter: string;
  facebook: string;
  instagram: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  industry: string;
  companySize: string;
  foundedYear: string;
  description: string;
  source: string;
}

export interface SearchParams {
  url: string | string[];
  maxPages?: number;
  includeEmail?: boolean;
  includePhone?: boolean;
  includeSocial?: boolean;
}

export interface SearchResponse {
  contacts: ContactProfile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasMore: boolean;
    searchedUrl: string;
  };
  message: string;
}

export interface ActiveJobInfo {
  run_id: string;
  start_time: number;
  status: string;
  completion_time?: number;
}

export interface CheckActiveJobsResponse {
  success: boolean;
  active_jobs: Record<string, ActiveJobInfo>;
  message?: string;
}

/**
 * Check if there are any active scraping jobs for the given URLs
 * @param urls URLs to check
 * @returns Object containing active jobs information
 */
export async function checkActiveScrapingJobs(urls: string | string[]): Promise<CheckActiveJobsResponse> {
  try {
    const urlsArray = Array.isArray(urls) ? urls : [urls];
    
    const response = await axios.post(
      FLASK_API_STATUS_ENDPOINT,
      { urls: urlsArray },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // 10 seconds timeout
      }
    );
    
    if (response.data && response.data.success) {
      return response.data;
    }
    
    return {
      success: false,
      active_jobs: {},
      message: 'Failed to check active jobs'
    };
  } catch (error) {
    console.error('Error checking active scraping jobs:', error);
    return {
      success: false,
      active_jobs: {},
      message: error instanceof Error ? error.message : 'Unknown error checking active jobs'
    };
  }
}

// Function to search for contact information
export async function searchContacts(
  params: SearchParams,
  email: string
): Promise<SearchResponse & { contactsPerSearch: number }> {
  const { url, maxPages = 5, includeEmail = true, includePhone = true, includeSocial = true } = params;
  
  if (!email) {
    throw new Error('Not authenticated');
  }

  // Set a default value for contactsPerSearch
  let contactsPerSearch = 30;
  
  try {
    // Validate required parameters
    if (!url) {
      throw new Error('URL is required for the search');
    }
    
    // Convert url to array if it's a string
    const urls = Array.isArray(url) ? url : [url];

    // Function to fetch contacts using the Flask API
    const fetchContacts = async (targetUrls: string[], retryCount = 0) => {
      try {
        console.log('Starting contact scraping with Flask API for URLs:', targetUrls);
        
        // Log the start time for debugging
        const startTime = Date.now();
        console.log(`Starting scraping at ${new Date().toISOString()}`);
        
        // Prepare the request payload
        const requestPayload = {
          url: targetUrls,
          maxPages: maxPages || 30,
          includeEmail: includeEmail,
          includePhone: includePhone,
          includeSocial: includeSocial
        };
        
        console.log('Request payload:', JSON.stringify(requestPayload, null, 2));
        
        // Make the API call to our Flask backend
        const response = await axios.post(
          FLASK_API_ENDPOINT,
          requestPayload,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: API_TIMEOUT
          }
        );
        
        // Log the end time and duration for debugging
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        console.log(`Complete scraping process took ${duration.toFixed(2)} seconds`);
        
        // Check if the response is valid
        if (!response.data || !response.data.success) {
          console.error('Invalid response from Flask API:', response.data);
          return [];
        }
        
        // Extract the raw contacts from the response
        const rawContacts = response.data.contacts || [];
        console.log(`Successfully retrieved ${rawContacts.length} contacts from Flask API`);
        
        // The Flask API already processes the contacts, so we can return them directly
        return rawContacts;
      } catch (error: any) {
        console.error('Error in contact scraper:', error.message);
        
        // Check if it's a timeout error
        if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
          console.log('Request timed out, this may happen with larger websites');
          
          // For timeout errors, create a special contact with a message
          return [{
            name: 'Scraping in Progress',
            position: '',
            company: '',
            email: 'The scraping process is taking longer than expected',
            phone: '',
            website: targetUrls[0],
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
            description: 'The contact scraping process is still running on the server. Please check back in a few minutes or view the results directly in the Apify console: https://console.apify.com',
            source: targetUrls[0]
          }];
        }
        
        if (retryCount < 2) { // Try up to 2 more times
          console.log(`Retry attempt ${retryCount + 1} for ${targetUrls}`);
          // Increase wait time between retries
          await new Promise(resolve => setTimeout(resolve, 5000 * (retryCount + 1))); // Wait longer before retry
          return fetchContacts(targetUrls, retryCount + 1);
        }
        
        // Check if it's a connection error (like 404 Not Found)
        const isConnectionError = (
          error.response?.status === 404 || 
          error.code === 'ECONNREFUSED' || 
          error.message?.includes('Network Error') ||
          error.message?.includes('404')
        );
        
        if (isConnectionError) {
          console.error('API connection error, returning special error flag');
          return [{
            name: 'API Connection Error',
            position: '',
            company: '',
            email: 'actor_failed_to_start', // Special flag to prevent credit deduction
            phone: '',
            website: targetUrls[0],
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
            description: `The contact scraping service is currently unavailable. Please check your API connection and try again later.`,
            source: targetUrls[0]
          }];
        }
        
        // For other errors, return a contact with error information
        console.error('Failed after retries, returning error message');
        return [{
          name: 'Error Occurred',
          position: '',
          company: '',
          email: 'An error occurred during contact scraping',
          phone: '',
          website: targetUrls[0],
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
          description: `Error: ${error.message}. The scraping process encountered an error. Please try again or check the server logs for more information.`,
          source: targetUrls[0]
        }];
      }
    };

    // Fetch contacts from Flask API
    console.log(`Starting contact fetching for ${urls.length} URLs`);
    const contacts = await fetchContacts(urls);
    console.log(`Fetched ${contacts.length} contacts from Flask API`);

    // The Flask API already processes the contacts in the correct format
    const processedContacts: ContactProfile[] = contacts;
    
    // Log the results
    if (contacts.length > 0) {
      console.log('Sample contact data structure:', JSON.stringify(contacts[0], null, 2));
    }
    
    console.log(`Received ${processedContacts.length} processed contacts from Flask API`);

    // Return formatted response with the processed contacts
    return {
      contacts: processedContacts.slice(0, contactsPerSearch), // Apply the limit
      contactsPerSearch,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalResults: processedContacts.length,
        hasMore: false,
        searchedUrl: Array.isArray(url) ? url.join(', ') : url
      },
      message: processedContacts.length > 0 
        ? `Found ${processedContacts.length} contacts` 
        : `No contact information found on ${Array.isArray(url) ? url.join(', ') : url}`
    };
  } catch (error) {
    console.error('Error searching contacts:', error);
    throw error;
  }
}

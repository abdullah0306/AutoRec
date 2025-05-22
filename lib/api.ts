import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type { ScrapingJob, ScrapingRequest, BatchResults } from '@/types/api';

// Base URLs for different services
export const API_BASE_URL = process.env.NEXT_PUBLIC_SCRAPER_API_URL;
export const SUBSCRIPTION_API_URL = process.env.NEXT_PUBLIC_SUBSCRIPTION_API_URL;
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL;

// Create base axios instance configuration
const createApiClient = (baseURL: string) => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    xsrfCookieName: 'csrftoken',
    xsrfHeaderName: 'X-CSRFToken',
  });

  // Add request interceptor for debugging
  client.interceptors.request.use(config => {
    console.log(`Making ${config.method?.toUpperCase()} request to:`, config.url);
    console.log('Request headers:', config.headers);
    return config;
  });

  // Add response interceptor for debugging
  client.interceptors.response.use(
    response => {
      console.log('Response received:', response.config.url, response.status);
      console.log('Response headers:', response.headers);
      return response;
    },
    error => {
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
        });
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      return Promise.reject(error);
    }
  );

  // Add request interceptor to include auth token in requests
  client.interceptors.request.use(async (config) => {
    if (typeof window === 'undefined') return config;
    
    // Get email from localStorage
    const email = localStorage.getItem('email');
    if (email) {
      config.headers.Authorization = `Bearer ${email}`;
    }
    
    return config;
  });

  // Add response interceptor to handle unauthorized errors
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('email');
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Create API clients for different services
const apiClient = createApiClient(API_BASE_URL);
const subscriptionClient = createApiClient(SUBSCRIPTION_API_URL);

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Function to process queue of failed requests
function onRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

// Function to add request to queue
function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

// Subscriptions API
export const subscriptions = {
  getPackages: async () => {
    console.log('Calling /api/packages...');
    const response = await subscriptionClient.get('/api/packages');
    console.log('Response from /api/packages:', response.data);
    return response.data;
  },
  
  getPackageById: async (id: string) => {
    try {
      // Fetch all packages and find the one matching the requested ID
      const response = await subscriptionClient.get('/api/packages');
      const packages = response.data;
      const packageData = packages.find((pkg: any) => pkg.id === id);
      
      if (!packageData) {
        throw new Error("Subscription package not found or inactive");
      }
      
      return packageData;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error("Subscription package not found or inactive");
      }
      throw error;
    }
  },
  
  getCurrentSubscription: async () => {
    try {
      const response = await subscriptionClient.get('/api/me');
      return response.data?.subscription;
    } catch (error: any) {
      // Return null when 404 (no active subscription) is encountered
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
  
  subscribe: async (packageId: string) => {
    try {
      const email = localStorage.getItem('email');
      if (!email) {
        return { error: 'Not authenticated' };
      }

      const response = await subscriptionClient.post('/api/create-checkout-session', {
        packageId
      }, {
        headers: {
          'Authorization': `Bearer ${email}`
        }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { error: "Package not found or inactive" };
      }
      return { error: error.message || "An unexpected error occurred" };
    }
  },

  cancelSubscription: async () => {
    try {
      const response = await subscriptionClient.delete('/api/subscriptions');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error("No active subscription to cancel");
      }
      throw error;
    }
  }
};

// Scraping API
export const scraping = {
  startScraping: async (request: ScrapingRequest) => {
    const response = await apiClient.post<ScrapingJob>('/scraper/start', request);
    return response.data;
  },

  getStatus: async (batchId: string) => {
    const response = await apiClient.get<ScrapingJob>(`/scraper/status/${batchId}`);
    return response.data;
  },

  stopScraping: async (batchId: string) => {
    const response = await apiClient.post(`/scraper/${batchId}/stop`);
    return response.data;
  },

  pauseScraping: async (batchId: string) => {
    const response = await apiClient.post(`/scraper/${batchId}/pause`);
    return response.data;
  },

  resumeScraping: async (batchId: string) => {
    const response = await apiClient.post(`/scraper/${batchId}/resume`);
    return response.data;
  },

  getResults: async (batchId: string) => {
    const response = await apiClient.get<BatchResults>(`/scraper/batch/${batchId}/detailed-results`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    return response.data;
  },
};

export default apiClient;

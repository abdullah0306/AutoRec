import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type { ScrapingJob, ScrapingRequest, BatchResults } from '@/types/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests
apiClient.interceptors.request.use(async (config) => {
  if (typeof window === 'undefined') return config;
  
  // Skip token handling for auth endpoints
  if (config.url && (
    config.url.includes('/auth/login') ||
    config.url.includes('/auth/register')
  )) {
    return config;
  }
  
  // Get email from localStorage
  const email = localStorage.getItem('email');
  if (email) {
    config.headers.Authorization = `Bearer ${email}`;
  }
  
  return config;
});

// Add response interceptor to handle unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('email');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Add scraping API functions
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
    const response = await apiClient.get<BatchResults>(`/scraper/batch/${batchId}/detailed-results`);
    return response.data;
  },
};

// Authentication API
export const auth = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData: any) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('email');
  },
  
  getUser: async () => {
    try {
      const response = await apiClient.get('/api/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  isAuthenticated: () => {
    return typeof window !== 'undefined' && !!localStorage.getItem('email');
  },

  updateProfile: async (data: { first_name: string; last_name: string }) => {
    const response = await apiClient.patch("/api/me", data);
    return response.data;
  },

  getSubscription: async () => {
    const response = await apiClient.get("/api/me");
    return response.data?.subscription;
  }
};

// Subscriptions API
export const subscriptions = {
  getPackages: async () => {
    console.log('Calling /api/packages...');
    const response = await apiClient.get('/api/packages');
    console.log('Response from /api/packages:', response.data);
    return response.data;
  },
  
  getPackageById: async (id: string) => {
    try {
      // Fetch all packages and find the one matching the requested ID
      const response = await apiClient.get('/api/packages');
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
      const response = await apiClient.get('/api/me');
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
      const response = await apiClient.post('/api/subscriptions', {
        packageId
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error("Package not found or inactive");
      }
      throw error;
    }
  },
  
  cancelSubscription: async () => {
    try {
      const response = await apiClient.delete('/api/subscriptions');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error("No active subscription to cancel");
      }
      throw error;
    }
  }
};

export default apiClient;

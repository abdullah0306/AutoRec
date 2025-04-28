import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { clearAuthTokens, getAuthTokens, isTokenExpired, refreshToken } from './auth';
import type { ScrapingJob, ScrapingRequest, BatchResults } from '@/types/api';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Add request interceptor to include auth token in requests
apiClient.interceptors.request.use(async (config) => {
  if (typeof window === 'undefined') return config;
  
  // Skip token handling for auth endpoints
  if (config.url && (
    config.url.includes('/auth/login') ||
    config.url.includes('/auth/register') ||
    config.url.includes('/auth/refresh')
  )) {
    return config;
  }
  
  // Check for and attach the token
  const tokens = getAuthTokens();
  if (tokens) {
    // Check if token is expired
    if (isTokenExpired() && !isRefreshing) {
      isRefreshing = true;
      
      try {
        const newTokens = await refreshToken();
        isRefreshing = false;
        
        if (newTokens) {
          config.headers.Authorization = `Bearer ${newTokens.access_token}`;
          onRefreshed(newTokens.access_token);
          return config;
        } else {
          // If refresh failed, clear tokens and redirect to login
          clearAuthTokens();
          window.location.href = '/login';
          return Promise.reject('Authentication failed');
        }
      } catch (error) {
        isRefreshing = false;
        clearAuthTokens();
        window.location.href = '/login';
        return Promise.reject('Authentication failed');
      }
    }
    
    config.headers.Authorization = `Bearer ${tokens.access_token}`;
  }
  
  return config;
});

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for token refresh
        return new Promise<string>((resolve, reject) => {
          addRefreshSubscriber((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            originalRequest._retry = true;
            resolve(token);
          });
        }).then(() => apiClient(originalRequest));
      }
      
      // Start refresh process
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const newTokens = await refreshToken();
        isRefreshing = false;
        
        if (newTokens) {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
          }
          onRefreshed(newTokens.access_token);
          return apiClient(originalRequest);
        } else {
          clearAuthTokens();
          window.location.href = '/login';
          return Promise.reject('Authentication failed');
        }
      } catch (refreshError) {
        isRefreshing = false;
        clearAuthTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
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
    clearAuthTokens();
  },
  
  getUser: async () => {
    try {
      const response = await apiClient.get('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  isAuthenticated: () => {
    return typeof window !== 'undefined' && getAuthTokens() !== null && !isTokenExpired();
  },

  updateProfile: async (data: { name: string; email: string }) => {
    const response = await apiClient.patch("/auth/me", data);
    return response.data;
  },

  getSubscription: async () => {
    const response = await apiClient.get("/auth/me/subscription");
    return response.data;
  }
};

// Subscriptions API
export const subscriptions = {
  getPackages: async () => {
    const response = await apiClient.get('/subscriptions/packages');
    return response.data;
  },
  
  getPackageById: async (id: string) => {
    try {
      // Fetch all packages and find the one matching the requested ID
      const response = await apiClient.get('/subscriptions/packages');
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
      const response = await apiClient.get('/subscriptions/subscription');
      return response.data;
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
      const response = await apiClient.post('/subscriptions/subscribe', {
        package_id: packageId
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
      const response = await apiClient.post('/subscriptions/cancel');
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

import { AuthResponse, LoginRequest, RegisterRequest, RefreshTokenResponse } from "@/types/auth";

// Define the API_BASE_URL directly instead of importing it from api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    const formData = new URLSearchParams({
      grant_type: "password",
      username: credentials.username,
      password: credentials.password,
      scope: "",
      client_id: "string",
      client_secret: "string",
    });

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || 
        `Login failed with status: ${response.status}`
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during login");
  }
}

export async function register(data: RegisterRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }
}

export function setAuthTokens(tokens: AuthResponse) {
  localStorage.setItem("accessToken", tokens.access_token);
  localStorage.setItem("refreshToken", tokens.refresh_token);
  localStorage.setItem("tokenExpiry", calculateExpiryTime(tokens.expires_in || 3600).toString());
}

export function clearAuthTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tokenExpiry");
}

export function getAuthTokens() {
  if (typeof window === 'undefined') return null;
  
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const tokenExpiry = localStorage.getItem("tokenExpiry");
  
  if (!accessToken || !refreshToken) return null;
  
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
    expires_in: tokenExpiry ? parseInt(tokenExpiry, 10) - Date.now() : undefined
  };
}

export function isTokenExpired() {
  const expiryTime = localStorage.getItem("tokenExpiry");
  if (!expiryTime) return true;
  
  return Date.now() > parseInt(expiryTime, 10);
}

export async function refreshToken(): Promise<AuthResponse | null> {
  const currentRefreshToken = localStorage.getItem("refreshToken");
  if (!currentRefreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh?refresh_token=${currentRefreshToken}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      // If refresh fails, clear tokens and return null
      clearAuthTokens();
      return null;
    }

    const tokens = await response.json();
    setAuthTokens(tokens);
    return tokens;
  } catch (error) {
    console.error("Error refreshing token:", error);
    clearAuthTokens();
    return null;
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to send password reset email");
  }
}

function calculateExpiryTime(expiresInSeconds: number): number {
  return Date.now() + expiresInSeconds * 1000;
}

export function isAuthenticated(): boolean {
  const tokens = getAuthTokens();
  if (!tokens) return false;
  
  // Check if token is expired
  if (isTokenExpired()) {
    // We don't handle refresh here as this is a sync function
    // The auth context will handle refresh
    return false;
  }
  
  return true;
}

export const auth = {
  /**
   * Get the current user's profile
   */
  getUser: async () => {
    const tokens = getAuthTokens();
    if (!tokens) return null;
    
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    
    if (!response.ok) return null;
    return response.json();
  },
  
  /**
   * Update the user's profile
   */
  updateProfile: async (data: { name: string, email: string }) => {
    const tokens = getAuthTokens();
    if (!tokens) throw new Error("Not authenticated");
    
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to update profile");
    }
    
    return response.json();
  },
  
  /**
   * Get the user's current subscription
   */
  getSubscription: async () => {
    const tokens = getAuthTokens();
    if (!tokens) return null;
    
    const response = await fetch(`${API_BASE_URL}/me/subscription`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    
    if (!response.ok) return null;
    return response.json();
  }
};

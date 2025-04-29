import { AuthResponse, LoginRequest, RegisterRequest, RefreshTokenResponse } from "@/types/auth";

// Define the API_BASE_URL directly instead of importing it from api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();
  // Store the user's email for authentication
  localStorage.setItem('email', data.user.email);
  return data;
}

export async function register(data: RegisterRequest): Promise<void> {
  const response = await fetch('/api/auth/register', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: data.email, // Using email as username
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Registration failed");
  }
}

export function clearAuthTokens() {
  localStorage.removeItem("email");
}

export function getJwtSecretKey(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set');
  }
  return secret;
}

export async function forgotPassword(email: string): Promise<void> {
  const response = await fetch('/api/auth/forgot-password', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send password reset email");
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('email');
}

export const auth = {
  /**
   * Get the current user's profile
   */
  getUser: async () => {
    const email = localStorage.getItem('email');
    if (!email) return null;
    
    const response = await fetch('/api/me', {
      headers: {
        Authorization: `Bearer ${email}`,
      },
    });
    
    if (!response.ok) return null;
    return response.json();
  },
  
  /**
   * Update the user's profile
   */
  updateProfile: async (data: { first_name: string, last_name: string }) => {
    const email = localStorage.getItem('email');
    if (!email) throw new Error("Not authenticated");
    
    const response = await fetch('/api/me', {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${email}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update profile");
    }
    
    return response.json();
  },
  
  /**
   * Get the user's current subscription
   */
  getSubscription: async () => {
    const email = localStorage.getItem('email');
    if (!email) return null;
    
    const response = await fetch('/api/me', {
      headers: {
        Authorization: `Bearer ${email}`,
      },
    });
    
    if (!response.ok) return null;
    const user = await response.json();
    return user.subscription;
  }
};

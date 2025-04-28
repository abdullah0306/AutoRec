"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User 
} from "@/types/auth";
import { 
  login as loginApi, 
  register as registerApi, 
  setAuthTokens, 
  clearAuthTokens,
  getAuthTokens,
  isAuthenticated as checkIsAuthenticated,
  refreshToken,
  forgotPassword as forgotPasswordApi 
} from "@/lib/auth";
import apiClient, { auth } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthLoading(true);
      
      if (checkIsAuthenticated()) {
        try {
          const userData = await auth.getUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // If token is invalid, try refreshing
          try {
            const newTokens = await refreshToken();
            if (newTokens) {
              // Try getting user data again with new token
              const userData = await auth.getUser();
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              handleLogout();
            }
          } catch (refreshError) {
            handleLogout();
          }
        }
      } else {
        // Check if we have refresh token to try
        const tokens = getAuthTokens();
        if (tokens?.refresh_token) {
          try {
            const newTokens = await refreshToken();
            if (newTokens) {
              const userData = await auth.getUser();
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              handleLogout();
            }
          } catch (error) {
            handleLogout();
          }
        } else {
          handleLogout();
        }
      }
      
      setIsAuthLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    setIsAuthLoading(true);
    try {
      const response = await loginApi(data);
      setAuthTokens(response);
      const userData = await auth.getUser();
      setUser(userData);
      setIsAuthenticated(true);
      return;
    } catch (error) {
      throw error;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsAuthLoading(true);
    try {
      await registerApi(data);
      setIsAuthLoading(false);
    } catch (error) {
      setIsAuthLoading(false);
      throw error;
    }
  };

  const handleLogout = () => {
    clearAuthTokens();
    setUser(null);
    setIsAuthenticated(false);
  };

  const logout = () => {
    handleLogout();
    router.push("/login");
  };

  const forgotPassword = async (email: string) => {
    try {
      await forgotPasswordApi(email);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAuthLoading,
        login,
        register,
        logout,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

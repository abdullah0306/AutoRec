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
  clearAuthTokens,
  isAuthenticated as checkIsAuthenticated,
  forgotPassword as forgotPasswordApi,
  auth
} from "@/lib/auth";

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
          handleLogout();
        }
      } else {
        handleLogout();
      }
      
      setIsAuthLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    setIsAuthLoading(true);
    try {
      const response = await loginApi(data);
      const userData = await auth.getUser();
      setUser(userData);
      setIsAuthenticated(true);
      router.push('/dashboard');
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

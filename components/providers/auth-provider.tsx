"use client";

import { AuthProvider as AuthProviderContext } from "@/contexts/auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProviderContext>{children}</AuthProviderContext>;
}

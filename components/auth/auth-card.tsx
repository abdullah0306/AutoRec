import * as React from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({ header, children, footer, className }: AuthCardProps) {
  return (
    <div className={cn("w-full space-y-6", className)}>
      <div className="space-y-6">
        {header}
        <div className="bg-card border rounded-lg shadow-sm p-6">
          {children}
        </div>
        {footer && <div className="space-y-6">{footer}</div>}
      </div>
    </div>
  );
}

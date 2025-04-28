"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className, width = 150, height = 150 }: LogoProps) {
  const { theme } = useTheme();

  return (
    <Image
      src={
        theme === "dark" ? "/autorec-full-dark.png" : "/autorec-full-light.png"
      }
      width={width}
      height={height}
      alt="Autorec Logo"
      className={cn("transition-transform", className)}
      priority
    />
  );
}

export function LogoIcon({ className, width = 32, height = 32 }: LogoProps) {
  const { theme } = useTheme();

  return (
    <Image
      src={
        theme === "dark" ? "/autorec-logo-dark.png" : "/autorec-logo-light.png"
      }
      width={width}
      height={height}
      alt="Autorec Icon"
      className={cn("transition-transform hover:scale-[0.98]", className)}
      priority
    />
  );
}

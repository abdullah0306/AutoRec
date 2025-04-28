import type React from "react"
import { Heading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"

interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
}

export function DashboardHeader({ heading, text, children }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2 py-6 mb-6 bg-background/60 backdrop-blur-sm rounded-lg border">
      <div className="space-y-1.5">
        <Heading as="h1" className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary/70 to-primary bg-clip-text text-transparent">
          {heading}
        </Heading>
        {text && <Text className="text-sm sm:text-base text-muted-foreground max-w-[750px]">{text}</Text>}
      </div>
      <div className="flex items-center gap-4">
        {children}
      </div>
    </div>
  )
}


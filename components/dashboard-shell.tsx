import type React from "react"
interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardShell({ children, className, ...props }: DashboardShellProps) {
  return (
    <div className="flex-1 space-y-8 overflow-y-auto" {...props}>
      {children}
    </div>
  )
}


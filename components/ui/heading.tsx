import * as React from "react"

import { cn } from "@/lib/utils"

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4"
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, as: Comp = "h1", ...props }, ref) => {
    return (
      <Comp
        className={cn(
          "scroll-m-20 font-bold tracking-tight",
          {
            "text-4xl lg:text-5xl": Comp === "h1",
            "text-3xl lg:text-4xl": Comp === "h2",
            "text-2xl lg:text-3xl": Comp === "h3",
            "text-xl lg:text-2xl": Comp === "h4",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

export { Heading }


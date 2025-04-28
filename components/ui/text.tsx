import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  as?: "p" | "span" | "div"
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, as: Comp = "p", ...props }, ref) => {
    return (
      <Comp
        className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

export { Text }


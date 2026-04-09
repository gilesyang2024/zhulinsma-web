import * as React from "react"
import { cn } from "@/lib/utils"

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "rise" | "fall" | "muted" | "outline" | "warning"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        {
          "bg-primary/10 text-primary ring-primary/20": variant === "default",
          "bg-rise/10 text-rise ring-rise/20": variant === "rise",
          "bg-fall/10 text-fall ring-fall/20": variant === "fall",
          "bg-muted text-muted-foreground ring-border": variant === "muted",
          "bg-transparent text-foreground ring-border": variant === "outline",
          "bg-yellow-400/10 text-yellow-400 ring-yellow-400/20": variant === "warning",
        },
        className
      )}
      {...props}
    />
  )
}

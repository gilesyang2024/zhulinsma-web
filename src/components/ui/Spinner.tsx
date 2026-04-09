import { memo } from "react"
import { cn } from "@/lib/utils"

interface SpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" }

export const Spinner = memo(function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "border-2 border-muted border-t-foreground rounded-full animate-spin",
        sizeMap[size],
        className
      )}
    />
  )
})

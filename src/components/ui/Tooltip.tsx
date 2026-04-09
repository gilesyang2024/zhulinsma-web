import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

// ─── 基础 Provider（挂载一次）───────────────────────────────────────────────
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={100}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

// ─── Tooltip 主组件 ─────────────────────────────────────────────────────────
interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  sideOffset?: number
  className?: string
  disabled?: boolean
}

export function Tooltip({
  children,
  content,
  side = "top",
  align = "center",
  sideOffset = 6,
  className,
  disabled,
}: TooltipProps) {
  if (disabled || !content) return <>{children}</>

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-50 max-w-xs rounded-lg border border-border bg-popover px-3 py-2",
            "text-xs text-popover-foreground shadow-md",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
          )}
        >
          {content}
          {/* 三角箭头 */}
          <TooltipPrimitive.Arrow className="fill-border" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

// ─── 快捷包装：带 Tooltip 的图标按钮 ────────────────────────────────────────
export function TooltipIconBtn({
  children,
  tooltip,
  side = "top",
  className,
  ...rest
}: Omit<TooltipProps, "content" | "children"> & {
  children: React.ReactNode
  tooltip: string
}) {
  return (
    <Tooltip content={tooltip} side={side} className={className} {...rest}>
      {children}
    </Tooltip>
  )
}

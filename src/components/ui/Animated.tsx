import { useEffect, useRef, memo, useState } from "react"
import { cn } from "@/lib/utils"

/** 价格/数字变化时自动触发动画 */
export const AnimatedNumber = memo(function AnimatedNumber({
  value,
  className,
}: {
  value: string | number | undefined
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevValue = useRef<string | number | undefined>(undefined)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (prevValue.current !== undefined && prevValue.current !== value) {
      setKey((k) => k + 1)
    }
    prevValue.current = value
  }, [value])

  return (
    <span
      key={key}
      ref={ref}
      className={cn("tabular-nums inline-block animate-number-roll", className)}
    >
      {value ?? "--"}
    </span>
  )
})

/** 数据更新时的背景闪烁效果 */
export const FlashBg = memo(function FlashBg({
  trigger,
  isRise,
  children,
  className,
}: {
  trigger?: unknown
  isRise?: boolean
  children: React.ReactNode
  className?: string
}) {
  const [flash, setFlash] = useState(false)
  const prevTrigger = useRef<unknown>(undefined)

  useEffect(() => {
    if (prevTrigger.current !== undefined && prevTrigger.current !== trigger) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 500)
      return () => clearTimeout(t)
    }
    prevTrigger.current = trigger
  }, [trigger])

  return (
    <div
      className={cn(
        "transition-colors duration-300",
        flash && isRise && "bg-rise/10",
        flash && !isRise && "bg-fall/10",
        className
      )}
    >
      {children}
    </div>
  )
})

/** 渐入容器 — 入场动画 */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <div
      className={cn("animate-fade-in-up", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/** 骨架屏 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50",
        className
      )}
    />
  )
}

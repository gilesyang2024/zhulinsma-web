import { memo, useState, useRef } from "react"
import { cn } from "@/lib/utils"

// ─── 涟漪按钮 ──────────────────────────────────────────────────────────────
interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "primary" | "ghost" | "outline"
  size?: "sm" | "md"
}

export const RippleButton = memo(function RippleButton({
  children,
  className,
  variant = "ghost",
  size = "md",
  onClick,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([])
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    const rect = btnRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples((prev) => [...prev, { x, y, id }])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600)
  }

  const sizeClasses = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
  const variantClasses =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : variant === "outline"
      ? "border border-border bg-transparent hover:bg-accent"
      : "bg-transparent hover:bg-accent"

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden rounded-md font-medium transition-all active:scale-[0.97]",
        sizeClasses, variantClasses,
        className
      )}
      {...props}
    >
      {/* 涟漪效果 */}
      {ripples.map(({ x, y, id }) => (
        <span
          key={id}
          className="absolute rounded-full bg-white/20 pointer-events-none animate-ripple"
          style={{ left: x, top: y, width: 8, height: 8, marginLeft: -4, marginTop: -4 }}
        />
      ))}
      {children}
    </button>
  )
})

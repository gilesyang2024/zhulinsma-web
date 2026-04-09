import { Wifi, WifiOff, AlertCircle, Loader2 } from "lucide-react"
import type { WsStatus } from "@/types"
import { cn } from "@/lib/utils"

const statusConfig: Record<WsStatus, { icon: React.FC<{ className?: string }>; label: string; className: string }> = {
  connected: { icon: Wifi, label: "已连接", className: "text-fall" },
  connecting: { icon: Loader2, label: "连接中", className: "text-yellow-400 animate-spin" },
  disconnected: { icon: WifiOff, label: "未连接", className: "text-muted-foreground" },
  error: { icon: AlertCircle, label: "连接错误", className: "text-rise" },
}

export function WsStatusBadge({ status }: { status: WsStatus }) {
  const { icon: Icon, label, className } = statusConfig[status]
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn("w-3.5 h-3.5", className)} />
      <span className={cn("text-xs", className)}>{label}</span>
    </div>
  )
}

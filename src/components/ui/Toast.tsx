import { useToastStore, type ToastType } from "@/store/toastStore"
import { cn } from "@/lib/utils"
import { X, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

const TOAST_ICONS: Record<ToastType, React.ElementType> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
}

const TOAST_STYLES: Record<ToastType, string> = {
  info:    "border-chart-1/30 bg-chart-1/5 text-chart-1",
  success: "border-rise/30   bg-rise/5    text-rise",
  warning: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
  error:   "border-fall/30   bg-fall/5    text-fall",
}

const TOAST_ICON_STYLES: Record<ToastType, string> = {
  info:    "text-chart-1",
  success: "text-rise",
  warning: "text-yellow-400",
  error:   "text-fall",
}

function ToastItem({ toast }: { toast: ReturnType<typeof useToastStore.getState>["toasts"][number] }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const Icon = TOAST_ICONS[toast.type]

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-xl border px-4 py-3",
        "shadow-lg backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        "bg-background/90",
        "border-border",
        "animate-toast-in",
        TOAST_STYLES[toast.type]
      )}
      style={{
        boxShadow: "0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", TOAST_ICON_STYLES[toast.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors rounded p-0.5 -mr-1 -mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

/** Toast 容器（挂载在 App 根节点，全局只渲染一次） */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="通知"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto w-80">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}

import { memo, useEffect, useRef, useState } from "react"
import { Bell, TrendingUp, TrendingDown, Activity, Zap, X } from "lucide-react"
import type { Alert } from "@/types"
import { cn } from "@/lib/utils"
import { useRealtimeStore } from "@/store/realtimeStore"
import { STOCK_NAMES } from "@/config/stocks"
import { toast } from "@/store/toastStore"

// ─── 预警类型 → 图标 + 颜色映射 ───────────────────────────────────────────
const alertTypeConfig: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  "RSI超买":     { icon: TrendingUp,   color: "text-orange-400",   label: "RSI超买" },
  "RSI超卖":     { icon: TrendingDown, color: "text-blue-400",     label: "RSI超卖" },
  "金叉":        { icon: Zap,          color: "text-rise",          label: "金叉" },
  "死叉":        { icon: Zap,          color: "text-fall",          label: "死叉" },
  "均线偏离":    { icon: Activity,     color: "text-yellow-400",    label: "均线偏离" },
  "成交量异动":  { icon: Activity,     color: "text-purple-400",    label: "量能异动" },
  "突破":        { icon: TrendingUp,   color: "text-rose-400",      label: "价格突破" },
  "unknown":     { icon: Bell,         color: "text-muted-foreground", label: "系统通知" },
}

function getAlertConfig(type: string) {
  // 模糊匹配
  for (const key of Object.keys(alertTypeConfig)) {
    if (type.includes(key)) return alertTypeConfig[key]
  }
  return alertTypeConfig["unknown"]
}

// ─── 预警等级颜色 ─────────────────────────────────────────────────────────
const levelColors = {
  critical: {
    bg: "bg-rise/10",
    border: "border-rise/30",
    badge: "bg-rise text-white",
    text: "text-rise",
    icon: "text-rise",
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    badge: "bg-yellow-500 text-black",
    text: "text-yellow-400",
    icon: "text-yellow-400",
  },
  info: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    badge: "bg-primary text-white",
    text: "text-primary",
    icon: "text-primary",
  },
}

// ─── 格式化时间差 ─────────────────────────────────────────────────────────
function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return "刚刚"
}

// ─── 单条预警 ─────────────────────────────────────────────────────────────
const AlertItem = memo(function AlertItem({ alert, isNew }: { alert: Alert; isNew?: boolean }) {
  const dismissAlert = useRealtimeStore((s) => s.dismissAlert)
  const cfg = getAlertConfig(alert.alert_type)
  const lvl = levelColors[alert.level] || levelColors.info
  const Icon = cfg.icon

  return (
    <div
      className={cn(
        "group relative rounded-lg p-2.5 mb-2 border transition-all hover:shadow-sm animate-fade-in-up",
        lvl.bg, lvl.border,
        // 新预警涟漪
        isNew && alert.level === "critical" && "alert-ripple-rise",
        isNew && alert.level === "warning"  && "alert-ripple-warning",
      )}
    >
      <div className="flex items-start gap-2">
        {/* 预警类型图标 */}
        <div className={cn("mt-0.5 flex-shrink-0", lvl.icon)}>
          <Icon className="w-3.5 h-3.5" />
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", lvl.badge)}>
              {cfg.label}
            </span>
            {isNew && (
              <span className="text-[10px] text-muted-foreground/50 animate-pulse">NEW</span>
            )}
          </div>
          <p className="text-xs text-foreground leading-relaxed line-clamp-2">
            {alert.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {STOCK_NAMES[alert.ts_code] || alert.stock_name || alert.ts_code}
            </span>
            <span className="text-xs text-muted-foreground/50">
              {formatRelativeTime(alert.timestamp)}
            </span>
          </div>
        </div>

        {/* 关闭按钮（hover 显示） */}
        <button
          onClick={() => dismissAlert(alert.id)}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-muted-foreground hover:text-foreground transition-all p-0.5 rounded"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
})

// ─── 预警统计栏 ───────────────────────────────────────────────────────────
function AlertStats({ alerts }: { alerts: Alert[] }) {
  const critical = alerts.filter((a) => a.level === "critical").length
  const warning = alerts.filter((a) => a.level === "warning").length
  const info = alerts.filter((a) => a.level === "info").length

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-card/50 border-b border-border text-xs">
      <span className="text-muted-foreground">统计：</span>
      {critical > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rise" />
          <span className="text-rise">紧急 {critical}</span>
        </span>
      )}
      {warning > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          <span className="text-yellow-500">警示 {warning}</span>
        </span>
      )}
      {info > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-primary">普通 {info}</span>
        </span>
      )}
    </div>
  )
}

// ─── 预警面板主组件 ───────────────────────────────────────────────────────
export const AlertPanel = memo(function AlertPanel() {
  const alerts = useRealtimeStore((s) => s.alerts)
  const clearAlerts = useRealtimeStore((s) => s.clearAlerts)

  // 跟踪新出现的预警（3秒内新增的打上 NEW 标记）
  const prevCountRef = useRef(0)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (alerts.length > prevCountRef.current) {
      // 有新增预警，标记前 N 个为 NEW（3秒后清除）
      const newest = alerts.slice(0, alerts.length - prevCountRef.current)
      setNewIds(new Set(newest.map((a) => a.id)))
      prevCountRef.current = alerts.length

      // Toast 通知：只对紧急预警弹窗
      const criticalAlert = newest.find((a) => a.level === "critical")
      if (criticalAlert) {
        const name = STOCK_NAMES[criticalAlert.ts_code] || criticalAlert.stock_name || criticalAlert.ts_code
        toast.error(
          `紧急预警：${name}`,
          criticalAlert.message,
          6000
        )
      } else {
        // 普通预警只显示 info toast（限制频率，最多重叠2个）
        const totalActive = newest.filter((a) => a.level !== "info").length
        if (totalActive > 0) {
          const sample = newest[0]
          const name = STOCK_NAMES[sample.ts_code] || sample.stock_name || sample.ts_code
          toast.warning(`${name} · 预警信号`, sample.message)
        }
      }

      // 3秒后清除 NEW 标记
      const t = setTimeout(() => setNewIds(new Set()), 3000)
      return () => clearTimeout(t)
    }
    prevCountRef.current = alerts.length
  }, [alerts.length])

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <Bell className={cn("w-3.5 h-3.5", alerts.length > 0 ? "text-rise animate-pulse" : "text-muted-foreground")} />
          <span className="text-sm font-medium">预警信号</span>
          {alerts.length > 0 && (
            <span className="bg-rise text-white text-xs rounded-full min-w-[1.1rem] h-4 flex items-center justify-center px-1">
              {alerts.length > 99 ? "99+" : alerts.length}
            </span>
          )}
        </div>
        {alerts.length > 0 && (
          <button
            onClick={clearAlerts}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            清空全部
          </button>
        )}
      </div>

      {/* 统计栏 */}
      {alerts.length > 0 && <AlertStats alerts={alerts} />}

      {/* 预警列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Bell className="w-10 h-10 mb-2 opacity-15" />
            <p className="text-xs font-medium">暂无预警</p>
            <p className="text-[10px] mt-0.5 opacity-60">订阅股票后将自动监控预警</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} isNew={newIds.has(alert.id)} />
          ))
        )}
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-2 border-t border-border bg-card/30">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          预警保留最近 200 条 · 支持本地持久化
        </p>
      </div>
    </div>
  )
})

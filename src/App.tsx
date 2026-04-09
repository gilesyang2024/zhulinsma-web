import { useState, useEffect, lazy, Suspense } from "react"
import { BarChart2, Zap, Settings, Plus, X, FileText, AlertTriangle } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { useRealtimeStore, loadStoredAlerts } from "@/store/realtimeStore"
import { useRealtimeConnection } from "@/hooks/useRealtime"
import { StockCard } from "@/components/stock/StockCard"
import { WsStatusBadge } from "@/components/ui/WsStatusBadge"
import { StockSearch } from "@/components/stock/StockSearch"
import { cn, formatPrice, formatChangePercent } from "@/lib/utils"
import { Spinner } from "@/components/ui/Spinner"
import { AnalysisReport } from "@/pages/AnalysisReport"
import { DetailPanelSkeleton } from "@/components/ui/Skeleton"
import { STOCK_NAMES } from "@/config/stocks"
import { AnimatePresence, motion } from "framer-motion"

// 懒加载重型组件（代码分割）
const StockDetailPanel = lazy(() =>
  import("@/components/stock/StockDetailPanel").then((m) => ({ default: m.StockDetailPanel }))
)
const AlertPanel = lazy(() =>
  import("@/components/stock/AlertPanel").then((m) => ({ default: m.AlertPanel }))
)

// ─── 顶部 Ticker 滚动条 ──────────────────────────────────────────────────
function MarketTicker() {
  const subscriptions = useRealtimeStore((s) => s.subscriptions)
  const watchList = useRealtimeStore((s) => s.watchList)

  const items = watchList
    .map((code) => {
      const sub = subscriptions[code]
      const price = sub?.lastPrice
      return { code, name: STOCK_NAMES[code] || code, price }
    })
    .filter((x) => x.price != null)

  if (items.length === 0) return null

  const doubled = [...items, ...items]

  return (
    <div className="h-7 bg-card/80 border-b border-border overflow-hidden flex items-center">
      <div
        className="flex items-center gap-0 whitespace-nowrap animate-ticker"
        style={{ animationDuration: `${items.length * 4}s` }}
      >
        {doubled.map((item, i) => {
          const pct = item.price!.pct_chg ?? 0
          const isRise = pct >= 0
          return (
            <span key={`${item.code}-${i}`} className="flex items-center gap-1.5 px-4 text-xs">
              <span className="text-muted-foreground">{item.name}</span>
              <span className={cn("tabular-nums font-medium", isRise ? "text-rise" : "text-fall")}>
                {formatPrice(item.price!.close)}
              </span>
              <span className={cn("tabular-nums", isRise ? "text-rise" : "text-fall")}>
                {isRise ? "▲" : "▼"}{formatChangePercent(pct).text}
              </span>
              <span className="text-border">·</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── 顶部导航栏 ──────────────────────────────────────────────────────────
function TopBar({ onOpenReport, onCloseReport, isReport }: {
  onOpenReport: () => void; onCloseReport: () => void; isReport: boolean
}) {
  useRealtimeConnection()
  const alerts = useRealtimeStore((s) => s.alerts)
  const criticalCount = alerts.filter((a) => a.level === "critical").length

  return (
    <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rise/80 to-rise flex items-center justify-center shadow-sm">
          <BarChart2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-semibold text-sm tracking-wide">竹林司马</span>
          <span className="text-xs text-muted-foreground ml-1.5 hidden sm:inline">Zhulinsma</span>
        </div>
        <span className="text-xs text-muted-foreground/50 hidden sm:block">· 实时技术分析平台</span>
      </div>

      <div className="flex items-center gap-3">
        <StockSearch />
        {/* 智能分析报告按钮 */}
        <button
          onClick={isReport ? onCloseReport : onOpenReport}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors",
            isReport
              ? "bg-chart-1/20 border-chart-1/30 text-chart-1"
              : "bg-chart-1/10 hover:bg-chart-1/20 border-chart-1/20 text-chart-1"
          )}
          title={isReport ? "关闭分析报告" : "智能分析报告"}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="text-xs font-medium hidden md:inline">
            {isReport ? "关闭报告" : "分析报告"}
          </span>
        </button>
        <WsStatusBadge status="connected" />
        {criticalCount > 0 && (
          <div className="relative cursor-pointer" title={`${criticalCount} 个紧急预警`}>
            <AlertTriangle className="w-4 h-4 text-rise animate-pulse" />
            <span className="absolute -top-1 -right-1 bg-rise text-white text-[10px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
              {criticalCount > 9 ? "9+" : criticalCount}
            </span>
          </div>
        )}
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

// ─── 左侧自选股面板 ───────────────────────────────────────────────────────
function WatchListSidebar({
  watchList,
  activeCode,
  onSelect,
}: {
  watchList: string[]
  activeCode: string
  onSelect: (code: string) => void
}) {
  const removeFromWatchList = useRealtimeStore((s) => s.removeFromWatchList)
  const [hovering, setHovering] = useState<string | null>(null)

  return (
    <aside className="w-64 flex flex-col border-r border-border flex-shrink-0">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-sm font-medium">自选股</span>
          <span className="text-xs text-muted-foreground">({watchList.length})</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {watchList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
            <Plus className="w-8 h-8 opacity-30" />
            <p className="text-xs">用顶部搜索框添加自选股</p>
          </div>
        ) : (
          watchList.map((code) => (
            <div
              key={code}
              className="relative group"
              onMouseEnter={() => setHovering(code)}
              onMouseLeave={() => setHovering(null)}
            >
              <StockCard
                tsCode={code}
                name={STOCK_NAMES[code] || code}
                onClick={() => onSelect(code)}
                isActive={code === activeCode}
              />
              {hovering === code && watchList.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromWatchList(code)
                    if (code === activeCode && watchList.length > 1) {
                      const next = watchList.find((c) => c !== code)
                      if (next) onSelect(next)
                    }
                  }}
                  className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-fall hover:bg-fall/10 transition-colors z-10"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border px-3 py-2 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-rise animate-pulse" />
        <span className="text-xs text-muted-foreground">A股 实时</span>
        <span className="text-xs text-muted-foreground/50 ml-auto">
          {new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </aside>
  )
}

// ─── 主 Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const { wsStatus } = useRealtimeConnection()
  const watchList = useRealtimeStore((s) => s.watchList)
  const subscribe = useRealtimeStore((s) => s.subscribe)

  const [searchParams, setSearchParams] = useSearchParams()
  const showReport = searchParams.get("report") === "true"
  const urlCode = searchParams.get("code")
  const [activeCode, setActiveCode] = useState(urlCode || watchList[0] || "600406.SH")

  // URL code 变化时同步 activeCode
  useEffect(() => {
    if (urlCode) setActiveCode(urlCode)
  }, [urlCode])

  // 初始化：从 localStorage 恢复预警历史
  useEffect(() => {
    const stored = loadStoredAlerts()
    if (stored.length > 0) {
      useRealtimeStore.setState({ alerts: stored })
    }
  }, [])

  useEffect(() => {
    watchList.forEach((code) => subscribe(code))
  }, [watchList, wsStatus])

  useEffect(() => {
    if (!watchList.includes(activeCode) && watchList.length > 0) {
      setActiveCode(watchList[0])
    }
  }, [watchList])

  // URL 导航：打开/关闭报告
  const openReport = () => {
    setSearchParams({ report: "true", code: activeCode })
  }
  const closeReport = () => {
    setSearchParams({})
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar
        onOpenReport={openReport}
        onCloseReport={closeReport}
        isReport={showReport}
      />
      <MarketTicker />

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：自选股 */}
        <WatchListSidebar
          watchList={watchList}
          activeCode={activeCode}
          onSelect={(code) => {
            setActiveCode(code)
            if (showReport) setSearchParams({ report: "true", code })
          }}
        />

        {/* 中间：详情面板或分析报告（带过渡动画） */}
        <main className="flex-1 overflow-y-auto p-4 min-w-0">
          <AnimatePresence mode="wait">
            {showReport ? (
              <motion.div
                key={`report-${activeCode}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                <AnalysisReport tsCode={activeCode} onClose={closeReport} />
              </motion.div>
            ) : (
              <motion.div
                key={`detail-${activeCode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Suspense fallback={<DetailPanelSkeleton />}>
                  <StockDetailPanel tsCode={activeCode} />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* 右侧：预警面板（代码分割 + Suspense） */}
        <aside className="w-72 border-l border-border flex flex-col flex-shrink-0">
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center">
              <Spinner />
            </div>
          }>
            <AlertPanel />
          </Suspense>
        </aside>
      </div>
    </div>
  )
}

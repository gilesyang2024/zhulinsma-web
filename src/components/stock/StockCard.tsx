import { memo, useRef, useEffect } from "react"
import { useStockRealtime } from "@/hooks/useRealtime"
import { MiniSparkline } from "@/components/charts/MiniSparkline"
import { Card } from "@/components/ui/Card"
import { AnimatedNumber } from "@/components/ui/Animated"
import { cn, formatPrice, formatChangePercent } from "@/lib/utils"

interface StockCardProps {
  tsCode: string
  name: string
  onClick?: () => void
  isActive?: boolean
}

export const StockCard = memo(function StockCard({
  tsCode,
  name,
  onClick,
  isActive = false,
}: StockCardProps) {
  const { lastPrice, history } = useStockRealtime(tsCode)

  const pctChg = lastPrice?.pct_chg ?? 0
  const { text: pctText, isRise } = formatChangePercent(pctChg)

  // 涨跌脉冲动画
  const cardRef = useRef<HTMLDivElement>(null)
  const prevClose = useRef<number | null>(null)

  useEffect(() => {
    if (!cardRef.current || prevClose.current === null) {
      prevClose.current = lastPrice?.close ?? null
      return
    }
    if (lastPrice?.close !== prevClose.current && prevClose.current !== null) {
      const el = cardRef.current
      el.classList.remove("card-pulse-rise", "card-pulse-fall")
      void el.offsetWidth // 强制重排
      el.classList.add(isRise ? "card-pulse-rise" : "card-pulse-fall")
      prevClose.current = lastPrice?.close ?? null
    }
  }, [lastPrice?.close, isRise])

  return (
    <Card
      ref={cardRef}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-black/20",
        isActive && "ring-1",
        isActive && isRise && "ring-rise/40 glow-border-rise",
        isActive && !isRise && "ring-fall/40 glow-border-fall"
      )}
      onClick={onClick}
    >
      <div className="p-3">
        {/* 第一行：名称 + 价格 */}
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate max-w-[90px]">
              {name}
            </p>
          </div>

          {/* 价格 — 右侧大字 */}
          <div className="text-right flex-shrink-0 ml-2">
            <AnimatedNumber
              value={lastPrice ? formatPrice(lastPrice.close) : "--"}
              className={cn(
                "text-lg font-bold tabular-nums leading-none block",
                isRise ? "text-rise" : "text-fall"
              )}
            />
            {/* 涨跌 */}
            <AnimatedNumber
              value={lastPrice ? `${isRise ? "+" : ""}${pctText}` : "--"}
              className={cn(
                "text-xs tabular-nums mt-0.5 block",
                isRise ? "text-rise" : "text-fall"
              )}
            />
          </div>
        </div>

        {/* 第二行：迷你趋势图 */}
        <div className="h-8 mt-1">
          {history.length > 4 ? (
            <MiniSparkline data={history} isRise={isRise} height={32} />
          ) : (
            <div className="h-8 flex items-center justify-center">
              <span className="text-xs text-muted-foreground/40">等待数据...</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
})

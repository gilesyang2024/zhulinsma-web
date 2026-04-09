import { memo } from "react"
import { cn, formatPrice, formatChangePercent, formatVolume } from "@/lib/utils"
import type { PriceData, IndicatorResult } from "@/types"
import { AnimatedNumber } from "@/components/ui/Animated"

interface PriceTickerProps {
  tsCode: string
  name: string
  price?: PriceData
  indicators?: IndicatorResult
}

// 小标签数字
function StatChip({
  label,
  value,
  color,
  divider = false,
}: {
  label: string
  value: string
  color?: string
  divider?: boolean
}) {
  return (
    <div className={cn("flex items-baseline gap-1.5", divider && "pl-4 border-l border-border")}>
      <span className="text-xs text-muted-foreground/60">{label}</span>
      <span className={cn("text-sm font-medium tabular-nums", color)}>
        {value}
      </span>
    </div>
  )
}

// RSI 状态显示
function RSIIndicator({ value }: { value?: number }) {
  if (value == null) return <span className="text-sm text-muted-foreground/40">--</span>
  const isOverbought = value > 70
  const isOversold = value < 30
  const color = isOverbought ? "text-rise" : isOversold ? "text-fall" : "text-muted-foreground"
  const label = isOverbought ? "超买" : isOversold ? "超卖" : ""
  return (
    <span className={cn("text-sm tabular-nums font-medium", color)}>
      {value.toFixed(1)}
      {label && <span className={cn("text-xs ml-0.5", color)}>{label}</span>}
    </span>
  )
}

// MACD 信号
function MACDIndicator({ value }: { value?: number }) {
  if (value == null) return <span className="text-sm text-muted-foreground/40">--</span>
  const color = value > 0 ? "text-rise" : "text-fall"
  return (
    <span className={cn("text-sm tabular-nums font-medium", color)}>
      {value.toFixed(3)}
    </span>
  )
}

export const PriceTicker = memo(function PriceTicker({
  tsCode,
  name,
  price,
  indicators,
}: PriceTickerProps) {
  const pctChg = price?.pct_chg ?? 0
  const chg = price?.change ?? 0
  const { text: pctText, isRise } = formatChangePercent(pctChg)
  const colorClass = isRise ? "text-rise" : "text-fall"
  const bgGlow = isRise ? "bg-rise/5" : "bg-fall/5"

  return (
    <div
      className={cn(
        "rounded-xl p-4 border transition-colors duration-500",
        bgGlow,
        isRise ? "border-rise/20" : "border-fall/20"
      )}
    >
      {/* 第1行：名称 · 代码 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-foreground">{name}</span>
        <span className="text-xs text-muted-foreground/50">· {tsCode}</span>
      </div>

      {/* 第2行：价格 + 涨跌（一行大字） */}
      <div className="flex items-baseline gap-3 mb-3">
        <AnimatedNumber
          value={price ? formatPrice(price.close) : "--"}
          className={cn("text-4xl font-bold tabular-nums leading-none", colorClass)}
        />
        <div className="flex flex-col justify-center">
          <span className={cn("text-base font-semibold tabular-nums", colorClass)}>
            {price ? `${isRise ? "+" : ""}${chg.toFixed(2)}` : "--"}
          </span>
          <span className={cn("text-sm tabular-nums", colorClass)}>
            {price ? `${isRise ? "+" : ""}${pctText}` : "--"}
          </span>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="border-t border-border/50 my-2" />

      {/* 第3行：今日行情（开盘/最高/最低/成交量） */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
        <StatChip label="开盘" value={price ? formatPrice(price.open) : "--"} color="text-foreground" />
        <StatChip label="最高" value={price ? formatPrice(price.high) : "--"} color="text-rise" divider />
        <StatChip label="最低" value={price ? formatPrice(price.low) : "--"} color="text-fall" divider />
        <StatChip
          label="成交量"
          value={price ? formatVolume(price.volume) : "--"}
          divider
        />
      </div>

      {/* 分隔线 */}
      <div className="border-t border-border/50 my-2" />

      {/* 第4行：均线指标 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <StatChip
          label="MA5"
          value={indicators?.sma5 != null ? formatPrice(indicators.sma5) : "--"}
          color="text-muted-foreground/80"
        />
        <StatChip
          label="MA20"
          value={indicators?.sma20 != null ? formatPrice(indicators.sma20) : "--"}
          color="text-muted-foreground/80"
          divider
        />
        <StatChip
          label="MA60"
          value={indicators?.sma60 != null ? formatPrice(indicators.sma60) : "--"}
          color="text-muted-foreground/80"
          divider
        />
        <StatChip
          label="EMA12"
          value={indicators?.ema12 != null ? formatPrice(indicators.ema12) : "--"}
          color="text-muted-foreground/80"
          divider
        />
      </div>

      {/* 第5行：MACD + RSI 右侧 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-muted-foreground/60">MACD</span>
          <MACDIndicator value={indicators?.macd} />
        </div>
        <div className="flex items-baseline gap-1.5 pl-4 border-l border-border">
          <span className="text-xs text-muted-foreground/60">RSI</span>
          <RSIIndicator value={indicators?.rsi} />
        </div>
      </div>
    </div>
  )
})

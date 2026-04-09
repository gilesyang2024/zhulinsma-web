import { memo, useRef, useEffect, useState } from "react"
import { useStockRealtime } from "@/hooks/useRealtime"
import { KLineChart } from "@/components/charts/KLineChart"
import { PriceTicker } from "@/components/stock/PriceTicker"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { cn } from "@/lib/utils"
import { STOCK_NAMES } from "@/config/stocks"

interface StockDetailPanelProps {
  tsCode: string
}

export const StockDetailPanel = memo(function StockDetailPanel({ tsCode }: StockDetailPanelProps) {
  const { lastPrice, indicators, history } = useStockRealtime(tsCode)
  const name = STOCK_NAMES[tsCode] || tsCode

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* 价格行情区 */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <PriceTicker tsCode={tsCode} name={name} price={lastPrice} indicators={indicators} />
        </CardContent>
      </Card>

      {/* K线图区 */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>K线走势</CardTitle>
        </CardHeader>
        <CardContent>
          <KLineChart
            data={history}
            indicators={indicators}
            height={420}
          />
        </CardContent>
      </Card>

      {/* 技术指标区 */}
      <div className="grid grid-cols-3 gap-3">
        <IndicatorCard
          title="RSI (14)"
          value={indicators?.rsi?.toFixed(1)}
          status={
            indicators?.rsi != null
              ? indicators.rsi > 70
                ? "超买"
                : indicators.rsi < 30
                ? "超卖"
                : "正常"
              : "--"
          }
          statusColor={
            indicators?.rsi != null
              ? indicators.rsi > 70
                ? "text-rise"
                : indicators.rsi < 30
                ? "text-fall"
                : "text-muted-foreground"
              : "text-muted-foreground"
          }
        />
        <IndicatorCard
          title="MACD"
          value={indicators?.macd?.toFixed(3)}
          status={
            indicators?.macd != null
              ? indicators.macd > 0
                ? "多头"
                : "空头"
              : "--"
          }
          statusColor={
            indicators?.macd != null
              ? indicators.macd > 0
                ? "text-rise"
                : "text-fall"
              : "text-muted-foreground"
          }
        />
        <IndicatorCard
          title="布林带位置"
          value={
            indicators?.bb_upper != null && lastPrice != null
              ? (
                  ((lastPrice.close - indicators.bb_lower!) /
                    (indicators.bb_upper - indicators.bb_lower!)) *
                  100
                ).toFixed(0) + "%"
              : undefined
          }
          status={
            indicators?.bb_upper != null && lastPrice != null
              ? lastPrice.close > indicators.bb_upper
                ? "上轨突破"
                : lastPrice.close < indicators.bb_lower!
                ? "下轨突破"
                : "轨道内"
              : "--"
          }
          statusColor="text-muted-foreground"
        />
      </div>
    </div>
  )
})

function IndicatorCard({
  title,
  value,
  status,
  statusColor,
}: {
  title: string
  value?: string
  status: string
  statusColor: string
}) {
  const prevValue = useRef<string | undefined>(value)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value
      if (value != null) {
        setPulse(true)
        const t = setTimeout(() => setPulse(false), 400)
        return () => clearTimeout(t)
      }
    }
  }, [value])

  return (
    <Card className="transition-shadow hover:shadow-md hover:shadow-primary/5">
      <CardContent className="pt-3 pb-3">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className={cn("text-xl font-bold tabular-nums mt-1 transition-all", pulse && "indicator-value-update text-primary")}>
          {value ?? "--"}
        </p>
        <p className={cn("text-xs mt-0.5", statusColor)}>{status}</p>
      </CardContent>
    </Card>
  )
}

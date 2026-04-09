import { useEffect, useRef, memo, useState } from "react"
import {
  createChart,
  CrosshairMode,
} from "lightweight-charts"
import type { IChartApi, ISeriesApi, IPriceLine } from "lightweight-charts"
import type { Time } from "lightweight-charts"
import type { CandlestickData, IndicatorResult } from "@/types"
import { cn } from "@/lib/utils"

interface KLineChartProps {
  data: CandlestickData[]
  indicators?: IndicatorResult
  height?: number
  className?: string
}

// 广州配色
const UP_COLOR = "#ef4444"
const DOWN_COLOR = "#22c55e"

const CHART_BASE = {
  layout: {
    background: { color: "transparent" },
    textColor: "#94a3b8",
    fontSize: 11,
  },
  grid: {
    vertLines: { color: "rgba(148, 163, 184, 0.05)" },
    horzLines: { color: "rgba(148, 163, 184, 0.05)" },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: { color: "rgba(148,163,184,0.35)", labelBackgroundColor: "#1e293b" },
    horzLine: { color: "rgba(148,163,184,0.35)", labelBackgroundColor: "#1e293b" },
  },
  timeScale: {
    borderColor: "rgba(148, 163, 184, 0.08)",
    timeVisible: true,
    secondsVisible: false,
  },
  rightPriceScale: { borderColor: "rgba(148, 163, 184, 0.08)" },
}

type SubPanel = "volume" | "rsi" | "macd"

// ──────────────────────────────────────────────────────
// 工具：计算 RSI 序列
function calcRSISeries(data: CandlestickData[], period = 14) {
  const result: { time: number; value: number }[] = []
  if (data.length < period + 1) return result

  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close
    if (diff > 0) avgGain += diff
    else avgLoss += -diff
  }
  avgGain /= period
  avgLoss /= period

  for (let i = period; i < data.length; i++) {
    if (i > period) {
      const diff = data[i].close - data[i - 1].close
      avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period
      avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    result.push({ time: data[i].time as number, value: +(100 - 100 / (1 + rs)).toFixed(2) })
  }
  return result
}

// 工具：计算 MACD 序列
function calcMACDSeries(data: CandlestickData[], fast = 12, slow = 26, signal = 9) {
  const macds: { time: number; macd: number; signal: number; hist: number }[] = []
  if (data.length < slow + signal) return macds

  let ema12 = data[0].close
  let ema26 = data[0].close
  const k12 = 2 / (fast + 1)
  const k26 = 2 / (slow + 1)
  const kSig = 2 / (signal + 1)

  const raw: { time: number; macd: number }[] = []
  for (let i = 0; i < data.length; i++) {
    ema12 = i === 0 ? data[i].close : ema12 + k12 * (data[i].close - ema12)
    ema26 = i === 0 ? data[i].close : ema26 + k26 * (data[i].close - ema26)
    if (i >= slow - 1) raw.push({ time: data[i].time as number, macd: ema12 - ema26 })
  }

  let sig = raw[0].macd
  for (let i = 0; i < raw.length; i++) {
    sig = i === 0 ? raw[i].macd : sig + kSig * (raw[i].macd - sig)
    if (i >= signal - 1) {
      macds.push({ time: raw[i].time, macd: +raw[i].macd.toFixed(4), signal: +sig.toFixed(4), hist: +(raw[i].macd - sig).toFixed(4) })
    }
  }
  return macds
}
// ──────────────────────────────────────────────────────

export const KLineChart = memo(function KLineChart({
  data,
  indicators: _indicators,
  height = 380,
  className,
}: KLineChartProps) {
  void _indicators // reserved for future real-time update
  const mainRef = useRef<HTMLDivElement>(null)
  const subRef  = useRef<HTMLDivElement>(null)

  const mainChartRef = useRef<IChartApi | null>(null)
  const subChartRef  = useRef<IChartApi | null>(null)

  // 主图系列
  const candleRef  = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volRef     = useRef<ISeriesApi<"Histogram"> | null>(null)
  const sma5Ref    = useRef<ISeriesApi<"Line"> | null>(null)
  const sma20Ref   = useRef<ISeriesApi<"Line"> | null>(null)
  const sma60Ref   = useRef<ISeriesApi<"Line"> | null>(null)

  // 实时价格线
  const priceLineRef = useRef<IPriceLine | null>(null)
  const lastPriceRef = useRef<number>(0)

  // 副图系列
  const rsiRef      = useRef<ISeriesApi<"Line"> | null>(null)
  const macdRef     = useRef<ISeriesApi<"Line"> | null>(null)
  const macdSigRef  = useRef<ISeriesApi<"Line"> | null>(null)
  const macdHistRef = useRef<ISeriesApi<"Histogram"> | null>(null)

  const [subPanel, setSubPanel] = useState<SubPanel>("volume")
  const subPanelRef = useRef<SubPanel>("volume")

  const SUB_HEIGHT = 100

  // ── 初始化主图 ──
  useEffect(() => {
    if (!mainRef.current) return
    const chart = createChart(mainRef.current, {
      ...CHART_BASE,
      width: mainRef.current.clientWidth,
      height: height - SUB_HEIGHT - 4,
    })
    mainChartRef.current = chart

    // K线 — v4 API
    candleRef.current = chart.addCandlestickSeries({
      upColor: UP_COLOR, downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR, borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR, wickDownColor: DOWN_COLOR,
    })

    // 实时价格横向发光线（拖尾效果核心）
    priceLineRef.current = candleRef.current.createPriceLine({
      price: 0,
      color: UP_COLOR,
      lineWidth: 1,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: "",
    })

    // 成交量叠加 — 独立价格刻度
    volRef.current = chart.addHistogramSeries({
      color: "rgba(148,163,184,0.15)",
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    })
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })

    // 均线 — v4 API
    sma5Ref.current  = chart.addLineSeries({ color: "#f59e0b", lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    sma20Ref.current = chart.addLineSeries({ color: "#8b5cf6", lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    sma60Ref.current = chart.addLineSeries({ color: "#06b6d4", lineWidth: 1, priceLineVisible: false, lastValueVisible: false })

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) chart.applyOptions({ width: e.contentRect.width })
    })
    ro.observe(mainRef.current)

    return () => { ro.disconnect(); chart.remove() }
  }, [height])

  // ── 初始化副图 ──
  useEffect(() => {
    if (!subRef.current) return
    const chart = createChart(subRef.current, {
      ...CHART_BASE,
      width: subRef.current.clientWidth,
      height: SUB_HEIGHT,
      timeScale: { ...CHART_BASE.timeScale, visible: false },
    })
    subChartRef.current = chart

    // RSI — v4 API
    rsiRef.current = chart.addLineSeries({ color: "#f97316", lineWidth: 2, priceLineVisible: false, lastValueVisible: true })
    // MACD Line — v4 API
    macdRef.current = chart.addLineSeries({ color: "#3b82f6", lineWidth: 2, priceLineVisible: false, lastValueVisible: false })
    // MACD Signal — v4 API
    macdSigRef.current = chart.addLineSeries({ color: "#f59e0b", lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    // MACD Histogram — v4 API
    macdHistRef.current = chart.addHistogramSeries({ priceLineVisible: false, lastValueVisible: false })

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) chart.applyOptions({ width: e.contentRect.width })
    })
    ro.observe(subRef.current)

    // 同步主图和副图时间轴
    mainChartRef.current?.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) subChartRef.current?.timeScale().setVisibleLogicalRange(range)
    })
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) mainChartRef.current?.timeScale().setVisibleLogicalRange(range)
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 更新主图数据 ──
  useEffect(() => {
    if (!candleRef.current || !volRef.current || data.length === 0) return

    candleRef.current.setData(data.map((d) => ({
      time: d.time as Time,
      open: d.open, high: d.high, low: d.low, close: d.close,
    })) as any)

    volRef.current.setData(data.map((d) => ({
      time: d.time as Time,
      value: d.volume || 0,
      color: d.close >= d.open ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)",
    })) as any)

    // SMA
    const calcSMA = (period: number) => {
      const r: { time: Time; value: number }[] = []
      for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, d) => a + d.close, 0)
        r.push({ time: data[i].time as Time, value: +(sum / period).toFixed(3) })
      }
      return r
    }
    sma5Ref.current?.setData(calcSMA(5) as any)
    sma20Ref.current?.setData(calcSMA(20) as any)
    if (data.length >= 60) sma60Ref.current?.setData(calcSMA(60) as any)

    // ── 拖尾效果：更新实时价格线 ──
    if (priceLineRef.current && data.length > 0) {
      const lastCandle = data[data.length - 1]
      const price = lastCandle.close
      const isUp = lastCandle.close >= lastCandle.open
      priceLineRef.current.applyOptions({
        price: +price.toFixed(2),
        color: isUp ? UP_COLOR : DOWN_COLOR,
      })
      lastPriceRef.current = price
    }

    // 滚动到最新
    mainChartRef.current?.timeScale().scrollToPosition(-3, false)
  }, [data])

  // ── 更新副图数据 ──
  useEffect(() => {
    if (data.length === 0) return

    // RSI
    const rsiData = calcRSISeries(data)
    rsiRef.current?.setData(rsiData.map((d) => ({ time: d.time as Time, value: d.value })) as any)
    rsiRef.current?.applyOptions({ title: "RSI" })

    // MACD
    const macdData = calcMACDSeries(data)
    if (macdData.length > 0) {
      macdRef.current?.setData(macdData.map((d) => ({ time: d.time as Time, value: d.macd })) as any)
      macdSigRef.current?.setData(macdData.map((d) => ({ time: d.time as Time, value: d.signal })) as any)
      macdHistRef.current?.setData(macdData.map((d) => ({
        time: d.time as Time,
        value: d.hist,
        color: d.hist >= 0 ? "rgba(239,68,68,0.6)" : "rgba(34,197,94,0.6)",
      })) as any)
    }
  }, [data])

  // ── 切换副图可见性 ──
  useEffect(() => {
    subPanelRef.current = subPanel

    const showRSI  = subPanel === "rsi"
    const showMACD = subPanel === "macd"

    rsiRef.current?.applyOptions({ visible: showRSI } as any)
    macdRef.current?.applyOptions({ visible: showMACD } as any)
    macdSigRef.current?.applyOptions({ visible: showMACD } as any)
    macdHistRef.current?.applyOptions({ visible: showMACD } as any)
    // volume 模式时副图全隐藏
    if (subPanel === "volume") {
      rsiRef.current?.applyOptions({ visible: false } as any)
      macdRef.current?.applyOptions({ visible: false } as any)
      macdSigRef.current?.applyOptions({ visible: false } as any)
      macdHistRef.current?.applyOptions({ visible: false } as any)
    }
  }, [subPanel])

  return (
    <div className={cn("flex flex-col gap-0 relative", className)}>
      {/* 均线图例 + 副图切换 */}
      <div className="flex items-center justify-between px-1 mb-1.5 relative z-10">
        <div className="flex gap-3">
          {[
            { label: "MA5",  color: "#f59e0b" },
            { label: "MA20", color: "#8b5cf6" },
            { label: "MA60", color: "#06b6d4" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <span className="inline-block w-4 h-0.5 rounded" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* 副图切换按钮 */}
        <div className="flex gap-1">
          {(["volume", "rsi", "macd"] as SubPanel[]).map((p) => (
            <button
              key={p}
              onClick={() => setSubPanel(p)}
              className={cn(
                "px-2 py-0.5 text-xs rounded transition-colors",
                subPanel === p
                  ? "bg-primary/20 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 主K线图 + 拖尾渐变 */}
      <div className="relative">
        <div ref={mainRef} />
        {/* 拖尾渐变：右侧半透明遮罩，营造"拖尾"速度感 */}
        <div
          className="absolute top-0 right-0 h-full pointer-events-none"
          style={{
            width: "60px",
            background: "linear-gradient(to right, transparent, rgba(15,23,42,0.55))",
          }}
        />
        {/* 最新价发光标签 */}
        {data.length > 0 && (
          <div
            className="absolute top-1 right-2 pointer-events-none text-xs font-bold tabular-nums animate-number-roll"
            style={{
              color: data[data.length - 1].close >= data[data.length - 1].open ? UP_COLOR : DOWN_COLOR,
              textShadow: `0 0 8px ${data[data.length - 1].close >= data[data.length - 1].open ? UP_COLOR : DOWN_COLOR}`,
            }}
          >
            {data[data.length - 1].close.toFixed(2)}
          </div>
        )}
      </div>

      {/* 副图分隔线 */}
      <div className="border-t border-border/40 my-0.5" />

      {/* 副图标注 */}
      <div className="flex items-center gap-3 px-1 mb-0.5 h-4">
        {subPanel === "rsi" && (
          <>
            <span className="text-xs" style={{ color: "#f97316" }}>RSI(14)</span>
            <span className="text-xs text-muted-foreground">超买:70 超卖:30</span>
          </>
        )}
        {subPanel === "macd" && (
          <>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5" style={{ backgroundColor: "#3b82f6" }} />
              <span className="text-xs text-muted-foreground">MACD</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5" style={{ backgroundColor: "#f59e0b" }} />
              <span className="text-xs text-muted-foreground">Signal</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded-sm" style={{ backgroundColor: "rgba(239,68,68,0.6)" }} />
              <span className="text-xs text-muted-foreground">Histogram</span>
            </div>
          </>
        )}
        {subPanel === "volume" && (
          <span className="text-xs text-muted-foreground">成交量</span>
        )}
      </div>

      {/* 副图容器 */}
      <div ref={subRef} />
    </div>
  )
})

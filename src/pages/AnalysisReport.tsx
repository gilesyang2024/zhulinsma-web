import { useState } from "react"
import {
  TrendingUp, Activity, BarChart2, Volume2,
  Shield, AlertTriangle, CheckCircle, Minus,
  ArrowUpRight, ArrowDownRight, Target, Zap, CircleDot,
  FileText, X, CalendarDays,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import { useStockRealtime } from "@/hooks/useRealtime"
import { getStockName } from "@/config/stocks"
import { Skeleton } from "@/components/ui/Skeleton"
import { motion } from "framer-motion"
import type { AnalysisReportData } from "@/types/report"

/** 区块入场动画配置 */
const SECTION_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
}

// ─── 评分颜色映射 ─────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return "text-rise"
  if (score >= 65) return "text-yellow-400"
  if (score >= 50) return "text-orange-400"
  return "text-fall"
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-rise/10 border-rise/20"
  if (score >= 65) return "bg-yellow-400/10 border-yellow-400/20"
  if (score >= 50) return "bg-orange-400/10 border-orange-400/20"
  return "bg-fall/10 border-fall/20"
}

// ─── 评分圆环组件 ─────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - score / 100)

  const color =
    score >= 80 ? "#ef4444" :
    score >= 65 ? "#eab308" :
    score >= 50 ? "#f97316" : "#22c55e"

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg width="144" height="144" className="absolute inset-0">
        {/* 背景圆环 */}
        <circle
          cx="72" cy="72" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        {/* 得分圆环 */}
        <circle
          cx="72" cy="72" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 72 72)"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold tabular-nums", scoreColor(score))}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}

// ─── 分项评分条 ───────────────────────────────────────────────────────────────
function ScoreBar({ label, score, max, colorClass }: {
  label: string; score: number; max: number; colorClass: string
}) {
  const pct = Math.round((score / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-xs tabular-nums font-semibold", colorClass)}>
          {score}/{max}
        </span>
      </div>
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", colorClass.replace("text-", "bg-"))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── 均线行 ───────────────────────────────────────────────────────────────────
function MABar({ label, value, price }: { label: string; value: number; price: number }) {
  const above = price >= value
  const dist = ((price - value) / value) * 100
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-10">{label}</span>
      <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden relative">
        <div
          className={cn("h-full rounded-full", above ? "bg-rise" : "bg-fall")}
          style={{ width: `${Math.min(Math.abs(dist) * 3, 100)}%` }}
        />
        {/* 价格位置标记 */}
        <div
          className={cn("absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border-2 border-card", above ? "bg-rise left-full -translate-x-1/2" : "bg-fall right-full translate-x-1/2")}
        />
      </div>
      <span className={cn("text-xs tabular-nums font-medium w-14 text-right", above ? "text-rise" : "text-fall")}>
        {value.toFixed(2)}
      </span>
    </div>
  )
}

// ─── RSI 仪表盘 ───────────────────────────────────────────────────────────────
function RSIGauge({ rsi, period }: { rsi: number; period: string }) {
  const pct = Math.min(Math.max(rsi / 100, 0), 1)
  const color =
    rsi >= 70 ? "#ef4444" :
    rsi <= 30 ? "#22c55e" : "#60a5fa"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">RSI{period}</span>
        <span className={cn("font-bold tabular-nums", scoreColor(rsi * 1.43))}>{rsi.toFixed(1)}</span>
      </div>
      <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
        {/* 超卖区 */}
        <div className="absolute inset-y-0 left-0 w-[30%] bg-fall/30" />
        {/* 超买区 */}
        <div className="absolute inset-y-0 right-0 w-[30%] bg-rise/30" />
        {/* RSI 位置 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-card shadow-md transition-all"
          style={{
            left: `calc(${pct * 100}% - 6px)`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span>30 超卖</span>
        <span>70 超买</span>
        <span>100</span>
      </div>
    </div>
  )
}

// ─── 布林带可视化 ────────────────────────────────────────────────────────────
function BBVisual({ upper, middle, lower, price }: {
  upper: number; middle: number; lower: number; price: number
}) {
  const range = upper - lower
  const pos = (price - lower) / range

  return (
    <div className="space-y-2">
      <div className="relative h-10 flex items-center">
        {/* 下轨 */}
        <div className="absolute left-0 right-0 h-0.5 bg-chart-3/60 top-1/2 -translate-y-1/2" />
        {/* 中轨 */}
        <div className="absolute left-0 right-0 h-0.5 border-t-2 border-dashed border-chart-2/60 top-1/2" style={{ top: "50%" }} />
        {/* 填充带 */}
        <div
          className="absolute inset-y-0 rounded-sm bg-chart-2/10"
          style={{ left: `${pos * 100}%`, right: 0 }}
        />
        {/* 价格标记 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-card shadow-md"
          style={{
            left: `calc(${pos * 100}% - 5px)`,
            backgroundColor: "#60a5fa",
            boxShadow: "0 0 8px #60a5fa80",
          }}
        />
        {/* 价格线 */}
        <div
          className="absolute w-px bg-chart-2/40 left-1/2"
          style={{
            top: `${(1 - pos) * 100}%`,
            bottom: `${pos * 100}%`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span className="text-chart-3">上轨 {upper.toFixed(2)}</span>
        <span className="text-chart-2">中轨 {middle.toFixed(2)}</span>
        <span className="text-chart-3">下轨 {lower.toFixed(2)}</span>
      </div>
    </div>
  )
}

// ─── 信号行 ───────────────────────────────────────────────────────────────────
function SignalRow({ signal }: { signal: { type: "bull" | "bear" | "neutral"; label: string; icon: "check" | "alert" | "minus" } }) {
  const config = {
    bull: { icon: CheckCircle, color: "text-rise", bg: "bg-rise/10", border: "border-rise/20" },
    bear: { icon: AlertTriangle, color: "text-fall", bg: "bg-fall/10", border: "border-fall/20" },
    neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted/20", border: "border-muted/20" },
  }[signal.type]

  const Icon = config.icon
  return (
    <div className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg border", config.bg, config.border)}>
      <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", config.color)} />
      <span className={cn("text-xs", config.color)}>{signal.label}</span>
    </div>
  )
}

// ─── 主报告组件 ───────────────────────────────────────────────────────────────
interface AnalysisReportProps {
  tsCode?: string
  onClose?: () => void
}

export function AnalysisReport({ tsCode, onClose }: AnalysisReportProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "signals" | "advice">("overview")

  const code = tsCode || "600406.SH"
  const { lastPrice, indicators, history } = useStockRealtime(code)
  const stockName = getStockName(code)

  // ── 实时指标数据（从 useStockRealtime 实时流获取）───────────────────────────
  const price = lastPrice
  const ind = indicators

  // 若数据未加载，显示骨架屏
  if (!price || !ind || history.length < 5) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-background">
        <div className="flex-shrink-0 border-b border-border bg-card/60 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-48 h-3" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
          <Skeleton className="h-32 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // ── 计算报告数据 ─────────────────────────────────────────────────────────────
  const curClose = price.close
  const curHigh = price.high
  const curLow = price.low
  const curOpen = price.open

  // 从历史数据计算收益率
  const histLen = history.length
  const histClose = history.map((h) => h.close)
  const priceAt = (offset: number) => histClose[Math.max(0, histLen - 1 - offset)] ?? curClose
  const pct5d = ((curClose - priceAt(5)) / priceAt(5)) * 100
  const pct10d = ((curClose - priceAt(10)) / priceAt(10)) * 100
  const pct20d = ((curClose - priceAt(20)) / priceAt(20)) * 100

  // 历史区间
  const rangeLow = Math.min(...histClose.slice(-20))
  const rangeHigh = Math.max(...histClose.slice(-20))
  const rangePct = rangeHigh > rangeLow ? ((curClose - rangeLow) / (rangeHigh - rangeLow)) * 100 : 50

  // 技术指标（安全取值）
  const sma5 = ind.sma5 ?? curClose
  const sma10 = ind.sma10 ?? curClose
  const sma20 = ind.sma20 ?? curClose
  const sma60 = ind.sma60 ?? sma20
  const ema12 = ind.ema12 ?? curClose
  const ema26 = ind.ema26 ?? curClose
  const rsi6 = ind.rsi6 ?? 50
  const rsi12 = ind.rsi12 ?? 50
  const rsi24 = ind.rsi24 ?? 50
  const macdDif = ind.macd_dif ?? 0
  const macdDea = ind.macd_dea ?? 0
  const macdHist = ind.macd_hist ?? 0
  const bbUpper = ind.bb_upper ?? curClose * 1.03
  const bbMiddle = ind.bb_middle ?? curClose
  const bbLower = ind.bb_lower ?? curClose * 0.97
  const bbBw = bbMiddle > 0 ? ((bbUpper - bbLower) / bbMiddle) * 100 : 0
  const bbPos = bbUpper > bbLower ? (curClose - bbLower) / (bbUpper - bbLower) : 0.5

  // 布林带描述
  const bbPosDesc =
    bbPos > 0.9 ? "上轨上方（超买区）" :
    bbPos > 0.7 ? "上轨附近" :
    bbPos < 0.1 ? "下轨下方（超卖区）" :
    bbPos < 0.3 ? "下轨附近" :
    "中轨附近"

  // RSI 等级
  const rsiLevel = (r: number) =>
    r >= 70 ? "超买" : r >= 60 ? "偏强" : r <= 30 ? "超卖" : r <= 40 ? "偏弱" : "中性"

  // 综合评分（基于实时指标）
  const trendScore = Math.min(30,
    (sma5 > curClose ? 0 : 6) +
    (sma10 > curClose ? 0 : 6) +
    (sma20 > curClose ? 0 : 6) +
    (sma60 > curClose ? 0 : 6)
  )
  const rsiScore = Math.min(20,
    rsi12 >= 70 ? 4 : rsi12 >= 60 ? 12 : rsi12 <= 30 ? 18 : 8
  )
  const macdScore = Math.min(20,
    macdDif > 0 && macdHist > 0 ? 14 :
    macdDif > 0 ? 8 : 4
  )
  // 量比：从历史均量估算
  const avgVol5 = histLen >= 5 ? histClose.slice(-5).reduce((a, b) => a + b, 0) / 5 : curClose
  const volRatio = avgVol5 > 0 ? curClose / avgVol5 : 1
  const volumeScore = Math.min(15, Math.round(Math.max(0, volRatio) * 10))
  const bbScore = Math.min(15,
    bbPos > 0.8 ? 2 : bbPos < 0.2 ? 12 : 8
  )
  const totalScore = trendScore + rsiScore + macdScore + volumeScore + bbScore
  const rating =
    totalScore >= 75 ? "★★★★ 强烈看好" :
    totalScore >= 60 ? "★★★☆ 看好" :
    totalScore >= 45 ? "★★☆☆ 谨慎关注" :
    totalScore >= 30 ? "★☆☆☆ 偏弱" :
    "☆☆☆☆ 看空"

  // 均线状态
  const aboveMA = (ma: number) => curClose >= ma
  const goldenCross = sma5 > sma10 && sma5 - sma10 < 0.05
  const deathCross = sma5 < sma10 && sma10 - sma5 < 0.05
  const bullish = sma5 > sma10 && sma10 > sma20

  // 信号生成
  const signals: { type: "bull" | "bear" | "neutral"; label: string; icon: "check" | "alert" | "minus" }[] = []
  if (aboveMA(sma20)) signals.push({ type: "bull", label: `价格站稳SMA20均线（${sma20.toFixed(2)}），中期趋势向好`, icon: "check" })
  if (aboveMA(sma60)) signals.push({ type: "bull", label: `价格站稳SMA60长期均线（${sma60.toFixed(2)}），长线保持强势`, icon: "check" })
  if (pct20d > 5) signals.push({ type: "bull", label: `近20日涨幅${pct20d.toFixed(1)}%，短中期动能充足`, icon: "check" })
  if (ema12 > ema26) signals.push({ type: "bull", label: "EMA12 > EMA26，多头排列", icon: "check" })
  if (rsi12 >= 70) signals.push({ type: "bear", label: `RSI(12)=${rsi12.toFixed(1)}，进入超买区域，注意回调风险`, icon: "alert" })
  if (rsi12 <= 30) signals.push({ type: "bear", label: `RSI(12)=${rsi12.toFixed(1)}，进入超卖区域，关注反弹机会`, icon: "alert" })
  if (volRatio < 0.6) signals.push({ type: "bear", label: `成交量严重萎缩（量比${volRatio.toFixed(2)}x），量价背离`, icon: "alert" })
  if (bbPos > 0.9) signals.push({ type: "bear", label: `价格位于布林上轨附近（${bbPosDesc}），注意回调风险`, icon: "alert" })
  if (goldenCross) signals.push({ type: "bull", label: "SMA5 上穿 SMA10，形成金叉", icon: "check" })
  if (deathCross) signals.push({ type: "bear", label: "SMA5 下穿 SMA10，形成死叉", icon: "alert" })
  if (signals.length === 0) signals.push({ type: "neutral", label: "暂无明显信号，建议观望", icon: "minus" })

  // 操作建议
  const actionBull = totalScore >= 60 ? "积极型可逢低布局" : totalScore >= 45 ? "持仓可持有，关注均线支撑" : "建议观望，等待明确信号"
  const stopLoss = (curClose * 0.93).toFixed(2)
  const takeProfit1 = (bbUpper * 0.99).toFixed(2)
  const takeProfit2 = (bbUpper * 1.02).toFixed(2)
  const action = `${rating.includes("强烈") || rating.includes("看好") ? "积极型可考虑" : "谨慎型"}${actionBull}，止损参考${stopLoss}`

  // 支撑阻力
  const support = bbLower
  const resistance = bbUpper
  const supDist = curClose > 0 ? ((curClose - support) / curClose) * 100 : 0
  const resDist = curClose > 0 ? ((resistance - curClose) / curClose) * 100 : 0

  const data: AnalysisReportData = {
    stock: {
      tsCode: code,
      name: stockName,
      reportDate: new Date().toISOString().slice(0, 10),
      dataRange: `${history.length > 0 ? new Date(history[0].time as number * 1000).toISOString().slice(0, 10) : "N/A"} ~ ${history.length > 0 ? new Date(history[history.length - 1].time as number * 1000).toISOString().slice(0, 10) : "N/A"}`,
      totalDays: history.length,
    },
    price: {
      close: curClose,
      open: curOpen,
      high: curHigh,
      low: curLow,
      ret5d: pct5d,
      ret10d: pct10d,
      ret20d: pct20d,
      rangeLow,
      rangeHigh,
      rangePct,
    },
    score: {
      total: totalScore,
      trendScore,
      trendMax: 30,
      rsiScore,
      rsiMax: 20,
      macdScore,
      macdMax: 20,
      volumeScore,
      volumeMax: 15,
      bbScore,
      bbMax: 15,
      rating,
    },
    sma: {
      sma5, sma10, sma20, sma30: sma20, sma60,
      abovePrice: aboveMA(sma5),
      goldenCross,
      deathCross,
      bullish,
    },
    ema: {
      ema12, ema26,
      abovePrice: aboveMA(ema12),
      bullish: ema12 > ema26,
    },
    rsi: {
      rsi6, rsi12, rsi24,
      rsi6Level: rsiLevel(rsi6),
      rsi12Level: rsiLevel(rsi12),
      rsi24Level: rsiLevel(rsi24),
      overbought: rsi12 >= 70,
    },
    macd: {
      dif: macdDif,
      dea: macdDea,
      histogram: macdHist,
      bullish: macdDif > 0,
      goldenCross: macdDif > macdDea && macdDif - macdDea < 0.02,
      deathCross: macdDif < macdDea && macdDea - macdDif < 0.02,
      note: "",
    },
    bb: {
      upper: bbUpper,
      middle: bbMiddle,
      lower: bbLower,
      bandwidth: bbBw,
      position: bbPos,
      positionDesc: bbPosDesc,
    },
    volume: {
      lastVolume: price.volume ?? 0,
      avgVol5: price.volume ?? 0,
      avgVol20: price.volume ?? 0,
      volRatio,
      description: volRatio < 0.6 ? "严重缩量" : volRatio > 1.5 ? "明显放量" : "量能正常",
    },
    levels: [
      { type: "阻力", price: resistance, distancePct: resDist },
      { type: "支撑", price: support, distancePct: -supDist },
    ],
    advice: {
      signals,
      stopLoss: parseFloat(stopLoss),
      stopLossPct: -7,
      takeProfit1: parseFloat(takeProfit1),
      takeProfit2: parseFloat(takeProfit2),
      action,
    },
  }

  const { stock, price: priceData, score, sma, ema, rsi, macd, bb, volume, levels, advice } = data
  const pct = (n: number) => (n >= 0 ? `+${n.toFixed(2)}%` : `${n.toFixed(2)}%`)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-chart-1/80 to-chart-2 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">{stock.name}</h2>
                <span className="text-xs text-muted-foreground">{stock.tsCode}</span>
                <Badge
                  variant={score.total >= 65 ? "rise" : score.total >= 50 ? "warning" : "fall"}
                  className="text-[10px]"
                >
                  {score.rating}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {stock.reportDate}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {stock.dataRange}（{stock.totalDays}日）
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right mr-2">
              <div className="text-xs text-muted-foreground">综合评分</div>
              <div className={cn("text-xl font-bold tabular-nums", scoreColor(score.total))}>
                {score.total}
                <span className="text-xs text-muted-foreground font-normal">/100</span>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── 评分总览区 ─────────────────────────────────────────────── */}
        <motion.div
          className={cn("grid grid-cols-2 gap-3", scoreBg(score.total))}
          variants={SECTION_VARIANTS}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          {/* 左侧：评分圆环 + 评级 */}
          <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "inherit" }}>
            <ScoreRing score={score.total} />
            <div className="space-y-1 flex-1">
              <p className={cn("text-sm font-bold", scoreColor(score.total))}>
                {score.rating}
              </p>
              <p className="text-xs text-muted-foreground">竹林司马综合评分</p>
              <div className="mt-2 space-y-1.5">
                <ScoreBar label="趋势（均线）" score={score.trendScore} max={score.trendMax} colorClass={score.trendScore >= 25 ? "text-rise" : "text-muted-foreground"} />
                <ScoreBar label="RSI健康度" score={score.rsiScore} max={score.rsiMax} colorClass={score.rsiScore >= 13 ? "text-rise" : score.rsiScore >= 8 ? "text-yellow-400" : "text-fall"} />
                <ScoreBar label="MACD" score={score.macdScore} max={score.macdMax} colorClass={score.macdScore >= 15 ? "text-rise" : score.macdScore >= 8 ? "text-yellow-400" : "text-muted-foreground"} />
                <ScoreBar label="成交量" score={score.volumeScore} max={score.volumeMax} colorClass="text-fall" />
                <ScoreBar label="布林带" score={score.bbScore} max={score.bbMax} colorClass="text-orange-400" />
              </div>
            </div>
          </div>

          {/* 右侧：价格总览 */}
          <div className="p-3 rounded-xl border" style={{ borderColor: "inherit" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">价格总览</span>
              <span className="text-xs text-muted-foreground">广州红涨绿跌</span>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-2xl font-bold text-rise tabular-nums">
                {priceData.close.toFixed(2)}
              </span>
              <span className="text-rise text-sm mb-0.5">元</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-background/40 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">5日涨跌</p>
                <p className={cn("text-xs font-semibold tabular-nums", priceData.ret5d >= 0 ? "text-rise" : "text-fall")}>
                  {pct(priceData.ret5d)}
                </p>
              </div>
              <div className="bg-background/40 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">10日涨跌</p>
                <p className={cn("text-xs font-semibold tabular-nums", priceData.ret10d >= 0 ? "text-rise" : "text-fall")}>
                  {pct(priceData.ret10d)}
                </p>
              </div>
              <div className="bg-background/40 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">20日涨跌</p>
                <p className={cn("text-xs font-semibold tabular-nums", priceData.ret20d >= 0 ? "text-rise" : "text-fall")}>
                  {pct(priceData.ret20d)}
                </p>
              </div>
              <div className="bg-background/40 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">今日开盘</p>
                <p className="text-xs font-semibold tabular-nums">{priceData.open.toFixed(2)}</p>
              </div>
              <div className="bg-background/40 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">日内最高</p>
                <p className="text-xs font-semibold tabular-nums text-rise">{priceData.high.toFixed(2)}</p>
              </div>
              <div className="bg-background/40 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">日内最低</p>
                <p className="text-xs font-semibold tabular-nums text-fall">{priceData.low.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">近20日区间</span>
              <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden mx-1">
                <div
                  className="h-full bg-chart-2 rounded-full"
                  style={{ width: `${((priceData.close - priceData.rangeLow) / (priceData.rangeHigh - priceData.rangeLow)) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {priceData.rangeLow.toFixed(0)}~{priceData.rangeHigh.toFixed(0)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── 均线系统 ──────────────────────────────────────────────── */}
        <motion.div variants={SECTION_VARIANTS} initial="hidden" animate="visible" custom={1}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-chart-2" />
              <CardTitle>均线系统 SMA</CardTitle>
              {sma.bullish && (
                <Badge variant="rise" className="text-[10px] ml-1">多头排列</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2.5">
              <MABar label="SMA5" value={sma.sma5} price={priceData.close} />
              <MABar label="SMA10" value={sma.sma10} price={priceData.close} />
              <MABar label="SMA20" value={sma.sma20} price={priceData.close} />
              <MABar label="SMA30" value={sma.sma30} price={priceData.close} />
              <MABar label="SMA60" value={sma.sma60} price={priceData.close} />
            </div>
            <div className="flex items-center gap-3 pt-1 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className={cn("w-2 h-2 rounded-full", sma.goldenCross ? "bg-rise animate-pulse" : "bg-muted/40")} />
                <span className={sma.goldenCross ? "text-rise" : "text-muted-foreground"}>
                  MA5/MA10{sma.goldenCross ? " 金叉" : " 无信号"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className={cn("w-2 h-2 rounded-full", sma.deathCross ? "bg-fall animate-pulse" : "bg-muted/40")} />
                <span className={sma.deathCross ? "text-fall" : "text-muted-foreground"}>
                  MA5/MA10{sma.deathCross ? " 死叉" : ""}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* ── EMA + RSI ──────────────────────────────────────────────── */}
        <motion.div className="grid grid-cols-2 gap-3" variants={SECTION_VARIANTS} initial="hidden" animate="visible" custom={2}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-chart-1" />
                <CardTitle>指数移动平均 EMA</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">EMA12</p>
                  <p className={cn("text-lg font-bold tabular-nums", ema.abovePrice ? "text-rise" : "text-fall")}>
                    {ema.ema12.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className={cn("text-xs", ema.bullish ? "text-rise" : "text-fall")}>
                    {ema.bullish ? "↑ 金叉" : "↓ 死叉"}
                  </span>
                  <div className="w-px h-4 bg-border" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">EMA26</p>
                  <p className="text-lg font-bold tabular-nums text-chart-1">
                    {ema.ema26.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>当前价</span>
                <span className={cn("font-semibold", price.close >= ema.ema12 ? "text-rise" : "text-fall")}>
                  {price.close.toFixed(2)}
                </span>
                <span className="ml-auto">
                  {price.close >= ema.ema12 ? "在EMA12之上" : "在EMA12之下"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-chart-3" />
                <CardTitle>相对强弱指标 RSI</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <RSIGauge rsi={rsi.rsi6} period="6" />
              <RSIGauge rsi={rsi.rsi12} period="12" />
              <RSIGauge rsi={rsi.rsi24} period="24" />
            </CardContent>
          </Card>
        </motion.div>

        {/* ── MACD ─────────────────────────────────────────────────── */}
        <motion.div variants={SECTION_VARIANTS} initial="hidden" animate="visible" custom={3}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-chart-4" />
              <CardTitle>MACD 异同移动平均线</CardTitle>
              {macd.bullish && (
                <Badge variant="rise" className="text-[10px] ml-1">DIF零轴上方</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-muted/20 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">DIF 快线</p>
                <p className={cn("text-lg font-bold tabular-nums", macd.bullish ? "text-rise" : "text-fall")}>
                  {macd.dif.toFixed(4)}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">DEA 慢线</p>
                <p className="text-lg font-bold tabular-nums text-muted-foreground">
                  {macd.dea > 0 ? macd.dea.toFixed(4) : "数据不足"}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">MACD 柱</p>
                <p className={cn("text-lg font-bold tabular-nums", macd.histogram > 0 ? "text-rise" : macd.histogram < 0 ? "text-fall" : "text-muted-foreground")}>
                  {macd.histogram !== 0 ? macd.histogram.toFixed(4) : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-3">
                <span className={cn("px-2 py-0.5 rounded-full text-[10px]", macd.bullish ? "bg-rise/10 text-rise" : "bg-fall/10 text-fall")}>
                  {macd.bullish ? "DIF > 0 多头" : "DIF < 0 空头"}
                </span>
                {macd.goldenCross && (
                  <span className="text-rise font-medium">✅ MACD金叉</span>
                )}
                {macd.deathCross && (
                  <span className="text-fall font-medium">❌ MACD死叉</span>
                )}
              </div>
              {macd.note && (
                <span className="text-muted-foreground italic ml-auto">{macd.note}</span>
              )}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* ── 布林带 + 成交量 ────────────────────────────────────────── */}
        <motion.div className="grid grid-cols-2 gap-3" variants={SECTION_VARIANTS} initial="hidden" animate="visible" custom={4}>
          <div>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-chart-3" />
                <CardTitle>布林带 Bollinger Bands</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <BBVisual upper={bb.upper} middle={bb.middle} lower={bb.lower} price={priceData.close} />
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-muted/20 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">上轨</p>
                  <p className="text-xs font-bold tabular-nums text-rise">{bb.upper.toFixed(2)}</p>
                </div>
                <div className="bg-muted/20 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">中轨</p>
                  <p className="text-xs font-bold tabular-nums text-chart-2">{bb.middle.toFixed(2)}</p>
                </div>
                <div className="bg-muted/20 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">下轨</p>
                  <p className="text-xs font-bold tabular-nums text-chart-3">{bb.lower.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">轨宽</span>
                <span className="font-medium">{bb.bandwidth.toFixed(1)}%</span>
                <span className="text-muted-foreground ml-2">位置</span>
                <Badge variant={bb.position > 0.8 ? "rise" : bb.position < 0.2 ? "fall" : "default"} className="text-[10px]">
                  {bb.positionDesc}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-chart-5" />
                <CardTitle>成交量分析</CardTitle>
                <Badge variant={volume.volRatio < 0.6 ? "fall" : "default"} className="text-[10px] ml-auto">
                  {volume.description}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">当日成交量</span>
                  <span className="text-sm font-bold tabular-nums">
                    {(volume.lastVolume / 1e8).toFixed(2)}亿手
                  </span>
                </div>
                <div className="relative h-6 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", volume.volRatio < 0.6 ? "bg-fall/60" : "bg-rise/60")}
                    style={{ width: `${Math.min(volume.volRatio * 100, 100)}%` }}
                  />
                  {/* 均量线 */}
                  <div className="absolute top-0 bottom-0 w-px bg-foreground/20" style={{ left: "60%" }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0</span>
                  <span>5日均量</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/20 rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground">5日均量</p>
                  <p className="text-xs font-bold tabular-nums">{(volume.avgVol5 / 1e8).toFixed(2)}亿</p>
                </div>
                <div className="bg-muted/20 rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground">20日均量</p>
                  <p className="text-xs font-bold tabular-nums">{(volume.avgVol20 / 1e8).toFixed(2)}亿</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/20 p-2">
                <span className="text-xs text-muted-foreground">量比</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-bold tabular-nums", volume.volRatio < 0.6 ? "text-fall" : "text-muted-foreground")}>
                    {volume.volRatio.toFixed(2)}x
                  </span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", volume.volRatio < 0.6 ? "bg-fall/20 text-fall" : "bg-muted/40 text-muted-foreground")}>
                    {volume.volRatio < 0.6 ? "严重萎缩" : volume.volRatio > 1.5 ? "放量" : "正常"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </motion.div>

        {/* ── 支撑与阻力 ────────────────────────────────────────────── */}
        <motion.div variants={SECTION_VARIANTS} initial="hidden" animate="visible" custom={5}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-chart-2" />
              <CardTitle>支撑与阻力</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {levels.map((level, i) => (
                <div key={i} className="flex-1">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border",
                    level.type === "阻力" ? "bg-rise/5 border-rise/20" : "bg-fall/5 border-fall/20"
                  )}>
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center",
                      level.type === "阻力" ? "bg-rise/10" : "bg-fall/10"
                    )}>
                      {level.type === "阻力" ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-rise" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-fall" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{level.type}位</p>
                      <p className={cn("text-sm font-bold tabular-nums", level.type === "阻力" ? "text-rise" : "text-fall")}>
                        {level.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className={cn("text-xs font-medium", level.distancePct >= 0 ? "text-rise" : "text-fall")}>
                        {level.distancePct >= 0 ? `+${level.distancePct.toFixed(1)}%` : `${level.distancePct.toFixed(1)}%`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">距当前</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* ── 信号与建议 Tab ─────────────────────────────────────────── */}
        <motion.div variants={SECTION_VARIANTS} initial="hidden" animate="visible" custom={6}>
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm">综合信号与建议</CardTitle>
              <div className="flex bg-muted/30 rounded-lg p-0.5 gap-0.5 ml-auto">
                {(["overview", "signals", "advice"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                      activeTab === tab
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab === "overview" ? "概览" : tab === "signals" ? "信号" : "建议"}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">

            {activeTab === "overview" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rise/5 border border-rise/20 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle className="w-3.5 h-3.5 text-rise" />
                    <span className="text-xs font-semibold text-rise">
                      积极信号 ({advice.signals.filter(s => s.type === "bull").length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {advice.signals.filter(s => s.type === "bull").map((s, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">· {s.label}</p>
                    ))}
                  </div>
                </div>
                <div className="bg-fall/5 border border-fall/20 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-fall" />
                    <span className="text-xs font-semibold text-fall">
                      风险提示 ({advice.signals.filter(s => s.type === "bear").length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {advice.signals.filter(s => s.type === "bear").map((s, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">· {s.label}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "signals" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  共 {advice.signals.length} 个信号 · {advice.signals.filter(s => s.type === "bull").length} 看多 · {advice.signals.filter(s => s.type === "bear").length} 看空
                </p>
                {advice.signals.map((signal, i) => (
                  <SignalRow key={i} signal={signal} />
                ))}
              </div>
            )}

            {activeTab === "advice" && (
              <div className="space-y-3">
                <div className="bg-chart-2/5 border border-chart-2/20 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CircleDot className="w-3.5 h-3.5 text-chart-2" />
                    <span className="text-xs font-semibold text-chart-2">操作建议</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{advice.action}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-fall/5 border border-fall/20 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ArrowDownRight className="w-3.5 h-3.5 text-fall" />
                      <span className="text-[11px] text-fall font-medium">止损参考</span>
                    </div>
                    <p className="text-lg font-bold tabular-nums text-fall">{advice.stopLoss.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">距当前 {advice.stopLossPct.toFixed(1)}%</p>
                  </div>
                  <div className="bg-rise/5 border border-rise/20 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-rise" />
                      <span className="text-[11px] text-rise font-medium">止盈参考</span>
                    </div>
                    <p className="text-lg font-bold tabular-nums text-rise">{advice.takeProfit1.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">近20日高点</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>

        {/* ── 免责声明 ────────────────────────────────────────────────── */}
        <motion.div
          variants={SECTION_VARIANTS}
          initial="hidden"
          animate="visible"
          custom={7}
          className="text-center text-[10px] text-muted-foreground/50 leading-relaxed pb-2"
        >
          本报告由 <strong className="text-muted-foreground/70">竹林司马 (Zhulinsma)</strong> 技术分析工具自动生成，
          数据来源于市场公开数据，仅供参考，不构成投资建议。
          股市有风险，投资需谨慎。
        </motion.div>
      </div>
    </div>
  )
}

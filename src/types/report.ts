// ─── 智能分析报告数据类型 ─────────────────────────────────────────────────────

export interface ReportStockInfo {
  tsCode: string
  name: string
  reportDate: string
  dataRange: string
  totalDays: number
}

export interface ReportPriceOverview {
  close: number
  open: number
  high: number
  low: number
  ret5d: number
  ret10d: number
  ret20d: number
  rangeLow: number
  rangeHigh: number
  rangePct: number
}

export interface ReportScore {
  total: number
  trendScore: number
  trendMax: number
  rsiScore: number
  rsiMax: number
  macdScore: number
  macdMax: number
  volumeScore: number
  volumeMax: number
  bbScore: number
  bbMax: number
  rating: string
}

export interface ReportSMAData {
  sma5: number
  sma10: number
  sma20: number
  sma30: number
  sma60: number
  abovePrice: boolean
  goldenCross: boolean
  deathCross: boolean
  bullish: boolean
}

export interface ReportEMAData {
  ema12: number
  ema26: number
  abovePrice: boolean
  bullish: boolean
}

export interface ReportRSIData {
  rsi6: number
  rsi12: number
  rsi24: number
  rsi6Level: string
  rsi12Level: string
  rsi24Level: string
  overbought: boolean
}

export interface ReportMACDData {
  dif: number
  dea: number
  histogram: number
  bullish: boolean
  goldenCross: boolean
  deathCross: boolean
  note?: string
}

export interface ReportBBData {
  upper: number
  middle: number
  lower: number
  bandwidth: number
  position: number // 0-1, 0=下轨, 1=上轨
  positionDesc: string
}

export interface ReportVolumeData {
  lastVolume: number
  avgVol5: number
  avgVol20: number
  volRatio: number
  description: string
}

export interface ReportLevel {
  type: "阻力" | "支撑"
  price: number
  distancePct: number
}

export interface ReportSignal {
  type: "bull" | "bear" | "neutral"
  label: string
  icon: "check" | "alert" | "minus"
}

export interface ReportAdvice {
  signals: ReportSignal[]
  stopLoss: number
  stopLossPct: number
  takeProfit1: number
  takeProfit2: number
  action: string
}

export interface AnalysisReportData {
  stock: ReportStockInfo
  price: ReportPriceOverview
  score: ReportScore
  sma: ReportSMAData
  ema: ReportEMAData
  rsi: ReportRSIData
  macd: ReportMACDData
  bb: ReportBBData
  volume: ReportVolumeData
  levels: [ReportLevel, ReportLevel]
  advice: ReportAdvice
}

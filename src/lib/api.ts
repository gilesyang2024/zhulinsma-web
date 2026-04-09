/**
 * 竹林司马 API 客户端
 * REST API + WebSocket 双通道，统一数据格式
 */
import type { CandlestickData, IndicatorResult, PriceData } from "@/types"

const API_BASE = "http://localhost:8765"

export interface HistoryResponse {
  ts_code: string
  name: string
  total: number
  data: CandlestickData[]
}

export interface RealtimeResponse {
  ts_code: string
  name: string
  price: PriceData
  indicators: IndicatorResult
}

export interface StockSearchResult {
  ts_code: string
  name: string
}

/** 获取历史K线数据 */
export async function fetchHistory(tsCode: string, days = 120): Promise<HistoryResponse> {
  const res = await fetch(`${API_BASE}/api/history/${tsCode}?days=${days}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** 获取实时行情快照 */
export async function fetchRealtime(tsCode: string): Promise<RealtimeResponse> {
  const res = await fetch(`${API_BASE}/api/realtime/${tsCode}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** 搜索股票 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  const res = await fetch(`${API_BASE}/api/stocks/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.results ?? []
}

/** 获取股票列表 */
export async function fetchStockList(): Promise<StockSearchResult[]> {
  const res = await fetch(`${API_BASE}/api/stocks/list`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.stocks ?? []
}

/** WebSocket 地址 */
export const WS_URL = `ws://${window.location.hostname}:8765`

/** 实时数据消息类型 */
export type MessageType =
  | "connected"
  | "heartbeat"
  | "subscribe_ack"
  | "unsubscribe_ack"
  | "realtime_data"
  | "alert"
  | "error"

/** 技术指标结果 */
export interface IndicatorResult {
  sma5?: number
  sma10?: number
  sma20?: number
  sma60?: number
  ema12?: number
  ema26?: number
  rsi?: number
  rsi6?: number
  rsi12?: number
  rsi24?: number
  macd?: number
  macd_signal?: number
  macd_dif?: number
  macd_dea?: number
  macd_hist?: number
  bb_upper?: number
  bb_middle?: number
  bb_lower?: number
}

/** 实时价格数据 */
export interface PriceData {
  ts_code: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  amount: number
  change?: number
  pct_chg?: number
}

/** 实时数据消息 */
export interface RealtimeMessage {
  type: MessageType
  data?: {
    ts_code?: string
    timestamp?: number
    price?: PriceData
    indicators?: IndicatorResult
    alert_type?: string
    message?: string
  }
  code?: number
  message?: string
  server_time?: number
}

/** K线数据（Lightweight Charts 格式） */
export interface CandlestickData {
  time: number | string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

/** 股票基本信息 */
export interface StockInfo {
  ts_code: string
  name: string
  industry?: string
  area?: string
  market?: string
}

/** 预警信息 */
export interface Alert {
  id: string
  ts_code: string
  stock_name: string
  alert_type: string
  message: string
  timestamp: number
  level: "info" | "warning" | "critical"
}

/** 订阅状态 */
export interface SubscriptionState {
  [tsCode: string]: {
    active: boolean
    lastPrice?: PriceData
    indicators?: IndicatorResult
    history: CandlestickData[]
  }
}

/** WebSocket 连接状态 */
export type WsStatus = "connecting" | "connected" | "disconnected" | "error"

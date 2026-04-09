import { create } from "zustand"
import type { SetState, GetState } from "zustand"
import type {
  WsStatus,
  PriceData,
  IndicatorResult,
  CandlestickData,
  Alert,
  SubscriptionState,
} from "@/types"
import { genId } from "@/lib/utils"
import { WS_URL, fetchHistory } from "@/lib/api"

const RECONNECT_MAX = 5
const ALERT_STORAGE_KEY = "zhulinsma_alerts_v2"

// ─── 预警本地持久化 ─────────────────────────────────────────────────────────
function loadPersistedAlerts(): Alert[] {
  try {
    const raw = localStorage.getItem(ALERT_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Alert[]) : []
  } catch {
    return []
  }
}

function persistAlertToStorage(alert: Alert) {
  try {
    const existing = loadPersistedAlerts()
    const updated = [alert, ...existing].slice(0, 200)
    localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage 不可用时静默忽略
  }
}

function inferAlertLevel(alertType: string): Alert["level"] {
  const critical = ["超买", "超卖", "突破", "异动"]
  if (critical.some((k) => alertType.includes(k))) return "critical"
  if (alertType.includes("金叉") || alertType.includes("死叉")) return "warning"
  return "info"
}

export function loadStoredAlerts(): Alert[] {
  return loadPersistedAlerts()
}

// ─── Store 定义 ──────────────────────────────────────────────────────────────
interface RealtimeStore {
  wsStatus: WsStatus
  ws: WebSocket | null
  reconnectCount: number
  subscriptions: SubscriptionState
  watchList: string[]
  alerts: Alert[]
  isInitialized: Record<string, boolean>
  connect: () => void
  disconnect: () => void
  subscribe: (tsCode: string) => void
  unsubscribe: (tsCode: string) => void
  addToWatchList: (tsCode: string) => void
  removeFromWatchList: (tsCode: string) => void
  clearAlerts: () => void
  dismissAlert: (id: string) => void
  _setStatus: (status: WsStatus) => void
  _onMessage: (event: MessageEvent) => void
  _updatePrice: (tsCode: string, price: PriceData, indicators?: IndicatorResult) => void
}

export const useRealtimeStore = create<RealtimeStore>((set, get) => ({
  wsStatus: "disconnected",
  ws: null,
  reconnectCount: 0,
  subscriptions: {},
  watchList: ["600406.SH", "000001.SZ", "300750.SZ"],
  alerts: loadStoredAlerts(),
  isInitialized: {},

  connect: () => {
    const { ws, wsStatus } = get()
    if (ws && (wsStatus === "connected" || wsStatus === "connecting")) return

    set({ wsStatus: "connecting" })

    try {
      const socket = new WebSocket(WS_URL)

      socket.onopen = () => {
        set({ wsStatus: "connected", reconnectCount: 0, ws: socket })
        const { watchList, isInitialized } = get()
        watchList.forEach((code) => {
          if (!isInitialized[code]) {
            _initStockData(code, get, set)
          } else {
            socket.send(JSON.stringify({ type: "subscribe", data: { ts_code: code } }))
          }
        })
      }

      socket.onmessage = (event) => get()._onMessage(event)

      socket.onclose = () => {
        set({ wsStatus: "disconnected", ws: null })
        const { reconnectCount } = get()
        if (reconnectCount < RECONNECT_MAX) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCount), 30000)
          set({ reconnectCount: reconnectCount + 1 })
          setTimeout(() => get().connect(), delay)
        }
      }

      socket.onerror = () => set({ wsStatus: "error" })
      set({ ws: socket })
    } catch {
      set({ wsStatus: "error" })
    }
  },

  disconnect: () => {
    get().ws?.close()
    set({ ws: null, wsStatus: "disconnected" })
  },

  subscribe: (tsCode) => {
    const { ws, wsStatus, isInitialized } = get()
    if (!isInitialized[tsCode]) {
      _initStockData(tsCode, get, set)
      return
    }
    if (ws && wsStatus === "connected") {
      ws.send(JSON.stringify({ type: "subscribe", data: { ts_code: tsCode } }))
    }
  },

  unsubscribe: (tsCode) => {
    const { ws, wsStatus } = get()
    if (ws && wsStatus === "connected") {
      ws.send(JSON.stringify({ type: "unsubscribe", data: { ts_code: tsCode } }))
    }
    set((s) => {
      const subs = { ...s.subscriptions }
      if (subs[tsCode]) subs[tsCode] = { ...subs[tsCode], active: false }
      return { subscriptions: subs }
    })
  },

  addToWatchList: (tsCode) => {
    set((s) => {
      if (s.watchList.includes(tsCode)) return s
      return { watchList: [...s.watchList, tsCode] }
    })
    get().subscribe(tsCode)
  },

  removeFromWatchList: (tsCode) => {
    set((s) => ({ watchList: s.watchList.filter((c) => c !== tsCode) }))
    get().unsubscribe(tsCode)
  },

  clearAlerts: () => {
    localStorage.removeItem(ALERT_STORAGE_KEY)
    set({ alerts: [] })
  },

  dismissAlert: (id) =>
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

  _setStatus: (status) => set({ wsStatus: status }),

  _onMessage: (event) => {
    try {
      const msg = JSON.parse(event.data as string)
      const { type, data } = msg as { type: string; data?: Record<string, unknown> }

      switch (type) {
        case "connected":
          break

        case "subscribe_ack": {
          const codes = data?.ts_code as string | string[] | undefined
          const codeList = Array.isArray(codes) ? codes : codes ? [codes] : []
          codeList.forEach((code: string) => {
            set((s) => ({
              subscriptions: {
                ...s.subscriptions,
                [code]: {
                  ...(s.subscriptions[code] || { history: [] }),
                  active: true,
                },
              },
            }))
          })
          break
        }

        case "history_data": {
          const tsCode = data?.ts_code as string | undefined
          const candles = (data?.candles || []) as CandlestickData[]
          if (tsCode && candles.length > 0) {
            set((s) => ({
              subscriptions: {
                ...s.subscriptions,
                [tsCode]: {
                  ...(s.subscriptions[tsCode] || { active: false }),
                  history: candles,
                },
              },
            }))
          }
          break
        }

        case "realtime_data": {
          const tsCode = data?.ts_code as string | undefined
          const price = data?.price as PriceData | undefined
          const indicators = data?.indicators as IndicatorResult | undefined
          if (tsCode && price) {
            get()._updatePrice(tsCode, price, indicators)
          }
          break
        }

        case "alert": {
          const alertData = data || {}
          const alert: Alert = {
            id: genId(),
            ts_code: (alertData.ts_code as string) || "",
            stock_name: (alertData.stock_name as string) || (alertData.ts_code as string) || "",
            alert_type: (alertData.alert_type as string) || "unknown",
            message: (alertData.message as string) || "",
            timestamp: (alertData.timestamp as number) || Date.now(),
            level: (alertData.level as Alert["level"]) || inferAlertLevel(alertData.alert_type as string),
          }
          persistAlertToStorage(alert)
          set((s) => ({ alerts: [alert, ...s.alerts].slice(0, 200) }))
          break
        }

        default:
          break
      }
    } catch {
      // ignore parse errors
    }
  },

  _updatePrice: (tsCode, price, indicators) => {
    set((s) => {
      const prev = s.subscriptions[tsCode] || { active: true, history: [] }
      const rawTs = (price as PriceData).timestamp
      // 后端 timestamp 为秒级 Unix 时间戳；若意外收到毫秒级(>1e12)则除以1000
      const secTs = rawTs > 1e12 ? Math.floor(rawTs / 1000) : rawTs || Math.floor(Date.now() / 1000)
      const candlestick: CandlestickData = {
        time: secTs,
        open: (price as PriceData).open,
        high: (price as PriceData).high,
        low: (price as PriceData).low,
        close: (price as PriceData).close,
        volume: (price as PriceData).volume,
      }
      // 追加到 history：去重（同时间戳则更新最后一条）+ 保持升序
      const prevHistory = prev.history.slice(-499)
      const lastBar = prevHistory[prevHistory.length - 1]
      let history: CandlestickData[]
      if (lastBar && lastBar.time === secTs) {
        // 更新最后一根 K 线（同一根 bar 的实时刷新）
        history = [...prevHistory.slice(0, -1), candlestick]
      } else if (lastBar && typeof lastBar.time === "number" && secTs > lastBar.time) {
        // 新 bar，直接追加
        history = [...prevHistory, candlestick]
      } else {
        // 时间倒退或无历史，只保持历史不变（等待下次历史刷新）
        history = prevHistory
      }
      return {
        subscriptions: {
          ...s.subscriptions,
          [tsCode]: {
            ...prev,
            lastPrice: price,
            indicators: indicators || prev.indicators,
            history,
          },
        },
      }
    })
  },
}))

// ─── HTTP 初始化单只股票 ────────────────────────────────────────────────────
async function _initStockData(
  tsCode: string,
  get: GetState<RealtimeStore>,
  set: SetState<RealtimeStore>
) {
  set((s) => ({ isInitialized: { ...s.isInitialized, [tsCode]: true } }))

  try {
    const resp = await fetchHistory(tsCode, 120)
    const candles: CandlestickData[] = resp.data.map((c) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }))

    set((s) => ({
      subscriptions: {
        ...s.subscriptions,
        [tsCode]: {
          ...(s.subscriptions[tsCode] || { active: false }),
          history: candles,
        },
      },
    }))
  } catch (e) {
    console.warn(`[API] 历史数据拉取失败 ${tsCode}:`, e)
  }

  const { ws, wsStatus } = get()
  if (ws && wsStatus === "connected") {
    ws.send(JSON.stringify({ type: "subscribe", data: { ts_code: tsCode } }))
  }
}

import { useEffect } from "react"
import { useRealtimeStore } from "@/store/realtimeStore"

/** 自动连接 WebSocket 并管理生命周期 */
export function useRealtimeConnection() {
  const connect = useRealtimeStore((s) => s.connect)
  const disconnect = useRealtimeStore((s) => s.disconnect)
  const wsStatus = useRealtimeStore((s) => s.wsStatus)

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [])

  return { wsStatus }
}

/** 订阅单只股票的实时数据 */
export function useStockRealtime(tsCode: string) {
  const subscribe = useRealtimeStore((s) => s.subscribe)
  const stockData = useRealtimeStore((s) => s.subscriptions[tsCode])
  const wsStatus = useRealtimeStore((s) => s.wsStatus)

  useEffect(() => {
    if (tsCode) subscribe(tsCode)
    return () => {
      // 注意：不要在 unmount 时取消订阅，因为其他组件可能也需要这个数据
    }
  }, [tsCode, wsStatus])

  return {
    lastPrice: stockData?.lastPrice,
    indicators: stockData?.indicators,
    history: stockData?.history || [],
    isActive: stockData?.active || false,
  }
}

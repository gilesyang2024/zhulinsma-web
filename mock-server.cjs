/**
 * 竹林司马 Mock WebSocket Server
 * 模拟实时行情推送 + 预警信号，无需后端即可验证前端
 * 运行: node mock-server.cjs
 */
const { WebSocketServer } = require("ws")

const PORT = 8765
const INTERVAL_MS = 800 // 每800ms推一次数据

// 模拟股票基础价格
const STOCKS = {
  "600406.SH": { name: "国电南瑞", base: 28.5,  vol: 0.008 },
  "000001.SZ": { name: "平安银行", base: 11.2,  vol: 0.010 },
  "300750.SZ": { name: "宁德时代", base: 195.0, vol: 0.012 },
  "600519.SH": { name: "贵州茅台", base: 1580,  vol: 0.006 },
  "000858.SZ": { name: "五粮液",   base: 142.0, vol: 0.009 },
}

// 维护每个股票的行情状态
const state = {}
for (const [code, info] of Object.entries(STOCKS)) {
  state[code] = {
    price: info.base,
    open: info.base,
    high: info.base,
    low: info.base,
    volume: 0,
    prevClose: info.base * (1 + (Math.random() - 0.5) * 0.03),
    // 用于计算 RSI 的收益序列
    gains: Array(14).fill(0.5),
    losses: Array(14).fill(0.5),
    // 用于计算 MACD
    ema12: info.base,
    ema26: info.base,
    macd_signal: 0,
    // 布林带历史收盘价
    closes: Array(20).fill(info.base),
  }
}

function randomWalk(price, vol) {
  const r = (Math.random() - 0.49) * vol
  return Math.max(price * (1 + r), 0.01)
}

function calcEMA(prev, price, period) {
  const k = 2 / (period + 1)
  return prev + k * (price - prev)
}

function calcIndicators(code) {
  const s = state[code]
  const closes = s.closes
  const n = closes.length

  // RSI(14)
  const gains = s.gains
  const losses = s.losses
  const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length
  const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
  const rsi = 100 - 100 / (1 + rs)

  // MACD
  const ema12 = s.ema12
  const ema26 = s.ema26
  const macd = ema12 - ema26
  const signal = s.macd_signal
  const histogram = macd - signal

  // 布林带(20,2)
  const mean = closes.reduce((a, b) => a + b, 0) / n
  const variance = closes.reduce((a, b) => a + (b - mean) ** 2, 0) / n
  const std = Math.sqrt(variance)
  const bb_upper = mean + 2 * std
  const bb_lower = mean - 2 * std
  const bb_middle = mean

  // SMA
  const sma5 = closes.slice(-5).reduce((a, b) => a + b, 0) / 5
  const sma20 = mean

  return { rsi, macd, macd_signal: signal, macd_histogram: histogram, bb_upper, bb_middle, bb_lower, sma5, sma20 }
}

function updateState(code) {
  const info = STOCKS[code]
  const s = state[code]
  const newPrice = randomWalk(s.price, info.vol)
  const delta = newPrice - s.price

  // 更新 RSI 数据
  s.gains.shift(); s.gains.push(delta > 0 ? delta : 0)
  s.losses.shift(); s.losses.push(delta < 0 ? -delta : 0)

  // 更新 MACD
  s.ema12 = calcEMA(s.ema12, newPrice, 12)
  s.ema26 = calcEMA(s.ema26, newPrice, 26)
  const macd = s.ema12 - s.ema26
  s.macd_signal = calcEMA(s.macd_signal, macd, 9)

  // 更新布林带历史
  s.closes.shift(); s.closes.push(newPrice)

  s.price = newPrice
  s.high = Math.max(s.high, newPrice)
  s.low = Math.min(s.low, newPrice)
  s.volume += Math.floor(Math.random() * 50000) + 10000

  return newPrice
}

function buildPriceMsg(code) {
  const s = state[code]
  const pctChange = (s.price - s.prevClose) / s.prevClose * 100
  return {
    type: "realtime_data",
    data: {
      ts_code: code,
      price: {
        ts_code: code,
        timestamp: Date.now(),
        open: +s.open.toFixed(2),
        high: +s.high.toFixed(2),
        low: +s.low.toFixed(2),
        close: +s.price.toFixed(2),
        volume: s.volume,
        prev_close: +s.prevClose.toFixed(2),
        change: +(s.price - s.prevClose).toFixed(2),
        pct_change: +pctChange.toFixed(2),
      },
      indicators: calcIndicators(code),
    },
  }
}

// 随机生成预警消息
const ALERT_TEMPLATES = [
  (code, name, ind) => ind.rsi > 72 ? { alert_type: "rsi_overbought", message: `${name} RSI(${ind.rsi.toFixed(1)}) 超买区域，注意回调风险` } : null,
  (code, name, ind) => ind.rsi < 28 ? { alert_type: "rsi_oversold",   message: `${name} RSI(${ind.rsi.toFixed(1)}) 超卖区域，关注反弹机会` } : null,
  (code, name, ind) => ind.macd_histogram > 0 && ind.macd < 0.05 ? { alert_type: "macd_golden_cross", message: `${name} MACD 形成金叉信号` } : null,
  (code, name, ind) => ind.macd_histogram < 0 && ind.macd > -0.05 ? { alert_type: "macd_death_cross", message: `${name} MACD 形成死叉信号` } : null,
]

// ===== WebSocket Server =====
const wss = new WebSocketServer({ port: PORT })
console.log(`[MockWS] 启动在 ws://localhost:${PORT}`)

// 每个客户端订阅的股票集合
const clientSubs = new Map()

wss.on("connection", (ws) => {
  console.log("[MockWS] 客户端已连接")
  clientSubs.set(ws, new Set())

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      const subs = clientSubs.get(ws)

      if (msg.type === "subscribe") {
        const code = msg.data?.ts_code
        if (code && STOCKS[code]) {
          subs.add(code)
          ws.send(JSON.stringify({ type: "subscribe_ack", data: { ts_code: code, success: true } }))
          // 立刻推一条历史快照（100根K线）
          ws.send(JSON.stringify({
            type: "history_data",
            data: {
              ts_code: code,
              candles: generateHistoricalCandles(code, 100),
            },
          }))
          console.log(`[MockWS] 订阅 ${code}`)
        }
      } else if (msg.type === "unsubscribe") {
        const code = msg.data?.ts_code
        if (code) {
          subs.delete(code)
          console.log(`[MockWS] 取消订阅 ${code}`)
        }
      }
    } catch (e) {
      // 忽略
    }
  })

  ws.on("close", () => {
    clientSubs.delete(ws)
    console.log("[MockWS] 客户端断开")
  })
})

// 生成历史K线（倒推100根1分钟K线）
function generateHistoricalCandles(code, count) {
  const info = STOCKS[code]
  const candles = []
  let p = info.base * (1 + (Math.random() - 0.5) * 0.05)
  const now = Math.floor(Date.now() / 1000)

  for (let i = count; i >= 0; i--) {
    const t = now - i * 60
    const o = p
    const c = randomWalk(p, info.vol * 0.5)
    const h = Math.max(o, c) * (1 + Math.random() * 0.003)
    const l = Math.min(o, c) * (1 - Math.random() * 0.003)
    candles.push({
      time: t,
      open: +o.toFixed(2),
      high: +h.toFixed(2),
      low: +l.toFixed(2),
      close: +c.toFixed(2),
      volume: Math.floor(Math.random() * 80000) + 20000,
    })
    p = c
  }
  return candles
}

// 定时推送行情
setInterval(() => {
  for (const [ws, subs] of clientSubs) {
    if (ws.readyState !== 1) continue // OPEN
    for (const code of subs) {
      updateState(code)
      ws.send(JSON.stringify(buildPriceMsg(code)))

      // 每次有 5% 概率触发预警
      if (Math.random() < 0.05) {
        const s = state[code]
        const ind = calcIndicators(code)
        const name = STOCKS[code].name
        for (const fn of ALERT_TEMPLATES) {
          const alert = fn(code, name, ind)
          if (alert) {
            ws.send(JSON.stringify({
              type: "alert",
              data: { ts_code: code, ...alert, timestamp: Date.now() },
            }))
            break
          }
        }
      }
    }
  }
}, INTERVAL_MS)

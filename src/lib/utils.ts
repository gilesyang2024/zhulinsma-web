import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 格式化涨跌幅，广州风格：涨为红色，跌为绿色 */
export function formatChangePercent(pct: number): { text: string; isRise: boolean } {
  const isRise = pct >= 0
  const text = `${isRise ? "+" : ""}${pct.toFixed(2)}%`
  return { text, isRise }
}

/** 格式化价格，保留2位小数 */
export function formatPrice(price: number): string {
  return price.toFixed(2)
}

/** 格式化大数字（亿/万） */
export function formatAmount(amount: number): string {
  if (amount >= 1e8) return `${(amount / 1e8).toFixed(2)}亿`
  if (amount >= 1e4) return `${(amount / 1e4).toFixed(2)}万`
  return amount.toFixed(0)
}

/** 格式化成交量 */
export function formatVolume(vol: number): string {
  if (vol >= 1e8) return `${(vol / 1e8).toFixed(1)}亿手`
  if (vol >= 1e4) return `${(vol / 1e4).toFixed(1)}万手`
  return `${vol}手`
}

/** 格式化时间戳为 HH:mm:ss */
export function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString("zh-CN", { hour12: false })
}

/** 格式化日期 */
export function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString("zh-CN")
}

/** 生成随机ID */
export function genId(): string {
  return Math.random().toString(36).slice(2, 9)
}

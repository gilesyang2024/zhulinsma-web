import { useState, useRef } from "react"
import { Search, Plus, X } from "lucide-react"
import { useRealtimeStore } from "@/store/realtimeStore"
import { cn } from "@/lib/utils"

// 内置搜索词典（常用股票）
const STOCK_DICT: { code: string; name: string; pinyin?: string }[] = [
  { code: "600519.SH", name: "贵州茅台", pinyin: "moutai" },
  { code: "000858.SZ", name: "五粮液", pinyin: "wuliangye" },
  { code: "600036.SH", name: "招商银行", pinyin: "zhaoshangyinhang" },
  { code: "000001.SZ", name: "平安银行", pinyin: "pinganbank" },
  { code: "600406.SH", name: "国电南瑞", pinyin: "guodiannrui" },
  { code: "300750.SZ", name: "宁德时代", pinyin: "catl" },
  { code: "002594.SZ", name: "比亚迪", pinyin: "byd" },
  { code: "601318.SH", name: "中国平安", pinyin: "chinapingan" },
  { code: "600276.SH", name: "恒瑞医药", pinyin: "hengrui" },
  { code: "000651.SZ", name: "格力电器", pinyin: "gree" },
  { code: "000333.SZ", name: "美的集团", pinyin: "midea" },
  { code: "601166.SH", name: "兴业银行", pinyin: "xinye" },
  { code: "600887.SH", name: "伊利股份", pinyin: "yili" },
  { code: "002415.SZ", name: "海康威视", pinyin: "hikvision" },
  { code: "601012.SH", name: "隆基绿能", pinyin: "longi" },
  { code: "688036.SH", name: "传音控股", pinyin: "transsion" },
  { code: "600031.SH", name: "三一重工", pinyin: "sany" },
  { code: "000725.SZ", name: "京东方A", pinyin: "boe" },
]

interface StockSearchProps {
  onClose?: () => void
}

export function StockSearch({ onClose }: StockSearchProps) {
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const addToWatchList = useRealtimeStore((s) => s.addToWatchList)
  const watchList = useRealtimeStore((s) => s.watchList)

  const results = query.trim().length > 0
    ? STOCK_DICT.filter((s) => {
        const q = query.toLowerCase()
        return (
          s.code.toLowerCase().includes(q) ||
          s.name.includes(query) ||
          (s.pinyin && s.pinyin.includes(q))
        )
      }).slice(0, 8)
    : []

  const handleAdd = (code: string) => {
    addToWatchList(code)
    setQuery("")
    onClose?.()
    inputRef.current?.blur()
  }

  // 支持直接输入代码 (e.g. 600519) 回车添加
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && results.length === 1) {
      handleAdd(results[0].code)
    }
    if (e.key === "Escape") {
      setQuery("")
      onClose?.()
    }
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-colors",
          focused
            ? "border-primary bg-background"
            : "border-border bg-card"
        )}
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="搜索股票代码/名称..."
          className="bg-transparent text-xs outline-none w-36 placeholder:text-muted-foreground/60"
        />
        {query && (
          <button
            onMouseDown={() => setQuery("")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 搜索结果下拉 */}
      {focused && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-56 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {results.map((stock) => {
            const isAdded = watchList.includes(stock.code)
            return (
              <button
                key={stock.code}
                onMouseDown={() => !isAdded && handleAdd(stock.code)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-left transition-colors",
                  isAdded
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-accent cursor-pointer"
                )}
              >
                <div>
                  <span className="text-sm font-medium">{stock.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{stock.code}</span>
                </div>
                {isAdded ? (
                  <span className="text-xs text-muted-foreground">已添加</span>
                ) : (
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* 无结果提示 */}
      {focused && query.trim().length > 0 && results.length === 0 && (
        <div className="absolute top-full mt-1 left-0 w-56 bg-popover border border-border rounded-lg shadow-xl z-50 px-3 py-3 text-xs text-muted-foreground">
          未找到 "{query}" 相关股票
        </div>
      )}
    </div>
  )
}

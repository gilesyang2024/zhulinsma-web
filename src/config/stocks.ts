/** 股票代码 → 中文名称 映射表
 * 单一数据源，消除硬编码重复
 * 使用位置：Dashboard / AlertPanel / StockDetailPanel
 */
export const STOCK_NAMES: Record<string, string> = {
  "600406.SH": "国电南瑞",
  "000001.SZ": "平安银行",
  "300750.SZ": "宁德时代",
  "600519.SH": "贵州茅台",
  "000858.SZ": "五粮液",
  "600036.SH": "招商银行",
  "002594.SZ": "比亚迪",
  "601318.SH": "中国平安",
  "600276.SH": "恒瑞医药",
  "000651.SZ": "格力电器",
  "000333.SZ": "美的集团",
}

/** 默认自选股列表（按加入顺序） */
export const DEFAULT_WATCHLIST: string[] = [
  "600406.SH",
  "600519.SH",
  "000001.SZ",
  "300750.SZ",
  "000858.SZ",
]

/** 根据股票代码获取名称，兜底返回代码本身 */
export function getStockName(tsCode: string): string {
  return STOCK_NAMES[tsCode] ?? tsCode
}

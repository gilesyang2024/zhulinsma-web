/**
 * 竹林司马 Design Tokens
 * 单一数据源，定义全局视觉语言
 * 用于：Tailwind CSS 变量、组件默认值、主题切换
 */

export const tokens = {
  // ── 涨跌色（广州红涨绿跌）──────────────────────────────────────────
  rise: {
    DEFAULT: "#ef4444",
    light: "#fca5a5",
    dark: "#991b1b",
    dim: "#7f1d1d",
    glow: "rgba(239, 68, 68, 0.3)",
  },
  fall: {
    DEFAULT: "#22c55e",
    light: "#86efac",
    dark: "#15803d",
    dim: "#14532d",
    glow: "rgba(34, 197, 94, 0.3)",
  },

  // ── 图表主题色 ─────────────────────────────────────────────────
  chart: [
    "#3b82f6", // chart-1: 蓝
    "#10b981", // chart-2: 绿
    "#f59e0b", // chart-3: 黄
    "#8b5cf6", // chart-4: 紫
    "#ec4899", // chart-5: 粉
  ],

  // ── 间距系统（8px 基准）──────────────────────────────────────────
  space: {
    "0": "0",
    "1": "0.25rem",  // 4px
    "2": "0.5rem",   // 8px
    "3": "0.75rem",  // 12px
    "4": "1rem",     // 16px
    "6": "1.5rem",   // 24px
    "8": "2rem",     // 32px
    "12": "3rem",    // 48px
    "16": "4rem",    // 64px
  },

  // ── 圆角系统 ─────────────────────────────────────────────────────
  radius: {
    sm: "0.25rem",
    DEFAULT: "0.5rem",
    md: "0.625rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.5rem",
    full: "9999px",
  },

  // ── 阴影系统 ─────────────────────────────────────────────────────
  shadow: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    DEFAULT: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    rise: "0 0 20px rgba(239, 68, 68, 0.25)",
    fall: "0 0 20px rgba(34, 197, 94, 0.25)",
    glow: "0 0 0 1px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.15)",
  },

  // ── 过渡动画 ─────────────────────────────────────────────────────
  transition: {
    fast: "150ms ease",
    DEFAULT: "300ms ease",
    slow: "500ms ease",
  },

  // ── 字体 ─────────────────────────────────────────────────────────
  font: {
    family: {
      mono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
    },
    size: {
      "2xs": "0.625rem",  // 10px
      xs: "0.75rem",      // 12px
      sm: "0.875rem",     // 14px
      DEFAULT: "1rem",    // 16px
      lg: "1.125rem",     // 18px
      xl: "1.25rem",      // 20px
      "2xl": "1.5rem",    // 24px
      "3xl": "1.875rem",  // 30px
    },
  },
} as const

/** 主题类型 */
export type ThemeMode = "dark" | "light"

/** 主题 CSS 变量 */
export const themeVars: Record<ThemeMode, Record<string, string>> = {
  dark: {
    "--background": "222 84% 4.9%",
    "--foreground": "210 40% 98%",
    "--card": "222 84% 7%",
    "--card-foreground": "210 40% 98%",
    "--popover": "222 84% 7%",
    "--popover-foreground": "210 40% 98%",
    "--primary": "210 40% 98%",
    "--primary-foreground": "222 47.4% 11.2%",
    "--secondary": "217.2 32.6% 17.5%",
    "--secondary-foreground": "210 40% 98%",
    "--muted": "217.2 32.6% 17.5%",
    "--muted-foreground": "215 20.2% 65.1%",
    "--accent": "217.2 32.6% 17.5%",
    "--accent-foreground": "210 40% 98%",
    "--destructive": "0 62.8% 30.6%",
    "--destructive-foreground": "210 40% 98%",
    "--border": "217.2 32.6% 17.5%",
    "--input": "217.2 32.6% 17.5%",
    "--ring": "217.2 32.6% 17.5%",
    "--radius": "0.5rem",
    "--chart-1": "217.2 91.2% 59.8%",
    "--chart-2": "160 60% 45%",
    "--chart-3": "38 92.5% 50.2%",
    "--chart-4": "262.1 83.2% 57.6%",
    "--chart-5": "330 81.2% 60.4%",
  },
  light: {
    "--background": "0 0% 100%",
    "--foreground": "222 47.4% 11.2%",
    "--card": "0 0% 100%",
    "--card-foreground": "222 47.4% 11.2%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "222 47.4% 11.2%",
    "--primary": "222 47.4% 11.2%",
    "--primary-foreground": "210 40% 98%",
    "--secondary": "210 40% 96.1%",
    "--secondary-foreground": "222.2 47.4% 11.2%",
    "--muted": "210 40% 96.1%",
    "--muted-foreground": "215.4 16.3% 46.9%",
    "--accent": "210 40% 96.1%",
    "--accent-foreground": "222.2 47.4% 11.2%",
    "--destructive": "0 84.2% 60.2%",
    "--destructive-foreground": "210 40% 98%",
    "--border": "214.3 31.8% 91.4%",
    "--input": "214.3 31.8% 91.4%",
    "--ring": "222.2 47.4% 11.2%",
    "--radius": "0.5rem",
    "--chart-1": "217.2 91.2% 59.8%",
    "--chart-2": "160 60% 45%",
    "--chart-3": "38 92.5% 50.2%",
    "--chart-4": "262.1 83.2% 57.6%",
    "--chart-5": "330 81.2% 60.4%",
  },
}

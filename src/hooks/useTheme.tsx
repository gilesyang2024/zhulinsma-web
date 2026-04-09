import { useEffect } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { themeVars, type ThemeMode } from "@/config/tokens"

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

/** 持久化的主题状态 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "dark",
      setMode: (mode) => {
        set({ mode })
        applyTheme(mode)
      },
      toggleMode: () => {
        const next = get().mode === "dark" ? "light" : "dark"
        set({ mode: next })
        applyTheme(next)
      },
    }),
    { name: "zhulinsma-theme" }
  )
)

/** 实际应用 CSS 变量到根元素 */
function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  const vars = themeVars[mode]
  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val)
  }
  // 更新 class
  root.classList.remove("dark", "light")
  root.classList.add(mode)
}

/** 初始化主题（SSR safe + hydration safe） */
export function initTheme() {
  applyTheme(useThemeStore.getState().mode)
}

/** React Hook：在组件中使用主题 */
export function useTheme() {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const toggleMode = useThemeStore((s) => s.toggleMode)

  // 组件挂载时确保主题已应用
  useEffect(() => {
    applyTheme(mode)
  }, [])

  return { mode, setMode, toggleMode }
}

/** ThemeToggle 组件 */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggleMode } = useTheme()

  return (
    <button
      onClick={toggleMode}
      className={className}
      title={mode === "dark" ? "切换浅色模式" : "切换深色模式"}
    >
      {mode === "dark" ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}

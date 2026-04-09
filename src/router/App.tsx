import { useEffect } from "react"
import { TooltipProvider } from "@/components/ui/Tooltip"
import { ToastContainer } from "@/components/ui/Toast"
import { GridBackground } from "@/components/ui/GridBackground"
import { initTheme } from "@/hooks/useTheme"
import Dashboard from "@/App"

export function App() {
  // 初始化主题（仅首次）
  useEffect(() => {
    initTheme()
  }, [])

  return (
    <>
      <TooltipProvider>
        <GridBackground variant="ambient" />
        {/* 扫描线氛围光 */}
        <div className="scan-line" />
        <Dashboard />
        {/* 全局 Toast 通知容器 */}
        <ToastContainer />
      </TooltipProvider>
    </>
  )
}

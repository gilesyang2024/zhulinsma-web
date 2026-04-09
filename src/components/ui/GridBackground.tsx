import { memo } from "react"

/**
 * 动态网格背景 — 竹林司马 P0 科技感背景
 * 特征：
 * - 极低对比度网格线，不喧宾夺主
 * - 左上角和右下角有渐变光晕，随涨跌氛围变化
 * - 可选微粒漂浮效果
 */
export const GridBackground = memo(function GridBackground({
  variant = "default",
}: {
  /** default: 静态网格 | ambient: 带漂浮微粒 */
  variant?: "default" | "ambient"
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* 底层网格 */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-white"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* 左上角氛围光晕 */}
      <div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
          animation: "float-slow 8s ease-in-out infinite",
        }}
      />

      {/* 右下角氛围光晕 */}
      <div
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
          animation: "float-slow 10s ease-in-out infinite reverse",
        }}
      />

      {/* 中间微光 */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.04]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.8) 0%, transparent 70%)",
        }}
      />

      {/* 漂浮微粒 (ambient 模式) */}
      {variant === "ambient" && <FloatingParticles />}

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(12px, -8px) scale(1.05); }
          66% { transform: translate(-8px, 10px) scale(0.97); }
        }
      `}</style>
    </div>
  )
})

/** 漂浮微粒 — ambient 变体专用 */
function FloatingParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 12 + 8,
    delay: Math.random() * -20,
  }))

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white opacity-[0.15]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animation: `particle-float ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes particle-float {
          0% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-80px) translateX(20px); opacity: 0; }
        }
      `}</style>
    </>
  )
}

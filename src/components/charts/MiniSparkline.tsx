import { memo, useMemo, useState } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import type { CandlestickData } from "@/types"

interface MiniSparklineProps {
  data: CandlestickData[]
  isRise: boolean
  height?: number
}

export const MiniSparkline = memo(function MiniSparkline({
  data,
  isRise,
  height = 36,
}: MiniSparklineProps) {
  const chartData = useMemo(
    () =>
      data.slice(-30).map((d) => ({
        time: typeof d.time === "number" ? d.time * 1000 : d.time,
        value: d.close,
      })),
    [data]
  )

  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (chartData.length < 2) return null

  const color = isRise ? "#ef4444" : "#22c55e"
  const gradId = `spark-grad-${isRise ? "rise" : "fall"}`

  return (
    <div
      className="relative w-full"
      onMouseLeave={() => setHoverIndex(null)}
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
          onMouseMove={(e) => {
            const idx = (e as { activePayloadIndex?: number }).activePayloadIndex
            if (e && idx != null) setHoverIndex(idx)
          }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            content={() => null}
            wrapperStyle={{ display: "none" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={hoverIndex !== null ? 2 : 1.5}
            fill={`url(#${gradId})`}
            dot={false}
            isAnimationActive={false}
          />
          {/* 十字光标 */}
          {hoverIndex !== null && hoverIndex < chartData.length && (
            <>
              <ReferenceLine
                segment={[
                  { x: chartData[hoverIndex].time, y: "min" as any },
                  { x: chartData[hoverIndex].time, y: "max" as any },
                ]}
                stroke={color}
                strokeOpacity={0.35}
                strokeDasharray="3 3"
              />
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Hover 浮窗：显示价格 */}
      {hoverIndex !== null && hoverIndex < chartData.length && (
        <div
          className="absolute top-0 pointer-events-none text-[9px] tabular-nums font-medium px-1 py-0.5 rounded"
          style={{
            backgroundColor: `${color}22`,
            color: color,
            left: `${Math.min((hoverIndex / Math.max(chartData.length - 1, 1)) * 100, 70)}%`,
          }}
        >
          {chartData[hoverIndex].value.toFixed(2)}
        </div>
      )}
    </div>
  )
})

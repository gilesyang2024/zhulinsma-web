import { cn } from "@/lib/utils"

/** 基础骨架单元 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

/** 文本骨架（单行/多行） */
export function SkeletonText({
  lines = 1,
  className,
  lastWidth = "60%",
}: {
  lines?: number
  className?: string
  lastWidth?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 && lines > 1 && "w-[60%]")}
          style={{ width: i === lines - 1 && lines === 1 ? lastWidth : "100%" }}
        />
      ))}
    </div>
  )
}

/** 卡片骨架 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
    </div>
  )
}

/** K线图骨架 */
export function SkeletonChart({ height = 320 }: { height?: number }) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
      style={{ minHeight: height }}
    >
      {/* 头部指标 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-24" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-md" />
        ))}
      </div>
      {/* 图表区域 */}
      <div className="flex-1 flex items-end gap-1 px-2">
        {Array.from({ length: 40 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${20 + Math.random() * 70}%` }}
          />
        ))}
      </div>
      {/* 底部指标 */}
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
    </div>
  )
}

/** 技术指标卡骨架 */
export function SkeletonIndicatorCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 space-y-3", className)}>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

/** 预警面板骨架 */
export function SkeletonAlertPanel({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-12 rounded-full ml-auto" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}

/** 搜索框骨架 */
export function SkeletonSearch() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background">
      <Skeleton className="w-4 h-4 rounded" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-5 w-16 rounded-md" />
    </div>
  )
}

/** 股票卡片骨架 */
export function SkeletonStockCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-3 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-3.5 w-14 ml-auto" />
        </div>
      </div>
    </div>
  )
}

/** 详情面板完整骨架（替换 DetailPanelFallback） */
export function DetailPanelSkeleton() {
  return (
    <div className="flex flex-col gap-3 h-full">
      {/* 价格行情卡片 */}
      <SkeletonCard />
      {/* K线图 */}
      <SkeletonChart height={420} />
      {/* 技术指标三卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <SkeletonIndicatorCard />
        <SkeletonIndicatorCard />
        <SkeletonIndicatorCard />
      </div>
    </div>
  )
}

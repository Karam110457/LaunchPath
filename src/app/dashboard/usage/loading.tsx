import { TopNav } from "@/components/layout/TopNav";
import { GlobalBackground } from "@/components/layout/GlobalBackground";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsageLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col antialiased relative overflow-hidden">
      <GlobalBackground />

      <div className="relative z-10 flex flex-col flex-1 h-full">
        <TopNav />
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Header row */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-2">
              <Skeleton className="h-12 w-80" />
              <Skeleton className="h-5 w-64" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-36 rounded-2xl" />
              <Skeleton className="h-[76px] w-52 rounded-3xl" />
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-border/40" />

          {/* Stats row (4 cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[108px] rounded-2xl" />
            ))}
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-border/40" />

          {/* Chart section header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-10 w-40 rounded-full" />
          </div>

          {/* Chart placeholder */}
          <Skeleton className="h-[280px] w-full rounded-2xl" />

          {/* Divider */}
          <div className="w-full h-px bg-border/40" />

          {/* Agent cards grid */}
          <div className="space-y-4">
            <Skeleton className="h-7 w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[160px] rounded-[32px]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

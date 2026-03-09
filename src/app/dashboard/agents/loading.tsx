import { TopNav } from "@/components/layout/TopNav";
import { GlobalBackground } from "@/components/layout/GlobalBackground";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentsLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col antialiased relative overflow-hidden">
      <GlobalBackground />

      <div className="relative z-10 flex flex-col flex-1 h-full">
        <TopNav />
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Greeting */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-5 w-48" />
          </div>

          {/* Stats row */}
          <div className="flex gap-4">
            <Skeleton className="h-20 w-36 rounded-2xl" />
            <Skeleton className="h-20 w-36 rounded-2xl" />
            <Skeleton className="h-20 w-36 rounded-2xl" />
          </div>

          {/* Search + filter bar */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 flex-1 max-w-sm rounded-xl" />
            <Skeleton className="h-10 w-64 rounded-full" />
            <Skeleton className="ml-auto h-10 w-36 rounded-full" />
          </div>

          {/* Agent cards grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[220px] rounded-[32px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

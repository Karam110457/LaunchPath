import { Skeleton } from "@/components/ui/skeleton";

export default function AgentBuilderLoading() {
  return (
    <div className="fixed inset-0 z-[100] w-full h-full overflow-hidden bg-[#eef0f2] dark:bg-[#050505] transition-colors duration-300">
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* Left catalog panel placeholder */}
      <div className="absolute left-4 top-16 bottom-16 w-72 z-10">
        <div className="h-full rounded-2xl border border-black/5 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Center canvas area — agent node placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton className="h-48 w-64 rounded-3xl" />
      </div>

      {/* Bottom toolbar placeholder */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <Skeleton className="h-11 w-64 rounded-full" />
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function ClientDetailLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-lg" />
        ))}
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-40" />
      </div>

      {/* Recent conversations */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-44" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

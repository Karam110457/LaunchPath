import { Skeleton } from "@/components/ui/skeleton";

export default function PortalConversationDetailLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      {/* Transcript */}
      <Skeleton className="h-[500px] rounded-2xl" />

      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

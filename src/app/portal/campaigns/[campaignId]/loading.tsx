import { Skeleton } from "@/components/ui/skeleton";

export default function PortalCampaignDetailLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-20 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-[88px] rounded-2xl" />
        <Skeleton className="h-[88px] rounded-2xl" />
        <Skeleton className="h-[88px] rounded-2xl" />
      </div>

      <Skeleton className="h-10 w-44 rounded-full" />
    </div>
  );
}

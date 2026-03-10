import { Skeleton } from "@/components/ui/skeleton";

export default function PortalCampaignsLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-10 w-40 rounded-full" />
      </div>

      {/* Campaign cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[160px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

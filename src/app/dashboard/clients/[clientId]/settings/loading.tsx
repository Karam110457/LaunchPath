import { Skeleton } from "@/components/ui/skeleton";

export default function ClientSettingsLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Client info card */}
      <Skeleton className="h-[320px] rounded-lg" />

      {/* Team members card */}
      <Skeleton className="h-[200px] rounded-lg" />

      {/* Danger zone */}
      <Skeleton className="h-[72px] rounded-lg" />
    </div>
  );
}

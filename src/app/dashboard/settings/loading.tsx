import { TopNav } from "@/components/layout/TopNav";
import { GlobalBackground } from "@/components/layout/GlobalBackground";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col antialiased relative overflow-hidden">
      <GlobalBackground />

      <div className="relative z-10 flex flex-col flex-1 h-full">
        <TopNav />
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-5 w-72" />
          </div>

          <div className="w-full h-px bg-border/40" />

          {/* Settings cards */}
          <div className="grid gap-6 max-w-4xl">
            <Skeleton className="h-[180px] rounded-[32px]" />
            <Skeleton className="h-[280px] rounded-[32px]" />
            <Skeleton className="h-[140px] rounded-[32px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

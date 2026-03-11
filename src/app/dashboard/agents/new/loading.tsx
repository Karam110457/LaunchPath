import { TopNav } from "@/components/layout/TopNav";
import { GlobalBackground } from "@/components/layout/GlobalBackground";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewAgentLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col antialiased relative overflow-hidden">
      <GlobalBackground />

      <div className="relative z-10 flex flex-col flex-1 h-full">
        <TopNav />
        <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
            {/* Hero text */}
            <div className="text-center mb-10 mt-8 space-y-3">
              <Skeleton className="h-12 w-80 mx-auto rounded-xl" />
              <Skeleton className="h-5 w-64 mx-auto" />
            </div>

            {/* Chat input */}
            <div className="w-full max-w-2xl">
              <Skeleton className="h-[88px] w-full rounded-2xl" />
            </div>

            {/* Template chips */}
            <div className="flex items-center justify-center gap-2 mt-5">
              <Skeleton className="h-10 w-44 rounded-full" />
              <Skeleton className="h-10 w-44 rounded-full" />
              <Skeleton className="h-10 w-36 rounded-full" />
            </div>

            {/* Start from scratch */}
            <Skeleton className="h-4 w-32 mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

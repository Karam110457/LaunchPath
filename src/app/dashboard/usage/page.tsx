import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/layout/TopNav";
import { GlobalBackground } from "@/components/layout/GlobalBackground";
import { UsageDashboard } from "@/components/usage/UsageDashboard";
import { getUsageData } from "@/lib/dashboard/usage-data";

export default async function UsagePage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const userName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "there";

  const initialData = await getUsageData(supabase, user.id, "30d");

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased relative overflow-hidden">
      <GlobalBackground />

      <div className="relative z-10 flex flex-col flex-1 h-full">
        <TopNav />
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
          <UsageDashboard userName={userName} initialData={initialData} />
        </div>
      </div>
    </div>
  );
}

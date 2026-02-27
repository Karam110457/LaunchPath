import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { getTargetCurrencySymbol } from "@/lib/utils/currency";
import { SystemCard } from "@/components/dashboard/SystemCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/ActivityFeed";
import { CreateSystemButton } from "@/components/dashboard/CreateSystemButton";

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: systems }, { data: userProfile }] = await Promise.all([
    supabase
      .from("user_systems")
      .select(
        "id, status, intent, offer, demo_url, created_at, updated_at, current_step, location_target, chosen_recommendation"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_profiles")
      .select("location_country")
      .eq("id", user.id)
      .single(),
  ]);

  const homeCountry = userProfile?.location_country ?? null;
  const hasSystems = systems && systems.length > 0;

  // Fetch submission counts per system for lead counts + activity feed
  let submissionCounts: Record<string, number> = {};
  let recentSubmissions: Array<{
    system_id: string;
    created_at: string;
    result: { priority?: string } | null;
  }> = [];

  if (hasSystems) {
    const systemIds = systems.map((s) => s.id);

    const [{ data: allSubmissions }, { data: recent }] = await Promise.all([
      supabase
        .from("demo_submissions")
        .select("system_id")
        .in("system_id", systemIds),
      supabase
        .from("demo_submissions")
        .select("system_id, created_at, result")
        .in("system_id", systemIds)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (allSubmissions) {
      submissionCounts = allSubmissions.reduce<Record<string, number>>(
        (acc, row) => {
          acc[row.system_id] = (acc[row.system_id] ?? 0) + 1;
          return acc;
        },
        {}
      );
    }

    recentSubmissions = (recent ?? []) as typeof recentSubmissions;
  }

  // Compute aggregate stats
  const liveBusinesses = (systems ?? []).filter(
    (s) => s.status === "complete"
  ).length;
  const totalLeads = Object.values(submissionCounts).reduce(
    (sum, n) => sum + n,
    0
  );

  // Build a name lookup for activity feed
  const nameMap: Record<string, string> = {};
  (systems ?? []).forEach((s) => {
    const offer = s.offer as { system_description?: string } | null;
    const rec = s.chosen_recommendation as { niche?: string } | null;
    nameMap[s.id] =
      offer?.system_description ?? rec?.niche ?? "Untitled Business";
  });

  // Compute projected monthly revenue from live businesses
  let projectedRevenue = 0;
  const defaultCurrency = getTargetCurrencySymbol(homeCountry, null);
  (systems ?? []).forEach((s) => {
    if (s.status === "complete") {
      const offer = s.offer as { pricing_monthly?: number } | null;
      if (offer?.pricing_monthly) {
        projectedRevenue += offer.pricing_monthly;
      }
    }
  });

  // Build activity items: leads + business events
  const activityItems: ActivityItem[] = [];

  // Recent lead submissions
  recentSubmissions.forEach((sub) => {
    activityItems.push({
      type: "new_lead",
      systemName: nameMap[sub.system_id] ?? "Unknown",
      priority: (sub.result as { priority?: string } | null)?.priority,
      timestamp: new Date(sub.created_at),
    });
  });

  // Business creation/completion events
  (systems ?? []).forEach((s) => {
    const name = nameMap[s.id] ?? "Untitled";
    if (s.status === "complete" && s.updated_at) {
      activityItems.push({
        type: "system_completed",
        systemName: name,
        timestamp: new Date(s.updated_at as string),
      });
    }
    activityItems.push({
      type: "system_created",
      systemName: name,
      timestamp: new Date(s.created_at),
    });
  });

  // Sort by timestamp descending, limit to 10
  activityItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const topActivity = activityItems.slice(0, 10);

  return (
    <PageShell
      title="Home"
      description="Your businesses at a glance."
      action={<CreateSystemButton />}
    >
      {hasSystems ? (
        <>
          {/* Aggregate stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Live" value={liveBusinesses} />
            <StatCard label="Leads" value={totalLeads} />
            <StatCard
              label="Revenue"
              value={
                projectedRevenue > 0
                  ? `${defaultCurrency}${projectedRevenue.toLocaleString()}/mo`
                  : "\u2014"
              }
            />
          </div>

          {/* Businesses grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {systems.map((system) => (
              <SystemCard
                key={system.id}
                id={system.id}
                status={system.status ?? "in_progress"}
                currentStep={system.current_step ?? 1}
                offer={
                  system.offer as {
                    system_description?: string;
                    segment?: string;
                    pricing_monthly?: number;
                  } | null
                }
                chosenRecommendation={
                  system.chosen_recommendation as { niche?: string } | null
                }
                currencySymbol={getTargetCurrencySymbol(
                  homeCountry,
                  system.location_target
                )}
                leadsCount={submissionCounts[system.id] ?? 0}
              />
            ))}
          </div>

          {/* Recent activity */}
          <ActivityFeed items={topActivity} />
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              Launch your first business
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              We&apos;ll help you find a niche, craft an irresistible offer, and
              build a demo page that qualifies leads for you.
            </p>
            <CreateSystemButton />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

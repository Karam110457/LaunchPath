import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus, ArrowRight, Rocket } from "lucide-react";
import { getTargetCurrencySymbol } from "@/lib/utils/currency";
import { SystemCard } from "@/components/dashboard/SystemCard";

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: systems }, { data: userProfile }] = await Promise.all([
    supabase
      .from("user_systems")
      .select("id, status, intent, offer, demo_url, created_at, current_step, location_target, chosen_recommendation")
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

  return (
    <PageShell
      title="Overview"
      description="Your systems and progress."
      action={
        <Button asChild>
          <Link href="/start">
            <Plus className="h-4 w-4 mr-2" />
            New System
          </Link>
        </Button>
      }
    >
      {hasSystems ? (
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
                system.location_target,
              )}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No systems yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Start your first business system. We&apos;ll guide you from niche
              discovery to a working demo page and ready-to-send prospect
              messages.
            </p>
            <Button asChild>
              <Link href="/start">
                Start Your First Business
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

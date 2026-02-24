import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DemoCard } from "@/components/dashboard/DemoCard";
import Link from "next/link";
import { Plus, ArrowRight, Megaphone } from "lucide-react";

interface DemoConfigJson {
  agent_name?: string;
  hero_headline?: string;
  niche_slug?: string;
  theme?: { accent_color?: string };
}

interface OfferJson {
  segment?: string;
  system_description?: string;
}

interface RecommendationJson {
  niche?: string;
}

export default async function DemosPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: systems } = await supabase
    .from("user_systems")
    .select("id, demo_url, demo_config, offer, chosen_recommendation, created_at")
    .eq("user_id", user.id)
    .not("demo_config", "is", null)
    .order("created_at", { ascending: false });

  const hasDemos = systems && systems.length > 0;

  // Fetch submission counts for all systems with demos
  let submissionCounts: Record<string, number> = {};
  if (hasDemos) {
    const systemIds = systems.map((s) => s.id);
    const { data: submissions } = await supabase
      .from("demo_submissions")
      .select("system_id")
      .in("system_id", systemIds);

    if (submissions) {
      submissionCounts = submissions.reduce<Record<string, number>>(
        (acc, row) => {
          acc[row.system_id] = (acc[row.system_id] ?? 0) + 1;
          return acc;
        },
        {}
      );
    }
  }

  return (
    <PageShell
      title="Demos"
      description="Your live demo pages and lead activity."
      action={
        <Button asChild>
          <Link href="/start">
            <Plus className="h-4 w-4 mr-2" />
            New System
          </Link>
        </Button>
      }
    >
      {hasDemos ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {systems.map((system) => {
            const config = system.demo_config as DemoConfigJson | null;
            const offer = system.offer as OfferJson | null;
            const rec = system.chosen_recommendation as RecommendationJson | null;

            return (
              <DemoCard
                key={system.id}
                systemId={system.id}
                agentName={config?.agent_name ?? "Demo Page"}
                heroHeadline={config?.hero_headline ?? offer?.system_description ?? ""}
                niche={rec?.niche ?? ""}
                segment={offer?.segment ?? ""}
                demoUrl={system.demo_url ?? `/demo/${system.id}`}
                accentColor={config?.theme?.accent_color}
                leadsCount={submissionCounts[system.id] ?? 0}
                createdAt={system.created_at}
              />
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No demos yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Complete your first system setup to generate a demo page.
              Each system creates a live landing page you can share with prospects.
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

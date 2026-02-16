import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, ArrowRight, Rocket } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: systems } = await supabase
    .from("user_systems")
    .select("id, status, intent, offer, demo_url, created_at, current_step")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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
          {systems.map((system) => {
            const offer = system.offer as {
              segment?: string;
              system_description?: string;
              pricing_monthly?: number;
            } | null;

            return (
              <Card key={system.id} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={
                        system.status === "complete"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      }
                    >
                      {system.status === "complete"
                        ? "Live"
                        : `Step ${system.current_step}/10`}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-lg">
                    {offer?.system_description ?? "System in progress"}
                  </CardTitle>
                  <CardDescription>
                    {offer?.segment ?? "Setting up..."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {offer?.pricing_monthly && (
                      <span className="text-sm font-mono text-muted-foreground">
                        £{offer.pricing_monthly}/mo
                      </span>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={
                          system.status === "in_progress"
                            ? `/start/${system.id}`
                            : `/dashboard`
                        }
                      >
                        {system.status === "in_progress" ? "Continue" : "View"}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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

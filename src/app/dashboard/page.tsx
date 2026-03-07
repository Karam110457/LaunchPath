import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { CreateSystemButton } from "@/components/dashboard/CreateSystemButton";
import { PageShell } from "@/components/layout/PageShell";

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: systems } = await supabase
    .from("user_systems")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  // If user has at least one business, go straight to it
  if (systems && systems.length > 0) {
    redirect(`/dashboard/systems/${systems[0].id}`);
  }

  // No businesses — show empty state
  return (
    <PageShell title="Welcome" description="">
      <Card className="border-dashed border-2 border-border/50 bg-card/50 shadow-none">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Launch your first business
          </h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm">
            We&apos;ll help you find a niche, craft an irresistible offer, and
            build a demo page that qualifies leads for you.
          </p>
          <CreateSystemButton />
        </CardContent>
      </Card>
    </PageShell>
  );
}

import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { CampaignsList } from "@/components/campaigns/CampaignsList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone } from "lucide-react";

export default async function CampaignsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, client_name, client_website, status, agent_id, created_at, ai_agents(name, personality)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const hasCampaigns = campaigns && campaigns.length > 0;

  return (
    <PageShell
      title="Campaigns"
      description="Deploy AI agents to client websites."
      action={
        hasCampaigns ? (
          <Button asChild>
            <Link href="/dashboard/campaigns/new">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Link>
          </Button>
        ) : undefined
      }
    >
      {hasCampaigns ? (
        <CampaignsList campaigns={campaigns} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Megaphone className="size-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-1">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Create a campaign to deploy your AI agent as a chat widget on a
            client&apos;s website.
          </p>
          <Button asChild>
            <Link href="/dashboard/campaigns/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Link>
          </Button>
        </div>
      )}
    </PageShell>
  );
}

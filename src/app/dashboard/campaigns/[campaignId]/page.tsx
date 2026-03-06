import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CampaignBuilder } from "@/components/campaigns/CampaignBuilder";

interface PageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function CampaignBuilderPage({ params }: PageProps) {
  const { campaignId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, ai_agents(id, name, personality)")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!campaign) notFound();

  const { data: channels } = await supabase
    .from("agent_channels")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id);

  return (
    <CampaignBuilder
      campaign={campaign}
      channels={(channels ?? []) as import("@/lib/channels/types").ChannelResponse[]}
    />
  );
}

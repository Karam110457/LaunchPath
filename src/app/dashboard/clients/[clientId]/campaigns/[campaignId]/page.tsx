import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CampaignBuilder } from "@/components/campaigns/CampaignBuilder";

export default async function ClientCampaignBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; campaignId: string }>;
  searchParams: Promise<{ channel?: string }>;
}) {
  const { clientId, campaignId } = await params;
  const { channel: channelParam } = await searchParams;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, ai_agents(id, name, personality), clients(id, name, website, logo_url)")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .eq("client_id", clientId)
    .single();

  if (!campaign) notFound();

  // Fetch channels for this campaign
  const { data: channels } = await supabase
    .from("agent_channels")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id);

  const initialChannelType =
    channelParam === "whatsapp" ? "whatsapp" : undefined;

  return (
    <CampaignBuilder
      campaign={campaign}
      channels={channels ?? []}
      backUrl={`/dashboard/clients/${clientId}/campaigns`}
      initialChannelType={initialChannelType}
    />
  );
}

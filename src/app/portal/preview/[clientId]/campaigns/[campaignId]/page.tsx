import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PortalCampaignDetail } from "@/components/portal/PortalCampaignDetail";

export default async function PreviewCampaignDetail({
  params,
}: {
  params: Promise<{ clientId: string; campaignId: string }>;
}) {
  const { clientId, campaignId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();
  if (!client) notFound();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, ai_agents(id, name)")
    .eq("id", campaignId)
    .eq("client_id", clientId)
    .single();

  if (!campaign) notFound();

  const { data: channels } = await supabase
    .from("agent_channels")
    .select("id, name, channel_type, config, is_enabled, token, allowed_origins")
    .eq("campaign_id", campaignId);

  const channelIds = channels?.map((ch) => ch.id) ?? [];
  let convCount = 0;
  if (channelIds.length > 0) {
    const { count } = await supabase
      .from("channel_conversations")
      .select("id", { count: "exact", head: true })
      .in("channel_id", channelIds);
    convCount = count ?? 0;
  }

  const agent = campaign.ai_agents as { id: string; name: string } | null;
  const widgetChannel = channels?.find((ch) => ch.channel_type === "widget") ?? null;
  const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "";

  return (
    <PortalCampaignDetail
      campaign={{
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        agent_name: agent?.name ?? null,
      }}
      widgetChannel={widgetChannel ? {
        id: widgetChannel.id,
        is_enabled: widgetChannel.is_enabled,
        config: (widgetChannel.config ?? {}) as Record<string, unknown>,
        allowed_origins: (widgetChannel.allowed_origins ?? []) as string[],
      } : null}
      conversationCount={convCount}
      appOrigin={appOrigin}
      role="admin"
    />
  );
}

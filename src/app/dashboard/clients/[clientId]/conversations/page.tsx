import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ConversationList } from "@/components/conversations/ConversationList";

export default async function ClientConversationsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  // Get campaigns → channels → conversations
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("client_id", clientId)
    .eq("user_id", user.id);

  const campaignIds = campaigns?.map((c) => c.id) ?? [];
  const campaignMap = new Map(campaigns?.map((c) => [c.id, c.name]) ?? []);

  const { data: channels } = campaignIds.length > 0
    ? await supabase
        .from("agent_channels")
        .select("id, campaign_id")
        .in("campaign_id", campaignIds)
    : { data: [] };

  const channelIds = channels?.map((ch) => ch.id) ?? [];
  const channelCampaignMap = new Map(
    channels?.map((ch) => [ch.id, ch.campaign_id]) ?? []
  );

  const { data: conversations } = channelIds.length > 0
    ? await supabase
        .from("channel_conversations")
        .select("id, channel_id, session_id, messages, metadata, updated_at")
        .in("channel_id", channelIds)
        .order("updated_at", { ascending: false })
        .limit(50)
    : { data: [] };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h2 className="text-lg font-semibold">Conversations</h2>
      <ConversationList
        conversations={conversations ?? []}
        basePath={`/dashboard/clients/${clientId}/conversations`}
        campaignMap={campaignMap}
        channelCampaignMap={channelCampaignMap}
        emptyMessage="No conversations yet. They will appear here once visitors interact with your agents."
      />
    </div>
  );
}

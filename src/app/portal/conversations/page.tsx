import { requireClientAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function PortalConversations() {
  const { clientId } = await requireClientAuth();
  const supabase = await createClient();

  // Get campaigns → channels → conversations
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("client_id", clientId);

  const campaignIds = campaigns?.map((c) => c.id) ?? [];
  const campaignMap = new Map(campaigns?.map((c) => [c.id, c.name]) ?? []);

  const { data: channels } = campaignIds.length > 0
    ? await supabase
        .from("agent_channels")
        .select("id, campaign_id, name")
        .in("campaign_id", campaignIds)
    : { data: [] };

  const channelIds = channels?.map((ch) => ch.id) ?? [];
  const channelCampaignMap = new Map(
    channels?.map((ch) => [ch.id, ch.campaign_id]) ?? []
  );

  const { data: conversations } = channelIds.length > 0
    ? await supabase
        .from("channel_conversations")
        .select("id, channel_id, session_id, messages, metadata, created_at, updated_at")
        .in("channel_id", channelIds)
        .order("updated_at", { ascending: false })
        .limit(50)
    : { data: [] };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>

      {!conversations || conversations.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No conversations yet. They will appear here once visitors interact with your agents.
        </div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {conversations.map((conv) => {
            const messages = conv.messages as Array<{ role: string; content: string }>;
            const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
            const campaignId = channelCampaignMap.get(conv.channel_id);
            const campaignName = campaignId ? campaignMap.get(campaignId) : null;
            const metadata = conv.metadata as Record<string, unknown> | null;
            const pageUrl = metadata?.page_url as string | undefined;

            return (
              <Link
                key={conv.id}
                href={`/portal/conversations/${conv.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {conv.session_id.slice(0, 8)}...
                    </p>
                    {campaignName && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {campaignName}
                      </span>
                    )}
                  </div>
                  {lastUserMsg && (
                    <p className="text-xs text-muted-foreground truncate max-w-md">
                      {lastUserMsg.content}
                    </p>
                  )}
                  {pageUrl && (
                    <p className="text-xs text-muted-foreground/60 truncate">
                      {pageUrl}
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

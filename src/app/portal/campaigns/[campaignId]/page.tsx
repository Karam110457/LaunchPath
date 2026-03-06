import { requireClientAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function PortalCampaignDetail({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const { clientId } = await requireClientAuth();
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, ai_agents(name, personality)")
    .eq("id", campaignId)
    .eq("client_id", clientId)
    .single();

  if (!campaign) notFound();

  const agent = campaign.ai_agents as {
    name: string;
    personality: Record<string, unknown> | null;
  } | null;

  // Get channels for this campaign
  const { data: channels } = await supabase
    .from("agent_channels")
    .select("id, name, channel_type, config, is_enabled")
    .eq("campaign_id", campaignId);

  // Conversation count
  const channelIds = channels?.map((ch) => ch.id) ?? [];
  let conversationCount = 0;
  if (channelIds.length > 0) {
    const { count } = await supabase
      .from("channel_conversations")
      .select("id", { count: "exact", head: true })
      .in("channel_id", channelIds);
    conversationCount = count ?? 0;
  }

  // Build embed code for widget channels
  const widgetChannel = channels?.find((ch) => ch.channel_type === "widget" && ch.is_enabled);
  const widgetConfig = widgetChannel?.config as Record<string, unknown> | null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/portal/campaigns"
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">
            {agent?.name && `Agent: ${agent.name}`}
          </p>
        </div>
        <span
          className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
            campaign.status === "active"
              ? "bg-emerald-500/10 text-emerald-600"
              : campaign.status === "paused"
                ? "bg-yellow-500/10 text-yellow-600"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {campaign.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Channels</p>
          <p className="text-2xl font-bold">{channels?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Conversations</p>
          <p className="text-2xl font-bold">{conversationCount}</p>
        </div>
      </div>

      {/* Widget embed code */}
      {widgetChannel && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Widget Embed Code</h2>
          <p className="text-xs text-muted-foreground">
            Add this code to your website before the closing &lt;/body&gt; tag.
          </p>
          <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto">
            {`<script src="${process.env.NEXT_PUBLIC_APP_ORIGIN}/widget.js" data-channel-id="${widgetChannel.id}"></script>`}
          </pre>
        </div>
      )}

      {/* Widget config preview */}
      {widgetConfig && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Widget Settings</h2>
          <div className="rounded-lg border bg-card p-4 space-y-2 text-sm">
            {!!widgetConfig.welcome_message && (
              <p>
                <span className="text-muted-foreground">Welcome: </span>
                {String(widgetConfig.welcome_message)}
              </p>
            )}
            {!!widgetConfig.primary_color && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Color: </span>
                <span
                  className="size-4 rounded-full border"
                  style={{ backgroundColor: String(widgetConfig.primary_color) }}
                />
                <span>{String(widgetConfig.primary_color)}</span>
              </div>
            )}
            {!!widgetConfig.position && (
              <p>
                <span className="text-muted-foreground">Position: </span>
                {String(widgetConfig.position)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

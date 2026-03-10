import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PortalConversationView } from "@/components/portal/PortalConversationView";

export default async function PreviewConversationDetail({
  params,
}: {
  params: Promise<{ clientId: string; conversationId: string }>;
}) {
  const { clientId, conversationId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();
  if (!client) notFound();

  const basePath = `/portal/preview/${clientId}`;

  const { data: conversation } = await supabase
    .from("channel_conversations")
    .select("*, agent_channels(name, campaign_id, campaigns(name))")
    .eq("id", conversationId)
    .single();

  if (!conversation) notFound();

  // Verify this conversation belongs to the client's campaigns
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("client_id", clientId);

  const campaignIds = new Set(campaigns?.map((c) => c.id) ?? []);
  const channel = conversation.agent_channels as unknown as {
    name: string;
    campaign_id: string | null;
    campaigns: { name: string } | null;
  } | null;

  if (!channel?.campaign_id || !campaignIds.has(channel.campaign_id)) {
    notFound();
  }

  const metadata = conversation.metadata as Record<string, unknown> | null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`${basePath}/conversations`}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Conversation</h1>
          <p className="text-sm text-muted-foreground">
            {channel?.campaigns?.name} &middot; Session {conversation.session_id.slice(0, 8)}
          </p>
        </div>
      </div>

      {metadata?.page_url ? (
        <p className="text-xs text-muted-foreground">
          Page: {String(metadata.page_url)}
        </p>
      ) : null}

      <PortalConversationView conversationId={conversationId} />
    </div>
  );
}

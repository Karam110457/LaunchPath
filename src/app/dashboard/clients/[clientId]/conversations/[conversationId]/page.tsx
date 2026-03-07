import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ConversationTranscript } from "@/components/conversations/ConversationTranscript";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ClientConversationDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; conversationId: string }>;
}) {
  const { clientId, conversationId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  // Fetch conversation with channel + campaign info
  const { data: conversation } = await supabase
    .from("channel_conversations")
    .select("*, agent_channels(name, campaign_id, campaigns(name))")
    .eq("id", conversationId)
    .single();

  if (!conversation) notFound();

  // Verify this conversation belongs to this client's campaigns
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("client_id", clientId)
    .eq("user_id", user.id);

  const campaignIds = new Set(campaigns?.map((c) => c.id) ?? []);
  const channel = conversation.agent_channels as unknown as {
    name: string;
    campaign_id: string | null;
    campaigns: { name: string } | null;
  } | null;

  if (!channel?.campaign_id || !campaignIds.has(channel.campaign_id)) {
    notFound();
  }

  const messages = conversation.messages as Array<{
    role: string;
    content: string;
  }>;
  const metadata = conversation.metadata as Record<string, unknown> | null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/clients/${clientId}/conversations`}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold">Conversation</h1>
          <p className="text-sm text-muted-foreground">
            {channel?.campaigns?.name} · Session {conversation.session_id.slice(0, 8)}
          </p>
        </div>
      </div>

      <ConversationTranscript
        messages={messages}
        metadata={metadata}
        createdAt={conversation.created_at}
      />
    </div>
  );
}

import Link from "next/link";

interface ConversationItem {
  id: string;
  session_id: string;
  messages: unknown;
  metadata: unknown;
  updated_at: string;
  channel_id: string;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  basePath: string;
  campaignMap?: Map<string, string>;
  channelCampaignMap?: Map<string, string | null>;
  emptyMessage?: string;
}

export function ConversationList({
  conversations,
  basePath,
  campaignMap,
  channelCampaignMap,
  emptyMessage = "No conversations yet.",
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card divide-y">
      {conversations.map((conv) => {
        const messages = conv.messages as Array<{ role: string; content: string }>;
        const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
        const campaignId = channelCampaignMap?.get(conv.channel_id);
        const campaignName = campaignId ? campaignMap?.get(campaignId) : null;
        const metadata = conv.metadata as Record<string, unknown> | null;
        const pageUrl = metadata?.page_url as string | undefined;

        return (
          <Link
            key={conv.id}
            href={`${basePath}/${conv.id}`}
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
  );
}

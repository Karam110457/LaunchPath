"use client";

import { useConversationRealtime } from "@/hooks/useConversationRealtime";
import { ConversationControls } from "./ConversationControls";
import { LiveTranscript } from "./LiveTranscript";

interface PortalConversationViewProps {
  conversationId: string;
}

export function PortalConversationView({ conversationId }: PortalConversationViewProps) {
  const { messages, status, isLoading, refresh } = useConversationRealtime(conversationId);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-12 text-center text-muted-foreground">
        Loading conversation...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ConversationControls
        conversationId={conversationId}
        status={status}
        onStatusChange={() => refresh()}
      />

      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm min-h-[400px] max-h-[600px] flex flex-col overflow-hidden">
        <LiveTranscript
          conversationId={conversationId}
          messages={messages}
          status={status}
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{messages.length} message{messages.length !== 1 ? "s" : ""}</span>
        <span>Status: {status}</span>
      </div>
    </div>
  );
}

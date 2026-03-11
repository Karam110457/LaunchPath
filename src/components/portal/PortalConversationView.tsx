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
      <div className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-12 text-center text-muted-foreground">
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

      <div className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 min-h-[400px] max-h-[600px] flex flex-col overflow-hidden">
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

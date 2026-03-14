"use client";

import { useEffect, useRef, useState } from "react";
import { usePortalCan } from "@/contexts/PortalContext";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: string;
  content: string;
  timestamp?: string;
  sent_by?: string;
  sent_by_name?: string;
}

interface LiveTranscriptProps {
  conversationId: string;
  messages: Message[];
  status: string;
  /** Conversation metadata — contains message_statuses for WhatsApp delivery ticks */
  metadata?: Record<string, unknown>;
  /** Channel type — delivery ticks only shown for whatsapp */
  channelType?: string;
}

function DeliveryTicks({ messageStatuses, outboundIds, messageIndex }: {
  messageStatuses: Record<string, string>;
  outboundIds: string[];
  messageIndex: number;
}) {
  // Map assistant message index (0-based among assistant messages) to outbound ID
  const msgId = outboundIds[messageIndex];
  if (!msgId) return null;

  const status = messageStatuses[msgId];
  if (!status) return null;

  if (status === "read") {
    return <span className="text-[10px] text-blue-500 ml-1" title="Read">&#10003;&#10003;</span>;
  }
  if (status === "delivered") {
    return <span className="text-[10px] text-muted-foreground ml-1" title="Delivered">&#10003;&#10003;</span>;
  }
  if (status === "sent") {
    return <span className="text-[10px] text-muted-foreground ml-1" title="Sent">&#10003;</span>;
  }
  if (status === "failed") {
    return <span className="text-[10px] text-red-500 ml-1" title="Failed">!</span>;
  }
  return null;
}

export function LiveTranscript({ conversationId, messages, status, metadata, channelType }: LiveTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const canSendMessage = usePortalCan("conversation.send_message");
  const showInput = status === "human_takeover" && canSendMessage;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isSending) return;
    setIsSending(true);
    try {
      await fetch(`/api/portal/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });
      setInput("");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet
          </p>
        )}
        {(() => {
          const isWhatsApp = channelType === "whatsapp";
          const messageStatuses = (metadata?.message_statuses ?? {}) as Record<string, string>;
          const outboundIds = (metadata?.outbound_message_ids ?? []) as string[];
          let assistantIdx = 0;

          return messages
            .filter((m) => ["user", "assistant", "human_agent"].includes(m.role))
            .map((msg, i) => {
              const currentAssistantIdx = msg.role === "assistant" ? assistantIdx++ : -1;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-primary text-primary-foreground text-sm">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : msg.role === "human_agent" ? (
                    <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm bg-blue-500/10 text-foreground border border-blue-500/20">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-600 dark:text-blue-400 mb-1">
                        {msg.sent_by_name ?? "Team"}
                      </span>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[75%] text-sm text-foreground leading-relaxed py-1">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {isWhatsApp && (
                        <DeliveryTicks
                          messageStatuses={messageStatuses}
                          outboundIds={outboundIds}
                          messageIndex={currentAssistantIdx}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            });
        })()}
      </div>

      {showInput && (
        <div className="border-t border-border/30 p-4">
          <div className="flex items-end gap-3 rounded-2xl px-4 py-3 border border-border/60 bg-card/80 backdrop-blur-md shadow-xl shadow-black/30 transition-all duration-200 focus-within:border-primary/50 focus-within:shadow-primary/5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message as a team member..."
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/60"
              disabled={isSending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className={cn(
                "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200",
                input.trim() && !isSending
                  ? "gradient-accent-bg text-white hover:opacity-90 shadow-sm shadow-[#FF8C00]/20"
                  : "bg-muted/60 text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground/40 text-center mt-2">
            Enter to send &middot; Messages appear to the end user as agent responses
          </p>
        </div>
      )}
    </div>
  );
}

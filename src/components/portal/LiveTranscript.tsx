"use client";

import { useEffect, useRef, useState } from "react";
import { usePortalCan } from "@/contexts/PortalContext";
import { Send } from "lucide-react";

interface Message {
  role: string;
  content: string;
  timestamp?: string;
}

interface LiveTranscriptProps {
  conversationId: string;
  messages: Message[];
  status: string;
}

export function LiveTranscript({ conversationId, messages, status }: LiveTranscriptProps) {
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet
          </p>
        )}
        {messages
          .filter((m) => ["user", "assistant", "human_agent"].includes(m.role))
          .map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                    : msg.role === "human_agent"
                    ? "bg-blue-500/10 text-foreground border border-blue-500/20"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.role === "human_agent" && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-600 mb-1">
                    Team
                  </span>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
      </div>

      {showInput && (
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message as a team member..."
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              disabled={isSending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Messages sent here appear to the end user as agent responses.
          </p>
        </div>
      )}
    </div>
  );
}

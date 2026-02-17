"use client";

/**
 * ChatContainer — the outer shell of the chat interface.
 *
 * Layout:
 * - Minimal header (logo + Start Over button)
 * - Scrollable message list (auto-scrolls to bottom)
 * - Typing indicator (when agent is thinking)
 * - Pinned InputBar at bottom
 */

import { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/chat/types";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { InputBar } from "./InputBar";

interface ChatContainerProps {
  messages: ChatMessageType[];
  isStreaming: boolean;
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  onCardComplete: (cardId: string, displayText: string, structuredMessage: string) => void;
  onStartOver: () => void;
}

export function ChatContainer({
  messages,
  isStreaming,
  isTyping,
  onSendMessage,
  onCardComplete,
  onStartOver,
}: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or content streams in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-[100dvh] bg-white">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-white z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">LaunchPath</span>
        </div>
        <button
          onClick={onStartOver}
          disabled={isStreaming}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Start a new business"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Start Over</span>
        </button>
      </header>

      {/* Message list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto py-6 space-y-4"
        aria-label="Conversation"
      >
        {messages.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-zinc-400">Starting your conversation…</p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onCardComplete={onCardComplete}
          />
        ))}

        {isTyping && (
          <div className="px-4">
            <TypingIndicator />
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <InputBar onSend={onSendMessage} disabled={isStreaming} />
    </div>
  );
}

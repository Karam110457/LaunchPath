"use client";

/**
 * ChatContainer — the outer shell of the chat interface.
 *
 * Layout:
 * - Minimal header (title + Start Over button)
 * - Scrollable message list (auto-scrolls to bottom)
 * - Thinking bubble (when agent is reasoning)
 * - Typing indicator (when agent is about to speak)
 * - Floating glassy InputBar pinned at bottom
 */

import { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/chat/types";
import { ChatMessage } from "./ChatMessage";
import { ThinkingBubble } from "./ThinkingBubble";
import { TypingIndicator } from "./TypingIndicator";
import { InputBar } from "./InputBar";

interface ChatContainerProps {
  messages: ChatMessageType[];
  isStreaming: boolean;
  isTyping: boolean;
  isThinking: boolean;
  thinkingText: string;
  onSendMessage: (text: string) => void;
  onCardComplete: (cardId: string, displayText: string, structuredMessage: string) => void;
  onStartOver: () => void;
}

export function ChatContainer({
  messages,
  isStreaming,
  isTyping,
  isThinking,
  thinkingText,
  onSendMessage,
  onCardComplete,
  onStartOver,
}: ChatContainerProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping, isThinking, thinkingText]);

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-background">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground tracking-tight">Start your business</span>
        </div>
        <button
          onClick={onStartOver}
          disabled={isStreaming}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Start a new business"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Start Over</span>
        </button>
      </header>

      {/* Message list — pb-36 so last message clears the floating input */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto py-6 space-y-4 pb-36"
        aria-label="Conversation"
      >
        {messages.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">Starting your conversation…</p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onCardComplete={onCardComplete}
          />
        ))}

        {/* Thinking indicator */}
        {(isThinking || thinkingText) && isStreaming && (
          <ThinkingBubble thinkingText={thinkingText} isThinking={isThinking} />
        )}

        {/* Typing indicator */}
        {isTyping && !isThinking && (
          <div className="px-4">
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* Floating glassy input — absolutely positioned at bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-3 z-10">
        <InputBar onSend={onSendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}

"use client";

/**
 * ChatContainer — the outer shell of the chat interface.
 *
 * Two modes:
 * - Landing (no messages yet): centered hero with preset "Start Business" option
 * - Chat: scrollable message list + floating glassy InputBar
 */

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Bot, Rocket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [landingInput, setLandingInput] = useState("");

  // Landing mode: no messages and nothing streaming/typing yet
  const isLanding = messages.length === 0 && !isStreaming && !isTyping && !isThinking;

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping, isThinking, thinkingText]);

  // ── Landing screen ──────────────────────────────────────────────────────────
  if (isLanding) {
    function handleLandingSubmit() {
      const trimmed = landingInput.trim();
      if (!trimmed) return;
      onSendMessage(trimmed);
      setLandingInput("");
    }

    return (
      <div className="flex flex-col h-full overflow-hidden bg-background">
        {/* Minimal header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background z-10 flex-shrink-0">
          <span className="text-sm font-semibold text-foreground tracking-tight">Start your business</span>
        </header>

        {/* Centered hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
          {/* Bot icon */}
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/15 border border-primary/30 shadow-lg shadow-primary/10 mb-6">
            <Bot className="size-7 text-primary" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-foreground text-center mb-2 font-serif italic">
            What business do you want to build?
          </h1>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-10">
            Start with a guided AI session, or describe your idea below.
          </p>

          {/* Input + preset panel */}
          <div className="w-full max-w-xl space-y-1.5">
            {/* Text input */}
            <div className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3",
              "bg-card/80 backdrop-blur-md",
              "border border-border/60",
              "shadow-xl shadow-black/30",
              "transition-all duration-200",
              "focus-within:border-primary/50"
            )}>
              <input
                autoFocus
                value={landingInput}
                onChange={(e) => setLandingInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLandingSubmit();
                }}
                placeholder="Describe your business idea…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
              />
              <button
                onClick={handleLandingSubmit}
                disabled={!landingInput.trim()}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                  landingInput.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/30"
                    : "bg-muted/60 text-muted-foreground cursor-not-allowed"
                )}
              >
                <ArrowRight className="size-4" />
              </button>
            </div>

            {/* Preset options */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => onSendMessage("[CONVERSATION_START]")}
                className="flex w-full items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <Rocket className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Start Business</p>
                  <p className="text-xs text-muted-foreground">
                    Guided AI session to build your offer and launch system
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Chat screen ─────────────────────────────────────────────────────────────
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

      {/* Floating glassy input */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-3 z-10">
        <InputBar onSend={onSendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}

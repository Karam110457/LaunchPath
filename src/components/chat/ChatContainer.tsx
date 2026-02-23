"use client";

/**
 * ChatContainer — the outer shell of the chat interface.
 *
 * Two modes:
 * - Landing (no messages yet): centered hero with preset "Start Business" option
 * - Chat: scrollable message list + floating glassy InputBar
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, Rocket, ArrowRight } from "lucide-react";
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
  const [landingFocused, setLandingFocused] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Landing mode: no messages and nothing streaming/typing yet
  const isLanding = messages.length === 0 && !isStreaming && !isTyping && !isThinking;

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping, isThinking, thinkingText]);

  // ── Landing screen ──────────────────────────────────────────────────────────
  const handleLandingFocus = useCallback(() => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setLandingFocused(true);
  }, []);

  const handleLandingBlur = useCallback(() => {
    // Short delay so clicking the preset button registers before hiding
    blurTimeoutRef.current = setTimeout(() => setLandingFocused(false), 150);
  }, []);

  if (isLanding) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-background relative">
        {/* Ambient radial glow — barely perceptible, blooms from centre */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 55%, oklch(0.60 0.16 165 / 0.05) 0%, transparent 70%)",
            animation: "ambient-breathe 5s ease-in-out infinite",
          }}
        />

        {/* Minimal header */}
        <header className="relative flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm z-10 flex-shrink-0">
          <span className="text-sm font-semibold text-foreground tracking-tight">Start your business</span>
        </header>

        {/* Centered hero */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-4 pb-16">
          {/* Heading — word-by-word reveal at display scale */}
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground text-center mb-3 font-serif italic leading-tight max-w-sm">
            {["What", "business", "do", "you", "want", "to", "build?"].map((word, i) => (
              <span
                key={word + i}
                className="inline-block"
                style={{
                  marginRight: "0.22em",
                  animation: `heading-word-enter 450ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 65}ms both`,
                }}
              >
                {word}
              </span>
            ))}
          </h1>
          <p
            className="text-sm text-muted-foreground text-center max-w-sm mb-10"
            style={{ animation: "heading-word-enter 400ms ease 500ms both" }}
          >
            Answer a few questions and we&apos;ll build your AI-powered offer and launch system.
          </p>

          {/* Input trigger + preset panel */}
          <div className="w-full max-w-xl space-y-1.5">
            {/* Click-to-reveal input — read-only, acts as a trigger */}
            <div
              onClick={handleLandingFocus}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 cursor-text",
                "bg-card/80 backdrop-blur-md",
                "border transition-all duration-200",
                landingFocused ? "border-primary/50 shadow-xl shadow-black/30" : "border-border/60 shadow-lg shadow-black/20",
              )}
            >
              <input
                readOnly
                onFocus={handleLandingFocus}
                onBlur={handleLandingBlur}
                placeholder="Tell me about yourself…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none cursor-text"
              />
            </div>

            {/* Preset options — only visible when input is focused */}
            {landingFocused && (
              <div className="rounded-xl border border-border bg-card overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
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
            )}
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
        className="flex-1 overflow-y-auto py-3 pb-36"
        aria-label="Conversation"
      >
        <div className="max-w-3xl mx-auto w-full px-4 space-y-5">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onCardComplete={onCardComplete}
              isStreaming={isStreaming}
            />
          ))}

          {/* Thinking indicator */}
          {(isThinking || thinkingText) && isStreaming && (
            <ThinkingBubble thinkingText={thinkingText} isThinking={isThinking} />
          )}

          {/* Typing indicator */}
          {isTyping && !isThinking && (
            <TypingIndicator />
          )}
        </div>
      </div>

      {/* Floating glassy input */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-3 z-10">
        <InputBar onSend={onSendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}

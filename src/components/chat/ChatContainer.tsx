"use client";

/**
 * ChatContainer — the outer shell of the chat interface.
 *
 * Two modes:
 * - Landing (no messages yet): centered hero with direct CTA
 * - Chat: scrollable message list + floating glassy InputBar
 */

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Rocket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/lib/chat/types";
import { ChatMessage } from "./ChatMessage";
import { ThinkingBubble } from "./ThinkingBubble";
import { TypingIndicator } from "./TypingIndicator";
import { InputBar } from "./InputBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ---------------------------------------------------------------------------
// Progress stage derivation
// ---------------------------------------------------------------------------

const STAGE_LABELS = [
  "Getting started",
  "Gathering info",
  "Analyzing niches",
  "Choosing niche",
  "Building offer",
  "Generating system",
  "Complete",
] as const;

function deriveChatStage(messages: ChatMessageType[]): number {
  let stage = 1;
  for (const msg of messages) {
    if (msg.role === "user" && msg.isCardResponse) stage = Math.max(stage, 2);
    if (msg.role === "assistant" && msg.type === "card") {
      const cardType = msg.card.type;
      if (cardType === "score-cards") stage = Math.max(stage, 3);
      if (cardType === "editable-content") stage = Math.max(stage, 5);
      if (cardType === "offer-summary") stage = Math.max(stage, 5);
      if (cardType === "progress-tracker" && msg.card.id?.includes("system")) stage = Math.max(stage, 6);
      if (cardType === "system-ready") stage = 7;
    }
    // Niche choice made
    if (msg.role === "user" && typeof msg.content === "string" && msg.content.startsWith("Selected:")) {
      stage = Math.max(stage, 4);
    }
  }
  return stage;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ChatContainerProps {
  messages: ChatMessageType[];
  isStreaming: boolean;
  isTyping: boolean;
  isThinking: boolean;
  thinkingText: string;
  isReturning?: boolean;
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
  isReturning = false,
  onSendMessage,
  onCardComplete,
  onStartOver,
}: ChatContainerProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [showReturnBanner, setShowReturnBanner] = useState(isReturning);

  // Landing mode: no messages and nothing streaming/typing yet
  const isLanding = messages.length === 0 && !isStreaming && !isTyping && !isThinking;

  // Auto-scroll on new content
  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping, isThinking, thinkingText]);

  // Auto-fade return banner after 5 seconds
  useEffect(() => {
    if (!showReturnBanner) return;
    const timer = setTimeout(() => setShowReturnBanner(false), 5000);
    return () => clearTimeout(timer);
  }, [showReturnBanner]);

  // Detect if the last message is an uncompleted card (for subdued input)
  const lastMsg = messages[messages.length - 1];
  const hasActiveCard =
    lastMsg &&
    lastMsg.role === "assistant" &&
    lastMsg.type === "card" &&
    !lastMsg.completed;

  // ── Landing screen ──────────────────────────────────────────────────────────

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

          {/* Direct CTA button */}
          <button
            onClick={() => onSendMessage("[CONVERSATION_START]")}
            className={cn(
              "flex items-center gap-3 h-14 px-8 rounded-2xl font-semibold text-base",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 transition-colors",
              "shadow-lg shadow-primary/20",
            )}
            style={{ animation: "heading-word-enter 400ms ease 600ms both" }}
          >
            <Rocket className="size-5" />
            Start Building Your Business
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Chat screen ─────────────────────────────────────────────────────────────

  const stage = deriveChatStage(messages);
  const progressPct = (stage / 7) * 100;

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-background">
      {/* Header with progress */}
      <header className="flex flex-col border-b border-border bg-background z-10 flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground tracking-tight">Start your business</span>
            {stage < 7 && (
              <span className="text-[11px] text-muted-foreground">
                {STAGE_LABELS[stage - 1]} ({stage}/7)
              </span>
            )}
            {stage === 7 && (
              <span className="text-[11px] text-primary font-medium">
                Complete
              </span>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={isStreaming}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Start a new business"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start Over</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start over?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will erase all progress — your niche analysis, offer, and any generated content. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep going</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onStartOver}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, start over
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-border/30">
          <div
            className="h-full bg-primary/60 transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Message list — pb-36 so last message clears the floating input */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto py-3 pb-36"
        aria-label="Conversation"
      >
        <div className="max-w-3xl mx-auto w-full px-4 space-y-5">
          {/* Returning user banner */}
          {showReturnBanner && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-xs text-muted-foreground transition-opacity duration-500",
                !showReturnBanner && "opacity-0"
              )}
            >
              Continuing your conversation — scroll up to see previous messages.
            </div>
          )}

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
        <InputBar
          onSend={onSendMessage}
          disabled={isStreaming}
          subdued={!!hasActiveCard && !isStreaming}
        />
      </div>
    </div>
  );
}

"use client";

/**
 * ChatMessage — renders a single message in the chat.
 *
 * Three variants:
 * - User text bubble (right-aligned)
 * - Assistant text (left-aligned, streams via StreamingText)
 * - Assistant card (full-width card component based on card.type)
 */

import type { ChatMessage as ChatMessageType } from "@/lib/chat/types";
import { StreamingText } from "./StreamingText";
import { cn } from "@/lib/utils";

// Card components (imported lazily so the main chat bundle stays lean)
import OptionSelectorCard from "./cards/OptionSelectorCard";
import TextInputCard from "./cards/TextInputCard";
import LocationCard from "./cards/LocationCard";
import ProgressTrackerCard from "./cards/ProgressTrackerCard";
import ScoreCard from "./cards/ScoreCard";
import EditableContentCard from "./cards/EditableContentCard";
import OfferSummaryCard from "./cards/OfferSummaryCard";
import SystemReadyCard from "./cards/SystemReadyCard";

interface ChatMessageProps {
  message: ChatMessageType;
  onCardComplete: (cardId: string, displayText: string, structuredMessage: string) => void;
  isStreaming?: boolean;
}

export function ChatMessage({ message, onCardComplete, isStreaming }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className={cn(
            "max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5",
            message.isCardResponse
              ? "bg-muted text-muted-foreground text-sm"
              : "bg-primary text-primary-foreground text-sm"
          )}
        >
          {message.content}
        </div>
      </div>
    );
  }

  if (message.type === "text") {
    // Strip AI meta-text like [card], [awaiting...], [tool_call ...], etc.
    const cleaned = message.content
      .replace(/\[tools?:[^\]]*\]/gi, "")
      .replace(/\[card[^\]]*\]/gi, "")
      .replace(/\[tool_?call[^\]]*\]/gi, "")
      .replace(/\[tool[^\]]*\]/gi, "")
      .replace(/\[awaiting[^\]]*\]/gi, "")
      .replace(/\[waiting[^\]]*\]/gi, "")
      .trim();
    if (!cleaned && !message.isStreaming) return null;
    return (
      <div className="text-sm text-foreground leading-relaxed py-1">
        <StreamingText content={cleaned} isStreaming={message.isStreaming} />
      </div>
    );
  }

  // Card message
  const { card, completed, completedSummary } = message;

  const handleComplete = (displayText: string, structuredMessage: string) => {
    onCardComplete(card.id, displayText, structuredMessage);
  };

  // Block interactions on incomplete cards while the agent is still streaming.
  // Without this, clicking a card mid-stream sends a response before the agent
  // has finished its turn, causing the next exchange to be processed out of order.
  const cardBlocked = isStreaming && !completed;

  return (
    // Cards slide up from below with a spring overshoot — they arrive with intention.
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
        cardBlocked && "pointer-events-none select-none opacity-60"
      )}
      style={{
        animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        animationFillMode: "both",
      }}
    >
      {(() => {
        switch (card.type) {
          case "option-selector":
            return (
              <OptionSelectorCard
                card={card}
                completed={completed}
                onComplete={handleComplete}
              />
            );
          case "text-input":
            return (
              <TextInputCard
                card={card}
                completed={completed}
                onComplete={handleComplete}
              />
            );
          case "location":
            return (
              <LocationCard
                card={card}
                completed={completed}
                onComplete={handleComplete}
              />
            );
          case "progress-tracker":
            return <ProgressTrackerCard card={card} />;
          case "score-cards":
            return (
              <ScoreCard
                card={card}
                completed={completed}
                completedSummary={completedSummary}
                onComplete={handleComplete}
              />
            );
          case "editable-content":
            return (
              <EditableContentCard
                card={card}
                completed={completed}
                onComplete={handleComplete}
              />
            );
          case "offer-summary":
            return <OfferSummaryCard card={card} onComplete={handleComplete} />;
          case "system-ready":
            return <SystemReadyCard card={card} onComplete={handleComplete} />;
          default:
            return null;
        }
      })()}
    </div>
  );
}

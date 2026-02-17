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
}

export function ChatMessage({ message, onCardComplete }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end px-4">
        <div
          className={cn(
            "max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5",
            message.isCardResponse
              ? "bg-zinc-100 text-zinc-600 text-sm"
              : "bg-zinc-900 text-white text-sm"
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
      .replace(/\[card[^\]]*\]/gi, "")
      .replace(/\[tool[^\]]*\]/gi, "")
      .replace(/\[awaiting[^\]]*\]/gi, "")
      .trim();
    if (!cleaned && !message.isStreaming) return null;
    return (
      <div className="px-4">
        <div className="text-sm text-zinc-800 leading-relaxed max-w-[600px]">
          <StreamingText content={cleaned} isStreaming={message.isStreaming} />
        </div>
      </div>
    );
  }

  // Card message
  const { card, completed } = message;

  const handleComplete = (displayText: string, structuredMessage: string) => {
    onCardComplete(card.id, displayText, structuredMessage);
  };

  return (
    <div className="px-4">
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

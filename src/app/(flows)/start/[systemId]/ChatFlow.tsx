"use client";

/**
 * ChatFlow — the new chat-based "Start Business" experience.
 *
 * Replaces StartBusinessFlow.tsx.
 * Renders the ChatContainer with useChatStream managing all state.
 * On mount with no history, triggers the opening [CONVERSATION_START] message.
 * For completed systems, reconstructs the system-ready card from DB data.
 */

import { useMemo } from "react";
import type { Tables } from "@/types/database";
import type { ChatMessage } from "@/lib/chat/types";
import type { AssembledOffer } from "@/lib/ai/schemas";
import { useChatStream } from "@/hooks/useChatStream";
import { ChatContainer } from "@/components/chat/ChatContainer";

type System = Tables<"user_systems">;
type Profile = Tables<"user_profiles">;

interface ChatFlowProps {
  system: System;
  profile: Profile;
}

export function ChatFlow({ system, profile: _profile }: ChatFlowProps) {
  const initialHistory = Array.isArray(system.conversation_history)
    ? (system.conversation_history as unknown as Parameters<typeof useChatStream>[0]["initialHistory"])
    : [];

  const { messages, isStreaming, isTyping, isThinking, thinkingText, sendMessage, handleCardResponse, startOver } =
    useChatStream({
      systemId: system.id,
      initialHistory,
    });

  // For completed systems, reconstruct the system-ready card if it's not already in messages
  const displayMessages = useMemo((): ChatMessage[] => {
    if (
      system.status === "complete" &&
      system.demo_url &&
      system.offer &&
      !isStreaming
    ) {
      const hasSystemReadyCard = messages.some(
        (m) =>
          m.role === "assistant" &&
          "type" in m &&
          m.type === "card" &&
          m.card.type === "system-ready"
      );
      if (!hasSystemReadyCard) {
        return [
          ...messages,
          {
            id: "system-ready-restored",
            role: "assistant",
            type: "card",
            card: {
              type: "system-ready",
              id: "system-ready",
              demoUrl: system.demo_url,
              offer: system.offer as AssembledOffer,
            },
            completed: false,
            timestamp: new Date().toISOString(),
          },
        ];
      }
    }
    return messages;
  }, [messages, system.status, system.demo_url, system.offer, isStreaming]);

  return (
    <ChatContainer
      messages={displayMessages}
      isStreaming={isStreaming}
      isTyping={isTyping}
      isThinking={isThinking}
      thinkingText={thinkingText}
      onSendMessage={sendMessage}
      onCardComplete={handleCardResponse}
      onStartOver={startOver}
    />
  );
}

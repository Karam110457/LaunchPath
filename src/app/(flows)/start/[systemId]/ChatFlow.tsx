"use client";

/**
 * ChatFlow — the new chat-based "Start Business" experience.
 *
 * Replaces StartBusinessFlow.tsx.
 * Renders the ChatContainer with useChatStream managing all state.
 * On mount with no history, triggers the opening [CONVERSATION_START] message.
 */

import { useEffect, useRef } from "react";
import type { Tables } from "@/types/database";
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

  const didGreet = useRef(false);

  // Trigger greeting on first load if no history
  useEffect(() => {
    if (!didGreet.current && initialHistory.length === 0) {
      didGreet.current = true;
      // Small delay so the component has mounted and the stream connection is ready
      const timer = setTimeout(() => {
        sendMessage("[CONVERSATION_START]");
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ChatContainer
      messages={messages}
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

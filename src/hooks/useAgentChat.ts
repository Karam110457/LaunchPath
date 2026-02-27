"use client";

/**
 * useAgentChat — manages agent test chat state and SSE streaming.
 * Text-only, no cards, no tools.
 */

import { useState, useCallback, useRef } from "react";
import type {
  AgentChatMessage,
  AgentConversationMessage,
  AgentServerEvent,
} from "@/lib/chat/agent-chat-types";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function now() {
  return new Date().toISOString();
}

interface UseAgentChatOptions {
  agentId: string;
  initialMessages: AgentConversationMessage[];
  greetingMessage?: string;
}

interface UseAgentChatReturn {
  messages: AgentChatMessage[];
  isStreaming: boolean;
  isTyping: boolean;
  isThinking: boolean;
  thinkingText: string;
  sendMessage: (text: string) => void;
  clearConversation: () => void;
}

export function useAgentChat({
  agentId,
  initialMessages,
  greetingMessage,
}: UseAgentChatOptions): UseAgentChatReturn {
  const [messages, setMessages] = useState<AgentChatMessage[]>(() => {
    const restored: AgentChatMessage[] = initialMessages.map((m) => ({
      id: generateId(),
      role: m.role,
      content: m.content,
      isStreaming: false,
      timestamp: m.timestamp,
    }));
    // If no history but there's a greeting, show it as the first assistant message
    if (restored.length === 0 && greetingMessage) {
      restored.push({
        id: "greeting",
        role: "assistant",
        content: greetingMessage,
        isStreaming: false,
        timestamp: now(),
      });
    }
    return restored;
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState("");

  const historyRef = useRef<AgentConversationMessage[]>(initialMessages);
  const streamingIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    (text: string) => {
      if (isStreaming) return;

      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: "user", content: text, timestamp: now() },
      ]);

      setIsStreaming(true);
      setIsTyping(true);
      setIsThinking(false);
      setThinkingText("");
      streamingIdRef.current = null;

      void (async () => {
        let accumulatedText = "";

        try {
          const response = await fetch(`/api/agents/${agentId}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: historyRef.current,
              userMessage: text,
            }),
          });

          if (!response.ok || !response.body) {
            setIsTyping(false);
            setIsStreaming(false);
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let receivedDone = false;

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6).trim();
              if (!raw) continue;

              try {
                const event = JSON.parse(raw) as AgentServerEvent;

                if (event.type === "text-delta") {
                  accumulatedText += event.delta;
                  setIsTyping(false);
                  setIsThinking(false);

                  setMessages((prev) => {
                    const sid = streamingIdRef.current;
                    if (!sid) {
                      const newId = generateId();
                      streamingIdRef.current = newId;
                      return [
                        ...prev,
                        {
                          id: newId,
                          role: "assistant" as const,
                          content: event.delta,
                          isStreaming: true,
                          timestamp: now(),
                        },
                      ];
                    }
                    return prev.map((m) =>
                      m.id === sid
                        ? { ...m, content: m.content + event.delta }
                        : m
                    );
                  });
                } else if (event.type === "text-done") {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === streamingIdRef.current
                        ? { ...m, isStreaming: false }
                        : m
                    )
                  );
                  streamingIdRef.current = null;
                } else if (event.type === "thinking") {
                  setIsTyping(false);
                  setIsThinking(true);
                  setThinkingText((prev) => prev + event.text);
                } else if (event.type === "thinking-done") {
                  setIsThinking(false);
                } else if (event.type === "done") {
                  receivedDone = true;
                  const content =
                    event.assistantContent || accumulatedText;
                  historyRef.current = [
                    ...historyRef.current,
                    { role: "user", content: text, timestamp: now() },
                    {
                      role: "assistant",
                      content,
                      timestamp: now(),
                    },
                  ];
                  setIsStreaming(false);
                  setIsTyping(false);
                  setIsThinking(false);
                } else if (event.type === "error") {
                  setIsStreaming(false);
                  setIsTyping(false);
                  setIsThinking(false);
                  streamingIdRef.current = null;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: generateId(),
                      role: "assistant",
                      content: event.message,
                      isStreaming: false,
                      timestamp: now(),
                    },
                  ]);
                }
              } catch {
                // Ignore malformed events
              }
            }
          }

          // Safety net: stream ended without a "done" event
          if (!receivedDone) {
            if (accumulatedText) {
              historyRef.current = [
                ...historyRef.current,
                { role: "user", content: text, timestamp: now() },
                {
                  role: "assistant",
                  content: accumulatedText,
                  timestamp: now(),
                },
              ];
            }
            if (streamingIdRef.current) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamingIdRef.current
                    ? { ...m, isStreaming: false }
                    : m
                )
              );
              streamingIdRef.current = null;
            }
            setIsStreaming(false);
            setIsTyping(false);
            setIsThinking(false);
          }
        } catch (err) {
          console.error("Agent chat stream error:", err);
          setIsStreaming(false);
          setIsTyping(false);
          setIsThinking(false);
          streamingIdRef.current = null;
        }
      })();
    },
    [agentId, isStreaming]
  );

  const clearConversation = useCallback(() => {
    void fetch(`/api/agents/${agentId}/chat/clear`, { method: "POST" }).then(
      () => {
        historyRef.current = [];
        streamingIdRef.current = null;
        setMessages(
          greetingMessage
            ? [
                {
                  id: "greeting",
                  role: "assistant",
                  content: greetingMessage,
                  isStreaming: false,
                  timestamp: now(),
                },
              ]
            : []
        );
        setIsStreaming(false);
        setIsTyping(false);
        setIsThinking(false);
      }
    );
  }, [agentId, greetingMessage]);

  return {
    messages,
    isStreaming,
    isTyping,
    isThinking,
    thinkingText,
    sendMessage,
    clearConversation,
  };
}

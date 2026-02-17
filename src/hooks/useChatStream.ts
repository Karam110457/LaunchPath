"use client";

/**
 * useChatStream — manages the chat conversation state and SSE streaming.
 *
 * Handles:
 * - Sending messages to the agent (POST /api/chat/[systemId])
 * - Parsing SSE events (text deltas, progress, cards)
 * - Managing the messages array (text + card messages)
 * - Card interactions (collapse + send structured response)
 * - Typing indicator state
 */

import { useState, useCallback, useRef } from "react";
import type {
  ChatMessage,
  ConversationMessage,
  ServerEvent,
  ProgressStep,
} from "@/lib/chat/types";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function now() {
  return new Date().toISOString();
}

interface UseChatStreamOptions {
  systemId: string;
  initialHistory: ConversationMessage[];
  initialDisplayMessages?: ChatMessage[];
}

interface UseChatStreamReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  isTyping: boolean;
  isThinking: boolean;
  thinkingText: string;
  sendMessage: (text: string, addBubble?: boolean) => void;
  handleCardResponse: (
    cardId: string,
    displayText: string,
    structuredMessage: string
  ) => void;
  startOver: () => void;
}

/** Strip tool markers and meta-text from assistant display text */
function stripToolMarkers(text: string): string {
  return text
    .replace(/\[tools?:[^\]]*\]/gi, "")
    .replace(/\[card[^\]]*\]/gi, "")
    .replace(/\[tool_?call[^\]]*\]/gi, "")
    .replace(/\[tool[^\]]*\]/gi, "")
    .replace(/\[awaiting[^\]]*\]/gi, "")
    .replace(/\[waiting[^\]]*\]/gi, "")
    .trim();
}

/**
 * Extract a clean display label from a structured card response message.
 * Cards send structured messages like "[offer-story confirmed: {...}]" or
 * "[intent selected: first_client]". On reload, we convert these to clean labels.
 * Returns null if the message isn't a structured card response.
 */
function cleanCardResponseDisplay(raw: string): string | null {
  const trimmed = raw.trim();

  // --- Specific patterns (nice labels) ---

  // Editable-content confirmations
  if (trimmed.startsWith("[offer-story confirmed:")) return "Confirmed: Your Business Story";
  if (trimmed.startsWith("[offer-pricing confirmed:")) return "Confirmed: Pricing & Guarantee";

  // Build system trigger
  if (trimmed.startsWith("[build-system:")) return "Build My System";

  // Niche choice — extract niche name from JSON
  const nicheMatch = trimmed.match(/^\[niche-choice:\s*(\{[\s\S]*\})\]$/);
  if (nicheMatch) {
    try {
      const data = JSON.parse(nicheMatch[1]);
      return `Selected: ${data.niche ?? "a niche"}`;
    } catch {
      return "Selected a niche";
    }
  }

  // Option-selector — [field selected: value] e.g. [intent selected: first_client]
  const fieldMatch = trimmed.match(/^\[([\w_-]+)\s+selected:\s*(.+)\]$/);
  if (fieldMatch) {
    const value = fieldMatch[2].replace(/_/g, " ");
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  // Location card — [location: city="London", target="local"]
  if (trimmed.startsWith("[location:")) {
    const cityMatch = trimmed.match(/city="([^"]*)"/);
    return cityMatch?.[1] || "Location set";
  }

  // Text-input cards — [card-id: "user's typed text"]
  const textInputMatch = trimmed.match(/^\[([\w_-]+):\s*"(.*)"\]$/);
  if (textInputMatch) {
    const value = textInputMatch[2];
    return value.length > 60 ? value.slice(0, 57) + "..." : value || "Response submitted";
  }

  // --- Catch-all: any remaining [bracket-wrapped] structured message ---
  if (/^\[[\w_-]+[\s:]/.test(trimmed) && trimmed.endsWith("]")) {
    return "Response submitted";
  }

  // Raw JSON object
  if (/^\{[\s\S]*\}$/.test(trimmed)) {
    return "Response submitted";
  }

  return null;
}

/**
 * Restore persisted conversation history into the ChatMessage format.
 * Filters system signals, detects card responses, strips tool markers.
 */
function restoreMessages(history: ConversationMessage[]): ChatMessage[] {
  const result: ChatMessage[] = [];

  for (const m of history) {
    // Skip system signals
    if (m.role === "user" && m.content === "[CONVERSATION_START]") continue;

    if (m.role === "user") {
      // Detect structured card responses — starts with [ or is raw JSON
      const isStructured = /^\[[\w_-]+[\s:]/.test(m.content.trim()) || /^\{[\s\S]*\}$/.test(m.content.trim());

      // For structured messages, show a clean label instead of raw JSON
      const cleanLabel = cleanCardResponseDisplay(m.content);

      result.push({
        id: generateId(),
        role: "user",
        content: cleanLabel ?? m.content,
        isCardResponse: isStructured,
        timestamp: m.timestamp,
      });
      continue;
    }

    // Assistant message — strip tool markers for display
    const displayContent = stripToolMarkers(m.content);
    if (!displayContent) continue; // Skip empty (tool-only) assistant messages

    result.push({
      id: generateId(),
      role: "assistant",
      type: "text",
      content: displayContent,
      isStreaming: false,
      timestamp: m.timestamp,
    });
  }

  return result;
}

/** Save display messages to the server so they survive refresh */
async function saveDisplayMessages(systemId: string, messages: ChatMessage[]) {
  try {
    await fetch(`/api/chat/${systemId}/display`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayMessages: messages }),
    });
  } catch {
    // Non-critical — ignore
  }
}

export function useChatStream({
  systemId,
  initialHistory,
  initialDisplayMessages,
}: UseChatStreamOptions): UseChatStreamReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialDisplayMessages && initialDisplayMessages.length > 0
      ? initialDisplayMessages
      : restoreMessages(initialHistory)
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState("");

  // Ref for the conversation history (persisted form) — updated after each exchange
  const historyRef = useRef<ConversationMessage[]>(initialHistory);

  // Ref to the current streaming message id (so we can append deltas to it)
  const streamingMessageIdRef = useRef<string | null>(null);

  /**
   * Update a progress card's step status in the messages array.
   */
  const updateProgressStep = useCallback(
    (cardId: string, stepId: string, status: "active" | "done") => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (
            msg.role === "assistant" &&
            msg.type === "card" &&
            msg.card.type === "progress-tracker" &&
            msg.card.id === cardId
          ) {
            const updatedSteps: ProgressStep[] = msg.card.steps.map((step) => {
              if (step.id === stepId) return { ...step, status };
              if (status === "active" && step.status === "active") {
                return { ...step, status: "done" };
              }
              return step;
            });
            return {
              ...msg,
              card: { ...msg.card, steps: updatedSteps },
            };
          }
          return msg;
        })
      );
    },
    []
  );

  /**
   * Process a single SSE event from the server.
   */
  const processEvent = useCallback(
    (event: ServerEvent) => {
      switch (event.type) {
        case "thinking": {
          setIsTyping(false);
          setIsThinking(true);
          setThinkingText((prev) => prev + event.text);
          break;
        }

        case "thinking-done": {
          setIsThinking(false);
          break;
        }

        case "text-delta": {
          setIsTyping(false);
          setIsThinking(false);
          setMessages((prev) => {
            const streamId = streamingMessageIdRef.current;
            if (!streamId) {
              const newId = generateId();
              streamingMessageIdRef.current = newId;
              return [
                ...prev,
                {
                  id: newId,
                  role: "assistant",
                  type: "text",
                  content: event.delta,
                  isStreaming: true,
                  timestamp: now(),
                },
              ];
            }
            return prev.map((msg) =>
              msg.id === streamId && msg.role === "assistant" && msg.type === "text"
                ? { ...msg, content: msg.content + event.delta }
                : msg
            );
          });
          break;
        }

        case "text-done": {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === streamingMessageIdRef.current && msg.role === "assistant" && msg.type === "text") {
                return { ...msg, isStreaming: false };
              }
              return msg;
            })
          );
          streamingMessageIdRef.current = null;
          break;
        }

        case "card": {
          if (streamingMessageIdRef.current) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingMessageIdRef.current && msg.role === "assistant" && msg.type === "text"
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );
            streamingMessageIdRef.current = null;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "assistant",
              type: "card",
              card: event.card,
              completed: false,
              timestamp: now(),
            },
          ]);
          break;
        }

        case "progress": {
          updateProgressStep(event.cardId, event.stepId, event.status);
          break;
        }

        case "done": {
          if (streamingMessageIdRef.current) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingMessageIdRef.current && msg.role === "assistant" && msg.type === "text"
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );
            streamingMessageIdRef.current = null;
          }
          setIsStreaming(false);
          setIsTyping(false);
          setIsThinking(false);
          break;
        }

        case "error": {
          setIsStreaming(false);
          setIsTyping(false);
          setIsThinking(false);
          streamingMessageIdRef.current = null;
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "assistant",
              type: "text",
              content: event.message,
              isStreaming: false,
              timestamp: now(),
            },
          ]);
          break;
        }
      }
    },
    [updateProgressStep]
  );

  /**
   * Send a message to the agent. Opens SSE and streams the response.
   * @param addBubble — set to false when handleCardResponse already added the user bubble
   */
  const sendMessage = useCallback(
    (text: string, addBubble = true) => {
      if (isStreaming) return;

      // Show the user message in the chat (unless it's a system signal or card already added it)
      if (addBubble && text !== "[CONVERSATION_START]") {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "user" as const,
            content: text,
            timestamp: now(),
          },
        ]);
      }

      setIsStreaming(true);
      setIsTyping(true);
      setIsThinking(false);
      setThinkingText("");
      streamingMessageIdRef.current = null;

      void (async () => {
        // Track accumulated text from this exchange for history fallback
        let accumulatedText = "";

        try {
          const response = await fetch(`/api/chat/${systemId}`, {
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
                const event = JSON.parse(raw) as ServerEvent;

                // Accumulate text for history fallback
                if (event.type === "text-delta") {
                  accumulatedText += event.delta;
                }

                if (event.type === "done") {
                  receivedDone = true;
                  // Use the server's authoritative content (includes text + tool names)
                  // Falls back to client-accumulated text if server didn't send content
                  const assistantContent = event.assistantContent || accumulatedText || "[card]";

                  historyRef.current = [
                    ...historyRef.current,
                    {
                      role: "user",
                      content: text,
                      timestamp: now(),
                    },
                    {
                      role: "assistant",
                      content: assistantContent,
                      timestamp: now(),
                    },
                  ];

                  // Save display messages (cards included) so they survive refresh
                  setMessages((current) => {
                    void saveDisplayMessages(systemId, current);
                    return current;
                  });
                }

                processEvent(event);
              } catch {
                // Ignore malformed events
              }
            }
          }

          // Safety net: if stream closed without a "done" event, clean up
          if (!receivedDone) {
            console.warn("Stream ended without done event — recovering.");
            if (accumulatedText) {
              historyRef.current = [
                ...historyRef.current,
                { role: "user", content: text, timestamp: now() },
                { role: "assistant", content: accumulatedText, timestamp: now() },
              ];
            }
            // Finalize any streaming message
            if (streamingMessageIdRef.current) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMessageIdRef.current && msg.role === "assistant" && msg.type === "text"
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
              streamingMessageIdRef.current = null;
            }
            setIsStreaming(false);
            setIsTyping(false);
            setIsThinking(false);
          }
        } catch (err) {
          console.error("Chat stream error:", err);
          setIsStreaming(false);
          setIsTyping(false);
          setIsThinking(false);
          streamingMessageIdRef.current = null;
        }
      })();
    },
    [systemId, isStreaming, processEvent]
  );

  /**
   * Handle a card interaction (option selected, form submitted, etc.)
   * Collapses the card, adds user message, and sends to agent.
   */
  const handleCardResponse = useCallback(
    (cardId: string, displayText: string, structuredMessage: string) => {
      // Mark the card as completed
      setMessages((prev) =>
        prev.map((msg) => {
          if (
            msg.role === "assistant" &&
            msg.type === "card" &&
            msg.card.id === cardId
          ) {
            return { ...msg, completed: true };
          }
          return msg;
        })
      );

      // Add user message (display text shown in bubble)
      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: displayText,
        isCardResponse: true,
        timestamp: now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Send structured message to agent (bubble already added above)
      sendMessage(structuredMessage, false);
    },
    [sendMessage]
  );

  /**
   * Start over — clears conversation history, resets system state, returns to landing screen.
   */
  const startOver = useCallback(() => {
    void Promise.all([
      fetch(`/api/chat/${systemId}/reset`, { method: "POST" }),
      fetch(`/api/chat/${systemId}/display`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayMessages: [] }),
      }),
    ]).then(() => {
      historyRef.current = [];
      setMessages([]);
      setIsStreaming(false);
      setIsTyping(false);
      streamingMessageIdRef.current = null;
      // Landing screen shows automatically when messages is empty
    });
  }, [systemId]);

  return {
    messages,
    isStreaming,
    isTyping,
    isThinking,
    thinkingText,
    sendMessage,
    handleCardResponse,
    startOver,
  };
}

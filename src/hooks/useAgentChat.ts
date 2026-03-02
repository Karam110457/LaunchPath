"use client";

/**
 * useAgentChat — manages agent test chat state, SSE streaming,
 * and multi-conversation support.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  AgentChatMessage,
  AgentConversationMessage,
  AgentConversationSummary,
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
  greetingMessage?: string;
}

export interface ToolActivity {
  toolName: string;
  displayName: string;
  status: "running" | "done" | "failed";
  message?: string;
}

interface UseAgentChatReturn {
  messages: AgentChatMessage[];
  isStreaming: boolean;
  isTyping: boolean;
  isThinking: boolean;
  thinkingText: string;
  toolActivity: ToolActivity[];
  sendMessage: (text: string) => void;

  // Multi-conversation
  conversations: AgentConversationSummary[];
  activeConversationId: string | null;
  isLoadingConversations: boolean;
  startNewConversation: () => void;
  switchConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
}

export function useAgentChat({
  agentId,
  greetingMessage,
}: UseAgentChatOptions): UseAgentChatReturn {
  // Conversation list
  const [conversations, setConversations] = useState<
    AgentConversationSummary[]
  >([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  // Messages for the active conversation
  const [messages, setMessages] = useState<AgentChatMessage[]>(() =>
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

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState("");

  const [toolActivity, setToolActivity] = useState<ToolActivity[]>([]);

  const historyRef = useRef<AgentConversationMessage[]>([]);
  const streamingIdRef = useRef<string | null>(null);

  // -------------------------------------------------------------------------
  // Fetch conversation list
  // -------------------------------------------------------------------------

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/agents/${agentId}/chat/conversations`
      );
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
        return data.conversations as AgentConversationSummary[];
      }
    } catch {
      // Network error — silent
    }
    return [] as AgentConversationSummary[];
  }, [agentId]);

  // Load conversations on mount, auto-select the most recent
  useEffect(() => {
    let cancelled = false;
    setIsLoadingConversations(true);

    void fetchConversations().then((convos) => {
      if (cancelled) return;
      setIsLoadingConversations(false);

      if (convos.length > 0) {
        // Auto-load the most recent conversation
        const mostRecent = convos[0];
        void loadConversation(mostRecent.id);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  // -------------------------------------------------------------------------
  // Load a single conversation's messages
  // -------------------------------------------------------------------------

  const loadConversation = useCallback(
    async (conversationId: string) => {
      setActiveConversationId(conversationId);
      try {
        const res = await fetch(
          `/api/agents/${agentId}/chat/conversations?id=${conversationId}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const msgs = Array.isArray(data.conversation?.messages)
          ? data.conversation.messages
          : [];

        historyRef.current = msgs as AgentConversationMessage[];
        setMessages(
          (msgs as AgentConversationMessage[]).map(
            (m: AgentConversationMessage) => ({
              id: generateId(),
              role: m.role,
              content: m.content,
              isStreaming: false,
              timestamp: m.timestamp,
            })
          )
        );
      } catch {
        // Network error
      }
    },
    [agentId]
  );

  // -------------------------------------------------------------------------
  // Start a new conversation
  // -------------------------------------------------------------------------

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
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
    setThinkingText("");
  }, [greetingMessage]);

  // -------------------------------------------------------------------------
  // Switch to an existing conversation
  // -------------------------------------------------------------------------

  const switchConversation = useCallback(
    (conversationId: string) => {
      if (conversationId === activeConversationId) return;
      setIsStreaming(false);
      setIsTyping(false);
      setIsThinking(false);
      setThinkingText("");
      streamingIdRef.current = null;
      void loadConversation(conversationId);
    },
    [activeConversationId, loadConversation]
  );

  // -------------------------------------------------------------------------
  // Delete a conversation
  // -------------------------------------------------------------------------

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await fetch(`/api/agents/${agentId}/chat/clear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });
      } catch {
        // Network error
        return;
      }

      // Remove from list
      setConversations((prev) =>
        prev.filter((c) => c.id !== conversationId)
      );

      // If deleting the active conversation, switch to next or start new
      if (conversationId === activeConversationId) {
        const remaining = conversations.filter(
          (c) => c.id !== conversationId
        );
        if (remaining.length > 0) {
          void loadConversation(remaining[0].id);
        } else {
          startNewConversation();
        }
      }
    },
    [
      agentId,
      activeConversationId,
      conversations,
      loadConversation,
      startNewConversation,
    ]
  );

  // -------------------------------------------------------------------------
  // Send a message
  // -------------------------------------------------------------------------

  const activeConvIdRef = useRef(activeConversationId);
  activeConvIdRef.current = activeConversationId;

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
      setToolActivity([]);
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
              conversationId: activeConvIdRef.current ?? undefined,
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
                } else if (event.type === "tool-call") {
                  setIsTyping(false);
                  setToolActivity((prev) => [
                    ...prev,
                    {
                      toolName: event.toolName,
                      displayName: event.displayName,
                      status: "running" as const,
                    },
                  ]);
                } else if (event.type === "tool-result") {
                  setToolActivity((prev) =>
                    prev.map((t) =>
                      t.toolName === event.toolName
                        ? {
                            ...t,
                            status: event.success ? ("done" as const) : ("failed" as const),
                            message: event.message,
                          }
                        : t
                    )
                  );
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
                    { role: "assistant", content, timestamp: now() },
                  ];

                  // Capture the conversation ID (new or existing)
                  if (event.conversationId) {
                    setActiveConversationId(event.conversationId);
                    activeConvIdRef.current = event.conversationId;
                    // Refresh conversation list
                    void fetchConversations();
                  }

                  setIsStreaming(false);
                  setIsTyping(false);
                  setIsThinking(false);
                  setToolActivity([]);
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
    [agentId, isStreaming, fetchConversations]
  );

  return {
    messages,
    isStreaming,
    isTyping,
    isThinking,
    thinkingText,
    toolActivity,
    sendMessage,
    conversations,
    activeConversationId,
    isLoadingConversations,
    startNewConversation,
    switchConversation,
    deleteConversation,
  };
}

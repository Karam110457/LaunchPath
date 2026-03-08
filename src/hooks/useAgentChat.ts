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

/** Conversations older than this are considered stale for auto-loading. */
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

interface UseAgentChatOptions {
  agentId: string;
  greetingMessage?: string;
}

export interface ToolActivity {
  toolName: string;
  displayName: string;
  status: "running" | "done" | "failed";
  message?: string;
  args?: Record<string, unknown>;
  result?: unknown;
}

interface UseAgentChatReturn {
  messages: AgentChatMessage[];
  isStreaming: boolean;
  isTyping: boolean;
  isThinking: boolean;
  isLoadingMessages: boolean;
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
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
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
  const toolActivityRef = useRef<ToolActivity[]>([]);

  const historyRef = useRef<AgentConversationMessage[]>([]);
  const streamingIdRef = useRef<string | null>(null);

  // AbortController for the active SSE stream
  const abortRef = useRef<AbortController | null>(null);

  // Abort any active stream (used by switch, unmount, new conversation)
  const abortActiveStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
    setIsTyping(false);
    setIsThinking(false);
    setThinkingText("");
    streamingIdRef.current = null;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

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

  // Load conversations on mount, auto-select the most recent IF fresh
  useEffect(() => {
    let cancelled = false;
    setIsLoadingConversations(true);

    void fetchConversations().then((convos) => {
      if (cancelled) return;
      setIsLoadingConversations(false);

      if (convos.length > 0) {
        const mostRecent = convos[0];
        const age = Date.now() - new Date(mostRecent.updated_at).getTime();

        if (age < STALE_THRESHOLD_MS) {
          // Fresh conversation — auto-load it
          void loadConversation(mostRecent.id);
        }
        // Stale conversation — stay on "New conversation" with greeting
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
      setIsLoadingMessages(true);
      try {
        const res = await fetch(
          `/api/agents/${agentId}/chat/conversations?id=${conversationId}`
        );
        if (!res.ok) {
          setIsLoadingMessages(false);
          return;
        }
        const data = await res.json();
        const msgs = Array.isArray(data.conversation?.messages)
          ? data.conversation.messages
          : [];

        historyRef.current = msgs as AgentConversationMessage[];
        // Only display user/assistant messages — tool-call/tool-result
        // entries are stored for LLM context but not shown in the chat UI
        const displayMsgs = (msgs as AgentConversationMessage[]).filter(
          (m) => m.role === "user" || m.role === "assistant"
        );
        setMessages(
          displayMsgs.map((m) => ({
            id: generateId(),
            role: m.role as "user" | "assistant",
            content: m.content,
            isStreaming: false,
            timestamp: m.timestamp,
          }))
        );
      } catch {
        // Network error
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [agentId]
  );

  // -------------------------------------------------------------------------
  // Start a new conversation
  // -------------------------------------------------------------------------

  const startNewConversation = useCallback(() => {
    abortActiveStream();
    setActiveConversationId(null);
    historyRef.current = [];
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
  }, [greetingMessage, abortActiveStream]);

  // -------------------------------------------------------------------------
  // Switch to an existing conversation
  // -------------------------------------------------------------------------

  const switchConversation = useCallback(
    (conversationId: string) => {
      if (conversationId === activeConversationId) return;
      abortActiveStream();
      void loadConversation(conversationId);
    },
    [activeConversationId, loadConversation, abortActiveStream]
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
      toolActivityRef.current = [];
      setToolActivity([]);
      streamingIdRef.current = null;

      // Create an AbortController for this stream
      const controller = new AbortController();
      abortRef.current = controller;

      void (async () => {
        let accumulatedText = "";
        // Track tool call count so tool-result can match by index
        let toolCallIndex = 0;

        try {
          const response = await fetch(`/api/agents/${agentId}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: historyRef.current,
              userMessage: text,
              conversationId: activeConvIdRef.current ?? undefined,
            }),
            signal: controller.signal,
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
                  const entry: ToolActivity = {
                    toolName: event.toolName,
                    displayName: event.displayName,
                    status: "running" as const,
                    args: event.args,
                  };
                  toolActivityRef.current = [...toolActivityRef.current, entry];
                  setToolActivity(toolActivityRef.current);
                } else if (event.type === "tool-result") {
                  // Match by index (order of tool-result matches order of tool-call)
                  // to handle duplicate tool names correctly
                  const targetIndex = toolCallIndex;
                  toolCallIndex++;
                  toolActivityRef.current = toolActivityRef.current.map((t, i) =>
                    i === targetIndex
                      ? {
                          ...t,
                          status: event.success ? ("done" as const) : ("failed" as const),
                          message: event.message,
                          result: event.result,
                        }
                      : t
                  );
                  setToolActivity(toolActivityRef.current);
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

                  // Persist tool activities onto the assistant message
                  const finishedTools = toolActivityRef.current;
                  if (finishedTools.length > 0) {
                    setMessages((prev) => {
                      const updated = [...prev];
                      for (let i = updated.length - 1; i >= 0; i--) {
                        if (updated[i].role === "assistant") {
                          updated[i] = { ...updated[i], toolActivities: [...finishedTools] };
                          break;
                        }
                      }
                      return updated;
                    });
                  }
                  toolActivityRef.current = [];
                  setToolActivity([]);

                  setIsStreaming(false);
                  setIsTyping(false);
                  setIsThinking(false);
                  abortRef.current = null;
                } else if (event.type === "error") {
                  setIsStreaming(false);
                  setIsTyping(false);
                  setIsThinking(false);
                  streamingIdRef.current = null;
                  abortRef.current = null;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: generateId(),
                      role: "assistant",
                      content: event.message,
                      isStreaming: false,
                      isError: true,
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
            abortRef.current = null;
          }
        } catch (err) {
          // Ignore abort errors — those are intentional
          if (err instanceof DOMException && err.name === "AbortError") return;

          console.error("Agent chat stream error:", err);
          setIsStreaming(false);
          setIsTyping(false);
          setIsThinking(false);
          streamingIdRef.current = null;
          abortRef.current = null;
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
    isLoadingMessages,
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

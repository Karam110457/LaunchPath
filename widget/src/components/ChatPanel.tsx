import { h } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { MessageBubble } from "./MessageBubble";
import { TypingDots } from "./TypingDots";
import type { WidgetConfig, Message, ConversationStatus } from "../types";
import { getContrastColor } from "../contrast";

interface ChatPanelProps {
  config: WidgetConfig;
  token: string;
  agentId: string;
  channelId: string;
  apiOrigin: string;
  onClose: () => void;
  size?: { launcher: number; panelW: number; panelH: number; fontSize: number };
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getSessionId(channelId: string): string {
  const key = `lp_session_${channelId}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = generateId();
    localStorage.setItem(key, id);
  }
  return id;
}

function loadHistory(channelId: string): Message[] {
  try {
    const raw = localStorage.getItem(`lp_history_${channelId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Message[];
      return parsed.slice(-50);
    }
  } catch {
    // Corrupted — ignore
  }
  return [];
}

function saveHistory(channelId: string, messages: Message[]) {
  try {
    localStorage.setItem(
      `lp_history_${channelId}`,
      JSON.stringify(messages.slice(-50))
    );
  } catch {
    // Storage full — ignore
  }
}

/* -------------------------------------------------------------------------- */
/*  Status banner shown during HITL states                                     */
/* -------------------------------------------------------------------------- */

function StatusBanner({ status }: { status: ConversationStatus }) {
  if (status === "human_takeover") {
    return (
      <div style={{
        padding: "8px 16px",
        backgroundColor: "rgba(59,130,246,0.08)",
        borderBottom: "1px solid rgba(59,130,246,0.12)",
        textAlign: "center",
        fontSize: "12px",
        color: "#3b82f6",
        fontWeight: 500,
      }}>
        A team member is responding to this conversation
      </div>
    );
  }
  if (status === "paused") {
    return (
      <div style={{
        padding: "8px 16px",
        backgroundColor: "rgba(245,158,11,0.08)",
        borderBottom: "1px solid rgba(245,158,11,0.12)",
        textAlign: "center",
        fontSize: "12px",
        color: "#d97706",
        fontWeight: 500,
      }}>
        This conversation is paused
      </div>
    );
  }
  if (status === "closed") {
    return (
      <div style={{
        padding: "8px 16px",
        backgroundColor: "rgba(113,113,122,0.08)",
        borderBottom: "1px solid rgba(113,113,122,0.12)",
        textAlign: "center",
        fontSize: "12px",
        color: "#71717a",
        fontWeight: 500,
      }}>
        This conversation has been closed
      </div>
    );
  }
  return null;
}

export function ChatPanel({
  config,
  token,
  agentId,
  channelId,
  apiOrigin,
  onClose,
  size,
}: ChatPanelProps) {
  const panelW = size?.panelW ?? 380;
  const panelH = size?.panelH ?? 520;
  const fontSize = size?.fontSize ?? 14;
  const [messages, setMessages] = useState<Message[]>(() =>
    loadHistory(channelId)
  );
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [convStatus, setConvStatus] = useState<ConversationStatus>("active");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = useRef(getSessionId(channelId));
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const knownMessageCount = useRef(0);
  const hasInteracted = useRef(false);

  const primaryColor = config.primaryColor || "#6366f1";
  const contrastColor = getContrastColor(primaryColor);
  const contrastMuted = contrastColor === "#ffffff" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
  const agentName = config.agentName || "AI Assistant";
  const welcomeMessage = config.welcomeMessage || "Hi! How can I help you today?";
  const starters = config.conversationStarters ?? [];
  const isDark = config.theme === "dark";
  const isSharp = config.borderRadius === "sharp";
  const showBranding = config.showBranding !== false;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ---------------------------------------------------------------------------
  // Background status polling
  // Polls every 10s during active (to detect takeover/pause),
  // every 3s during human_takeover (to get human messages quickly).
  // Only starts after the user has sent at least one message.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!hasInteracted.current) return;
    if (convStatus === "closed") return;

    const interval = convStatus === "human_takeover" ? 3000 : 10000;

    // Initialize known count on first poll start
    const initPoll = async () => {
      try {
        const r = await fetch(
          `${apiOrigin}/api/widget/${channelId}/status?sessionId=${sessionId.current}&since=0`
        );
        if (r.ok) {
          const d = await r.json();
          knownMessageCount.current = d.totalMessages ?? 0;
          if (d.status && d.status !== convStatus) {
            setConvStatus(d.status as ConversationStatus);
          }
        }
      } catch {
        // Ignore
      }
    };

    if (knownMessageCount.current === 0) {
      initPoll();
    }

    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(
          `${apiOrigin}/api/widget/${channelId}/status?sessionId=${sessionId.current}&since=${knownMessageCount.current}`
        );
        if (!r.ok) return;
        const d = await r.json();

        // Status change detection
        if (d.status && d.status !== convStatus) {
          setConvStatus(d.status as ConversationStatus);
        }

        // New human_agent messages
        if (d.newMessages && d.newMessages.length > 0) {
          const humanMsgs = d.newMessages.filter(
            (m: { role: string }) => m.role === "human_agent"
          );
          if (humanMsgs.length > 0) {
            setMessages((prev) => [
              ...prev,
              ...humanMsgs.map((m: { content: string }) => ({
                id: generateId(),
                role: "assistant" as const,
                content: m.content,
                timestamp: Date.now(),
                isHumanAgent: true,
              })),
            ]);
          }
          knownMessageCount.current = d.totalMessages;
        }
      } catch {
        // Ignore polling errors
      }
    }, interval);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [convStatus, apiOrigin, channelId]);

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;
      if (convStatus === "closed") return;

      hasInteracted.current = true;

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue("");
      setIsStreaming(true);
      setIsTyping(true);

      try {
        const response = await fetch(
          `${apiOrigin}/api/channels/${agentId}/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              userMessage: text.trim(),
              sessionId: sessionId.current,
            }),
          }
        );

        // Handle HITL status responses (non-streaming JSON)
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const data = await response.json();

          if (data.status === "human_takeover") {
            setConvStatus("human_takeover");
            setMessages((prev) => [
              ...prev,
              {
                id: generateId(),
                role: "assistant",
                content: data.message || "A team member will respond shortly.",
                timestamp: Date.now(),
              },
            ]);
            setIsStreaming(false);
            setIsTyping(false);
            return;
          }

          if (data.error === "conversation_paused") {
            setConvStatus("paused");
            setIsStreaming(false);
            setIsTyping(false);
            return;
          }

          if (data.error === "conversation_closed") {
            setConvStatus("closed");
            setIsStreaming(false);
            setIsTyping(false);
            return;
          }

          // Other JSON error
          if (!response.ok) {
            throw new Error(data.message || "Chat request failed");
          }
        }

        // Normal SSE streaming response
        if (!response.ok || !response.body) {
          throw new Error("Chat request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedText = "";
        let addedAssistant = false;

        const assistantMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: "",
          isStreaming: true,
          timestamp: Date.now(),
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "text-delta") {
                if (!addedAssistant) {
                  setMessages((prev) => [...prev, assistantMsg]);
                  addedAssistant = true;
                  setIsTyping(false);
                }
                accumulatedText += event.delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: accumulatedText }
                      : m
                  )
                );
              } else if (event.type === "done") {
                if (!addedAssistant && accumulatedText === "") {
                  accumulatedText =
                    event.assistantContent || "I processed your request.";
                  setMessages((prev) => [
                    ...prev,
                    {
                      ...assistantMsg,
                      content: accumulatedText,
                      isStreaming: false,
                    },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, isStreaming: false }
                        : m
                    )
                  );
                }
              } else if (event.type === "error") {
                if (!addedAssistant) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      ...assistantMsg,
                      content:
                        "Sorry, something went wrong. Please try again.",
                      isStreaming: false,
                    },
                  ]);
                }
              }
            } catch {
              // Parse error — skip this event
            }
          }
        }
      } catch {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content: "Sorry, I'm having trouble connecting. Please try again.",
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsStreaming(false);
        setIsTyping(false);
      }
    },
    [agentId, apiOrigin, token, isStreaming, convStatus]
  );

  // Save history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveHistory(
        channelId,
        messages.filter((m) => !m.isStreaming)
      );
    }
  }, [messages, channelId]);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    setInputValue(target.value);
    target.style.height = "38px";
    target.style.height = Math.min(target.scrollHeight, 100) + "px";
  }

  const showStarters =
    starters.length > 0 && messages.filter((m) => m.role === "user").length === 0;

  const avatarContent = config.agentAvatar;
  const isAvatarUrl = avatarContent?.startsWith("http");

  const panelClass = [
    "lp-chat-panel",
    isDark ? "lp-dark" : "",
    isSharp ? "lp-sharp" : "",
  ].filter(Boolean).join(" ");

  const inputDisabled = isStreaming || convStatus === "closed" || convStatus === "paused";

  return (
    <div class={panelClass} style={{ width: `${panelW}px`, height: `${panelH}px`, fontSize: `${fontSize}px` }}>
      {/* Header — primary color banner */}
      <div class="lp-header" style={{ backgroundColor: primaryColor }}>
        <div
          class="lp-header-avatar"
          style={{ backgroundColor: contrastColor === "#ffffff" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }}
        >
          {isAvatarUrl ? (
            <img src={avatarContent} alt={agentName} />
          ) : (
            <span style={{ color: contrastColor }}>{avatarContent || agentName.charAt(0)}</span>
          )}
        </div>
        <div class="lp-header-info">
          <div class="lp-header-name" style={{ color: contrastColor }}>{agentName}</div>
          <div class="lp-header-status" style={{ color: contrastMuted }}>
            <span style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: convStatus === "closed" ? "#71717a" : convStatus === "human_takeover" ? "#3b82f6" : "#22c55e",
              marginRight: "4px",
              verticalAlign: "middle",
            }} />
            {convStatus === "human_takeover" ? "Team member connected" : convStatus === "closed" ? "Closed" : "Online"}
          </div>
        </div>
        <button
          class="lp-close-btn"
          onClick={onClose}
          aria-label="Close chat"
          style={{ color: contrastMuted }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Status banner */}
      <StatusBanner status={convStatus} />

      {/* Messages */}
      <div class="lp-messages">
        {messages.length === 0 && (
          <div class="lp-welcome">{welcomeMessage}</div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            primaryColor={primaryColor}
          />
        ))}

        {isTyping && <TypingDots />}

        <div ref={messagesEndRef} />
      </div>

      {/* Conversation Starters */}
      {showStarters && (
        <div class="lp-starters">
          {starters.slice(0, 4).map((s) => (
            <button
              key={s}
              class="lp-starter-btn"
              onClick={() => sendMessage(s)}
              disabled={isStreaming}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div class="lp-input-area">
        <textarea
          ref={inputRef}
          class="lp-input"
          value={inputValue}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            convStatus === "closed"
              ? "This conversation has ended"
              : convStatus === "paused"
              ? "Conversation paused..."
              : "Type a message..."
          }
          rows={1}
          disabled={inputDisabled}
        />
        <button
          class="lp-send-btn"
          style={{ backgroundColor: primaryColor, color: contrastColor }}
          onClick={() => sendMessage(inputValue)}
          disabled={!inputValue.trim() || inputDisabled}
          aria-label="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Powered by */}
      {showBranding && (
        <div class="lp-powered">
          <a href="https://launchpath.io" target="_blank" rel="noopener noreferrer">
            Powered by LaunchPath
          </a>
        </div>
      )}
    </div>
  );
}

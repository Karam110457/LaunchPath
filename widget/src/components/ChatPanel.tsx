import { h } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { MessageBubble } from "./MessageBubble";
import { TypingDots } from "./TypingDots";
import { PreChatForm } from "./PreChatForm";
import { CsatSurvey } from "./CsatSurvey";
import type { WidgetConfig, Message, MessageAttachment, ConversationStatus, VisitorInfo } from "../types";
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

function loadVisitorInfo(channelId: string): VisitorInfo | null {
  try {
    const raw = localStorage.getItem(`lp_visitor_${channelId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveVisitorInfo(channelId: string, info: VisitorInfo) {
  try {
    localStorage.setItem(`lp_visitor_${channelId}`, JSON.stringify(info));
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
      <div role="status" aria-live="assertive" style={{
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
      <div role="status" aria-live="assertive" style={{
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
      <div role="status" aria-live="assertive" style={{
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

/* -------------------------------------------------------------------------- */
/*  Delivered receipt indicator                                                */
/* -------------------------------------------------------------------------- */

function DeliveredCheck() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: "4px",
      marginTop: "2px",
      marginRight: "4px",
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span style={{ fontSize: "10px", color: "#9ca3af" }}>Delivered</span>
    </div>
  );
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
  const [showCsat, setShowCsat] = useState(false);
  const [csatDismissed, setCsatDismissed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = useRef(getSessionId(channelId));
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const knownMessageCount = useRef(0);
  const hasInteracted = useRef(false);
  const prevStatusRef = useRef<ConversationStatus>("active");

  // Pre-chat form state
  const preChatEnabled = config.preChatForm?.enabled && (config.preChatForm.fields?.length ?? 0) > 0;
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(() =>
    loadVisitorInfo(channelId)
  );
  const needsPreChat = preChatEnabled && !visitorInfo && messages.length === 0;

  const primaryColor = config.primaryColor || "#6366f1";
  const contrastColor = getContrastColor(primaryColor);
  const contrastMuted = contrastColor === "#ffffff" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
  const agentName = config.agentName || "AI Assistant";
  const welcomeMessage = config.welcomeMessage || "Hi! How can I help you today?";
  const starters = config.conversationStarters ?? [];
  const isDark = config.theme === "dark";
  const isSharp = config.borderRadius === "sharp";
  const showBranding = config.showBranding !== false;

  // Show CSAT survey when conversation closes (if enabled)
  useEffect(() => {
    if (
      convStatus === "closed" &&
      prevStatusRef.current !== "closed" &&
      config.csatSurvey?.enabled &&
      !csatDismissed
    ) {
      setShowCsat(true);
    }
    prevStatusRef.current = convStatus;
  }, [convStatus, config.csatSurvey?.enabled, csatDismissed]);

  // Detect return-to-bot transition and inject system message
  useEffect(() => {
    if (
      convStatus === "active" &&
      (prevStatusRef.current === "human_takeover" || prevStatusRef.current === "paused") &&
      messages.length > 0
    ) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: "You're now back with our AI assistant. How else can I help?",
          timestamp: Date.now(),
        },
      ]);
    }
    // Note: prevStatusRef is updated in the CSAT effect above
  }, [convStatus]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input on open
  useEffect(() => {
    if (!needsPreChat) {
      inputRef.current?.focus();
    }
  }, [needsPreChat]);

  // ---------------------------------------------------------------------------
  // Background status polling
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!hasInteracted.current) return;
    if (convStatus === "closed") return;

    const interval = convStatus === "human_takeover" ? 3000 : 10000;

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

        if (d.status && d.status !== convStatus) {
          setConvStatus(d.status as ConversationStatus);
        }

        if (d.totalMessages != null && d.totalMessages > knownMessageCount.current) {
          const humanMsgs = (d.newMessages ?? []).filter(
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
  // Pre-chat form submission
  // ---------------------------------------------------------------------------
  function handlePreChatSubmit(info: VisitorInfo) {
    setVisitorInfo(info);
    saveVisitorInfo(channelId, info);
  }

  // ---------------------------------------------------------------------------
  // CSAT survey submission
  // ---------------------------------------------------------------------------
  function handleCsatSubmit(rating: number, feedback: string) {
    // Fire and forget — send rating to server
    fetch(`${apiOrigin}/api/widget/${channelId}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId.current,
        rating,
        feedback: feedback || undefined,
      }),
    }).catch(() => {});
  }

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
        const payload: Record<string, unknown> = {
          userMessage: text.trim(),
          sessionId: sessionId.current,
        };
        // Attach visitor info on first message
        if (visitorInfo) {
          payload.visitorInfo = visitorInfo;
        }

        const response = await fetch(
          `${apiOrigin}/api/channels/${agentId}/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        // Handle HITL status responses (non-streaming JSON — 423 or other error)
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const data = await response.json();

          // 423 = human_takeover or paused
          if (data.error === "human_takeover") {
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
    [agentId, apiOrigin, token, isStreaming, convStatus, visitorInfo]
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

  // ---------------------------------------------------------------------------
  // End chat (visitor-initiated close)
  // ---------------------------------------------------------------------------
  const [isClosing, setIsClosing] = useState(false);

  function handleEndChat() {
    if (isClosing || convStatus === "closed") return;
    setIsClosing(true);
    fetch(`${apiOrigin}/api/widget/${channelId}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId.current }),
    })
      .then((r) => {
        if (r.ok) setConvStatus("closed");
      })
      .catch(() => {})
      .finally(() => setIsClosing(false));
  }

  // ---------------------------------------------------------------------------
  // File upload
  // ---------------------------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = ""; // Reset so same file can be re-selected

    if (file.size > 5 * 1024 * 1024) {
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: "assistant", content: "File is too large. Maximum size is 5MB.", timestamp: Date.now() },
      ]);
      return;
    }

    setIsUploading(true);
    hasInteracted.current = true;

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("sessionId", sessionId.current);

      const res = await fetch(`${apiOrigin}/api/widget/${channelId}/upload`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json() as MessageAttachment;

      // Add user message with attachment
      const isImage = data.fileType.startsWith("image/");
      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: isImage ? "" : `Sent a file: ${data.fileName}`,
        timestamp: Date.now(),
        attachment: data,
      };
      setMessages((prev) => [...prev, userMsg]);

      // Send text message referencing the file so the AI knows about it
      await sendMessage(`[User attached a file: ${data.fileName} (${data.fileType})]`);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: "assistant", content: "Failed to upload file. Please try again.", timestamp: Date.now() },
      ]);
    } finally {
      setIsUploading(false);
    }
  }

  const inputDisabled = isStreaming || isUploading || convStatus === "closed" || convStatus === "paused";

  // Find the last user message index to show read receipt
  const lastUserMsgIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user" && !messages[i].isStreaming) return i;
    }
    return -1;
  })();

  // Show receipt only after the last user message when not streaming and there's a response after it
  const showReceipt = lastUserMsgIndex >= 0 && !isStreaming && !isTyping &&
    (messages.length > lastUserMsgIndex + 1 || lastUserMsgIndex === messages.length - 1);

  // ---------------------------------------------------------------------------
  // Focus trap + keyboard handling
  // ---------------------------------------------------------------------------
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Focus trap: Tab cycles within the panel
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      class={panelClass}
      style={{ width: `${panelW}px`, height: `${panelH}px`, fontSize: `${fontSize}px` }}
      role="dialog"
      aria-label={`Chat with ${agentName}`}
      aria-modal="true"
    >
      {/* Header — primary color banner */}
      <div class="lp-header" role="banner" style={{ backgroundColor: primaryColor }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {config.endChat?.enabled !== false && convStatus !== "closed" && messages.length > 0 && (
            <button
              onClick={handleEndChat}
              disabled={isClosing}
              aria-label="End chat"
              style={{
                background: "none",
                border: `1px solid ${contrastColor === "#ffffff" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)"}`,
                borderRadius: "12px",
                padding: "3px 10px",
                cursor: isClosing ? "default" : "pointer",
                color: contrastMuted,
                fontSize: "11px",
                fontWeight: 500,
                opacity: isClosing ? 0.5 : 1,
                transition: "opacity 150ms",
              }}
            >
              {isClosing ? "Ending..." : "End Chat"}
            </button>
          )}
          <button
            class="lp-close-btn"
            onClick={onClose}
            aria-label="Minimize chat"
            style={{ color: contrastMuted }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status banner */}
      <StatusBanner status={convStatus} />

      {/* CSAT Survey overlay */}
      {showCsat && !csatDismissed && (
        <CsatSurvey
          primaryColor={primaryColor}
          isDark={isDark}
          onSubmit={handleCsatSubmit}
          onDismiss={() => { setShowCsat(false); setCsatDismissed(true); }}
        />
      )}

      {/* Pre-chat form gate */}
      {needsPreChat && !showCsat ? (
        <PreChatForm
          fields={config.preChatForm!.fields}
          primaryColor={primaryColor}
          isDark={isDark}
          onSubmit={handlePreChatSubmit}
        />
      ) : !showCsat ? (
        <>
          {/* Messages */}
          <div class="lp-messages" role="log" aria-live="polite" aria-label="Conversation messages">
            {messages.length === 0 && (
              <div class="lp-welcome">{welcomeMessage}</div>
            )}

            {messages.map((msg, i) => (
              <div key={msg.id}>
                <MessageBubble
                  message={msg}
                  primaryColor={primaryColor}
                />
                {/* Read receipt after last user message */}
                {msg.role === "user" && i === lastUserMsgIndex && showReceipt && (
                  <DeliveredCheck />
                )}
              </div>
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
            {config.fileUpload?.enabled !== false && (
              <>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                  aria-hidden="true"
                />
                {/* Attachment button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={inputDisabled}
                  aria-label="Attach file"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: inputDisabled ? "default" : "pointer",
                    padding: "6px",
                    color: isDark ? "#6b7280" : "#9ca3af",
                    opacity: inputDisabled ? 0.4 : 1,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    transition: "color 0.15s",
                  }}
                >
                  {isUploading ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style={{ animation: "lp-bounce 1s ease-in-out infinite" }}>
                      <circle cx="12" cy="12" r="10" stroke-dasharray="30" stroke-dashoffset="10" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  )}
                </button>
              </>
            )}
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
                  : isUploading
                  ? "Uploading file..."
                  : "Type a message..."
              }
              rows={1}
              disabled={inputDisabled}
              aria-label="Message input"
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
        </>
      ) : null}

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

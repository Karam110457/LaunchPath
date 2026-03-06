import { h } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { MessageBubble } from "./MessageBubble";
import { TypingDots } from "./TypingDots";
import type { WidgetConfig, Message } from "../types";
import { getContrastColor } from "../contrast";

interface ChatPanelProps {
  config: WidgetConfig;
  token: string;
  agentId: string;
  channelId: string;
  apiOrigin: string;
  onClose: () => void;
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

export function ChatPanel({
  config,
  token,
  agentId,
  channelId,
  apiOrigin,
  onClose,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() =>
    loadHistory(channelId)
  );
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = useRef(getSessionId(channelId));

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

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };

      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        isStreaming: true,
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

        if (!response.ok || !response.body) {
          throw new Error("Chat request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedText = "";
        let addedAssistant = false;

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
    [agentId, apiOrigin, token, isStreaming]
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

  return (
    <div class={panelClass}>
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
            <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e", marginRight: "4px", verticalAlign: "middle" }} />
            Online
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
          placeholder="Type a message..."
          rows={1}
          disabled={isStreaming}
        />
        <button
          class="lp-send-btn"
          style={{ backgroundColor: primaryColor, color: contrastColor }}
          onClick={() => sendMessage(inputValue)}
          disabled={!inputValue.trim() || isStreaming}
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

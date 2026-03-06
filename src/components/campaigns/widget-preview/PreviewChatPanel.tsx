"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  PreviewMessageBubble,
  type PreviewMessage,
} from "./PreviewMessageBubble";
import type { WidgetConfig } from "@/lib/channels/types";
import { getContrastColor } from "./contrast";

interface PreviewChatPanelProps {
  config: WidgetConfig;
  token: string;
  agentId: string;
  apiOrigin: string;
  position: "right" | "left";
  onClose: () => void;
  canChat: boolean;
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function PreviewChatPanel({
  config,
  token,
  agentId,
  apiOrigin,
  position,
  onClose,
  canChat,
}: PreviewChatPanelProps) {
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef(generateId());

  const primaryColor = config.primaryColor || "#6366f1";
  const contrastColor = getContrastColor(primaryColor);
  const contrastMuted = contrastColor === "#ffffff" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
  const agentName = config.agentName || "AI Assistant";
  const welcomeMessage =
    config.welcomeMessage || "Hi! How can I help you today?";
  const starters = config.conversationStarters ?? [];
  const isDark = config.theme === "dark";
  const isSharp = config.borderRadius === "sharp";
  const showBranding = config.showBranding !== false;

  const avatarContent = config.agentAvatar;
  const isAvatarUrl = avatarContent?.startsWith("http");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || !canChat) return;

      const userMsg: PreviewMessage = {
        id: generateId(),
        role: "user",
        content: text.trim(),
      };

      const assistantMsg: PreviewMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        isStreaming: true,
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
              sessionId: sessionIdRef.current,
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
              // Parse error — skip
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
            content:
              "Sorry, I'm having trouble connecting. Please try again.",
          },
        ]);
      } finally {
        setIsStreaming(false);
        setIsTyping(false);
      }
    },
    [agentId, apiOrigin, token, isStreaming, canChat]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value);
    const target = e.target;
    target.style.height = "38px";
    target.style.height = Math.min(target.scrollHeight, 100) + "px";
  }

  const showStarters =
    starters.length > 0 &&
    messages.filter((m) => m.role === "user").length === 0;

  return (
    <div
      className={`absolute w-[380px] ${isSharp ? "rounded-lg" : "rounded-2xl"} shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 ${
        isDark ? "bg-gray-900" : "bg-white"
      } ${position === "right" ? "right-5" : "left-5"}`}
      style={{ bottom: "88px", maxHeight: "calc(100% - 104px)", height: "520px" }}
    >
      {/* Header — primary color banner */}
      <div
        className="px-4 py-3.5 flex items-center gap-2.5 shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 overflow-hidden"
          style={{ backgroundColor: contrastColor === "#ffffff" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }}
        >
          {isAvatarUrl ? (
            <img
              src={avatarContent}
              alt={agentName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span style={{ color: contrastColor }}>
              {avatarContent || agentName.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-tight" style={{ color: contrastColor }}>
            {agentName}
          </div>
          <div className="text-[11px] leading-tight flex items-center gap-1" style={{ color: contrastMuted }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Online
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: contrastMuted }}
          aria-label="Close chat"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 flex flex-col gap-2 scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded ${isDark ? "[&::-webkit-scrollbar-thumb]:bg-gray-600" : "[&::-webkit-scrollbar-thumb]:bg-gray-300"}`}>
        {messages.length === 0 && (
          <div className={`self-start px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed ${isDark ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-900"}`}>
            {welcomeMessage}
          </div>
        )}

        {messages.map((msg) => (
          <PreviewMessageBubble
            key={msg.id}
            message={msg}
            primaryColor={primaryColor}
            isDark={isDark}
          />
        ))}

        {isTyping && (
          <div className={`self-start px-4 py-2.5 rounded-2xl rounded-bl-sm flex gap-1 items-center ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
            <span className={`w-[7px] h-[7px] rounded-full animate-bounce ${isDark ? "bg-gray-500" : "bg-gray-400"}`} />
            <span
              className={`w-[7px] h-[7px] rounded-full animate-bounce ${isDark ? "bg-gray-500" : "bg-gray-400"}`}
              style={{ animationDelay: "0.16s" }}
            />
            <span
              className={`w-[7px] h-[7px] rounded-full animate-bounce ${isDark ? "bg-gray-500" : "bg-gray-400"}`}
              style={{ animationDelay: "0.32s" }}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starters */}
      {showStarters && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5 shrink-0">
          {starters.slice(0, 4).map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={isStreaming}
              className={`px-3.5 py-1.5 rounded-full border text-[13px] transition-colors whitespace-nowrap ${
                isDark
                  ? "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:border-gray-600"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Deploy notice */}
      {!canChat && (
        <div className={`px-4 py-2 border-t shrink-0 ${isDark ? "bg-amber-900/30 border-amber-800/40" : "bg-amber-50 border-amber-100"}`}>
          <p className={`text-[11px] text-center ${isDark ? "text-amber-400" : "text-amber-700"}`}>
            Click &ldquo;Save&rdquo; to enable live chat testing
          </p>
        </div>
      )}

      {/* Input */}
      <div className={`px-4 py-3 border-t flex gap-2 items-end shrink-0 ${isDark ? "border-gray-700" : "border-gray-100"}`}>
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={canChat ? "Type a message..." : "Save to enable chat..."}
          rows={1}
          disabled={isStreaming || !canChat}
          className={`flex-1 resize-none border rounded-xl px-3 py-2 text-sm outline-none transition-colors min-h-[38px] max-h-[100px] disabled:opacity-60 ${
            isDark
              ? "border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500 focus:border-indigo-400"
              : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-indigo-500"
          }`}
        />
        <button
          onClick={() => sendMessage(inputValue)}
          disabled={!inputValue.trim() || isStreaming || !canChat}
          className="w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0 transition-opacity disabled:opacity-50 disabled:cursor-default hover:opacity-90"
          style={{ backgroundColor: primaryColor, color: contrastColor }}
          aria-label="Send message"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Powered by */}
      {showBranding && (
        <div className={`text-center py-1.5 text-[10px] shrink-0 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
          <a
            href="https://launchpath.io"
            target="_blank"
            rel="noopener noreferrer"
            className={`no-underline ${isDark ? "text-gray-600 hover:text-gray-500" : "text-gray-400 hover:text-gray-500"}`}
          >
            Powered by LaunchPath
          </a>
        </div>
      )}
    </div>
  );
}

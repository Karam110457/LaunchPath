"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  PreviewMessageBubble,
  type PreviewMessage,
} from "./PreviewMessageBubble";
import type { WidgetConfig } from "@/lib/channels/types";

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
  const agentName = config.agentName || "AI Assistant";
  const welcomeMessage =
    config.welcomeMessage || "Hi! How can I help you today?";
  const starters = config.conversationStarters ?? [];
  const headerText = config.headerText || agentName;

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
      className={`absolute w-[380px] h-[520px] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 ${
        position === "right" ? "right-5" : "left-5"
      }`}
      style={{ bottom: "88px" }}
    >
      {/* Header */}
      <div className="px-4 py-3.5 flex items-center gap-2.5 border-b border-gray-100 shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shrink-0 overflow-hidden"
          style={{ backgroundColor: primaryColor }}
        >
          {isAvatarUrl ? (
            <img
              src={avatarContent}
              alt={agentName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{avatarContent || agentName.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 leading-tight">
            {headerText}
          </div>
          <div className="text-[11px] text-green-500 leading-tight">
            Online
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
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
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded">
        {messages.length === 0 && (
          <div className="self-start bg-gray-100 text-gray-900 px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed">
            {welcomeMessage}
          </div>
        )}

        {messages.map((msg) => (
          <PreviewMessageBubble
            key={msg.id}
            message={msg}
            primaryColor={primaryColor}
          />
        ))}

        {isTyping && (
          <div className="self-start bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm flex gap-1 items-center">
            <span className="w-[7px] h-[7px] bg-gray-400 rounded-full animate-bounce" />
            <span
              className="w-[7px] h-[7px] bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.16s" }}
            />
            <span
              className="w-[7px] h-[7px] bg-gray-400 rounded-full animate-bounce"
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
              className="px-3.5 py-1.5 rounded-full border border-gray-200 bg-white text-[13px] text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Deploy notice */}
      {!canChat && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 shrink-0">
          <p className="text-[11px] text-amber-700 text-center">
            Click &ldquo;Save&rdquo; to enable live chat testing
          </p>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2 items-end shrink-0">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={canChat ? "Type a message..." : "Save to enable chat..."}
          rows={1}
          disabled={isStreaming || !canChat}
          className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors min-h-[38px] max-h-[100px] text-gray-900 placeholder:text-gray-400 bg-white disabled:opacity-60"
        />
        <button
          onClick={() => sendMessage(inputValue)}
          disabled={!inputValue.trim() || isStreaming || !canChat}
          className="w-[38px] h-[38px] rounded-xl flex items-center justify-center text-white shrink-0 transition-opacity disabled:opacity-50 disabled:cursor-default hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
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
      <div className="text-center py-1.5 text-[10px] text-gray-400 shrink-0">
        <a
          href="https://launchpath.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 no-underline hover:text-gray-500"
        >
          Powered by LaunchPath
        </a>
      </div>
    </div>
  );
}

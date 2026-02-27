"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface BuilderChatProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
}

export function BuilderChat({
  messages,
  isStreaming,
  onSendMessage,
}: BuilderChatProps) {
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    onSendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4" aria-live="polite" aria-relevant="additions">
        {!hasMessages && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 space-y-3">
            <p className="text-sm font-semibold text-foreground font-serif italic">
              Customize your page
            </p>
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
              Tell me what to change. Try &ldquo;Make the headline more
              urgent&rdquo; or &ldquo;Add a phone number field.&rdquo;
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border/50 text-foreground rounded-bl-md"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                  <ReactMarkdown>
                    {msg.content || (isStreaming ? "..." : "")}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {isStreaming &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "assistant" &&
          messages[messages.length - 1].content === "" && (
            <div className="flex justify-start">
              <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-2.5">
                <Loader2 className="size-4 animate-spin text-primary" />
              </div>
            </div>
          )}
      </div>

      {/* Input bar */}
      <div className="border-t border-border px-4 py-3">
        <div
          className={cn(
            "flex items-end gap-2 rounded-xl border bg-card/60 backdrop-blur-sm px-3 py-2 transition-colors duration-200",
            "focus-within:border-primary/40 focus-within:shadow-sm focus-within:shadow-primary/5",
            "border-border/60"
          )}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what to change..."
            aria-label="Message to builder assistant"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[24px] max-h-[120px]"
            style={{ fieldSizing: "content" as never }}
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            aria-label="Send message"
            className={cn(
              "shrink-0 flex items-center justify-center size-8 rounded-lg transition-all duration-200",
              input.trim() && !isStreaming
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * InputBar — floating glassy message input.
 * Disabled while the agent is streaming. Enter to send, Shift+Enter for newline.
 * Subdued when a card is awaiting interaction (still functional, just de-emphasized).
 */

import { useState, useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  subdued?: boolean;
  embedded?: boolean;
}

export function InputBar({ onSend, disabled = false, subdued = false, embedded = false }: InputBarProps) {
  const [value, setValue] = useState("");
  const [justSent, setJustSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    // Brief visual feedback before the streaming state kicks in
    setJustSent(true);
    if (sentTimerRef.current) clearTimeout(sentTimerRef.current);
    sentTimerRef.current = setTimeout(() => setJustSent(false), 500);
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Glassy floating card */}
      <div
        className={cn(
          "flex items-end gap-3 rounded-2xl px-4 border transition-all duration-200 focus-within:border-primary/50 focus-within:shadow-primary/5",
          embedded
            ? "bg-white/80 backdrop-blur-xl border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.06)] py-3"
            : "bg-card/80 backdrop-blur-md py-3 border-border/60 shadow-xl shadow-black/30",
          subdued && !embedded && "py-2 border-border/30 shadow-none",
          (disabled || justSent) && "opacity-60"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={
            disabled
              ? "Agent is thinking\u2026"
              : subdued
                ? "You can also type a response\u2026"
                : "Type a message\u2026"
          }
          className={cn(
            "flex-1 resize-none bg-transparent text-sm outline-none min-h-[24px] max-h-[160px] py-0.5",
            embedded ? "text-zinc-800 placeholder:text-zinc-400" : "text-foreground placeholder:text-muted-foreground/60"
          )}
          style={{ lineHeight: "1.5" }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
          className={cn(
            "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 mb-0.5",
            value.trim() && !disabled
              ? "gradient-accent-bg text-white hover:opacity-90 shadow-sm shadow-[#FF8C00]/20"
              : "bg-muted/60 text-muted-foreground cursor-not-allowed"
          )}
          style={justSent ? { transform: "scale(1.1)", opacity: 0.6 } : undefined}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hint */}
      <p className={cn(
        "mt-2 text-center text-[11px]",
        embedded ? "text-zinc-500 font-medium" : "text-muted-foreground/40"
      )}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

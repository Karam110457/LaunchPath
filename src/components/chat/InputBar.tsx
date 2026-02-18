"use client";

/**
 * InputBar — floating glassy message input.
 * Disabled while the agent is streaming. Enter to send, Shift+Enter for newline.
 */

import { useState, useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function InputBar({ onSend, disabled = false }: InputBarProps) {
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
          "flex items-end gap-3 rounded-2xl px-4 py-3",
          "bg-card/80 backdrop-blur-md",
          "border border-border/60",
          "shadow-xl shadow-black/30",
          "transition-all duration-200",
          "focus-within:border-primary/50 focus-within:shadow-primary/5",
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
          placeholder={disabled ? "Agent is thinking…" : "Type a message…"}
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none min-h-[24px] max-h-[160px] py-0.5"
          style={{ lineHeight: "1.5" }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
          className={cn(
            "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 mb-0.5",
            value.trim() && !disabled
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/30"
              : "bg-muted/60 text-muted-foreground cursor-not-allowed"
          )}
          style={justSent ? { transform: "scale(1.1)", opacity: 0.6 } : undefined}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hint */}
      <p className="mt-2 text-center text-[11px] text-muted-foreground/40">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

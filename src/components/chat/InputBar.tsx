"use client";

/**
 * InputBar — the pinned message input at the bottom of the chat.
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
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
    // Auto-grow textarea
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex-shrink-0 border-t border-zinc-200 bg-white px-4 py-3">
      <div
        className={cn(
          "flex items-end gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2",
          "focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-400",
          disabled && "opacity-60"
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
          className="flex-1 resize-none bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none min-h-[24px] max-h-[160px] py-0.5"
          style={{ lineHeight: "1.5" }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
          className={cn(
            "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
            value.trim() && !disabled
              ? "bg-zinc-900 text-white hover:bg-zinc-700"
              : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-zinc-400">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

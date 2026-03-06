"use client";

import { useState, useEffect } from "react";

interface GreetingBubbleProps {
  message: string;
  delay: number;
  position: "right" | "left";
  isDark?: boolean;
  isSharp?: boolean;
  onDismiss: () => void;
  onClick: () => void;
  /** Offset from bottom for the bubble (accounts for launcher size) */
  bottomOffset: number;
}

export function GreetingBubble({
  message,
  delay,
  position,
  isDark,
  isSharp,
  onDismiss,
  onClick,
  bottomOffset,
}: GreetingBubbleProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <div
      className={`absolute flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        position === "right" ? "right-5" : "left-5"
      }`}
      style={{ bottom: `${bottomOffset}px` }}
    >
      <div
        onClick={onClick}
        className={`relative max-w-[240px] px-3.5 py-2.5 text-sm leading-relaxed shadow-lg cursor-pointer transition-transform hover:scale-[1.02] ${
          isSharp ? "rounded-lg" : "rounded-2xl"
        } ${
          isDark
            ? "bg-gray-800 text-gray-200 shadow-gray-900/40"
            : "bg-white text-gray-800 shadow-gray-200/60"
        }`}
      >
        {/* Close X */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className={`absolute -top-1.5 ${position === "right" ? "-left-1.5" : "-right-1.5"} w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-colors ${
            isDark
              ? "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          }`}
          aria-label="Dismiss greeting"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {message}

        {/* Tail pointer */}
        <div
          className={`absolute -bottom-[6px] ${
            position === "right" ? "right-6" : "left-6"
          } w-3 h-3 rotate-45 ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        />
      </div>
    </div>
  );
}

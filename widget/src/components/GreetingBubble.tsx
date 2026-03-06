import { h } from "preact";
import { useState, useEffect } from "preact/hooks";

interface GreetingBubbleProps {
  message: string;
  delay: number;
  position: "right" | "left";
  isDark: boolean;
  isSharp: boolean;
  onDismiss: () => void;
  onClick: () => void;
}

export function GreetingBubble({
  message,
  delay,
  position,
  isDark,
  isSharp,
  onDismiss,
  onClick,
}: GreetingBubbleProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <div
      class={`lp-greeting lp-greeting-${position}`}
      onClick={onClick}
    >
      <button
        class={`lp-greeting-close lp-greeting-close-${position}`}
        onClick={(e: Event) => {
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Dismiss"
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      {message}
      <div class={`lp-greeting-tail lp-greeting-tail-${position}`} />
    </div>
  );
}

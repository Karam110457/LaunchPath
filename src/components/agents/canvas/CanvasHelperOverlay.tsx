"use client";

import { useState, useEffect } from "react";
import { X, MousePointerClick, Database, Wrench } from "lucide-react";

const STORAGE_KEY = "launchpath_canvas_helpers_dismissed";

interface HelperBubble {
  id: string;
  icon: React.ReactNode;
  text: string;
  position: string; // Tailwind positioning classes
}

const BUBBLES: HelperBubble[] = [
  {
    id: "agent",
    icon: <MousePointerClick className="w-3.5 h-3.5 text-primary shrink-0" />,
    text: "Double-click the agent to edit personality, tone, and behavior",
    position: "top-[110px] left-1/2 -translate-x-1/2",
  },
  {
    id: "knowledge",
    icon: <Database className="w-3.5 h-3.5 text-violet-400 shrink-0" />,
    text: "Double-click to add documents, FAQs, and website content",
    position: "bottom-[100px] left-8",
  },
  {
    id: "tools",
    icon: <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
    text: "Click 'Add Tool' to connect Calendly, CRM, webhooks, and more",
    position: "top-[110px] right-[180px]",
  },
];

export function CanvasHelperOverlay() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [allDismissed, setAllDismissed] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setAllDismissed(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const dismissBubble = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      // If all bubbles dismissed, persist globally
      if (next.size >= BUBBLES.length) {
        try {
          localStorage.setItem(STORAGE_KEY, "true");
        } catch {
          // ignore
        }
        setAllDismissed(true);
      }
      return next;
    });
  };

  const dismissAll = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setAllDismissed(true);
  };

  if (allDismissed) return null;

  const visibleBubbles = BUBBLES.filter((b) => !dismissed.has(b.id));
  if (visibleBubbles.length === 0) return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {visibleBubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`absolute ${bubble.position} pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-500`}
        >
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-card/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-lg max-w-[260px]">
            <div className="mt-0.5">{bubble.icon}</div>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1">
              {bubble.text}
            </p>
            <button
              onClick={() => dismissBubble(bubble.id)}
              className="p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0 -mt-0.5 -mr-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}

      {/* Dismiss all link */}
      {visibleBubbles.length > 1 && (
        <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            onClick={dismissAll}
            className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors underline underline-offset-2"
          >
            Dismiss all tips
          </button>
        </div>
      )}
    </div>
  );
}

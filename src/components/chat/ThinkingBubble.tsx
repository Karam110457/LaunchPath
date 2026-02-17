"use client";

/**
 * ThinkingBubble — shows the agent's reasoning process while it thinks.
 * Collapsible: shows "Thinking..." with an animated indicator,
 * click to expand and see the streaming reasoning text.
 */

import { useState, useEffect, useRef } from "react";
import { Brain, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingBubbleProps {
  thinkingText: string;
  isThinking: boolean;
}

export function ThinkingBubble({ thinkingText, isThinking }: ThinkingBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the thinking text when expanded
  useEffect(() => {
    if (isExpanded && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [thinkingText, isExpanded]);

  return (
    <div className="px-4">
      <div className="max-w-[600px]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-2 text-xs transition-colors rounded-lg px-3 py-2",
            "bg-zinc-50 hover:bg-zinc-100 text-zinc-500",
            isThinking && "animate-pulse"
          )}
        >
          <Brain className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-medium">
            {isThinking ? "Thinking..." : "Thought process"}
          </span>
          {isThinking && (
            <span className="flex gap-0.5 ml-1">
              <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-3 h-3 ml-auto transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </button>

        {isExpanded && thinkingText && (
          <div
            ref={textRef}
            className="mt-1 px-3 py-2 bg-zinc-50 rounded-lg border border-zinc-100 max-h-[200px] overflow-y-auto"
          >
            <p className="text-[11px] leading-relaxed text-zinc-400 whitespace-pre-wrap font-mono">
              {thinkingText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

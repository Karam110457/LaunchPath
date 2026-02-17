"use client";

/**
 * ThinkingBubble — shows the agent's extended reasoning process.
 *
 * Active state: shimmer sweep + rotating arc icon + elapsed-second counter + glow
 * Done state: static "Reasoned for Xs" with brain icon
 * Expandable to read the full reasoning text.
 */

import { useState, useEffect, useRef } from "react";
import { Brain, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingBubbleProps {
  thinkingText: string;
  isThinking: boolean;
}

export function ThinkingBubble({ thinkingText, isThinking }: ThinkingBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalSeconds, setFinalSeconds] = useState<number | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start/stop elapsed timer
  useEffect(() => {
    if (isThinking) {
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      setFinalSeconds(null);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setFinalSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isThinking]);

  // Auto-scroll the thinking text when expanded
  useEffect(() => {
    if (isExpanded && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [thinkingText, isExpanded]);

  const displayTime = finalSeconds !== null ? finalSeconds : elapsedSeconds;

  return (
    <div>
      {/* Pill button */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className={cn(
          "group relative flex items-center gap-2.5 text-xs rounded-xl px-3 py-2 overflow-hidden",
          "border transition-all duration-300 cursor-pointer select-none",
          isThinking
            ? "bg-card border-primary/25 text-muted-foreground"
            : "bg-card border-border hover:border-border/80 text-muted-foreground"
        )}
        style={isThinking ? { animation: "thinking-glow 2.5s ease-in-out infinite" } : undefined}
      >
        {/* Shimmer sweep — only while actively thinking */}
        {isThinking && (
          <span
            className="pointer-events-none absolute inset-0 -skew-x-12 w-1/3 bg-gradient-to-r from-transparent via-primary/8 to-transparent"
            style={{ animation: "shimmer-sweep 2.2s ease-in-out infinite" }}
          />
        )}

        {/* Icon */}
        <span className="relative flex-shrink-0 flex items-center justify-center w-4 h-4">
          {isThinking ? (
            <>
              {/* Outer ring */}
              <span className="absolute inset-0 rounded-full border border-primary/30" />
              {/* Rotating arc (top quarter) */}
              <span
                className="absolute inset-[-1px] rounded-full border-t-2 border-r-transparent border-b-transparent border-l-transparent border-primary/80"
                style={{ animation: "thinking-arc 1s linear infinite" }}
              />
              {/* Center dot */}
              <span className="w-1 h-1 rounded-full bg-primary/60" />
            </>
          ) : (
            <Brain className="w-3.5 h-3.5 text-muted-foreground/70" />
          )}
        </span>

        {/* Label */}
        <span className="font-medium tracking-tight">
          {isThinking
            ? elapsedSeconds > 0
              ? `Thinking… ${elapsedSeconds}s`
              : "Thinking…"
            : displayTime !== null && displayTime > 0
              ? `Reasoned for ${displayTime}s`
              : "Thought process"}
        </span>

        {/* Sparkle icon when done and thinking text exists */}
        {!isThinking && thinkingText && (
          <Sparkles className="w-3 h-3 text-primary/50 ml-0.5" />
        )}

        {/* Expand chevron */}
        <ChevronDown
          className={cn(
            "w-3 h-3 ml-auto transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded reasoning text */}
      {isExpanded && thinkingText && (
        <div
          className="mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div
            ref={textRef}
            className="px-3 py-2.5 bg-muted/50 rounded-xl border border-border/60 max-h-[220px] overflow-y-auto"
          >
            <p className="text-[11px] leading-relaxed text-muted-foreground/80 whitespace-pre-wrap font-mono">
              {thinkingText}
              {isThinking && (
                <span
                  className="inline-block w-px h-3 bg-muted-foreground/60 ml-0.5 -mb-0.5"
                  style={{ animation: "cursor-blink 1.06s step-end infinite" }}
                />
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

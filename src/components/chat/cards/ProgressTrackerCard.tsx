"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardData, ProgressStep } from "@/lib/chat/types";

interface ProgressTrackerCardProps {
  card: Extract<CardData, { type: "progress-tracker" }>;
}

export default function ProgressTrackerCard({ card }: ProgressTrackerCardProps) {
  const total = card.steps.length;
  const doneCount = card.steps.filter((s) => s.status === "done").length;

  // Track which step IDs were just completed so we can play the bounce animation
  const [recentlyDone, setRecentlyDone] = useState<Set<string>>(new Set());
  const prevDoneRef = useRef<Set<string>>(
    new Set(card.steps.filter((s) => s.status === "done").map((s) => s.id))
  );

  useEffect(() => {
    const currentDone = new Set(
      card.steps.filter((s) => s.status === "done").map((s) => s.id)
    );
    const newlyDone: string[] = [];
    currentDone.forEach((id) => {
      if (!prevDoneRef.current.has(id)) newlyDone.push(id);
    });
    prevDoneRef.current = currentDone;
    if (newlyDone.length > 0) {
      setRecentlyDone(new Set(newlyDone));
      const t = setTimeout(() => setRecentlyDone(new Set()), 350);
      return () => clearTimeout(t);
    }
  }, [card.steps]);

  return (
    <div className="max-w-[600px] w-full rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Header: title + counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground font-serif italic">
          {card.title}
        </p>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {doneCount}/{total}
        </span>
      </div>

      {/* Segmented progress bar — 3px so it's actually visible on dark bg */}
      <div className="flex gap-1">
        {card.steps.map((step, i) => {
          const isDone = step.status === "done";
          const isActive = step.status === "active";
          return (
            <div
              key={step.id}
              className={cn(
                "h-[3px] flex-1 rounded-full transition-all duration-500",
                isDone && "bg-primary",
                isActive && "bg-primary/60 animate-pulse",
                !isDone && !isActive && "bg-border"
              )}
              style={{ animationDelay: isActive ? `${i * 100}ms` : undefined }}
            />
          );
        })}
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {card.steps.map((step: ProgressStep) => (
          <StepRow
            key={step.id}
            step={step}
            isRecentlyDone={recentlyDone.has(step.id)}
          />
        ))}
      </div>
    </div>
  );
}

function StepRow({
  step,
  isRecentlyDone,
}: {
  step: ProgressStep;
  isRecentlyDone: boolean;
}) {
  const isDone = step.status === "done";
  const isActive = step.status === "active";
  const isPending = step.status === "pending";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300",
        isActive && "bg-muted/50"
      )}
    >
      {/* Icon */}
      <span className="shrink-0 flex items-center justify-center size-5">
        {isDone && (
          <span
            className="flex size-5 items-center justify-center rounded-full bg-primary"
            style={
              isRecentlyDone
                ? { animation: "step-done-bounce 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both" }
                : undefined
            }
          >
            <Check className="size-3 text-primary-foreground" strokeWidth={3} />
          </span>
        )}
        {isActive && (
          <span className="relative flex size-5 items-center justify-center">
            {/* Glow ring behind the spinner */}
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "1.5s" }} />
            <Loader2 className="size-5 text-primary animate-spin relative" />
          </span>
        )}
        {isPending && (
          <span className="size-5 rounded-full border-2 border-border" />
        )}
      </span>

      {/* Label */}
      <span
        className={cn(
          "text-sm transition-colors duration-300",
          isDone && "text-foreground/70 font-medium",
          isActive && "text-foreground font-semibold",
          isPending && "text-muted-foreground"
        )}
        style={
          isRecentlyDone
            ? { animation: "none", color: "oklch(0.60 0.16 165)" }
            : undefined
        }
      >
        {step.label}
      </span>
    </div>
  );
}

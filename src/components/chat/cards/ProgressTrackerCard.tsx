"use client";

import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardData, ProgressStep } from "@/lib/chat/types";

interface ProgressTrackerCardProps {
  card: Extract<CardData, { type: "progress-tracker" }>;
}

export default function ProgressTrackerCard({ card }: ProgressTrackerCardProps) {
  const total = card.steps.length;
  const doneCount = card.steps.filter((s) => s.status === "done").length;
  const hasActive = card.steps.some((s) => s.status === "active");

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

      {/* Segmented progress bar */}
      <div className="flex gap-1">
        {card.steps.map((step, i) => {
          const isDone = step.status === "done";
          const isActive = step.status === "active";
          return (
            <div
              key={step.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                isDone && "bg-primary",
                isActive && "bg-primary animate-pulse",
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
          <StepRow key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}

function StepRow({ step }: { step: ProgressStep }) {
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
          <span className="flex size-5 items-center justify-center rounded-full bg-primary">
            <Check className="size-3 text-primary-foreground" strokeWidth={3} />
          </span>
        )}
        {isActive && (
          <Loader2 className="size-5 text-primary animate-spin" />
        )}
        {isPending && (
          <span className="size-5 rounded-full border-2 border-border" />
        )}
      </span>

      {/* Label */}
      <span
        className={cn(
          "text-sm transition-colors duration-300",
          isDone && "text-primary font-medium",
          isActive && "text-foreground font-semibold",
          isPending && "text-muted-foreground"
        )}
      >
        {step.label}
      </span>
    </div>
  );
}

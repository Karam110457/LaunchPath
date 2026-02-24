"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnalysisStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
}

interface AnalysisProgressProps {
  steps: AnalysisStep[];
}

export function AnalysisProgress({ steps }: AnalysisProgressProps) {
  const total = steps.length;
  const doneCount = steps.filter((s) => s.status === "done").length;

  // Track which step IDs just completed for bounce animation
  const [recentlyDone, setRecentlyDone] = useState<Set<string>>(new Set());
  const prevDoneRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentDone = new Set(
      steps.filter((s) => s.status === "done").map((s) => s.id)
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
  }, [steps]);

  return (
    <div className="max-w-xl mx-auto px-4">
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground font-serif italic">
            Analysing Your Submission
          </p>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {doneCount}/{total}
          </span>
        </div>

        {/* Segmented progress bar */}
        <div
          className="flex gap-1"
          role="progressbar"
          aria-valuenow={doneCount}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`Analysis progress: ${doneCount} of ${total} steps complete`}
        >
          {steps.map((step, i) => {
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
                style={{
                  animationDelay: isActive ? `${i * 100}ms` : undefined,
                }}
              />
            );
          })}
        </div>

        {/* Step list */}
        <div className="space-y-1">
          {steps.map((step) => {
            const isDone = step.status === "done";
            const isActive = step.status === "active";
            const isPending = step.status === "pending";
            const justDone = recentlyDone.has(step.id);

            return (
              <div
                key={step.id}
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
                        justDone
                          ? {
                              animation:
                                "step-done-bounce 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
                            }
                          : undefined
                      }
                    >
                      <Check
                        className="size-3 text-primary-foreground"
                        strokeWidth={3}
                      />
                    </span>
                  )}
                  {isActive && (
                    <span className="relative flex size-5 items-center justify-center">
                      <span
                        className="absolute inset-0 rounded-full bg-primary/20 animate-ping"
                        style={{ animationDuration: "1.5s" }}
                      />
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
                    justDone
                      ? {
                          animation: "none",
                          color: "oklch(0.60 0.16 165)",
                        }
                      : undefined
                  }
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

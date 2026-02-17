"use client";

import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardData, ProgressStep } from "@/lib/chat/types";

interface ProgressTrackerCardProps {
  card: Extract<CardData, { type: "progress-tracker" }>;
}

export default function ProgressTrackerCard({ card }: ProgressTrackerCardProps) {
  return (
    <div className="max-w-[600px] w-full space-y-2">
      {/* Title */}
      <p className="text-sm font-semibold text-zinc-700 mb-3">{card.title}</p>

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
        isActive && "bg-zinc-50 animate-pulse-subtle"
      )}
    >
      {/* Icon */}
      <span className="shrink-0 flex items-center justify-center size-5">
        {isDone && (
          <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500">
            <Check className="size-3 text-white" strokeWidth={3} />
          </span>
        )}
        {isActive && (
          <Loader2 className="size-5 text-indigo-500 animate-spin" />
        )}
        {isPending && (
          <span className="size-5 rounded-full border-2 border-zinc-300" />
        )}
      </span>

      {/* Label */}
      <span
        className={cn(
          "text-sm transition-colors duration-300",
          isDone && "text-emerald-600 font-medium",
          isActive && "text-zinc-900 font-semibold",
          isPending && "text-zinc-400"
        )}
      >
        {step.label}
      </span>
    </div>
  );
}

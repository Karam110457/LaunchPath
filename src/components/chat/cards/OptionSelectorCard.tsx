"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CollapsedCard from "./CollapsedCard";
import type { CardData, CardOption } from "@/lib/chat/types";

interface OptionSelectorCardProps {
  card: Extract<CardData, { type: "option-selector" }>;
  completed: boolean;
  completedSummary?: string;
  onComplete: (displayText: string, structuredMessage: string) => void;
}

export default function OptionSelectorCard({
  card,
  completed,
  completedSummary,
  onComplete,
}: OptionSelectorCardProps) {
  const [selected, setSelected] = useState<string[]>([]);

  if (completed) {
    return <CollapsedCard summary={completedSummary} />;
  }

  const isMulti = card.multiSelect === true;
  const maxSelect = card.maxSelect ?? card.options.length;

  function toggleOption(value: string) {
    if (!isMulti) {
      const option = card.options.find((o) => o.value === value)!;
      onComplete(
        option.label,
        `[${card.id} selected: ${value}]`
      );
      return;
    }

    setSelected((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      if (prev.length >= maxSelect) return prev;
      return [...prev, value];
    });
  }

  function handleSubmit() {
    if (selected.length === 0) return;
    const labels = selected.map(
      (v) => card.options.find((o) => o.value === v)?.label ?? v
    );
    onComplete(
      `Selected: ${labels.join(", ")}`,
      `[${card.id} selected: ${selected.join(", ")}]`
    );
  }

  return (
    <div className="max-w-[600px] w-full space-y-3">
      {/* Question header */}
      <p className="text-sm font-semibold text-zinc-800">{card.question}</p>

      {/* Options grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {card.options.map((option: CardOption) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              className={cn(
                "relative flex flex-col items-start gap-0.5 rounded-xl border-2 px-4 py-3 text-left transition-all duration-150",
                "min-h-[44px] cursor-pointer",
                isSelected
                  ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                  : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
              )}
            >
              {/* Multi-select checkmark */}
              {isMulti && (
                <span
                  className={cn(
                    "absolute right-3 top-3 flex size-4 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-zinc-300 bg-white"
                  )}
                >
                  {isSelected && <Check className="size-2.5 text-white" strokeWidth={3} />}
                </span>
              )}
              <span className="text-sm font-semibold pr-6">{option.label}</span>
              {option.description && (
                <span className="text-xs text-zinc-500">{option.description}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Multi-select submit */}
      {isMulti && (
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs text-zinc-400">
            {selected.length} selected
            {maxSelect < card.options.length && ` (max ${maxSelect})`}
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={selected.length === 0}
            className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Submit
          </Button>
        </div>
      )}
    </div>
  );
}

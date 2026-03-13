"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OptionCardProps {
  value: string;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: (value: string) => void;
}

export function OptionCard({
  value,
  label,
  description,
  selected,
  onSelect,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "w-full text-left px-5 py-4 rounded-xl border transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-foreground/20",
        selected
          ? "border-transparent gradient-accent-border bg-white dark:bg-neutral-900 canvas-dark:bg-neutral-900 shadow-sm"
          : "border-border bg-card hover:bg-muted/50"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div
            className={cn("font-medium text-sm", selected && "text-foreground")}
          >
            {label}
          </div>
          {description && (
            <div className="text-xs mt-0.5 text-muted-foreground">
              {description}
            </div>
          )}
        </div>
        {selected && (
          <div className="shrink-0 h-5 w-5 rounded-full gradient-accent-bg flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

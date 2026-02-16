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
        "hover:border-primary/40 hover:bg-primary/5",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        selected
          ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div
            className={cn("font-medium text-sm", selected && "text-primary")}
          >
            {label}
          </div>
          {description && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {description}
            </div>
          )}
        </div>
        {selected && (
          <div className="shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
}

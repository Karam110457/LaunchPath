"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface MultiOptionCardProps {
  value: string;
  label: string;
  selected: boolean;
  onToggle: (value: string) => void;
}

export function MultiOptionCard({
  value,
  label,
  selected,
  onToggle,
}: MultiOptionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      className={cn(
        "w-full text-left px-5 py-3.5 rounded-xl border transition-all duration-200",
        "hover:border-primary/40 hover:bg-primary/5",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        selected ? "border-primary bg-primary/10" : "border-border bg-card"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "shrink-0 h-5 w-5 rounded border transition-colors flex items-center justify-center",
            selected
              ? "bg-primary border-primary"
              : "border-muted-foreground/30"
          )}
        >
          {selected && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
        <span className={cn("text-sm", selected && "text-primary font-medium")}>
          {label}
        </span>
      </div>
    </button>
  );
}

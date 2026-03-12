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
        "hover:border-[#FF8C00]/30 hover:bg-[#FF8C00]/5",
        "focus:outline-none focus:ring-2 focus:ring-[#FF8C00]/40",
        selected
          ? "border-transparent gradient-accent-border bg-gradient-to-br from-[#FF8C00]/8 to-[#9D50BB]/8 shadow-sm"
          : "border-border bg-card"
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
            <div className={cn("text-xs mt-0.5", selected ? "text-muted-foreground" : "text-muted-foreground")}>
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

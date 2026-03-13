"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OptionCardProps {
  value: string;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: (value: string) => void;
  variant?: "gradient" | "mono";
}

export function OptionCard({
  value,
  label,
  description,
  selected,
  onSelect,
  variant = "gradient",
}: OptionCardProps) {
  const isGradient = variant === "gradient";

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "w-full text-left px-5 py-4 rounded-xl border transition-all duration-200",
        "focus:outline-none focus:ring-2",
        isGradient
          ? "hover:border-[#FF8C00]/30 hover:bg-[#FF8C00]/5 focus:ring-[#FF8C00]/40"
          : "hover:bg-muted/60 focus:ring-foreground/20",
        selected
          ? isGradient
            ? "border-transparent gradient-accent-border bg-gradient-to-br from-[#FF8C00]/8 to-[#9D50BB]/8 shadow-sm"
            : "bg-foreground text-background border-transparent shadow-sm"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div
            className={cn(
              "font-medium text-sm",
              selected && (isGradient ? "text-foreground" : "text-background")
            )}
          >
            {label}
          </div>
          {description && (
            <div className={cn(
              "text-xs mt-0.5",
              selected && !isGradient ? "text-background/70" : "text-muted-foreground"
            )}>
              {description}
            </div>
          )}
        </div>
        {selected && (
          <div className={cn(
            "shrink-0 h-5 w-5 rounded-full flex items-center justify-center",
            isGradient ? "gradient-accent-bg" : "bg-background"
          )}>
            <Check className={cn("h-3 w-3", isGradient ? "text-white" : "text-foreground")} />
          </div>
        )}
      </div>
    </button>
  );
}

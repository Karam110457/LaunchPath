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

/** background-clip gradient border trick — works in any stacking context */
const gradientBorderStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, #FF8C00, #9D50BB)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

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
      style={selected ? gradientBorderStyle : undefined}
      className={cn(
        "w-full text-left px-5 py-4 rounded-[20px] border-2 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-foreground/20",
        selected
          ? "[--card-bg:#f8f9fa] dark:[--card-bg:#1E1E1E] canvas-dark:[--card-bg:#1E1E1E] border-transparent shadow-sm"
          : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 canvas-dark:bg-[#1E1E1E]/80 hover:bg-white dark:hover:bg-[#252525] canvas-dark:hover:bg-[#252525] hover:shadow-sm"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div
            className={cn(
              "font-medium text-sm",
              selected
                ? "text-neutral-900 dark:text-neutral-100"
                : "text-neutral-800 dark:text-neutral-200"
            )}
          >
            {label}
          </div>
          {description && (
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
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

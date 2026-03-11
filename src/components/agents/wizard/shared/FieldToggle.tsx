"use client";

interface FieldToggleProps {
  label: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle?: () => void;
}

export function FieldToggle({
  label,
  enabled,
  disabled,
  onToggle,
}: FieldToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`
        px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all
        ${disabled ? "cursor-default" : "cursor-pointer"}
        ${
          enabled
            ? "bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 border-[#FF8C00]/30 text-[#FF8C00] dark:text-[#FFa333]"
            : "bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 border-black/5 dark:border-[#2A2A2A] text-neutral-500 dark:text-neutral-400 hover:border-[#FF8C00]/30"
        }
      `}
    >
      {label}
    </button>
  );
}

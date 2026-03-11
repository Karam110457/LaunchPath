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
        ${disabled ? "cursor-default opacity-50" : "cursor-pointer"}
        ${
          enabled
            ? "bg-neutral-900 dark:bg-white border-transparent text-white dark:text-neutral-900"
            : "bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 border-black/5 dark:border-[#2A2A2A] text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-500"
        }
      `}
    >
      {label}
    </button>
  );
}

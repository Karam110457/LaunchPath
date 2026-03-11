"use client";

import { cn } from "@/lib/utils";

interface WizardCardProps {
  children: React.ReactNode;
  className?: string;
}

/** Card container matching the agents page card styling. */
export function WizardCard({ children, className }: WizardCardProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 border border-black/5 dark:border-[#2A2A2A] p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsedCardProps {
  summary?: string;
  className?: string;
}

export default function CollapsedCard({ summary, className }: CollapsedCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg bg-muted px-3 py-2 max-w-[600px]",
        className
      )}
      style={{ minHeight: "36px" }}
    >
      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
      <span className="text-sm text-muted-foreground truncate">
        {summary ?? "Completed"}
      </span>
    </div>
  );
}

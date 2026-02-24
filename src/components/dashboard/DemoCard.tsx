"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Pencil,
  Copy,
  Check,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT_DOT_COLORS: Record<string, string> = {
  emerald: "bg-emerald-400",
  blue: "bg-blue-400",
  violet: "bg-violet-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  cyan: "bg-cyan-400",
};

interface DemoCardProps {
  systemId: string;
  agentName: string;
  heroHeadline: string;
  niche: string;
  segment: string;
  demoUrl: string;
  accentColor?: string;
  leadsCount: number;
  createdAt: string;
}

export function DemoCard({
  systemId,
  agentName,
  heroHeadline,
  niche,
  segment,
  demoUrl,
  accentColor = "emerald",
  leadsCount,
  createdAt,
}: DemoCardProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dotColor = ACCENT_DOT_COLORS[accentColor] ?? ACCENT_DOT_COLORS.emerald;

  const handleCopy = async () => {
    const fullUrl = `${window.location.origin}${demoUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const formattedDate = new Date(createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden",
        "transition-all duration-300 hover:border-border/80 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5"
      )}
    >
      {/* Accent stripe */}
      <div
        className={cn(
          "h-[2px] w-full transition-all duration-300 group-hover:h-[3px]",
          accentColor === "emerald" && "bg-emerald-500",
          accentColor === "blue" && "bg-blue-500",
          accentColor === "violet" && "bg-violet-500",
          accentColor === "amber" && "bg-amber-500",
          accentColor === "rose" && "bg-rose-500",
          accentColor === "cyan" && "bg-cyan-500",
          !ACCENT_DOT_COLORS[accentColor] && "bg-emerald-500"
        )}
      />

      {/* Header */}
      <div className="px-5 pt-4 pb-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full shrink-0", dotColor)} />
          <span className="text-xs text-muted-foreground truncate">
            {niche}
          </span>
        </div>
        <h3 className="text-base font-semibold text-foreground leading-snug truncate">
          {agentName}
        </h3>
      </div>

      {/* Body */}
      <div className="px-5 pb-3 flex-1">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {heroHeadline}
        </p>
      </div>

      {/* Stats */}
      <div className="px-5 pb-3 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3" />
          {leadsCount} {leadsCount === 1 ? "lead" : "leads"}
        </span>
        <span className="text-xs text-muted-foreground/60">
          {formattedDate}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Actions */}
      <div className="px-5 py-3 flex items-center gap-1">
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
            "text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          )}
        >
          <ExternalLink className="size-3.5" />
          View
        </a>

        <Link
          href={`/builder/${systemId}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
            "text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          )}
        >
          <Pencil className="size-3.5" />
          Edit
        </Link>

        <button
          onClick={handleCopy}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ml-auto",
            "transition-colors",
            copied
              ? "text-emerald-400"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Copied" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}

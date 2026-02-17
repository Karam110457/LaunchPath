"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Lock, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CardData } from "@/lib/chat/types";

interface SystemReadyCardProps {
  card: Extract<CardData, { type: "system-ready" }>;
  onComplete: (displayText: string, structuredMessage: string) => void;
}

export default function SystemReadyCard({ card, onComplete }: SystemReadyCardProps) {
  const router = useRouter();
  const [checkmarkVisible, setCheckmarkVisible] = useState(false);

  useEffect(() => {
    // Slight delay so the animation plays after mount
    const t = setTimeout(() => setCheckmarkVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const { offer } = card;

  return (
    <div className="max-w-[600px] w-full space-y-5">
      {/* Animated checkmark */}
      <div className="flex flex-col items-center gap-3 py-2">
        <div
          className={cn(
            "flex size-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all duration-500",
            checkmarkVisible
              ? "scale-100 opacity-100"
              : "scale-0 opacity-0"
          )}
          style={{
            transitionTimingFunction: checkmarkVisible
              ? "cubic-bezier(0.34, 1.56, 0.64, 1)"
              : "ease-in",
          }}
        >
          {/* SVG checkmark with draw animation */}
          <svg
            className="size-8 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline
              points="20 6 9 17 4 12"
              className={cn(
                "transition-all duration-300 delay-300",
                checkmarkVisible ? "opacity-100" : "opacity-0"
              )}
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground text-center font-serif italic">
          Your System Is Ready!
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Your AI-powered demo page is live. Share it with prospects to instantly
          qualify leads.
        </p>
      </div>

      {/* Demo URL card */}
      <a
        href={card.demoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/10 px-4 py-3.5 hover:bg-primary/15 transition-colors group"
      >
        <Lock className="size-4 text-primary/60 shrink-0" />
        <span className="flex-1 text-sm font-medium text-primary break-all">
          {card.demoUrl}
        </span>
        <ExternalLink className="size-4 text-primary/60 shrink-0 group-hover:text-primary transition-colors" />
      </a>

      {/* Offer highlights */}
      <div className="flex flex-wrap gap-2">
        <HighlightChip label="Segment" value={offer.segment} />
        <HighlightChip
          label="Setup"
          value={`£${offer.pricing_setup.toLocaleString()}`}
        />
        <HighlightChip
          label="Monthly"
          value={`£${offer.pricing_monthly.toLocaleString()}/mo`}
        />
      </div>

      {/* What to do now */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          What to do now
        </p>
        <ol className="space-y-2.5">
          {[
            "Try your own demo page — go through the flow as a prospect would.",
            "Share it with a prospect — send the link and see how they respond.",
            "Check your dashboard for submissions — track qualified leads as they come in.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-foreground leading-snug">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Dashboard button */}
      <Button
        onClick={() => router.push("/dashboard")}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-base gap-2"
      >
        <LayoutDashboard className="size-4" />
        Go to Dashboard
      </Button>
    </div>
  );
}

function HighlightChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted border border-border px-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}: </span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

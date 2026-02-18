"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Copy, Check, ExternalLink, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CardData } from "@/lib/chat/types";

interface SystemReadyCardProps {
  card: Extract<CardData, { type: "system-ready" }>;
  onComplete: (displayText: string, structuredMessage: string) => void;
}

// ---------------------------------------------------------------------------
// Confetti — scoped particle burst, not full-screen
// ---------------------------------------------------------------------------

const CONFETTI_COLORS = [
  "oklch(0.60 0.16 165)",
  "oklch(0.72 0.17 158)",
  "oklch(0.80 0.14 165)",
  "oklch(0.50 0.18 170)",
  "oklch(0.65 0.12 140)",
];

interface Particle {
  id: number;
  color: string;
  dx: number;
  dy: number;
  rot: number;
  delay: number;
  size: number;
  shape: "rect" | "circle";
}

function Confetti() {
  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      dx: (Math.random() - 0.5) * 280,
      dy: -(Math.random() * 160 + 40),
      rot: (Math.random() - 0.5) * 540,
      delay: Math.random() * 350,
      size: Math.random() * 5 + 4,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [active, setActive] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setActive(false), 1900);
    return () => clearTimeout(t);
  }, []);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible z-10" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: "50%",
            top: "15%",
            width: p.size,
            height: p.shape === "rect" ? p.size * 1.6 : p.size,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            background: p.color,
            ["--cp-dx" as string]: `${p.dx}px`,
            ["--cp-dy" as string]: `${p.dy}px`,
            ["--cp-rot" as string]: `${p.rot}deg`,
            animation: `confetti-fly 1.4s ${p.delay}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG checkmark that draws itself via stroke-dashoffset
// ---------------------------------------------------------------------------

function DrawCheckmark() {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={cn(
        "flex size-16 items-center justify-center rounded-full bg-emerald-500",
        "shadow-lg shadow-emerald-500/25 transition-all duration-500",
        drawn ? "scale-100 opacity-100" : "scale-0 opacity-0"
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >
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
          strokeDasharray="28"
          strokeDashoffset={drawn ? "0" : "28"}
          style={{ transition: drawn ? "stroke-dashoffset 350ms 300ms ease-out" : "none" }}
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy-to-clipboard button
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy link"
      className={cn(
        "flex items-center justify-center size-8 rounded-lg shrink-0 transition-all duration-200",
        copied
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-primary/10 text-primary/70 hover:bg-primary/20 hover:text-primary"
      )}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main card
// ---------------------------------------------------------------------------

const ACTION_STEPS = [
  "Try your own demo page — go through the flow as a prospect would.",
  "Share it with a prospect — send the link and see how they respond.",
  "Check your dashboard for submissions — track qualified leads as they come in.",
];

export default function SystemReadyCard({ card }: SystemReadyCardProps) {
  const router = useRouter();

  return (
    <div className="max-w-[600px] w-full space-y-5 relative">
      {/* Particle confetti burst — scoped to card */}
      <Confetti />

      {/* Checkmark + heading */}
      <div className="flex flex-col items-center gap-3 py-2">
        <DrawCheckmark />
        <h2
          className="text-xl font-bold text-foreground text-center font-serif italic animate-in fade-in duration-400"
          style={{ animationDelay: "500ms", animationFillMode: "both" }}
        >
          Your System Is Ready!
        </h2>
        <p
          className="text-sm text-muted-foreground text-center max-w-xs animate-in fade-in duration-300"
          style={{ animationDelay: "650ms", animationFillMode: "both" }}
        >
          Your AI-powered demo page is live. Share it with prospects to instantly qualify leads.
        </p>
      </div>

      {/* Three stat cards */}
      <div
        className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-400"
        style={{ animationDelay: "700ms", animationFillMode: "both" }}
      >
        <div className="rounded-xl border border-border bg-card p-3 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-emerald-400 tracking-wide">LIVE</span>
          </div>
          <p className="text-xs text-muted-foreground leading-tight">Demo Page</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center space-y-1">
          <p className="text-xl font-bold tabular-nums text-foreground">0</p>
          <p className="text-xs text-muted-foreground">Prospects</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center space-y-1">
          <p className="text-xl font-bold tabular-nums text-foreground">0</p>
          <p className="text-xs text-muted-foreground">Messages</p>
        </div>
      </div>

      {/* Demo URL — prominent + copyable */}
      <div
        className="animate-in fade-in slide-in-from-bottom-2 duration-400"
        style={{ animationDelay: "800ms", animationFillMode: "both" }}
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Your demo link
        </p>
        <div className="flex items-center gap-2 rounded-xl border-2 border-primary/25 bg-primary/8 px-4 py-3">
          <a
            href={card.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center gap-1.5 min-w-0 group"
          >
            <ExternalLink className="size-3.5 shrink-0 text-primary/60 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-primary truncate hover:underline">
              {card.demoUrl}
            </span>
          </a>
          <CopyButton text={card.demoUrl} />
        </div>
      </div>

      {/* Your first move — steps stagger in */}
      <div
        className="rounded-xl border border-border bg-card p-4 space-y-3 animate-in fade-in duration-300"
        style={{ animationDelay: "900ms", animationFillMode: "both" }}
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Your first move
        </p>
        <ol className="space-y-2.5">
          {ACTION_STEPS.map((step, i) => (
            <li
              key={i}
              className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-300"
              style={{ animationDelay: `${1000 + i * 300}ms`, animationFillMode: "both" }}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-foreground leading-snug">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Offer highlights */}
      <div
        className="flex flex-wrap gap-2 animate-in fade-in duration-300"
        style={{ animationDelay: "950ms", animationFillMode: "both" }}
      >
        <HighlightChip label="Segment" value={card.offer.segment} />
        <HighlightChip label="Setup" value={`£${card.offer.pricing_setup.toLocaleString()}`} />
        <HighlightChip label="Monthly" value={`£${card.offer.pricing_monthly.toLocaleString()}/mo`} />
      </div>

      {/* Dashboard CTA */}
      <div
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ animationDelay: "1100ms", animationFillMode: "both" }}
      >
        <Button
          onClick={() => router.push("/dashboard")}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-base gap-2"
        >
          <LayoutDashboard className="size-4" />
          Go to Dashboard
        </Button>
      </div>
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

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  Zap,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CollapsedCard from "./CollapsedCard";
import type { CardData } from "@/lib/chat/types";
import type { AIRecommendation } from "@/lib/ai/schemas";

interface ScoreCardProps {
  card: Extract<CardData, { type: "score-cards" }>;
  completed: boolean;
  completedSummary?: string;
  onComplete: (displayText: string, structuredMessage: string) => void;
}

const SCORE_BARS = [
  { key: "roi_from_service" as const, label: "ROI from Service", icon: TrendingUp },
  { key: "can_afford_it" as const, label: "Can Afford It", icon: DollarSign },
  { key: "guarantee_results" as const, label: "Guarantee Results", icon: ShieldCheck },
  { key: "easy_to_find" as const, label: "Easy to Find", icon: Search },
];

/** Counts up from 0 to target over durationMs, starting after delayMs. */
function useCountUp(target: number, durationMs = 600, delayMs = 0): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let rafId: number;
    const timer = setTimeout(() => {
      let startTime: number | null = null;
      const tick = (ts: number) => {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setValue(Math.round(eased * target));
        if (progress < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
    };
  }, [target, durationMs, delayMs]);
  return value;
}

/** Parse the numeric part of a revenue string like "£3,600/month" or "$4,200". */
function parseRevenueNumber(str: string): number {
  const match = str.replace(/,/g, "").match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/** Re-format a parsed number with the original currency symbol and suffix. */
function formatRevenue(str: string, count: number): string {
  const symbol = str.match(/^[£$€¥]/) ? str[0] : "";
  const suffix = str.replace(/^[£$€¥]?[\d,]+/, "");
  return `${symbol}${count.toLocaleString()}${suffix}`;
}

export default function ScoreCard({
  card,
  completed,
  completedSummary,
  onComplete,
}: ScoreCardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (completed) {
    return <CollapsedCard summary={completedSummary} />;
  }

  const [primary, ...secondaries] = card.recommendations;

  function handleChoose(rec: AIRecommendation) {
    onComplete(
      `I want to work in: ${rec.niche}`,
      `[niche-choice: ${JSON.stringify(rec)}]`
    );
  }

  return (
    <div className="max-w-[600px] w-full space-y-4">
      {/* Primary recommendation — enters from below */}
      <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        <PrimaryCard recommendation={primary} onChoose={() => handleChoose(primary)} />
      </div>

      {/* Secondary recommendations — cascade in with 100ms stagger */}
      {secondaries.length > 0 && (
        <div className="space-y-2">
          <p
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 animate-in fade-in duration-300"
            style={{ animationDelay: "350ms", animationFillMode: "both" }}
          >
            Other options
          </p>
          {secondaries.map((rec, i) => (
            <div
              key={rec.niche}
              className="animate-in fade-in slide-in-from-bottom-2 duration-400"
              style={{
                animationDelay: `${400 + i * 100}ms`,
                animationFillMode: "both",
                animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <SecondaryCard
                recommendation={rec}
                rank={i + 2}
                isExpanded={expandedIndex === i}
                onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
                onChoose={() => handleChoose(rec)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Primary card
// ---------------------------------------------------------------------------

function PrimaryCard({
  recommendation: rec,
  onChoose,
}: {
  recommendation: AIRecommendation;
  onChoose: () => void;
}) {
  // Score counts up from 0
  const animatedScore = useCountUp(rec.score, 600, 150);

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-emerald-700 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            {/* Badge pulses once on entry */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white"
              style={{ animation: "badge-pulse-once 500ms 100ms cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
            >
              <Star className="size-3" />
              #1 Recommended
            </span>
            <h3
              className="text-lg font-bold text-white leading-tight font-serif italic animate-in fade-in duration-300"
              style={{ animationDelay: "200ms", animationFillMode: "both" }}
            >
              {rec.niche}
            </h3>
          </div>
          {/* Animated score badge */}
          <AnimatedScoreBadge score={rec.score} animatedScore={animatedScore} large />
        </div>
      </div>

      {/* Body — sections stagger in */}
      <div className="p-5 space-y-5">
        {/* Score bars — staggered fill */}
        <div
          className="animate-in fade-in duration-300"
          style={{ animationDelay: "200ms", animationFillMode: "both" }}
        >
          <ScoreBarsSection scores={rec.segment_scores} entryDelay={250} />
        </div>

        {/* Who you help */}
        <InfoSection
          icon={<Users className="size-4 text-primary" />}
          label="Who you help"
          text={rec.target_segment.description}
          delay={400}
        />

        {/* Bottleneck */}
        <InfoSection
          icon={<Zap className="size-4 text-amber-400" />}
          label="The bottleneck"
          text={rec.bottleneck}
          delay={450}
        />

        {/* Solution */}
        <InfoSection
          icon={<ShieldCheck className="size-4 text-emerald-400" />}
          label="Your solution"
          text={rec.your_solution}
          delay={500}
        />

        {/* Revenue — numbers count up */}
        <div
          className="animate-in fade-in duration-300"
          style={{ animationDelay: "550ms", animationFillMode: "both" }}
        >
          <RevenueSection revenue={rec.revenue_potential} />
        </div>

        {/* Strategic insight fades in last — it's the punchline */}
        <p
          className="text-sm italic text-muted-foreground border-l-2 border-border pl-3 animate-in fade-in duration-400"
          style={{ animationDelay: "700ms", animationFillMode: "both" }}
        >
          {rec.strategic_insight}
        </p>

        {/* Why for you */}
        <div
          className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 animate-in fade-in duration-300"
          style={{ animationDelay: "800ms", animationFillMode: "both" }}
        >
          <p className="text-xs font-semibold text-primary mb-1">Why this fits you</p>
          <p className="text-sm text-foreground">{rec.why_for_you}</p>
        </div>

        {/* CTA */}
        <div
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: "850ms", animationFillMode: "both" }}
        >
          <Button
            onClick={onChoose}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-base"
          >
            Choose This Niche →
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Secondary card (accordion)
// ---------------------------------------------------------------------------

function SecondaryCard({
  recommendation: rec,
  rank,
  isExpanded,
  onToggle,
  onChoose,
}: {
  recommendation: AIRecommendation;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChoose: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted transition-colors min-h-[56px]"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground">#{rank}</span>
          <span className="text-sm font-semibold text-foreground font-serif italic">{rec.niche}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ScoreBadge score={rec.score} />
          {isExpanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <ScoreBarsSection scores={rec.segment_scores} entryDelay={0} />
          <InfoSection icon={<Users className="size-4 text-primary" />} label="Who you help" text={rec.target_segment.description} delay={0} />
          <InfoSection icon={<Zap className="size-4 text-amber-400" />} label="The bottleneck" text={rec.bottleneck} delay={0} />
          <InfoSection icon={<ShieldCheck className="size-4 text-emerald-400" />} label="Your solution" text={rec.your_solution} delay={0} />
          <RevenueSection revenue={rec.revenue_potential} />
          <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
            <p className="text-xs font-semibold text-primary mb-1">Why this fits you</p>
            <p className="text-sm text-foreground">{rec.why_for_you}</p>
          </div>
          <Button
            onClick={onChoose}
            variant="outline"
            className="w-full h-11 border-primary/30 text-primary hover:bg-primary/10 rounded-xl font-semibold"
          >
            Choose This Niche →
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AnimatedScoreBadge({
  score,
  animatedScore,
  large = false,
}: {
  score: number;
  animatedScore: number;
  large?: boolean;
}) {
  const color =
    score >= 80
      ? "bg-emerald-500/20 text-emerald-400"
      : score >= 60
      ? "bg-amber-500/20 text-amber-400"
      : "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold tabular-nums",
        color,
        large ? "size-12 text-lg" : "h-7 px-2.5 text-sm"
      )}
    >
      {animatedScore}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500/20 text-emerald-400"
      : score >= 60
      ? "bg-amber-500/20 text-amber-400"
      : "bg-muted text-muted-foreground";

  return (
    <span className={cn("inline-flex items-center justify-center rounded-full font-bold tabular-nums h-7 px-2.5 text-sm", color)}>
      {score}
    </span>
  );
}

function ScoreBarsSection({
  scores,
  entryDelay,
}: {
  scores: AIRecommendation["segment_scores"];
  entryDelay: number;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Score breakdown
      </p>
      {SCORE_BARS.map(({ key, label, icon: Icon }, i) => (
        <ScoreBar
          key={key}
          label={label}
          icon={<Icon className="size-3.5" />}
          value={scores[key]}
          max={25}
          fillDelay={entryDelay + i * 150}
        />
      ))}
    </div>
  );
}

function ScoreBar({
  label,
  icon,
  value,
  max,
  fillDelay,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  max: number;
  fillDelay: number;
}) {
  const [width, setWidth] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const t = setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setWidth((value / max) * 100));
        });
      }, fillDelay);
      return () => clearTimeout(t);
    }
  }, [value, max, fillDelay]);

  const pct = (value / max) * 100;
  const barColor =
    pct >= 80 ? "bg-emerald-400"
    : pct >= 60 ? "bg-primary"
    : pct >= 40 ? "bg-amber-400"
    : "bg-muted-foreground";

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="w-32 text-xs text-muted-foreground shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", barColor)}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-foreground w-9 text-right tabular-nums shrink-0">
        {value}/{max}
      </span>
    </div>
  );
}

function InfoSection({
  icon,
  label,
  text,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
  delay: number;
}) {
  return (
    <div
      className="space-y-1 animate-in fade-in duration-300"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function RevenueSection({
  revenue,
}: {
  revenue: AIRecommendation["revenue_potential"];
}) {
  // Count up revenue numbers for the monthly total (the most impactful figure)
  const monthlyNum = useMemo(() => parseRevenueNumber(revenue.monthly_total), [revenue.monthly_total]);
  const animatedMonthly = useCountUp(monthlyNum, 700, 600);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Revenue potential
      </p>
      <div className="flex flex-wrap gap-2">
        <StatChip label="Per client" value={revenue.per_client} />
        <StatChip label="Target clients" value={String(revenue.target_clients)} />
        <StatChip
          label="Monthly total"
          value={formatRevenue(revenue.monthly_total, animatedMonthly)}
          highlight
        />
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2 text-center",
        highlight
          ? "bg-emerald-500/10 border border-emerald-500/20"
          : "bg-muted border border-border"
      )}
    >
      <p className={cn("text-xs font-semibold tabular-nums", highlight ? "text-emerald-400" : "text-foreground")}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
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
      {/* Primary recommendation */}
      <PrimaryCard recommendation={primary} onChoose={() => handleChoose(primary)} />

      {/* Secondary recommendations */}
      {secondaries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide px-1">
            Other options
          </p>
          {secondaries.map((rec, i) => (
            <SecondaryCard
              key={rec.niche}
              recommendation={rec}
              rank={i + 2}
              isExpanded={expandedIndex === i}
              onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
              onChoose={() => handleChoose(rec)}
            />
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
  return (
    <div className="rounded-2xl border-2 border-indigo-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
              <Star className="size-3" />
              #1 Recommended
            </span>
            <h3 className="text-lg font-bold text-white leading-tight">{rec.niche}</h3>
          </div>
          <ScoreBadge score={rec.score} large />
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* Score bars */}
        <ScoreBarsSection scores={rec.segment_scores} />

        {/* Who you help */}
        <InfoSection
          icon={<Users className="size-4 text-indigo-400" />}
          label="Who you help"
          text={rec.target_segment.description}
        />

        {/* Bottleneck */}
        <InfoSection
          icon={<Zap className="size-4 text-amber-400" />}
          label="The bottleneck"
          text={rec.bottleneck}
        />

        {/* Solution */}
        <InfoSection
          icon={<ShieldCheck className="size-4 text-emerald-400" />}
          label="Your solution"
          text={rec.your_solution}
        />

        {/* Revenue */}
        <RevenueSection revenue={rec.revenue_potential} />

        {/* Strategic insight */}
        <p className="text-sm italic text-zinc-500 border-l-2 border-zinc-200 pl-3">
          {rec.strategic_insight}
        </p>

        {/* Why for you */}
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
          <p className="text-xs font-semibold text-indigo-600 mb-1">Why this fits you</p>
          <p className="text-sm text-indigo-900">{rec.why_for_you}</p>
        </div>

        {/* CTA */}
        <Button
          onClick={onChoose}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-base"
        >
          Choose This Niche →
        </Button>
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
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      {/* Accordion header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors min-h-[56px]"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-zinc-400">#{rank}</span>
          <span className="text-sm font-semibold text-zinc-800">{rec.niche}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ScoreBadge score={rec.score} />
          {isExpanded ? (
            <ChevronUp className="size-4 text-zinc-400" />
          ) : (
            <ChevronDown className="size-4 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Expanded body */}
      {isExpanded && (
        <div className="border-t border-zinc-100 p-4 space-y-4">
          <ScoreBarsSection scores={rec.segment_scores} />
          <InfoSection
            icon={<Users className="size-4 text-indigo-400" />}
            label="Who you help"
            text={rec.target_segment.description}
          />
          <InfoSection
            icon={<Zap className="size-4 text-amber-400" />}
            label="The bottleneck"
            text={rec.bottleneck}
          />
          <InfoSection
            icon={<ShieldCheck className="size-4 text-emerald-400" />}
            label="Your solution"
            text={rec.your_solution}
          />
          <RevenueSection revenue={rec.revenue_potential} />
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
            <p className="text-xs font-semibold text-indigo-600 mb-1">Why this fits you</p>
            <p className="text-sm text-indigo-900">{rec.why_for_you}</p>
          </div>
          <Button
            onClick={onChoose}
            variant="outline"
            className="w-full h-11 border-indigo-300 text-indigo-700 hover:bg-indigo-50 rounded-xl font-semibold"
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

function ScoreBadge({ score, large = false }: { score: number; large?: boolean }) {
  const color =
    score >= 80
      ? "bg-emerald-100 text-emerald-700"
      : score >= 60
      ? "bg-amber-100 text-amber-700"
      : "bg-zinc-100 text-zinc-600";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold tabular-nums",
        color,
        large ? "size-12 text-lg" : "h-7 px-2.5 text-sm"
      )}
    >
      {score}
    </span>
  );
}

function ScoreBarsSection({
  scores,
}: {
  scores: AIRecommendation["segment_scores"];
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
        Score breakdown
      </p>
      {SCORE_BARS.map(({ key, label, icon: Icon }) => (
        <ScoreBar
          key={key}
          label={label}
          icon={<Icon className="size-3.5" />}
          value={scores[key]}
          max={25}
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
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  max: number;
}) {
  const [width, setWidth] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      // Defer to next frame so CSS transition fires
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setWidth((value / max) * 100);
        });
      });
    }
  }, [value, max]);

  const pct = (value / max) * 100;
  const barColor =
    pct >= 80
      ? "bg-emerald-400"
      : pct >= 60
      ? "bg-indigo-400"
      : pct >= 40
      ? "bg-amber-400"
      : "bg-zinc-300";

  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-400 shrink-0">{icon}</span>
      <span className="w-32 text-xs text-zinc-600 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", barColor)}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-zinc-600 w-9 text-right tabular-nums shrink-0">
        {value}/{max}
      </span>
    </div>
  );
}

function InfoSection({
  icon,
  label,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-sm text-zinc-700 leading-relaxed">{text}</p>
    </div>
  );
}

function RevenueSection({
  revenue,
}: {
  revenue: AIRecommendation["revenue_potential"];
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
        Revenue potential
      </p>
      <div className="flex flex-wrap gap-2">
        <StatChip label="Per client" value={revenue.per_client} />
        <StatChip label="Target clients" value={String(revenue.target_clients)} />
        <StatChip label="Monthly total" value={revenue.monthly_total} highlight />
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
          ? "bg-emerald-50 border border-emerald-200"
          : "bg-zinc-50 border border-zinc-200"
      )}
    >
      <p className={cn("text-xs font-semibold", highlight ? "text-emerald-700" : "text-zinc-700")}>
        {value}
      </p>
      <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
    </div>
  );
}

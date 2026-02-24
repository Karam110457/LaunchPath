"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedScore } from "./AnimatedScore";
import type { DemoResult } from "@/lib/ai/schemas";
import type { PostResultCta } from "@/lib/ai/schemas";

interface DemoResultsProps {
  result: DemoResult;
  onReset: () => void;
  postResultCta?: PostResultCta;
}

const PRIORITY_STYLES = {
  HIGH: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  LOW: "text-red-400 bg-red-500/10 border-red-500/20",
} as const;

export function DemoResults({
  result,
  onReset,
  postResultCta,
}: DemoResultsProps) {
  // Staged reveal: 0→score, 1→priority+value, 2→insights, 3→analysis, 4→steps, 5→cta
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 2600),
      setTimeout(() => setPhase(5), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-6">
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-6">
        {/* Score — animates from 0 immediately */}
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
            Your Score
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <AnimatedScore
              target={result.score}
              className="text-5xl font-mono font-bold text-foreground tabular-nums"
            />
            <span className="text-lg text-muted-foreground font-mono">
              /100
            </span>
          </div>
        </div>

        {/* Priority badge + Estimated value */}
        {phase >= 1 && (
          <div className="flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${PRIORITY_STYLES[result.priority]}`}
              style={{ animation: "badge-pulse-once 500ms ease both" }}
              role="status"
              aria-label={`${result.priority} priority lead`}
            >
              <TrendingUp className="size-3" aria-hidden="true" />
              {result.priority} Priority
            </span>
            {result.estimated_value && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Est. Value
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {result.estimated_value}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Key Insights — staggered reveal */}
        {phase >= 2 && result.insights.length > 0 && (
          <div className="animate-in fade-in duration-300">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">
              Key Insights
            </h4>
            <ul className="space-y-2">
              {result.insights.map((insight, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm animate-in fade-in slide-in-from-left-2 duration-300"
                  style={{
                    animationDelay: `${i * 150}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/80 leading-relaxed">
                    {insight}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Analysis */}
        {phase >= 3 && Object.keys(result.fit_analysis).length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">
              Detailed Analysis
            </h4>
            <div className="space-y-2">
              {Object.entries(result.fit_analysis).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between gap-4 text-sm border-b border-border/30 pb-2 last:border-0"
                >
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="font-medium text-foreground/90 text-right">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Next Steps — numbered with stagger */}
        {phase >= 4 && result.next_steps.length > 0 && (
          <div className="animate-in fade-in duration-300">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">
              Recommended Next Steps
            </h4>
            <ol className="space-y-2.5">
              {result.next_steps.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-300"
                  style={{
                    animationDelay: `${i * 200}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground/80 leading-snug">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Post-result CTAs */}
      {phase >= 5 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-400">
          {postResultCta && (
            <Button
              className="w-full h-14 text-base font-semibold rounded-xl"
              style={{
                backgroundColor: "var(--demo-cta)",
                boxShadow:
                  "0 10px 15px -3px color-mix(in oklch, var(--demo-cta) 25%, transparent)",
              }}
              onClick={() => {
                if (postResultCta.url) window.open(postResultCta.url, "_blank");
              }}
            >
              {postResultCta.text}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={onReset}
          >
            Submit Another Assessment
          </Button>
        </div>
      )}
    </div>
  );
}

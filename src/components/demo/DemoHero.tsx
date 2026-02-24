"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoHeroProps {
  agentName: string;
  heroHeadline: string;
  heroSubheadline: string;
  transformationHeadline?: string;
  transformationFrom?: string;
  transformationTo?: string;
  headlineStyle?: "serif-italic" | "sans-bold";
}

export function DemoHero({
  agentName,
  heroHeadline,
  heroSubheadline,
  transformationHeadline,
  transformationFrom,
  transformationTo,
  headlineStyle = "serif-italic",
}: DemoHeroProps) {
  const words = heroHeadline.split(" ");

  return (
    <div className="relative text-center pt-20 sm:pt-28 pb-8 px-4">
      {/* Ambient radial glow — blooms from upper center, uses theme accent */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 35%, color-mix(in oklch, var(--primary) 7%, transparent) 0%, transparent 70%)",
          animation: "ambient-breathe 5s ease-in-out infinite",
        }}
      />

      <div className="relative max-w-3xl mx-auto space-y-6">
        {/* Niche-specific badge */}
        <div
          className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide"
          style={{ animation: "heading-word-enter 400ms ease 0ms both" }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {agentName}
        </div>

        {/* Headline — word-by-word reveal */}
        <h1
          className={cn(
            "text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.1]",
            headlineStyle === "sans-bold"
              ? "font-sans font-bold"
              : "font-serif font-light italic"
          )}
        >
          {words.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="inline-block"
              style={{
                marginRight: "0.22em",
                animation: `heading-word-enter 450ms cubic-bezier(0.34, 1.56, 0.64, 1) ${150 + i * 65}ms both`,
              }}
            >
              {word}
            </span>
          ))}
        </h1>

        {/* Subheadline */}
        <p
          className="text-base sm:text-lg text-foreground/70 max-w-xl mx-auto leading-relaxed"
          style={{ animation: "heading-word-enter 500ms ease 600ms both" }}
        >
          {heroSubheadline}
        </p>

        {/* Transformation display */}
        {transformationFrom && transformationTo ? (
          /* Red → Accent pill treatment */
          <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
            <div
              className="rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-2.5 max-w-[260px] animate-in fade-in slide-in-from-left-3 duration-500"
              style={{ animationDelay: "700ms", animationFillMode: "both" }}
            >
              <p className="text-xs font-bold text-red-400/80 uppercase tracking-wider mb-0.5">
                From
              </p>
              <p className="text-sm text-red-300/90 leading-snug">
                {transformationFrom}
              </p>
            </div>
            <ArrowRight
              className="size-4 text-muted-foreground/50 shrink-0 animate-in fade-in zoom-in-50 duration-300"
              style={{ animationDelay: "950ms", animationFillMode: "both" }}
            />
            <div
              className="rounded-xl bg-primary/8 border border-primary/15 px-4 py-2.5 max-w-[260px] animate-in fade-in slide-in-from-right-3 duration-500"
              style={{ animationDelay: "1100ms", animationFillMode: "both" }}
            >
              <p className="text-xs font-bold text-primary/80 uppercase tracking-wider mb-0.5">
                To
              </p>
              <p className="text-sm text-primary/90 leading-snug">
                {transformationTo}
              </p>
            </div>
          </div>
        ) : transformationHeadline ? (
          /* Fallback: single italic line */
          <p
            className="text-base font-medium text-primary/70 italic animate-in fade-in duration-500"
            style={{ animationDelay: "700ms", animationFillMode: "both" }}
          >
            {transformationHeadline}
          </p>
        ) : null}
      </div>
    </div>
  );
}

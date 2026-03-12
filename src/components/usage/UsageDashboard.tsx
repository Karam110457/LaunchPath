"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Coins,
  MessageSquare,
  Zap,
  TrendingUp,
  Bot,
  Gift,
  Cpu,
  ChevronDown,
  ChevronUp,
  Layers,
  Download,
} from "lucide-react";
import { getModelInfo } from "@/lib/ai/model-tiers";
import type { UsageData } from "@/lib/dashboard/usage-data";
import { UsageChart } from "./UsageChart";
import { ProviderBreakdown } from "./ProviderBreakdown";
import { RequestHistory } from "./RequestHistory";
import { PromoRedeemModal } from "./PromoRedeemModal";

type Period = "7d" | "30d" | "90d";

// ---------------------------------------------------------------------------
// Skeleton components
// ---------------------------------------------------------------------------

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-neutral-200/60 dark:bg-neutral-800/60 ${className ?? ""}`}
    />
  );
}

function StatCardSkeleton({ stagger }: { stagger: number }) {
  return (
    <div
      className="px-5 py-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm"
      style={{ "--stagger": String(stagger) } as React.CSSProperties}
    >
      <SkeletonPulse className="h-4 w-28 mb-3" />
      <SkeletonPulse className="h-7 w-20 mb-2" />
      <SkeletonPulse className="h-2 w-full rounded-full" />
    </div>
  );
}

function AgentCardSkeleton({ stagger }: { stagger: number }) {
  return (
    <div
      className="p-5 rounded-[32px] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 border border-black/5 dark:border-[#2A2A2A]"
      style={{ "--stagger": String(stagger) } as React.CSSProperties}
    >
      <div className="flex items-center gap-3 mb-3">
        <SkeletonPulse className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <SkeletonPulse className="h-4 w-28 mb-1.5" />
          <SkeletonPulse className="h-3 w-20" />
        </div>
      </div>
      <div className="border-t border-border/40 pt-3 flex items-center justify-between">
        <div>
          <SkeletonPulse className="h-5 w-12 mb-1" />
          <SkeletonPulse className="h-3 w-10" />
        </div>
        <div className="text-right">
          <SkeletonPulse className="h-5 w-10 mb-1 ml-auto" />
          <SkeletonPulse className="h-3 w-14 ml-auto" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface UsageDashboardProps {
  userName: string;
  initialData?: UsageData | null;
}

export function UsageDashboard({ userName, initialData }: UsageDashboardProps) {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<UsageData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [promoOpen, setPromoOpen] = useState(false);
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/usage?period=${p}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (period === "30d" && initialData) return;
    fetchData(period);
  }, [period, fetchData, initialData]);

  const maxDayCredits = data
    ? Math.max(...data.by_day.map((d) => d.credits), 1)
    : 1;

  const usedPercent = data
    ? Math.min(
        100,
        (data.credits.monthly_used /
          Math.max(data.credits.monthly_included, 1)) *
          100
      )
    : 0;

  const totalTokens = data
    ? data.period_stats.total_input_tokens + data.period_stats.total_output_tokens
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* SVG gradient definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient
            id="primary-icon-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FF8C00" />
            <stop offset="100%" stopColor="#9D50BB" />
          </linearGradient>
        </defs>
      </svg>

      {/* Credit usage alert banners */}
      {data && (() => {
        const pct = data.credits.monthly_included > 0
          ? data.credits.monthly_used / data.credits.monthly_included
          : 0;
        if (pct >= 0.95) {
          return (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm font-medium">
              <Zap className="w-4 h-4 shrink-0" />
              You&apos;ve used {Math.round(pct * 100)}% of your monthly credits. Top up or upgrade to avoid interruptions.
            </div>
          );
        }
        if (pct >= 0.8) {
          return (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-medium">
              <Zap className="w-4 h-4 shrink-0" />
              You&apos;ve used {Math.round(pct * 100)}% of your monthly credits.
            </div>
          );
        }
        return null;
      })()}

      {/* ----------------------------------------------------------------- */}
      {/* Header Row                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Usage &amp; Credits
          </h1>
          <p className="text-muted-foreground text-lg">
            Monitor your credit balance and model usage, {userName}.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Export CSV */}
          <a
            href={`/api/dashboard/usage/export?period=${period}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
          {/* Redeem promo button */}
          <button
            onClick={() => setPromoOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            <Gift className="w-4 h-4" />
            Redeem promo
          </button>

          {/* Credit balance stat card */}
          <div className="flex items-center gap-4 px-4 py-3 rounded-3xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm">
            <div className="w-[52px] h-[52px] rounded-[18px] bg-[#f8f9fa] dark:bg-[#252525] border border-black/5 dark:border-[#333333] flex items-center justify-center">
              <Coins
                className="w-6 h-6"
                style={{ stroke: "url(#primary-icon-gradient)" }}
              />
            </div>
            <div>
              {loading && !data ? (
                <SkeletonPulse className="h-8 w-16 mb-1" />
              ) : (
                <p className="text-3xl font-semibold tracking-tight leading-none text-neutral-900 dark:text-neutral-100">
                  {data
                    ? data.credits.remaining.toLocaleString(undefined, {
                        maximumFractionDigits: 1,
                      })
                    : "0"}
                </p>
              )}
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                Credits Remaining
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Divider                                                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="w-full h-px bg-border/40" />

      {/* ----------------------------------------------------------------- */}
      {/* Stats Row (4 cards)                                               */}
      {/* ----------------------------------------------------------------- */}
      {loading && !data ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-enter">
          <StatCardSkeleton stagger={0} />
          <StatCardSkeleton stagger={1} />
          <StatCardSkeleton stagger={2} />
          <StatCardSkeleton stagger={3} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-enter">
          {/* Monthly usage with progress bar + plan badge */}
          <div
            className="px-5 py-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm"
            style={{ "--stagger": "0" } as React.CSSProperties}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Zap className="w-4 h-4" />
                Monthly Credits
              </div>
              {data?.plan && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300 font-semibold uppercase tracking-wider">
                  {data.plan.name}
                </span>
              )}
            </div>
            <p className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {data
                ? data.credits.monthly_used.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })
                : "0"}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {data?.credits.monthly_included?.toLocaleString() ?? "500"}
              </span>
            </p>
            <div className="mt-2 h-2 rounded-full bg-neutral-200/60 dark:bg-neutral-800/60 overflow-hidden">
              <div
                className="h-full rounded-full gradient-accent-bg transition-all duration-700 ease-out"
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>

          {/* Top-up balance */}
          <div
            className="px-5 py-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm"
            style={{ "--stagger": "1" } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Coins className="w-4 h-4" />
              Top-up Balance
            </div>
            <p className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {data
                ? data.credits.topup_balance.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })
                : "0"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Bonus credits from top-up packs
            </p>
          </div>

          {/* Messages this period */}
          <div
            className="px-5 py-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm"
            style={{ "--stagger": "2" } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <MessageSquare className="w-4 h-4" />
              Requests ({period})
            </div>
            <p className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {data
                ? data.period_stats.total_messages.toLocaleString()
                : "0"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data
                ? `${data.period_stats.total_credits.toLocaleString()} credits consumed`
                : ""}
            </p>
          </div>

          {/* Tokens + avg credits/request */}
          <div
            className="px-5 py-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm"
            style={{ "--stagger": "3" } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Cpu className="w-4 h-4" />
              Tokens ({period})
            </div>
            <p className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {totalTokens.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data && data.period_stats.avg_credits_per_request > 0
                ? `Avg ${data.period_stats.avg_credits_per_request.toFixed(4)} cr/request`
                : "Processed"}
            </p>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Period Selector + Usage Over Time Chart                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="w-full h-px bg-border/40" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            Usage Over Time
          </h2>
          <div className="flex items-center p-1 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
            {(["7d", "30d", "90d"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-[color,background-color,box-shadow] duration-150 ${
                  period === p
                    ? "bg-foreground text-background shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {loading && !data ? (
          <div className="h-[280px] rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm animate-pulse" />
        ) : data && data.by_day.length > 0 ? (
          <>
            <UsageChart data={data.by_day} />

            {/* Collapsible daily breakdown */}
            <button
              onClick={() => setShowDailyBreakdown(!showDailyBreakdown)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDailyBreakdown ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showDailyBreakdown ? "Hide" : "Show"} daily breakdown
            </button>

            {showDailyBreakdown && (
              <div className="space-y-1.5 stagger-enter animate-in fade-in slide-in-from-top-2 duration-200">
                {data.by_day.map((day, i) => (
                  <div
                    key={day.date}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] hover:bg-[#f8f9fa] dark:hover:bg-[#1E1E1E] transition-colors duration-150"
                    style={
                      { "--stagger": String(i) } as React.CSSProperties
                    }
                  >
                    <span className="text-sm text-muted-foreground w-24 shrink-0 font-mono">
                      {new Date(day.date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </span>
                    <div className="flex-1 h-5 rounded-full bg-neutral-200/40 dark:bg-neutral-800/40 overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-accent-bg transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(
                            2,
                            (day.credits / maxDayCredits) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right tabular-nums text-neutral-800 dark:text-neutral-200">
                      {day.credits.toLocaleString()} cr
                    </span>
                    <span className="text-xs text-muted-foreground w-16 text-right tabular-nums">
                      {day.messages} msgs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-border/60 bg-card/30">
            <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No usage data yet</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
              Usage will appear here once your agents start handling
              conversations.
            </p>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* By Provider                                                       */}
      {/* ----------------------------------------------------------------- */}
      {data && data.by_provider && data.by_provider.length > 0 && (
        <>
          <div className="w-full h-px bg-border/40" />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-muted-foreground" />
              By Provider
            </h2>
            <ProviderBreakdown data={data.by_provider} />
          </div>
        </>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Usage by Agent                                                    */}
      {/* ----------------------------------------------------------------- */}
      <div className="w-full h-px bg-border/40" />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Bot className="w-5 h-5 text-muted-foreground" />
          Usage by Agent
        </h2>

        {loading && !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-enter">
            {Array.from({ length: 4 }).map((_, i) => (
              <AgentCardSkeleton key={i} stagger={i} />
            ))}
          </div>
        ) : data && data.by_agent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-enter">
            {data.by_agent.map((agent, i) => {
              const modelInfo = getModelInfo(agent.model);
              return (
                <div
                  key={agent.agent_id}
                  className="group p-5 rounded-[32px] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 border border-black/5 dark:border-[#2A2A2A] hover:bg-white dark:hover:bg-[#252525] hover:-translate-y-1 hover:shadow-md transition-[transform,box-shadow,background-color] duration-200"
                  style={
                    { "--stagger": String(i) } as React.CSSProperties
                  }
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-[42px] h-[42px] rounded-[14px] bg-white dark:bg-[#252525] border border-black/5 dark:border-[#333333] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <Bot
                        className="w-5 h-5"
                        style={{
                          stroke: "url(#primary-icon-gradient)",
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
                        {agent.agent_name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {modelInfo?.label ?? agent.model}
                        {modelInfo && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300 font-medium">
                            {modelInfo.multiplier}x
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {agent.credits.toLocaleString()}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        credits
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {agent.messages.toLocaleString()}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        messages
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-6 rounded-3xl border border-dashed border-border/60 bg-card/30">
            <Bot className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No agent usage yet</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
              Per-agent breakdowns will appear here once conversations start.
            </p>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Usage by Model                                                    */}
      {/* ----------------------------------------------------------------- */}
      {data && data.by_model.length > 0 && (
        <>
          <div className="w-full h-px bg-border/40" />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">
              Usage by Model
            </h2>
            <div className="space-y-1.5 stagger-enter">
              {data.by_model.map((m, i) => {
                const info = getModelInfo(m.model);
                const maxModelCredits = Math.max(
                  ...data.by_model.map((x) => x.credits),
                  1
                );
                return (
                  <div
                    key={m.model}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] hover:bg-[#f8f9fa] dark:hover:bg-[#1E1E1E] transition-colors duration-150"
                    style={
                      { "--stagger": String(i) } as React.CSSProperties
                    }
                  >
                    <span className="text-sm font-medium w-40 shrink-0 truncate text-neutral-800 dark:text-neutral-200">
                      {info?.label ?? m.model}
                      {info && (
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300 font-medium">
                          {info.multiplier}x
                        </span>
                      )}
                    </span>
                    <div className="flex-1 h-5 rounded-full bg-neutral-200/40 dark:bg-neutral-800/40 overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-accent-bg transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(
                            2,
                            (m.credits / maxModelCredits) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right tabular-nums text-neutral-800 dark:text-neutral-200">
                      {m.credits.toLocaleString()} cr
                    </span>
                    <span className="text-xs text-muted-foreground w-16 text-right tabular-nums">
                      {m.messages} msgs
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Request History                                                   */}
      {/* ----------------------------------------------------------------- */}
      <div className="w-full h-px bg-border/40" />
      <RequestHistory />

      {/* Promo Modal */}
      <PromoRedeemModal
        open={promoOpen}
        onClose={() => setPromoOpen(false)}
        onSuccess={() => fetchData(period)}
      />
    </div>
  );
}

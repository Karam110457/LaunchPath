"use client";

import { useState, useEffect, useCallback } from "react";
import { Coins, MessageSquare, Zap, TrendingUp, Bot } from "lucide-react";
import { getModelInfo } from "@/lib/ai/model-tiers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UsageData {
  credits: {
    monthly_included: number;
    monthly_used: number;
    topup_balance: number;
    remaining: number;
  };
  period_stats: {
    total_credits: number;
    total_messages: number;
    total_input_tokens: number;
    total_output_tokens: number;
  };
  by_day: Array<{ date: string; credits: number; messages: number }>;
  by_agent: Array<{
    agent_id: string;
    agent_name: string;
    model: string;
    credits: number;
    messages: number;
  }>;
  by_model: Array<{ model: string; credits: number; messages: number }>;
}

type Period = "7d" | "30d" | "90d";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UsageDashboard({ userName }: { userName: string }) {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

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
    fetchData(period);
  }, [period, fetchData]);

  const maxDayCredits = data
    ? Math.max(...data.by_day.map((d) => d.credits), 1)
    : 1;

  const usedPercent = data
    ? Math.min(
        100,
        (data.credits.monthly_used / Math.max(data.credits.monthly_included, 1)) * 100
      )
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

        {/* Credit balance stat card */}
        <div className="flex items-center gap-4 shrink-0 px-4 py-3 rounded-3xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm">
          <div className="w-[52px] h-[52px] rounded-[18px] bg-[#f8f9fa] dark:bg-[#252525] border border-black/5 dark:border-[#333333] flex items-center justify-center">
            <Coins
              className="w-6 h-6"
              style={{ stroke: "url(#primary-icon-gradient)" }}
            />
          </div>
          <div>
            <p className="text-3xl font-semibold tracking-tight leading-none">
              {data ? Math.round(data.credits.remaining).toLocaleString() : "—"}
            </p>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              Credits Remaining
            </p>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Stats Row                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="h-px bg-border/40" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-enter">
        {/* Monthly usage with progress bar */}
        <div
          className="px-5 py-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm"
          style={{ "--stagger": "0" } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Zap className="w-4 h-4" />
            Monthly Credits
          </div>
          <p className="text-2xl font-semibold tracking-tight">
            {data ? Math.round(data.credits.monthly_used).toLocaleString() : "—"}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {data?.credits.monthly_included?.toLocaleString() ?? "—"}
            </span>
          </p>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full gradient-accent-bg transition-all duration-500"
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
          <p className="text-2xl font-semibold tracking-tight">
            {data
              ? Math.round(data.credits.topup_balance).toLocaleString()
              : "—"}
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
            Messages ({period})
          </div>
          <p className="text-2xl font-semibold tracking-tight">
            {data
              ? data.period_stats.total_messages.toLocaleString()
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data
              ? `${data.period_stats.total_credits.toLocaleString()} credits consumed`
              : ""}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Period Selector + Usage by Day                                    */}
      {/* ----------------------------------------------------------------- */}
      <div className="h-px bg-border/40" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            Daily Usage
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
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Loading usage data...
          </div>
        ) : data && data.by_day.length > 0 ? (
          <div className="space-y-1.5">
            {data.by_day.map((day) => (
              <div
                key={day.date}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] hover:bg-[#f8f9fa] dark:hover:bg-[#1E1E1E] transition-colors"
              >
                <span className="text-sm text-muted-foreground w-24 shrink-0 font-mono">
                  {new Date(day.date + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" }
                  )}
                </span>
                <div className="flex-1 h-5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-accent-bg transition-all duration-500"
                    style={{
                      width: `${Math.max(2, (day.credits / maxDayCredits) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-20 text-right tabular-nums">
                  {day.credits.toLocaleString()} cr
                </span>
                <span className="text-xs text-muted-foreground w-16 text-right tabular-nums">
                  {day.messages} msgs
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/40 bg-card/30">
            <TrendingUp className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground text-sm">
              No usage data for this period
            </p>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Usage by Agent                                                    */}
      {/* ----------------------------------------------------------------- */}
      <div className="h-px bg-border/40" />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Bot className="w-5 h-5 text-muted-foreground" />
          Usage by Agent
        </h2>

        {data && data.by_agent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-enter">
            {data.by_agent.map((agent, i) => {
              const modelInfo = getModelInfo(agent.model);
              return (
                <div
                  key={agent.agent_id}
                  className="p-5 rounded-[32px] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 border border-black/5 dark:border-[#2A2A2A] hover:bg-white dark:hover:bg-[#252525] hover:-translate-y-1 hover:shadow-md transition-all duration-200"
                  style={
                    { "--stagger": String(i) } as React.CSSProperties
                  }
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#252525] border border-black/5 dark:border-[#333333] flex items-center justify-center">
                      <Bot
                        className="w-5 h-5"
                        style={{
                          stroke: "url(#primary-icon-gradient)",
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {agent.agent_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {modelInfo?.label ?? agent.model}
                        {modelInfo && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-medium">
                            {modelInfo.multiplier}x
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold tabular-nums">
                        {agent.credits.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        credits
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold tabular-nums">
                        {agent.messages.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        messages
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-36 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/40 bg-card/30">
            <Bot className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground text-sm">
              No agent usage for this period
            </p>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Usage by Model                                                    */}
      {/* ----------------------------------------------------------------- */}
      {data && data.by_model.length > 0 && (
        <>
          <div className="h-px bg-border/40" />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">
              Usage by Model
            </h2>
            <div className="space-y-1.5">
              {data.by_model.map((m) => {
                const info = getModelInfo(m.model);
                const maxModelCredits = Math.max(
                  ...data.by_model.map((x) => x.credits),
                  1
                );
                return (
                  <div
                    key={m.model}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A]"
                  >
                    <span className="text-sm font-medium w-40 shrink-0 truncate">
                      {info?.label ?? m.model}
                      {info && (
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          {info.multiplier}x
                        </span>
                      )}
                    </span>
                    <div className="flex-1 h-5 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-accent-bg transition-all duration-500"
                        style={{
                          width: `${Math.max(2, (m.credits / maxModelCredits) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right tabular-nums">
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
    </div>
  );
}

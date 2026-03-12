"use client";

import { useState, useEffect, useCallback } from "react";
import { Coins, MessageSquare, Zap, Cpu, Bot } from "lucide-react";
import { getModelInfo } from "@/lib/ai/model-tiers";
import type { ClientUsageData } from "@/lib/dashboard/client-usage-data";

type Period = "7d" | "30d" | "90d";

// ---------------------------------------------------------------------------
// Skeletons
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  clientId: string;
  clientName: string;
}

export function ClientUsageDashboard({ clientId, clientName }: Props) {
  const [data, setData] = useState<ClientUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  const fetchData = useCallback(
    async (p: Period) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/clients/${clientId}/usage?period=${p}`
        );
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    },
    [clientId]
  );

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  const handlePeriod = (p: Period) => {
    setPeriod(p);
  };

  // Skeleton state
  if (loading && !data) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <StatCardSkeleton key={i} stagger={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { period_stats, by_day, by_agent, by_model } = data;
  const totalTokens = period_stats.total_input_tokens + period_stats.total_output_tokens;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Usage — {clientName}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Credit consumption and token usage for this client
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center p-1 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriod(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                period === p
                  ? "bg-foreground text-background shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "7d" ? "7 days" : p === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Credits Used"
          value={period_stats.total_credits.toFixed(2)}
          sub="This period"
          icon={<Coins className="w-4 h-4" />}
        />
        <StatCard
          label="Requests"
          value={String(period_stats.total_messages)}
          sub="API calls"
          icon={<MessageSquare className="w-4 h-4" />}
        />
        <StatCard
          label="Avg/Request"
          value={period_stats.avg_credits_per_request.toFixed(4)}
          sub="Credits"
          icon={<Zap className="w-4 h-4" />}
        />
        <StatCard
          label="Tokens"
          value={totalTokens.toLocaleString()}
          sub={`${period_stats.total_input_tokens.toLocaleString()} in / ${period_stats.total_output_tokens.toLocaleString()} out`}
          icon={<Cpu className="w-4 h-4" />}
        />
      </div>

      {/* Daily breakdown */}
      {by_day.length > 0 && (
        <section className="rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm p-5">
          <h3 className="text-sm font-semibold mb-4">Daily Usage</h3>
          <div className="space-y-2">
            {by_day.map((d) => {
              const maxCredits = Math.max(...by_day.map((x) => x.credits), 1);
              const pct = (d.credits / maxCredits) * 100;
              return (
                <div key={d.date} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-muted-foreground tabular-nums shrink-0">
                    {d.date}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF8C00] to-[#9D50BB]"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right tabular-nums font-medium">
                    {d.credits}
                  </span>
                  <span className="w-12 text-right text-muted-foreground tabular-nums">
                    {d.messages} req
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* By Agent */}
      {by_agent.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-4">By Agent</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {by_agent.map((a) => {
              const info = getModelInfo(a.model);
              return (
                <div
                  key={a.agent_id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8C00]/10 to-[#9D50BB]/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.agent_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {info?.label ?? a.model}
                        {info && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted">
                            {info.multiplier}x
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-border/40 pt-3 flex justify-between">
                    <div>
                      <p className="text-lg font-semibold tabular-nums">
                        {a.credits}
                      </p>
                      <p className="text-xs text-muted-foreground">credits</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold tabular-nums">
                        {a.messages}
                      </p>
                      <p className="text-xs text-muted-foreground">requests</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* By Model */}
      {by_model.length > 0 && (
        <section className="rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm p-5">
          <h3 className="text-sm font-semibold mb-4">By Model</h3>
          <div className="space-y-3">
            {by_model.map((m) => {
              const maxCredits = Math.max(...by_model.map((x) => x.credits), 1);
              const pct = (m.credits / maxCredits) * 100;
              const info = getModelInfo(m.model);
              return (
                <div key={m.model} className="flex items-center gap-3 text-sm">
                  <span className="w-40 truncate shrink-0 font-medium">
                    {info?.label ?? m.model}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF8C00] to-[#9D50BB]"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right tabular-nums font-medium">
                    {m.credits}
                  </span>
                  <span className="w-12 text-right text-muted-foreground tabular-nums">
                    {m.messages} req
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {period_stats.total_messages === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Cpu className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No usage data for this period</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">
          {label}
        </span>
        <span className="text-muted-foreground/60">{icon}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

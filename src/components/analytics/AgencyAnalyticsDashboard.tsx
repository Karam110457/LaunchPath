"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Users, Coins, MessageSquare, Cpu, ArrowUpDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ClientUsageSummary } from "@/lib/dashboard/client-usage-data";

type Period = "7d" | "30d" | "90d";
type SortKey = "total_credits" | "total_messages" | "total_tokens" | "client_name";

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

function TableRowSkeleton({ stagger }: { stagger: number }) {
  return (
    <tr
      className="border-b border-border/30"
      style={{ "--stagger": String(stagger) } as React.CSSProperties}
    >
      <td className="py-3 px-4"><SkeletonPulse className="h-5 w-32" /></td>
      <td className="py-3 px-4"><SkeletonPulse className="h-5 w-16" /></td>
      <td className="py-3 px-4"><SkeletonPulse className="h-5 w-12" /></td>
      <td className="py-3 px-4"><SkeletonPulse className="h-5 w-20" /></td>
      <td className="py-3 px-4"><SkeletonPulse className="h-5 w-24" /></td>
      <td className="py-3 px-4"><SkeletonPulse className="h-5 w-8" /></td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function AgencyAnalyticsDashboard() {
  const [data, setData] = useState<ClientUsageSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [sortKey, setSortKey] = useState<SortKey>("total_credits");
  const [sortAsc, setSortAsc] = useState(false);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/analytics?period=${p}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === "client_name") {
        return a.client_name.localeCompare(b.client_name) * dir;
      }
      return ((a[sortKey] as number) - (b[sortKey] as number)) * dir;
    });
  }, [data, sortKey, sortAsc]);

  // Totals
  const totals = useMemo(() => {
    if (!data) return { credits: 0, messages: 0, tokens: 0, clients: 0 };
    return {
      credits: data.reduce((s, c) => s + c.total_credits, 0),
      messages: data.reduce((s, c) => s + c.total_messages, 0),
      tokens: data.reduce((s, c) => s + c.total_tokens, 0),
      clients: data.length,
    };
  }, [data]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Per-client credit consumption across your agency
          </p>
        </div>
        <div className="flex items-center p-1 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
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

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Clients"
          value={loading ? "—" : String(totals.clients)}
          icon={<Users className="w-4 h-4" />}
        />
        <SummaryCard
          label="Total Credits"
          value={loading ? "—" : totals.credits.toFixed(2)}
          icon={<Coins className="w-4 h-4" />}
        />
        <SummaryCard
          label="Total Requests"
          value={loading ? "—" : totals.messages.toLocaleString()}
          icon={<MessageSquare className="w-4 h-4" />}
        />
        <SummaryCard
          label="Total Tokens"
          value={loading ? "—" : totals.tokens.toLocaleString()}
          icon={<Cpu className="w-4 h-4" />}
        />
      </div>

      {/* Client comparison table */}
      <div className="rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40">
          <h3 className="text-sm font-semibold">Client Breakdown</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click column headers to sort
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left">
                <SortableHeader
                  label="Client"
                  sortKey="client_name"
                  currentKey={sortKey}
                  asc={sortAsc}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Credits"
                  sortKey="total_credits"
                  currentKey={sortKey}
                  asc={sortAsc}
                  onSort={handleSort}
                  align="right"
                />
                <SortableHeader
                  label="Requests"
                  sortKey="total_messages"
                  currentKey={sortKey}
                  asc={sortAsc}
                  onSort={handleSort}
                  align="right"
                />
                <SortableHeader
                  label="Tokens"
                  sortKey="total_tokens"
                  currentKey={sortKey}
                  asc={sortAsc}
                  onSort={handleSort}
                  align="right"
                />
                <th className="py-3 px-4 text-xs font-medium text-muted-foreground">
                  Last Active
                </th>
                <th className="py-3 px-4 text-xs font-medium text-muted-foreground w-10" />
              </tr>
            </thead>
            <tbody>
              {loading && !data
                ? [0, 1, 2, 3, 4].map((i) => (
                    <TableRowSkeleton key={i} stagger={i} />
                  ))
                : sorted.map((c) => (
                    <tr
                      key={c.client_id}
                      className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">
                        {c.client_name}
                        {c.credit_cap_monthly != null && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            cap: {c.credit_cap_used}/{c.credit_cap_monthly}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-medium">
                        {c.total_credits.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {c.total_messages.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {c.total_tokens.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {c.last_active
                          ? new Date(c.last_active).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/clients/${c.client_id}/usage`}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
              {!loading && sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No clients with usage data in this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
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
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  currentKey,
  asc,
  onSort,
  align,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  asc: boolean;
  onSort: (key: SortKey) => void;
  align?: "right";
}) {
  const active = currentKey === sortKey;
  return (
    <th
      className={`py-3 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none ${
        align === "right" ? "text-right" : ""
      }`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`w-3 h-3 ${active ? "text-foreground" : "opacity-40"}`}
        />
        {active && (
          <span className="text-[9px]">{asc ? "ASC" : "DESC"}</span>
        )}
      </span>
    </th>
  );
}

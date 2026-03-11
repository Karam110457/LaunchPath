"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { MODEL_OPTIONS, getModelInfo } from "@/lib/ai/model-tiers";

interface HistoryRow {
  id: string;
  model: string;
  model_tier: string;
  credits_consumed: number;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
}

const PROVIDERS = [...new Set(MODEL_OPTIONS.map((m) => m.provider))];

export function RequestHistory() {
  const [expanded, setExpanded] = useState(false);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modelFilter, setModelFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");

  const limit = 50;

  const fetchHistory = useCallback(
    async (p: number, model: string, provider: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          view: "history",
          page: String(p),
          limit: String(limit),
        });
        if (model) params.set("model", model);
        if (provider) params.set("provider", provider);

        const res = await fetch(`/api/dashboard/usage?${params}`);
        if (res.ok) {
          const data = await res.json();
          setRows(data.rows);
          setTotal(data.total);
          setPage(data.page);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleExpand = () => {
    if (!expanded) {
      setExpanded(true);
      fetchHistory(1, modelFilter, providerFilter);
    } else {
      setExpanded(false);
    }
  };

  const handleFilterChange = (model: string, provider: string) => {
    setModelFilter(model);
    setProviderFilter(provider);
    fetchHistory(1, model, provider);
  };

  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  function formatProvider(modelId: string): string {
    const info = getModelInfo(modelId);
    if (info) return info.provider;
    if (modelId.includes("/")) {
      const seg = modelId.split("/")[0];
      return seg.charAt(0).toUpperCase() + seg.slice(1);
    }
    return "Anthropic";
  }

  return (
    <div className="space-y-3">
      {/* Toggle button */}
      <button
        onClick={handleExpand}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        {expanded ? "Hide" : "View"} Request History
        {total > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300">
            {total}
          </span>
        )}
      </button>

      {expanded && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={modelFilter}
              onChange={(e) =>
                handleFilterChange(e.target.value, providerFilter)
              }
              className="text-sm px-3 py-1.5 rounded-lg border border-border/40 bg-card/60 backdrop-blur-sm text-foreground focus:outline-none focus:ring-1 focus:ring-border"
            >
              <option value="">All models</option>
              {MODEL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={providerFilter}
              onChange={(e) =>
                handleFilterChange(modelFilter, e.target.value)
              }
              className="text-sm px-3 py-1.5 rounded-lg border border-border/40 bg-card/60 backdrop-blur-sm text-foreground focus:outline-none focus:ring-1 focus:ring-border"
            >
              <option value="">All providers</option>
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-11 rounded-xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] animate-pulse"
                />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No requests found.
            </p>
          ) : (
            <>
              {/* Header row */}
              <div className="hidden sm:grid grid-cols-[1fr_1fr_0.7fr_0.8fr_0.8fr_0.6fr] gap-2 px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>Date</span>
                <span>Model</span>
                <span>Provider</span>
                <span className="text-right">Input</span>
                <span className="text-right">Output</span>
                <span className="text-right">Credits</span>
              </div>

              <div className="space-y-1">
                {rows.map((row) => {
                  const info = getModelInfo(row.model);
                  const totalTokens =
                    (row.input_tokens ?? 0) + (row.output_tokens ?? 0);
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_0.7fr_0.8fr_0.8fr_0.6fr] gap-2 items-center px-4 py-2.5 rounded-xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] hover:bg-[#f8f9fa] dark:hover:bg-[#1E1E1E] transition-colors duration-150 text-sm"
                    >
                      <span className="text-muted-foreground text-xs sm:text-sm font-mono">
                        {new Date(row.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {", "}
                        {new Date(row.created_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                        {info?.label ?? row.model}
                      </span>
                      <span className="hidden sm:block text-muted-foreground">
                        {formatProvider(row.model)}
                      </span>
                      <span className="hidden sm:block text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                        {(row.input_tokens ?? 0).toLocaleString()}
                      </span>
                      <span className="hidden sm:block text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                        {(row.output_tokens ?? 0).toLocaleString()}
                      </span>
                      <span className="text-right font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                        {row.credits_consumed}
                        {/* Mobile: show total tokens inline */}
                        <span className="sm:hidden text-xs text-muted-foreground ml-1">
                          ({totalTokens.toLocaleString()} tok)
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Showing {start}–{end} of {total}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        fetchHistory(page - 1, modelFilter, providerFilter)
                      }
                      disabled={page <= 1}
                      className="p-1.5 rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm tabular-nums px-2 text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        fetchHistory(page + 1, modelFilter, providerFilter)
                      }
                      disabled={page >= totalPages}
                      className="p-1.5 rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import {
  MODEL_OPTIONS,
  getAvailableProviders,
  TIER_LABELS,
  type ModelOption,
  type ModelTier,
} from "@/lib/ai/model-tiers";

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  className?: string;
}

const TIER_ORDER: ModelTier[] = ["fast", "standard", "advanced"];

const TIER_BADGE_COLORS: Record<ModelTier, string> = {
  fast: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  standard: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  advanced: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function ModelSelector({ value, onChange, className }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const providers = useMemo(() => getAvailableProviders(), []);

  const selectedModel = useMemo(
    () => MODEL_OPTIONS.find((m) => m.value === value),
    [value]
  );

  // Filter models by search + provider
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MODEL_OPTIONS.filter((m) => {
      if (providerFilter && m.provider !== providerFilter) return false;
      if (!q) return true;
      return (
        m.label.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.value.toLowerCase().includes(q)
      );
    });
  }, [search, providerFilter]);

  // Group filtered models by provider
  const grouped = useMemo(() => {
    const map = new Map<string, ModelOption[]>();
    for (const m of filtered) {
      const list = map.get(m.provider) ?? [];
      list.push(m);
      map.set(m.provider, list);
    }
    // Sort within each provider by tier order then multiplier
    for (const [, list] of map) {
      list.sort((a, b) => {
        const tierDiff = TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
        if (tierDiff !== 0) return tierDiff;
        return a.multiplier - b.multiplier;
      });
    }
    return map;
  }, [filtered]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch("");
      setProviderFilter(null);
    }
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span className="truncate">
          {selectedModel ? (
            <>
              {selectedModel.label}
              <span className="text-muted-foreground ml-1.5">
                {selectedModel.provider} · {selectedModel.multiplier}x
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Select a model…</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground ml-2" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[380px] max-h-[420px] rounded-xl border border-border/60 bg-background shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models…"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="p-0.5 hover:bg-muted/50 rounded">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Provider pills */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border/40 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setProviderFilter(null)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                !providerFilter
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              All
            </button>
            {providers.map((p) => (
              <button
                key={p}
                onClick={() => setProviderFilter(providerFilter === p ? null : p)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  providerFilter === p
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Model list */}
          <div className="overflow-y-auto max-h-[310px] py-1">
            {grouped.size === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No models found
              </p>
            ) : (
              Array.from(grouped.entries()).map(([provider, models]) => (
                <div key={provider}>
                  {/* Provider header (only show if not filtering by single provider) */}
                  {!providerFilter && (
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background/95 backdrop-blur-sm">
                      {provider}
                    </div>
                  )}
                  {models.map((m) => {
                    const isSelected = m.value === value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => {
                          onChange(m.value);
                          setOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          isSelected
                            ? "bg-muted/60"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex-1 min-w-0 text-left">
                          <span className="font-medium text-foreground">
                            {m.label}
                          </span>
                          {providerFilter && (
                            <span className="text-muted-foreground ml-1">
                              · {m.provider}
                            </span>
                          )}
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TIER_BADGE_COLORS[m.tier]}`}
                        >
                          {TIER_LABELS[m.tier]}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums w-10 text-right">
                          {m.multiplier}x
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 shrink-0 text-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  /** Use a simple native <select> — best for narrow panels */
  compact?: boolean;
}

const TIER_ORDER: ModelTier[] = ["fast", "standard", "advanced"];

const TIER_BADGE_COLORS: Record<ModelTier, string> = {
  fast: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  standard: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  advanced: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const DROPDOWN_W = 360;
const DROPDOWN_MAX_H = 420;

/** Models grouped by provider for the native <select> */
const PROVIDER_GROUPS = (() => {
  const map = new Map<string, ModelOption[]>();
  for (const m of MODEL_OPTIONS) {
    const list = map.get(m.provider) ?? [];
    list.push(m);
    map.set(m.provider, list);
  }
  return Array.from(map.entries());
})();

export function ModelSelector({ value, onChange, className, compact }: ModelSelectorProps) {
  // ── Compact mode: native <select> grouped by provider ──
  if (compact) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className ?? ""}`}
      >
        {PROVIDER_GROUPS.map(([provider, models]) => (
          <optgroup key={provider} label={provider}>
            {models.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}{m.voiceReady ? " 🎙" : ""} — {m.multiplier}x
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    );
  }
  // ── Full mode: searchable dropdown ──
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: DROPDOWN_W,
  });

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
    for (const [, list] of map) {
      list.sort((a, b) => {
        const tierDiff = TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
        if (tierDiff !== 0) return tierDiff;
        return a.multiplier - b.multiplier;
      });
    }
    return map;
  }, [filtered]);

  // Calculate fixed position for dropdown
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const triggerW = rect.width;
    const dropW = Math.max(triggerW, DROPDOWN_W);

    // Prefer aligning left edge with trigger; clamp to viewport
    let left = rect.left;
    if (left + dropW > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - dropW - 8);
    }

    // Prefer opening below; if not enough space, open above
    let top = rect.bottom + 4;
    if (top + DROPDOWN_MAX_H > window.innerHeight - 8) {
      const above = rect.top - 4 - DROPDOWN_MAX_H;
      if (above > 8) top = above;
    }

    setPos({ top, left, width: dropW });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        triggerRef.current?.contains(t) ||
        dropdownRef.current?.contains(t)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reposition on scroll / resize while open
  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

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
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className ?? ""}`}
      >
        <span className="truncate text-left">
          {selectedModel ? (
            <>
              {selectedModel.label}
              <span className="text-muted-foreground ml-1.5 text-xs">
                {selectedModel.multiplier}x
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Select model…</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground ml-1" />
      </button>

      {/* Portal-style fixed dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: pos.width,
            maxHeight: DROPDOWN_MAX_H,
            zIndex: 9999,
          }}
          className="rounded-xl border border-border/60 bg-background shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
        >
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

          {/* Provider pills — wrapping allowed on narrow widths */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border/40 flex-wrap">
            <button
              onClick={() => setProviderFilter(null)}
              className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
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
                className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
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
          <div className="overflow-y-auto" style={{ maxHeight: DROPDOWN_MAX_H - 90 }}>
            {grouped.size === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No models found
              </p>
            ) : (
              Array.from(grouped.entries()).map(([provider, models]) => (
                <div key={provider}>
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
                        className={`w-full flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                          isSelected ? "bg-muted/60" : "hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex-1 min-w-0 text-left truncate">
                          <span className="font-medium text-foreground">
                            {m.label}
                          </span>
                        </div>
                        {m.voiceReady && (
                          <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            Voice
                          </span>
                        )}
                        <span
                          className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TIER_BADGE_COLORS[m.tier]}`}
                        >
                          {TIER_LABELS[m.tier]}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums w-8 text-right">
                          {m.multiplier}x
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 shrink-0 text-foreground" />
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
    </>
  );
}

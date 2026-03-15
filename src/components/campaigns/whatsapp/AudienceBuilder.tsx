"use client";

import { useState, useEffect } from "react";
import { Users, Tag } from "lucide-react";

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50";

export interface AudienceFilter {
  tags?: string[];
  status?: string;
}

interface AudienceBuilderProps {
  campaignId: string;
  filter: AudienceFilter;
  onChange: (filter: AudienceFilter) => void;
}

export function AudienceBuilder({
  campaignId,
  filter,
  onChange,
}: AudienceBuilderProps) {
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState(filter.tags?.join(", ") ?? "");

  useEffect(() => {
    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ limit: "1" });
        if (filter.tags?.length) params.set("tags", filter.tags.join(","));
        if (filter.status) params.set("status", filter.status);

        const res = await fetch(
          `/api/campaigns/${campaignId}/contacts?${params.toString()}`,
          { signal: abortController.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setMatchCount(data.total ?? 0);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setMatchCount(null);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [campaignId, filter]);

  return (
    <div className="space-y-4">
      {/* Tag filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground flex items-center gap-1">
          <Tag className="w-3 h-3" />
          Filter by Tags
        </label>
        <input
          value={tagInput}
          onChange={(e) => {
            setTagInput(e.target.value);
            const tags = e.target.value
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
            onChange({ ...filter, tags: tags.length > 0 ? tags : undefined });
          }}
          className={INPUT_CLASS}
          placeholder="e.g., vip, campaign-q1 (comma-separated)"
        />
      </div>

      {/* Status filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">
          Contact Status
        </label>
        <select
          value={filter.status ?? ""}
          onChange={(e) =>
            onChange({
              ...filter,
              status: e.target.value || undefined,
            })
          }
          className={INPUT_CLASS}
        >
          <option value="">All contacts</option>
          <option value="active">Active only</option>
        </select>
      </div>

      {/* Match count */}
      <div className="flex items-center gap-2 p-3 rounded-[16px] bg-neutral-50/60 dark:bg-neutral-800/30 border border-neutral-200/50 dark:border-neutral-700/50">
        <Users className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs text-foreground">
          {matchCount !== null ? (
            <>
              <span className="font-semibold">{matchCount}</span> contacts match
            </>
          ) : (
            "Counting…"
          )}
        </p>
      </div>
    </div>
  );
}

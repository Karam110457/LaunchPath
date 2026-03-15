"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Plus,
  Loader2,
  Search,
  FileText,
  ArrowUpDown,
} from "lucide-react";
import { TemplateList, type TemplateRecord } from "./TemplateList";
import { TemplateEditor } from "./TemplateEditor";
import { VariableMappingEditor } from "./VariableMappingEditor";

interface TemplatesTabProps {
  agentId: string;
  channelId: string;
  hasBusinessAccountId: boolean;
  campaignId?: string;
}

type StatusFilter = "ALL" | "APPROVED" | "PENDING" | "REJECTED";
type SortField = "name" | "created_at" | "category";

const FILTER_PILLS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
];

const gradientBorderStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, #FF8C00, #9D50BB)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

export function TemplatesTab({
  agentId,
  channelId,
  hasBusinessAccountId,
  campaignId,
}: TemplatesTabProps) {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<TemplateRecord | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("created_at");

  const channelApiBase = `/api/agents/${agentId}/channels/${channelId}`;

  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(
        `${channelApiBase}/templates?${params.toString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates ?? []);
      } else {
        setError("Failed to load templates");
      }
    } catch {
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [channelApiBase, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchTemplates();
  }, [fetchTemplates]);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch(`${channelApiBase}/templates/sync`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchTemplates();
      } else {
        setError("Sync failed. Check your Business Account ID.");
      }
    } catch {
      setError("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(templateId: string) {
    if (!window.confirm("Delete this template? This will also remove it from Meta and cannot be undone.")) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(
        `${channelApiBase}/templates/${templateId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      } else {
        setError("Failed to delete template");
      }
    } catch {
      setError("Failed to delete template");
    }
  }

  // Filter by search (client-side) and sort
  const filtered = (search.trim()
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.category.toLowerCase().includes(search.toLowerCase())
      )
    : templates
  ).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "category") return a.category.localeCompare(b.category);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  if (!hasBusinessAccountId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">
          Business Account ID Required
        </p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Add your WhatsApp Business Account ID in the Settings tab to enable
          template management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Message Templates
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing…" : "Sync from Meta"}
          </button>
          <button
            type="button"
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-3 h-3" />
            New Template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center p-1 rounded-full border border-border/40 bg-card/60 backdrop-blur-md">
          {FILTER_PILLS.map((pill) => {
            const isActive = statusFilter === pill.value;
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => setStatusFilter(pill.value)}
                style={isActive ? gradientBorderStyle : undefined}
                className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-all ${
                  isActive
                    ? "[--card-bg:#fff] dark:[--card-bg:#171717] border-transparent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 max-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] outline-none focus:ring-2 focus:ring-neutral-400/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="text-[11px] rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-2 py-1.5 outline-none focus:ring-2 focus:ring-neutral-400/20 transition-all"
          >
            <option value="created_at">Newest</option>
            <option value="name">Name</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30">
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs">Dismiss</button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TemplateList
          templates={filtered}
          onEdit={(t) => setEditingTemplate(t)}
          onDelete={handleDelete}
        />
      )}

      {/* Editor dialog */}
      {showEditor && (
        <TemplateEditor
          channelApiBase={channelApiBase}
          onCreated={() => {
            setShowEditor(false);
            fetchTemplates();
          }}
          onClose={() => setShowEditor(false)}
        />
      )}

      {/* Variable mapping dialog */}
      {editingTemplate && (
        <VariableMappingEditor
          template={editingTemplate}
          channelApiBase={channelApiBase}
          campaignId={campaignId}
          onSaved={() => {
            setEditingTemplate(null);
            fetchTemplates();
          }}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}

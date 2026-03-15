"use client";

import { Trash2, Settings2, Send } from "lucide-react";

export interface TemplateRecord {
  id: string;
  name: string;
  language: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAUSED" | "DISABLED";
  components: Record<string, unknown>[];
  meta_template_id?: string;
  rejected_reason?: string;
  quality_score?: string;
  example_values?: Record<string, unknown>;
  variable_mapping?: Record<string, unknown>;
  last_synced_at?: string;
  updated_at: string;
}

interface TemplateListProps {
  templates: TemplateRecord[];
  onEdit: (template: TemplateRecord) => void;
  onDelete: (templateId: string) => void;
  onSend?: (template: TemplateRecord) => void;
}

const STATUS_STYLES: Record<string, string> = {
  APPROVED:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDING:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PAUSED: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  DISABLED:
    "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  MARKETING: "Marketing",
  UTILITY: "Utility",
  AUTHENTICATION: "Auth",
};

function getBodyText(components: Record<string, unknown>[]): string {
  const body = components.find((c) => c.type === "BODY");
  return (body?.text as string) ?? "";
}

export function TemplateList({
  templates,
  onEdit,
  onDelete,
  onSend,
}: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300/60 dark:border-neutral-700/50 bg-neutral-100/30 dark:bg-neutral-800/20 p-6">
        <p className="text-xs text-muted-foreground text-center">
          No templates found. Sync from Meta or create a new template.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {templates.map((t) => {
        const bodyPreview = getBodyText(t.components);
        return (
          <div
            key={t.id}
            className="rounded-[20px] border border-neutral-200/60 dark:border-[#2A2A2A] bg-white/60 dark:bg-neutral-900/40 p-4 hover:bg-white/80 dark:hover:bg-neutral-900/60 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate">
                    {t.name}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      STATUS_STYLES[t.status] ?? STATUS_STYLES.DISABLED
                    }`}
                  >
                    {t.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                    {CATEGORY_LABELS[t.category] ?? t.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {t.language}
                  </span>
                </div>
                {bodyPreview && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                    {bodyPreview}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                {t.status === "APPROVED" && onSend && (
                  <button
                    type="button"
                    onClick={() => onSend(t)}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-muted-foreground hover:text-foreground transition-colors"
                    title="Send template"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onEdit(t)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit mapping"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(t.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

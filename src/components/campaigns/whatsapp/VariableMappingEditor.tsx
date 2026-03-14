"use client";

import { useState } from "react";
import { X, Loader2, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { TemplateRecord } from "./TemplateList";

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50";

const CONTACT_FIELDS = [
  { value: "name", label: "Contact Name" },
  { value: "phone", label: "Phone Number" },
  { value: "email", label: "Email" },
  { value: "custom_fields.company", label: "Company (custom)" },
  { value: "custom_fields.order_id", label: "Order ID (custom)" },
  { value: "custom_fields.amount", label: "Amount (custom)" },
];

interface VariableMappingEditorProps {
  template: TemplateRecord;
  channelApiBase: string;
  onSaved: () => void;
  onClose: () => void;
}

function extractVariables(components: Record<string, unknown>[]): string[] {
  const vars = new Set<string>();
  for (const c of components) {
    const text = c.text as string | undefined;
    if (text) {
      const matches = text.match(/\{\{(\d+)\}\}/g);
      if (matches) matches.forEach((m) => vars.add(m));
    }
  }
  return Array.from(vars).sort();
}

export function VariableMappingEditor({
  template,
  channelApiBase,
  onSaved,
  onClose,
}: VariableMappingEditorProps) {
  const variables = extractVariables(template.components);
  const [mapping, setMapping] = useState<Record<string, string>>(
    (template.variable_mapping ?? {}) as Record<string, string>
  );
  const [exampleValues, setExampleValues] = useState<Record<string, string>>(
    (template.example_values ?? {}) as Record<string, string>
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        `${channelApiBase}/templates/${template.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variable_mapping: mapping,
            example_values: exampleValues,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${res.status})`);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  // Render body text with variables highlighted
  const bodyComponent = template.components.find((c) => c.type === "BODY");
  const bodyText = (bodyComponent?.text as string) ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/50 dark:border-neutral-700/50">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Variable Mapping
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {template.name} · {template.language}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Body preview */}
          <div className="rounded-[16px] bg-neutral-50/60 dark:bg-neutral-800/30 border border-neutral-200/50 dark:border-neutral-700/50 p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Template Body
            </p>
            <p className="text-xs text-foreground/80 font-mono whitespace-pre-wrap">
              {bodyText}
            </p>
          </div>

          {variables.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              This template has no variables to map.
            </p>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground">
                Map each variable to a contact field, or provide a static
                example value for preview/testing.
              </p>

              <div className="space-y-4">
                {variables.map((v) => {
                  const key = v.replace(/[{}]/g, "");
                  return (
                    <div
                      key={v}
                      className="rounded-[16px] border border-neutral-200/60 dark:border-[#2A2A2A] p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-foreground bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                          {v}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Contact Field</Label>
                        <select
                          value={mapping[key] ?? ""}
                          onChange={(e) =>
                            setMapping((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className={INPUT_CLASS}
                        >
                          <option value="">— Static value —</option>
                          {CONTACT_FIELDS.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px]">
                          Example / Fallback Value
                        </Label>
                        <input
                          value={exampleValues[key] ?? ""}
                          onChange={(e) =>
                            setExampleValues((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className={INPUT_CLASS}
                          placeholder={`Value for ${v}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium rounded-full gradient-accent-bg text-white shadow-md hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Mapping
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

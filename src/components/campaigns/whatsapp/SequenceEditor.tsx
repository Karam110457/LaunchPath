"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50";

interface SequenceStep {
  stepNumber: number;
  delayMinutes: number;
  templateId: string;
  stopOnReply?: boolean;
}

interface TemplateSummary {
  id: string;
  name: string;
  language: string;
  status: string;
}

interface SequenceEditorProps {
  campaignId: string;
  agentId: string;
  channelId: string;
  sequenceId?: string | null;
  onDone: () => void;
  onCancel: () => void;
}

export function SequenceEditor({ campaignId, agentId, channelId, sequenceId, onDone, onCancel }: SequenceEditorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<SequenceStep[]>([
    { stepNumber: 1, delayMinutes: 60, templateId: "", stopOnReply: true },
  ]);
  const [stopOnReply, setStopOnReply] = useState(true);
  const [autoEnrollTags, setAutoEnrollTags] = useState("");
  const [autoEnrollOnIngest, setAutoEnrollOnIngest] = useState(false);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!sequenceId);
  const [error, setError] = useState<string | null>(null);

  // Load templates from the correct channel-level endpoint
  useEffect(() => {
    fetch(`/api/agents/${agentId}/channels/${channelId}/templates?status=APPROVED`)
      .then((r) => r.json())
      .then((data) => {
        setTemplates(
          (data.templates ?? []).filter((t: TemplateSummary) => t.status === "APPROVED")
        );
      })
      .catch(() => {});
  }, [agentId, channelId]);

  // Load existing sequence if editing
  useEffect(() => {
    if (!sequenceId) return;
    fetch(`/api/campaigns/${campaignId}/sequences/${sequenceId}`)
      .then((r) => r.json())
      .then((data) => {
        const seq = data.sequence;
        if (seq) {
          setName(seq.name);
          setDescription(seq.description ?? "");
          setSteps(seq.steps.length > 0 ? seq.steps : [{ stepNumber: 1, delayMinutes: 60, templateId: "", stopOnReply: true }]);
          setStopOnReply(seq.stop_on_reply ?? true);
          setAutoEnrollTags((seq.auto_enroll?.on_tag ?? []).join(", "));
          setAutoEnrollOnIngest(seq.auto_enroll?.on_ingest ?? false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId, sequenceId]);

  function addStep() {
    setSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length + 1,
        delayMinutes: 1440,
        templateId: "",
        stopOnReply: true,
      },
    ]);
  }

  function removeStep(idx: number) {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, stepNumber: i + 1 }))
    );
  }

  function updateStep(idx: number, updates: Partial<SequenceStep>) {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...updates } : s))
    );
  }

  function moveStep(idx: number, direction: "up" | "down") {
    setSteps((prev) => {
      const next = [...prev];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next.map((s, i) => ({ ...s, stepNumber: i + 1 }));
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    const validSteps = steps.filter((s) => s.templateId);
    if (validSteps.length === 0) {
      setError("Add at least one step with a template");
      return;
    }

    setSaving(true);
    setError(null);

    const autoEnroll = {
      on_tag: autoEnrollTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      on_ingest: autoEnrollOnIngest,
    };

    try {
      const url = sequenceId
        ? `/api/campaigns/${campaignId}/sequences/${sequenceId}`
        : `/api/campaigns/${campaignId}/sequences`;

      const res = await fetch(url, {
        method: sequenceId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          steps: validSteps,
          stop_on_reply: stopOnReply,
          auto_enroll: autoEnroll,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function formatDelay(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {sequenceId ? "Edit Sequence" : "Create Sequence"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Basic info */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-muted-foreground">Name</Label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT_CLASS}
            placeholder="e.g., Welcome Drip"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-muted-foreground">Description</Label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={INPUT_CLASS}
            placeholder="Optional description"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Steps
        </Label>

        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200/50 dark:border-neutral-700/30 bg-neutral-50/50 dark:bg-neutral-800/20"
            >
              <div className="flex flex-col items-center gap-0.5 pt-1 text-muted-foreground">
                <button
                  type="button"
                  onClick={() => moveStep(idx, "up")}
                  disabled={idx === 0}
                  className="p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-20"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-semibold">{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => moveStep(idx, "down")}
                  disabled={idx === steps.length - 1}
                  className="p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-20"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <select
                      value={step.templateId}
                      onChange={(e) => updateStep(idx, { templateId: e.target.value })}
                      className={`${INPUT_CLASS} text-xs`}
                    >
                      <option value="">Select template...</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.language})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={step.delayMinutes}
                        onChange={(e) =>
                          updateStep(idx, { delayMinutes: Math.max(0, parseInt(e.target.value) || 0) })
                        }
                        className={`${INPUT_CLASS} text-xs text-center`}
                        min={0}
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground text-center mt-0.5">
                      min ({formatDelay(step.delayMinutes)})
                    </p>
                  </div>
                </div>
              </div>

              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(idx)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addStep}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Step
        </button>
      </div>

      {/* Settings */}
      <div className="space-y-3 border-t border-neutral-200/50 dark:border-neutral-700/50 pt-4">
        <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Settings
        </Label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={stopOnReply}
            onChange={(e) => setStopOnReply(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs text-foreground">Stop sequence when contact replies</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoEnrollOnIngest}
            onChange={(e) => setAutoEnrollOnIngest(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs text-foreground">Auto-enroll new contacts from ingest</span>
        </label>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-muted-foreground">
            Auto-enroll on tags (comma-separated)
          </Label>
          <input
            value={autoEnrollTags}
            onChange={(e) => setAutoEnrollTags(e.target.value)}
            className={INPUT_CLASS}
            placeholder="e.g., lead, interested"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[11px] font-medium rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2 text-[11px] font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Sequence"}
        </button>
      </div>
    </div>
  );
}

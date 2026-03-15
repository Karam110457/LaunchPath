"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Send, ChevronRight, Clock } from "lucide-react";
import { AudienceBuilder, type AudienceFilter } from "./AudienceBuilder";
import type { TemplateRecord } from "./TemplateList";

interface BulkSendDialogProps {
  agentId: string;
  channelId: string;
  campaignId: string;
  templates: TemplateRecord[];
  onCreated: () => void;
  onClose: () => void;
}

type Step = "template" | "audience" | "confirm";

const gradientBorderStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, #FF8C00, #9D50BB)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

export function BulkSendDialog({
  agentId,
  channelId,
  campaignId,
  templates,
  onCreated,
  onClose,
}: BulkSendDialogProps) {
  const approvedTemplates = templates.filter((t) => t.status === "APPROVED");
  const [step, setStep] = useState<Step>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRecord | null>(null);
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");

  async function handleSend() {
    if (!selectedTemplate) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/agents/${agentId}/channels/${channelId}/templates/${selectedTemplate.id}/bulk-send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audience_filter: audienceFilter,
            scheduled_for: scheduleEnabled && scheduledFor
              ? new Date(scheduledFor).toISOString()
              : undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Bulk send failed");
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSending(false);
    }
  }

  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  // Fetch recipient count when reaching confirm step
  useEffect(() => {
    if (step !== "confirm") return;
    const params = new URLSearchParams({ limit: "1" });
    if (audienceFilter.tags?.length) params.set("tags", audienceFilter.tags.join(","));
    if (audienceFilter.status) params.set("status", audienceFilter.status);
    fetch(`/api/campaigns/${campaignId}/contacts?${params.toString()}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setRecipientCount(data.total ?? 0); })
      .catch(() => {});
  }, [step, campaignId, audienceFilter]);

  const bodyPreview = selectedTemplate
    ? (selectedTemplate.components.find((c) => c.type === "BODY")?.text as string) ?? ""
    : "";

  // Close on Escape
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && !sending) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onKeyDown={handleKeyDown}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/50 dark:border-neutral-700/50">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              New Bulk Send
            </h3>
            <div className="flex items-center gap-1 mt-1">
              {(["template", "audience", "confirm"] as Step[]).map((s, i) => (
                <span key={s} className="flex items-center gap-1">
                  <span
                    className={`text-[10px] font-medium ${
                      s === step ? "text-foreground" : "text-muted-foreground/50"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                  {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground/30" />}
                </span>
              ))}
            </div>
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
          {/* Step 1: Select Template */}
          {step === "template" && (
            <div className="space-y-2.5">
              <p className="text-xs text-muted-foreground">
                Select an approved template to send.
              </p>
              {approvedTemplates.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No approved templates available. Create and get a template approved first.
                </p>
              ) : (
                approvedTemplates.map((t) => {
                  const isSelected = selectedTemplate?.id === t.id;
                  const body = (t.components.find((c) => c.type === "BODY")?.text as string) ?? "";
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTemplate(t)}
                      style={isSelected ? gradientBorderStyle : undefined}
                      className={`w-full text-left p-3 rounded-[16px] border-2 transition-all ${
                        isSelected
                          ? "[--card-bg:#fff] dark:[--card-bg:#171717] border-transparent"
                          : "border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                        {body}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Step 2: Build Audience */}
          {step === "audience" && (
            <AudienceBuilder
              campaignId={campaignId}
              filter={audienceFilter}
              onChange={setAudienceFilter}
            />
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && selectedTemplate && (
            <div className="space-y-4">
              <div className="rounded-[16px] bg-neutral-50/60 dark:bg-neutral-800/30 border border-neutral-200/50 dark:border-neutral-700/50 p-4 space-y-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Template
                </p>
                <p className="text-sm font-medium text-foreground">
                  {selectedTemplate.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                  {bodyPreview}
                </p>
              </div>

              <div className="rounded-[16px] bg-neutral-50/60 dark:bg-neutral-800/30 border border-neutral-200/50 dark:border-neutral-700/50 p-4 space-y-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Audience
                </p>
                <p className="text-xs text-foreground">
                  {audienceFilter.tags?.length
                    ? `Tags: ${audienceFilter.tags.join(", ")}`
                    : "All contacts"}
                  {audienceFilter.status ? ` · Status: ${audienceFilter.status}` : ""}
                </p>
                {recipientCount !== null && (
                  <p className="text-sm font-semibold text-foreground">
                    {recipientCount} contact{recipientCount !== 1 ? "s" : ""} will receive this message
                  </p>
                )}
              </div>

              {/* Schedule option */}
              <div className="rounded-[16px] bg-neutral-50/60 dark:bg-neutral-800/30 border border-neutral-200/50 dark:border-neutral-700/50 p-4 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Schedule for later
                  </span>
                </label>
                {scheduleEnabled && (
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400/20 transition-all"
                  />
                )}
              </div>

              <div className="rounded-[16px] bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 p-3">
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Messages will be queued and sent in batches (~50/minute) to avoid Meta throttling.
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {step !== "template" && (
              <button
                type="button"
                onClick={() =>
                  setStep(step === "confirm" ? "audience" : "template")
                }
                className="px-4 py-2 text-sm rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Back
              </button>
            )}

            {step === "template" && (
              <button
                type="button"
                onClick={() => setStep("audience")}
                disabled={!selectedTemplate}
                className="px-5 py-2 text-sm font-medium rounded-full gradient-accent-bg text-white shadow-md hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === "audience" && (
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="px-5 py-2 text-sm font-medium rounded-full gradient-accent-bg text-white shadow-md hover:scale-[1.02] transition-transform flex items-center gap-2"
              >
                Review
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === "confirm" && (
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="px-5 py-2 text-sm font-medium rounded-full gradient-accent-bg text-white shadow-md hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {scheduleEnabled ? "Scheduling…" : "Starting…"}
                  </>
                ) : (
                  <>
                    {scheduleEnabled ? <Clock className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    {scheduleEnabled ? "Schedule Send" : "Start Sending"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

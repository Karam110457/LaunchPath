"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Play, Pause, Archive, Users, Zap } from "lucide-react";

interface SequenceDetailProps {
  campaignId: string;
  sequenceId: string;
  onBack: () => void;
}

interface SequenceStep {
  stepNumber: number;
  delayMinutes: number;
  templateId: string;
}

interface SequenceData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  steps: SequenceStep[];
  stop_on_reply: boolean;
  auto_enroll: { on_tag?: string[]; on_ingest?: boolean };
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  archived: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500",
};

function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
  return `${Math.round(minutes / 1440)} days`;
}

export function SequenceDetail({ campaignId, sequenceId, onBack }: SequenceDetailProps) {
  const [sequence, setSequence] = useState<SequenceData | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/sequences/${sequenceId}`)
      .then((r) => r.json())
      .then((data) => {
        setSequence(data.sequence);
        setStats(data.enrollment_stats ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId, sequenceId]);

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/sequences/${sequenceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setSequence(data.sequence);
      }
    } catch {
      // Silently fail
    } finally {
      setUpdating(false);
    }
  }

  async function enrollAllActive() {
    if (!window.confirm("Enroll all active contacts into this sequence?")) return;
    setEnrolling(true);
    try {
      await fetch(`/api/campaigns/${campaignId}/sequences/${sequenceId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filter: { status: "active" } }),
      });
      // Refresh stats
      const res = await fetch(`/api/campaigns/${campaignId}/sequences/${sequenceId}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.enrollment_stats ?? {});
      }
    } catch {
      // Silently fail
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Sequence not found
      </div>
    );
  }

  const totalEnrolled = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">{sequence.name}</h3>
            <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${STATUS_COLORS[sequence.status] ?? STATUS_COLORS.draft}`}>
              {sequence.status}
            </span>
          </div>
          {sequence.description && (
            <p className="text-[11px] text-muted-foreground">{sequence.description}</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {sequence.status === "draft" && (
          <button
            type="button"
            onClick={() => updateStatus("active")}
            disabled={updating || sequence.steps.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3" />
            Activate
          </button>
        )}
        {sequence.status === "active" && (
          <button
            type="button"
            onClick={() => updateStatus("paused")}
            disabled={updating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            <Pause className="w-3 h-3" />
            Pause
          </button>
        )}
        {sequence.status === "paused" && (
          <button
            type="button"
            onClick={() => updateStatus("active")}
            disabled={updating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3" />
            Resume
          </button>
        )}
        {sequence.status !== "archived" && (
          <button
            type="button"
            onClick={() => updateStatus("archived")}
            disabled={updating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <Archive className="w-3 h-3" />
            Archive
          </button>
        )}

        {sequence.status === "active" && (
          <button
            type="button"
            onClick={enrollAllActive}
            disabled={enrolling}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform disabled:opacity-50 ml-auto"
          >
            {enrolling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
            Enroll All Active Contacts
          </button>
        )}
      </div>

      {/* Step timeline */}
      <div className="space-y-1">
        <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Steps</h4>
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-neutral-200 dark:bg-neutral-700" />

          {sequence.steps.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-3 py-2">
              {/* Dot */}
              <div className="absolute left-[-15px] top-3 w-3 h-3 rounded-full bg-gradient-to-br from-[#FF8C00] to-[#9D50BB] border-2 border-white dark:border-neutral-900" />

              <div className="flex-1 rounded-lg border border-neutral-200/40 dark:border-neutral-700/30 bg-neutral-50/50 dark:bg-neutral-800/20 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    Step {idx + 1}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {idx === 0 ? "Immediately" : `After ${formatDelay(step.delayMinutes)}`}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                  Template: <span className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">{step.templateId.slice(0, 8)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enrollment stats */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Enrollment ({totalEnrolled})
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "active", label: "Active", color: "text-emerald-600" },
            { key: "completed", label: "Completed", color: "text-blue-600" },
            { key: "stopped_reply", label: "Stopped (Reply)", color: "text-amber-600" },
            { key: "stopped_optout", label: "Stopped (Opt-out)", color: "text-red-600" },
            { key: "stopped_tag", label: "Stopped (Tag)", color: "text-purple-600" },
            { key: "stopped_manual", label: "Stopped (Manual)", color: "text-neutral-600" },
          ].map(({ key, label, color }) => (
            <div
              key={key}
              className="rounded-lg border border-neutral-200/40 dark:border-neutral-700/30 bg-neutral-50/50 dark:bg-neutral-800/20 px-3 py-2"
            >
              <p className={`text-sm font-semibold ${color}`}>{stats[key] ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Config info */}
      <div className="text-[11px] text-muted-foreground space-y-1">
        <p>Stop on reply: {sequence.stop_on_reply ? "Yes" : "No"}</p>
        {sequence.auto_enroll.on_tag && sequence.auto_enroll.on_tag.length > 0 && (
          <p>Auto-enroll tags: {sequence.auto_enroll.on_tag.join(", ")}</p>
        )}
        {sequence.auto_enroll.on_ingest && <p>Auto-enroll on ingest: Yes</p>}
      </div>
    </div>
  );
}

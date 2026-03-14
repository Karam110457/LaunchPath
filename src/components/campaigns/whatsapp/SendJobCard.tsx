"use client";

import { Loader2, CheckCircle2, XCircle, Clock, Ban } from "lucide-react";

export interface SendJobRecord {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  total_contacts: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  whatsapp_templates?: {
    name: string;
    language: string;
    category: string;
  } | null;
}

interface SendJobCardProps {
  job: SendJobRecord;
  onCancel?: (jobId: string) => void;
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", label: "Pending" },
  processing: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", label: "Sending" },
  completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", label: "Failed" },
  cancelled: { icon: Ban, color: "text-neutral-400", bg: "bg-neutral-50 dark:bg-neutral-800/30", label: "Cancelled" },
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SendJobCard({ job, onCancel }: SendJobCardProps) {
  const config = STATUS_CONFIG[job.status];
  const Icon = config.icon;
  const progress = job.total_contacts > 0
    ? Math.round((job.sent_count / job.total_contacts) * 100)
    : 0;

  const canCancel = job.status === "pending" || job.status === "processing";

  return (
    <div className="rounded-[20px] border border-neutral-200/60 dark:border-[#2A2A2A] bg-white/60 dark:bg-neutral-900/40 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {job.whatsapp_templates?.name ?? "Unknown Template"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {formatTime(job.created_at)} · {job.total_contacts} contacts
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bg} ${config.color}`}>
          <Icon className={`w-3 h-3 ${job.status === "processing" ? "animate-spin" : ""}`} />
          {config.label}
        </div>
      </div>

      {/* Progress bar */}
      {(job.status === "processing" || job.status === "completed") && (
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF8C00] to-[#9D50BB] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">{progress}% sent</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <StatBlock label="Sent" value={job.sent_count} />
        <StatBlock label="Delivered" value={job.delivered_count} />
        <StatBlock label="Read" value={job.read_count} />
        <StatBlock label="Failed" value={job.failed_count} error={job.failed_count > 0} />
      </div>

      {/* Cancel */}
      {canCancel && onCancel && (
        <button
          type="button"
          onClick={() => onCancel(job.id)}
          className="text-[11px] font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          Cancel Send
        </button>
      )}
    </div>
  );
}

function StatBlock({
  label,
  value,
  error,
}: {
  label: string;
  value: number;
  error?: boolean;
}) {
  return (
    <div className="text-center">
      <p className={`text-sm font-semibold ${error ? "text-red-500" : "text-foreground"}`}>
        {value}
      </p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}

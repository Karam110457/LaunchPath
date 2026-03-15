"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Loader2, Send, Download } from "lucide-react";
import { SendJobCard, type SendJobRecord } from "./SendJobCard";
import { BulkSendDialog } from "./BulkSendDialog";
import { SendAnalytics } from "./SendAnalytics";
import type { TemplateRecord } from "./TemplateList";

interface SendsTabProps {
  agentId: string;
  channelId: string;
  campaignId: string;
}

export function SendsTab({ agentId, channelId, campaignId }: SendsTabProps) {
  const [jobs, setJobs] = useState<SendJobRecord[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkSend, setShowBulkSend] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const channelApiBase = `/api/agents/${agentId}/channels/${channelId}`;

  const fetchJobs = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await fetch(`${channelApiBase}/send-jobs`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs ?? []);
      } else {
        setFetchError("Failed to load send jobs");
      }
    } catch {
      setFetchError("Failed to load send jobs");
    } finally {
      setLoading(false);
    }
  }, [channelApiBase]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${channelApiBase}/templates?status=APPROVED`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates ?? []);
      }
    } catch {
      // Templates are secondary — don't block UI
    }
  }, [channelApiBase]);

  useEffect(() => {
    fetchJobs();
    fetchTemplates();
  }, [fetchJobs, fetchTemplates]);

  // Poll for active jobs — pause when tab is hidden
  useEffect(() => {
    const hasActive = jobs.some(
      (j) => j.status === "pending" || j.status === "processing"
    );

    function startPoll() {
      if (!pollRef.current && hasActive) {
        pollRef.current = setInterval(() => fetchJobs(), 5000);
      }
    }

    function stopPoll() {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        stopPoll();
      } else if (hasActive) {
        fetchJobs();
        startPoll();
      }
    }

    if (hasActive && document.visibilityState !== "hidden") {
      startPoll();
    } else {
      stopPoll();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopPoll();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [jobs, fetchJobs]);

  async function handleCancel(jobId: string) {
    if (!window.confirm("Cancel this send job? Messages already sent cannot be recalled.")) {
      return;
    }
    try {
      const res = await fetch(`${channelApiBase}/send-jobs/${jobId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId ? { ...j, status: "cancelled" as const } : j
          )
        );
      } else {
        setFetchError("Failed to cancel send job");
      }
    } catch {
      setFetchError("Failed to cancel send job");
    }
  }

  const activeCount = jobs.filter(
    (j) => j.status === "pending" || j.status === "processing"
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">Send Jobs</h3>
          {activeCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium animate-pulse">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const a = document.createElement("a");
              a.href = `/api/campaigns/${campaignId}/conversations/export?format=csv`;
              a.download = "conversations.csv";
              a.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setShowBulkSend(true)}
            disabled={templates.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            New Send
          </button>
        </div>
      </div>

      {/* Analytics */}
      {!loading && jobs.length > 0 && <SendAnalytics jobs={jobs} />}

      {/* Error */}
      {fetchError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30">
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{fetchError}</p>
          <button type="button" onClick={() => { setFetchError(null); fetchJobs(); }} className="text-xs text-red-600 hover:underline">Retry</button>
        </div>
      )}

      {/* Jobs list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <button
          type="button"
          onClick={() => templates.length > 0 && setShowBulkSend(true)}
          className="w-full rounded-xl border-2 border-dashed border-border/60 p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Send className="w-8 h-8" />
          <span className="text-sm font-medium">Send Your First Campaign</span>
          <span className="text-xs">
            {templates.length > 0
              ? "Select a template and audience to start sending"
              : "Create and get a template approved first"}
          </span>
        </button>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <SendJobCard key={job.id} job={job} onCancel={handleCancel} />
          ))}
        </div>
      )}

      {/* Bulk send dialog */}
      {showBulkSend && (
        <BulkSendDialog
          agentId={agentId}
          channelId={channelId}
          campaignId={campaignId}
          templates={templates}
          onCreated={() => {
            setShowBulkSend(false);
            fetchJobs();
          }}
          onClose={() => setShowBulkSend(false)}
        />
      )}
    </div>
  );
}

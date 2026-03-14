"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Loader2, Send } from "lucide-react";
import { SendJobCard, type SendJobRecord } from "./SendJobCard";
import { BulkSendDialog } from "./BulkSendDialog";
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const channelApiBase = `/api/agents/${agentId}/channels/${channelId}`;

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`${channelApiBase}/send-jobs`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs ?? []);
      }
    } catch {
      // Silently fail
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
      // Silently fail
    }
  }, [channelApiBase]);

  useEffect(() => {
    fetchJobs();
    fetchTemplates();
  }, [fetchJobs, fetchTemplates]);

  // Poll for active jobs
  useEffect(() => {
    const hasActive = jobs.some(
      (j) => j.status === "pending" || j.status === "processing"
    );

    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(() => fetchJobs(), 5000);
    } else if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
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
      }
    } catch {
      // Silently fail
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

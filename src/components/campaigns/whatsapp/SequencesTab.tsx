"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, Zap, Play, Pause, Archive } from "lucide-react";
import { SequenceEditor } from "./SequenceEditor";
import { SequenceDetail } from "./SequenceDetail";

interface SequenceRecord {
  id: string;
  name: string;
  description: string | null;
  status: string;
  steps: unknown[];
  enrolled_count: number;
  created_at: string;
}

interface SequencesTabProps {
  campaignId: string;
  channelId: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  archived: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500",
};

export function SequencesTab({ campaignId, channelId }: SequencesTabProps) {
  const [sequences, setSequences] = useState<SequenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  void channelId;

  const fetchSequences = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/sequences`);
      if (res.ok) {
        const data = await res.json();
        setSequences(data.sequences ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  if (selectedId) {
    return (
      <SequenceDetail
        campaignId={campaignId}
        sequenceId={selectedId}
        onBack={() => {
          setSelectedId(null);
          fetchSequences();
        }}
      />
    );
  }

  if (showEditor || editingId) {
    return (
      <SequenceEditor
        campaignId={campaignId}
        sequenceId={editingId}
        onDone={() => {
          setShowEditor(false);
          setEditingId(null);
          fetchSequences();
        }}
        onCancel={() => {
          setShowEditor(false);
          setEditingId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">Follow-Up Sequences</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-muted-foreground font-medium">
            {sequences.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform"
        >
          <Plus className="w-3 h-3" />
          Create Sequence
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : sequences.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border/60 p-8 flex flex-col items-center gap-2 text-muted-foreground">
          <Zap className="w-8 h-8" />
          <span className="text-sm font-medium">No Sequences Yet</span>
          <span className="text-xs">Create automated follow-up sequences for your contacts</span>
        </div>
      ) : (
        <div className="space-y-2">
          {sequences.map((seq) => (
            <button
              key={seq.id}
              type="button"
              onClick={() => setSelectedId(seq.id)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left border border-neutral-200/40 dark:border-neutral-700/30"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{seq.name}</p>
                  <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${STATUS_COLORS[seq.status] ?? STATUS_COLORS.draft}`}>
                    {seq.status}
                  </span>
                </div>
                {seq.description && (
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{seq.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-4">
                <span className="text-xs text-muted-foreground">
                  {seq.steps.length} step{seq.steps.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {seq.enrolled_count} enrolled
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

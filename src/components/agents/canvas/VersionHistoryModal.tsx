"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw, FileText, Globe, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface KnowledgeSnapshotItem {
  id: string;
  source_type: string;
  source_name: string;
  status: string;
}

interface VersionEntry {
  id: string;
  version_number: number;
  name: string;
  description: string | null;
  system_prompt: string;
  personality: Record<string, unknown>;
  model: string;
  status: string;
  tool_guidelines: string | null;
  change_title: string | null;
  change_description: string | null;
  knowledge_snapshot: KnowledgeSnapshotItem[];
  created_at: string;
}

interface RevertedAgent {
  name: string;
  description: string | null;
  system_prompt: string;
  personality: Record<string, unknown>;
  model: string;
  status: string;
  wizard_config?: Record<string, unknown> | null;
  tool_guidelines?: string | null;
}

interface VersionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  agentId: string;
  isDirty?: boolean;
  onReverted: (agent: RevertedAgent) => void;
}

const sourceIcons: Record<string, React.ReactNode> = {
  file: <FileText className="w-3 h-3" />,
  website: <Globe className="w-3 h-3" />,
  faq: <HelpCircle className="w-3 h-3" />,
};

export function VersionHistoryModal({
  open,
  onClose,
  agentId,
  isDirty,
  onReverted,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [reverting, setReverting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (open) fetchVersions();
  }, [open, fetchVersions]);

  const handleRevert = async (versionId: string) => {
    setReverting(versionId);
    try {
      const res = await fetch(`/api/agents/${agentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      if (res.ok) {
        const data = await res.json();
        onReverted(data.agent);
        onClose();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Failed to revert");
      }
    } finally {
      setReverting(null);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[40]" onClick={onClose} />
      
      <div className="absolute top-6 bottom-6 right-6 w-[420px] max-w-[calc(100vw-3rem)] z-50 flex flex-col bg-white/70 dark:bg-zinc-900/70 text-zinc-900 dark:text-zinc-100 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-[2rem] overflow-hidden animate-in slide-in-from-right-8 fade-in duration-200">
        <div className="flex flex-col px-6 pt-6 pb-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex-shrink-0 bg-transparent">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Version History</h2>
            <button onClick={onClose} className="p-1 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            <button className="text-zinc-900 dark:text-zinc-100 pb-0.5" style={{ borderBottom: "2px solid transparent", borderImage: "linear-gradient(135deg, #FF8C00, #9D50BB) 1" }}>History</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-400 dark:text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading versions...
            </div>
          )}

          {!loading && versions.length === 0 && (
            <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
              <p className="text-sm">No versions yet.</p>
              <p className="text-xs mt-1">
                Versions are created automatically each time you save.
              </p>
            </div>
          )}

          {!loading && versions.length > 0 && (
            <div className="space-y-3">
              {versions.map((v) => {
                const isExpanded = expandedId === v.id;
                const knowledgeDocs = v.knowledge_snapshot ?? [];

                return (
                  <div
                    key={v.id}
                    className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-all overflow-hidden"
                  >
                    {/* Version header */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : v.id)
                      }
                      className="w-full flex items-start gap-3 p-4 text-left"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold shrink-0 text-zinc-600 dark:text-zinc-400">
                        {v.version_number}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {v.change_title || `Version ${v.version_number}`}
                        </p>
                        {v.change_description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                            {v.change_description}
                          </p>
                        )}
                        <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-2 font-medium">
                          {new Date(v.created_at).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs shrink-0 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/80 rounded-xl"
                            disabled={reverting === v.id}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {reverting === v.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                Revert
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem] border-white/60 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-zinc-900 dark:text-zinc-100">
                              Revert to {v.change_title || `Version ${v.version_number}`}?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400">
                              This will restore the agent configuration to this
                              version. Knowledge base documents won&apos;t be
                              affected.
                              {isDirty && (
                                <span className="block mt-3 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium border border-red-100 dark:border-red-500/20">
                                  You have unsaved changes that will be lost.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-2">
                            <AlertDialogCancel className="rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 text-zinc-700 dark:text-zinc-300">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
                              onClick={() => handleRevert(v.id)}
                            >
                              Revert
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 space-y-4 border-t border-zinc-100 dark:border-zinc-800/50 bg-white/30 dark:bg-zinc-800/30">
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 mb-1">
                              Agent Name
                            </p>
                            <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium">{v.name}</p>
                          </div>
                          <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 mb-1">
                              Model
                            </p>
                            <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium">{v.model}</p>
                          </div>
                          {(v.personality as { tone?: string })?.tone && (
                            <div className="col-span-2 bg-zinc-50/50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                              <p className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 mb-1">
                                Tone
                              </p>
                              <p className="text-xs text-zinc-800 dark:text-zinc-200">
                                {(v.personality as { tone: string }).tone}
                              </p>
                            </div>
                          )}
                        </div>

                        {knowledgeDocs.length > 0 && (
                          <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
                              Knowledge ({knowledgeDocs.length} sources)
                            </p>
                            <div className="space-y-1.5">
                              {knowledgeDocs.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 p-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50"
                                >
                                  <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 shrink-0">
                                    {sourceIcons[doc.source_type] ?? (
                                      <FileText className="w-3 h-3" />
                                    )}
                                  </div>
                                  <span className="truncate font-medium">
                                    {doc.source_name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {v.system_prompt && (
                          <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
                              System Prompt Preview
                            </p>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed line-clamp-4 bg-white dark:bg-zinc-800 p-2.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                              {v.system_prompt}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

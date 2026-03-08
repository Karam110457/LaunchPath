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
      
      <div className="absolute top-6 bottom-6 right-6 w-[420px] max-w-[calc(100vw-3rem)] z-50 flex flex-col bg-white/70 canvas-dark:bg-neutral-900/70 text-neutral-900 canvas-dark:text-neutral-100 backdrop-blur-2xl border border-white/60 canvas-dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] overflow-hidden animate-in slide-in-from-right-8 fade-in duration-200">
        <div className="flex flex-col px-6 pt-6 pb-4 border-b border-neutral-200/50 canvas-dark:border-neutral-700/50 flex-shrink-0 bg-transparent">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-neutral-900 canvas-dark:text-neutral-100 tracking-tight">Version History</h2>
            <button onClick={onClose} className="p-1 rounded-full text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium text-neutral-400">
            <button className="text-neutral-900 canvas-dark:text-neutral-100 pb-0.5" style={{ borderBottom: "2px solid transparent", borderImage: "linear-gradient(135deg, #FF8C00, #9D50BB) 1" }}>History</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading versions...
            </div>
          )}

          {!loading && versions.length === 0 && (
            <div className="text-center py-8 text-neutral-400">
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
                const isAutoSnapshot = v.change_title?.startsWith("Before revert") ?? false;

                return (
                  <div
                    key={v.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isAutoSnapshot
                        ? "border-dashed border-neutral-200/40 canvas-dark:border-neutral-700/40 bg-neutral-50/30 canvas-dark:bg-neutral-800/20 opacity-60 hover:opacity-100"
                        : "border-neutral-200/60 canvas-dark:border-neutral-700/60 bg-white/50 canvas-dark:bg-neutral-800/50 hover:bg-white/80 canvas-dark:hover:bg-neutral-800/80"
                    }`}
                  >
                    {/* Version header */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : v.id)
                      }
                      className="w-full flex items-start gap-3 p-4 text-left"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0 ${
                        isAutoSnapshot
                          ? "bg-neutral-100/50 canvas-dark:bg-neutral-700/50 text-neutral-400 canvas-dark:text-neutral-500"
                          : "bg-neutral-100 canvas-dark:bg-neutral-700 text-neutral-600 canvas-dark:text-neutral-300"
                      }`}>
                        {v.version_number}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${
                            isAutoSnapshot
                              ? "text-neutral-500 canvas-dark:text-neutral-400"
                              : "text-neutral-900 canvas-dark:text-neutral-100"
                          }`}>
                            {v.change_title || `Version ${v.version_number}`}
                          </p>
                          {isAutoSnapshot && (
                            <span className="shrink-0 text-[9px] uppercase tracking-wider font-semibold text-neutral-400 canvas-dark:text-neutral-500 bg-neutral-100/50 canvas-dark:bg-neutral-700/30 px-1.5 py-0.5 rounded-full">
                              Auto
                            </span>
                          )}
                        </div>
                        {v.change_description && (
                          <p className="text-xs text-neutral-500 canvas-dark:text-neutral-400 mt-1 line-clamp-2">
                            {v.change_description}
                          </p>
                        )}
                        <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-2 font-medium">
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
                            className="h-8 px-2 text-xs shrink-0 text-neutral-500 canvas-dark:text-neutral-400 hover:text-neutral-900 canvas-dark:hover:text-neutral-200 hover:bg-neutral-100/80 canvas-dark:hover:bg-neutral-700/80 rounded-xl"
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
                        <AlertDialogContent className="rounded-[2rem] border-white/60 canvas-dark:border-neutral-700/60 bg-white/90 canvas-dark:bg-neutral-900/90 backdrop-blur-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-neutral-900 canvas-dark:text-neutral-100">
                              Revert to {v.change_title || `Version ${v.version_number}`}?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-neutral-500 canvas-dark:text-neutral-400">
                              This will restore the agent configuration to this
                              version. Knowledge base documents won&apos;t be
                              affected.
                              {isDirty && (
                                <span className="block mt-3 p-3 bg-red-50 canvas-dark:bg-red-900/20 text-red-600 canvas-dark:text-red-400 rounded-xl text-xs font-medium border border-red-100 canvas-dark:border-red-800/30">
                                  You have unsaved changes that will be lost.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-2">
                            <AlertDialogCancel className="rounded-xl border-neutral-200 canvas-dark:border-neutral-700 hover:bg-neutral-50 canvas-dark:hover:bg-neutral-800 hover:text-neutral-900 canvas-dark:hover:text-neutral-100">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-xl bg-neutral-900 canvas-dark:bg-neutral-100 text-white canvas-dark:text-neutral-900 hover:bg-neutral-800 canvas-dark:hover:bg-neutral-200"
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
                      <div className="px-4 pb-4 pt-1 space-y-4 border-t border-neutral-100 canvas-dark:border-neutral-700 bg-white/30 canvas-dark:bg-neutral-800/30">
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="bg-neutral-50/50 canvas-dark:bg-neutral-700/30 p-2.5 rounded-xl border border-neutral-100 canvas-dark:border-neutral-700">
                            <p className="text-[9px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                              Agent Name
                            </p>
                            <p className="text-xs text-neutral-800 canvas-dark:text-neutral-200 font-medium">{v.name}</p>
                          </div>
                          <div className="bg-neutral-50/50 canvas-dark:bg-neutral-700/30 p-2.5 rounded-xl border border-neutral-100 canvas-dark:border-neutral-700">
                            <p className="text-[9px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                              Model
                            </p>
                            <p className="text-xs text-neutral-800 canvas-dark:text-neutral-200 font-medium">{v.model}</p>
                          </div>
                          {(v.personality as { tone?: string })?.tone && (
                            <div className="col-span-2 bg-neutral-50/50 canvas-dark:bg-neutral-700/30 p-2.5 rounded-xl border border-neutral-100 canvas-dark:border-neutral-700">
                              <p className="text-[9px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                                Tone
                              </p>
                              <p className="text-xs text-neutral-800 canvas-dark:text-neutral-200">
                                {(v.personality as { tone: string }).tone}
                              </p>
                            </div>
                          )}
                        </div>

                        {knowledgeDocs.length > 0 && (
                          <div className="bg-neutral-50/50 canvas-dark:bg-neutral-700/30 p-3 rounded-xl border border-neutral-100 canvas-dark:border-neutral-700">
                            <p className="text-[9px] uppercase tracking-wider font-semibold text-neutral-400 mb-2">
                              Knowledge ({knowledgeDocs.length} sources)
                            </p>
                            <div className="space-y-1.5">
                              {knowledgeDocs.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center gap-2 text-xs text-neutral-600 canvas-dark:text-neutral-300 bg-white canvas-dark:bg-neutral-800 p-1.5 rounded-lg border border-neutral-200/50 canvas-dark:border-neutral-600/50"
                                >
                                  <div className="w-5 h-5 rounded-md bg-neutral-100 canvas-dark:bg-neutral-700 flex items-center justify-center text-neutral-500 canvas-dark:text-neutral-400 shrink-0">
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
                          <div className="bg-neutral-50/50 canvas-dark:bg-neutral-700/30 p-3 rounded-xl border border-neutral-100 canvas-dark:border-neutral-700">
                            <p className="text-[9px] uppercase tracking-wider font-semibold text-neutral-400 mb-2">
                              System Prompt Preview
                            </p>
                            <p className="text-[11px] text-neutral-600 canvas-dark:text-neutral-300 font-mono leading-relaxed line-clamp-4 bg-white canvas-dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200/50 canvas-dark:border-neutral-600/50">
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

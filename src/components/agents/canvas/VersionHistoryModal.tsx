"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw, FileText, Globe, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px] max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">Version History</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading versions...
            </div>
          )}

          {!loading && versions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No versions yet.</p>
              <p className="text-xs mt-1">
                Versions are created automatically each time you save.
              </p>
            </div>
          )}

          {!loading && versions.length > 0 && (
            <div className="space-y-1">
              {versions.map((v) => {
                const isExpanded = expandedId === v.id;
                const knowledgeDocs = v.knowledge_snapshot ?? [];

                return (
                  <div
                    key={v.id}
                    className="rounded-lg border border-border hover:border-border/80 transition-colors"
                  >
                    {/* Version header */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : v.id)
                      }
                      className="w-full flex items-start gap-3 p-3 text-left"
                    >
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-semibold shrink-0 mt-0.5">
                        {v.version_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {v.change_title || `Version ${v.version_number}`}
                        </p>
                        {v.change_description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {v.change_description}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground/70 mt-1">
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
                            className="h-7 text-xs shrink-0"
                            disabled={reverting === v.id}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {reverting === v.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Revert
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Revert to {v.change_title || `Version ${v.version_number}`}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will restore the agent configuration to this
                              version. Knowledge base documents won&apos;t be
                              affected.
                              {isDirty && (
                                <span className="block mt-2 font-medium text-destructive">
                                  You have unsaved changes that will be lost.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
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
                      <div className="px-3 pb-3 pt-0 border-t border-border/50 space-y-2">
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                              Agent Name
                            </p>
                            <p className="text-xs">{v.name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                              Model
                            </p>
                            <p className="text-xs">{v.model}</p>
                          </div>
                          {(v.personality as { tone?: string })?.tone && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                                Tone
                              </p>
                              <p className="text-xs">
                                {(v.personality as { tone: string }).tone}
                              </p>
                            </div>
                          )}
                        </div>

                        {knowledgeDocs.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                              Knowledge ({knowledgeDocs.length} sources)
                            </p>
                            <div className="space-y-0.5">
                              {knowledgeDocs.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                                >
                                  {sourceIcons[doc.source_type] ?? (
                                    <FileText className="w-3 h-3" />
                                  )}
                                  <span className="truncate">
                                    {doc.source_name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {v.system_prompt && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                              System Prompt Preview
                            </p>
                            <p className="text-xs text-muted-foreground font-mono line-clamp-3 bg-muted/30 rounded p-1.5">
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
      </DialogContent>
    </Dialog>
  );
}

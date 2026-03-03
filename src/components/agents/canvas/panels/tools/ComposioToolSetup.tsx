"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Check,
  Wrench,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AgentToolResponse } from "@/lib/tools/types";

interface ComposioToolAction {
  slug: string;
  name: string;
  description: string;
}

interface ComposioToolSetupProps {
  agentId: string;
  toolkit: string;
  toolkitName: string;
  toolkitIcon: string;
  connectionId: string;
  /** If editing an existing composio tool, pass it here */
  existing?: AgentToolResponse;
  onSaved: () => void;
  onClose: () => void;
}

export function ComposioToolSetup({
  agentId,
  toolkit,
  toolkitName,
  toolkitIcon,
  connectionId,
  existing,
  onSaved,
  onClose,
}: ComposioToolSetupProps) {
  const [actions, setActions] = useState<ComposioToolAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(true);
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [useAllActions, setUseAllActions] = useState(true);
  const [description, setDescription] = useState(
    existing?.description ?? `Use ${toolkitName} to help the user.`
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load existing config
  useEffect(() => {
    if (existing) {
      const cfg = existing.config as {
        toolkit?: string;
        enabled_actions?: string[];
      };
      if (cfg.enabled_actions && cfg.enabled_actions.length > 0) {
        setUseAllActions(false);
        setSelectedActions(new Set(cfg.enabled_actions));
      }
    }
  }, [existing]);

  // Fetch available actions
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setActionsLoading(true);
      try {
        const res = await fetch(
          `/api/composio/tools?toolkit=${encodeURIComponent(toolkit)}`
        );
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { tools: ComposioToolAction[] };
          setActions(data.tools);
        }
      } catch {
        // non-critical
      } finally {
        if (!cancelled) setActionsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [toolkit]);

  const toggleAction = useCallback((slug: string) => {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);

    const config = {
      toolkit,
      toolkit_name: toolkitName,
      connection_id: connectionId,
      enabled_actions: useAllActions ? undefined : Array.from(selectedActions),
    };

    try {
      if (existing) {
        // Update existing
        await fetch(`/api/agents/${agentId}/tools/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: description.trim(),
            config,
          }),
        });
      } else {
        // Create new
        await fetch(`/api/agents/${agentId}/tools`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool_type: "composio",
            display_name: toolkitName,
            description: description.trim(),
            config,
          }),
        });
      }
      onSaved();
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  }, [
    agentId,
    toolkit,
    toolkitName,
    connectionId,
    useAllActions,
    selectedActions,
    description,
    existing,
    onSaved,
  ]);

  const handleDelete = useCallback(async () => {
    if (!existing) return;
    setDeleting(true);
    try {
      await fetch(`/api/agents/${agentId}/tools/${existing.id}`, {
        method: "DELETE",
      });
      onSaved();
    } catch {
      // error handled silently
    } finally {
      setDeleting(false);
    }
  }, [agentId, existing, onSaved]);

  const canSave =
    description.trim().length > 0 &&
    (useAllActions || selectedActions.size > 0);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2.5">
            <span className="text-xl">{toolkitIcon}</span>
            <span>{existing ? `Edit ${toolkitName}` : `Add ${toolkitName}`}</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Configure which {toolkitName} actions your agent can use.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-5 space-y-5">
          {/* Description / trigger */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              When should your agent use {toolkitName}?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1.5 w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/50"
              placeholder={`e.g. Use ${toolkitName} when the user asks to send emails or check their inbox`}
            />
          </div>

          {/* Action selection */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Actions
            </label>

            {/* Use all toggle */}
            <button
              onClick={() => setUseAllActions(!useAllActions)}
              className={cn(
                "mt-1.5 w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                useAllActions
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/50 hover:border-border"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                  useAllActions
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {useAllActions && (
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Use all available actions</p>
                <p className="text-[11px] text-muted-foreground">
                  Let the AI decide which {toolkitName} actions to use
                </p>
              </div>
            </button>

            {/* Individual actions */}
            {!useAllActions && (
              <div className="mt-3 space-y-1.5">
                {actionsLoading ? (
                  <div className="flex items-center gap-2 py-8 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Loading available actions...
                    </span>
                  </div>
                ) : actions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No actions found for this app.
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] text-muted-foreground mb-2">
                      Select which actions your agent can use ({selectedActions.size}/{actions.length} selected)
                    </p>
                    <div className="max-h-[240px] overflow-y-auto space-y-1 pr-1">
                      {actions.map((action) => {
                        const selected = selectedActions.has(action.slug);
                        return (
                          <button
                            key={action.slug}
                            onClick={() => toggleAction(action.slug)}
                            className={cn(
                              "w-full flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-colors",
                              selected
                                ? "border-primary/30 bg-primary/5"
                                : "border-border/30 hover:border-border/60 hover:bg-muted/20"
                            )}
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5",
                                selected
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground/30"
                              )}
                            >
                              {selected && (
                                <Check className="w-2.5 h-2.5 text-primary-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground">
                                {action.name}
                              </p>
                              {action.description && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                                  {action.description}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Delete (edit mode only) */}
          {existing && (
            <div className="pt-2 border-t border-border/30">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400">Remove this tool?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-2.5 py-1 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-md hover:bg-red-500/20"
                  >
                    {deleting ? "Removing..." : "Yes, remove"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                  Remove {toolkitName} from agent
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/30 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-lg transition-colors",
              canSave && !saving
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </span>
            ) : existing ? (
              "Save Changes"
            ) : (
              <span className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5" />
                Add to Agent
              </span>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

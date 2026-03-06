"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { AgentToolResponse } from "@/lib/tools/types";

interface AgentOption {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

interface SubagentSetupProps {
  agentId: string;
  existing?: AgentToolResponse;
  onSaved: () => void;
  onClose: () => void;
}

export function SubagentSetup({
  agentId,
  existing,
  onSaved,
  onClose,
}: SubagentSetupProps) {
  const isEdit = !!existing;
  const existingConfig = existing?.config as Record<string, unknown> | undefined;

  // Form state
  const [targetAgentId, setTargetAgentId] = useState(
    (existingConfig?.target_agent_id as string) || ""
  );
  const [instructions, setInstructions] = useState(
    (existingConfig?.instructions as string) || ""
  );
  const [maxTurns, setMaxTurns] = useState(
    (existingConfig?.max_turns as number) || 5
  );
  const [displayName, setDisplayName] = useState(
    existing?.display_name || ""
  );
  const [description, setDescription] = useState(
    existing?.description || ""
  );

  // UI state
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load user's other agents
  useEffect(() => {
    async function loadAgents() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("ai_agents")
          .select("id, name, description, status")
          .neq("id", agentId)
          .order("name");

        setAgents((data as AgentOption[]) ?? []);
      } finally {
        setLoadingAgents(false);
      }
    }
    void loadAgents();
  }, [agentId]);

  // Auto-fill display name and description when agent is selected
  useEffect(() => {
    if (isEdit) return; // Don't auto-fill in edit mode
    const selected = agents.find((a) => a.id === targetAgentId);
    if (selected) {
      if (!displayName) setDisplayName(selected.name);
      if (!description) {
        setDescription(
          `Delegate tasks to ${selected.name}. ${selected.description || "This agent can help with specialized tasks."}`
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetAgentId, agents]);

  const selectedAgent = agents.find((a) => a.id === targetAgentId);
  const isInactive =
    selectedAgent &&
    selectedAgent.status !== "active";

  const canSave = targetAgentId && displayName.trim() && description.trim();

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        tool_type: "subagent",
        display_name: displayName.trim(),
        description: description.trim(),
        config: {
          target_agent_id: targetAgentId,
          target_agent_name: selectedAgent?.name ?? displayName,
          instructions: instructions || undefined,
          max_turns: maxTurns,
        },
      };

      const endpoint = isEdit
        ? `/api/agents/${agentId}/tools/${existing.id}`
        : `/api/agents/${agentId}/tools`;
      const res = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    await fetch(`/api/agents/${agentId}/tools/${existing.id}`, {
      method: "DELETE",
    });
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} Sub-Agent Tool</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Let this agent delegate tasks to another agent in your workspace.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Agent Picker */}
          <div>
            <Label className="text-xs">Select Agent</Label>
            {loadingAgents ? (
              <div className="h-10 flex items-center justify-center mt-1">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : agents.length === 0 ? (
              <div className="mt-1 rounded-lg border border-dashed border-border/60 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No other agents found. Create another agent first.
                </p>
              </div>
            ) : (
              <div className="mt-1 space-y-1.5 max-h-48 overflow-y-auto">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setTargetAgentId(agent.id)}
                    className={`w-full text-left rounded-lg border p-2.5 flex items-start gap-2.5 transition-all ${
                      targetAgentId === agent.id
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">
                          {agent.name}
                        </span>
                        {agent.status !== "active" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {agent.status}
                          </span>
                        )}
                      </div>
                      {agent.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {agent.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Inactive warning */}
          {isInactive && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/80">
                This agent is not active. It may not respond correctly when
                called as a subagent. Consider activating it first.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div>
            <Label className="text-xs">
              Instructions (optional)
            </Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="When should the parent agent consult this subagent? What kind of tasks should be delegated?"
              rows={2}
              className="mt-1 text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Help the parent agent understand when to use this subagent.
            </p>
          </div>

          {/* Max Turns */}
          <div>
            <Label className="text-xs">Max Tool Steps</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                min={1}
                max={10}
                value={maxTurns}
                onChange={(e) =>
                  setMaxTurns(
                    Math.max(1, Math.min(10, parseInt(e.target.value) || 5))
                  )
                }
                className="h-8 w-20 text-sm"
              />
              <span className="text-xs text-muted-foreground">
                Max tool call iterations (1-10)
              </span>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <Label className="text-xs">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Research Agent"
              className="mt-1 h-8 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs">Description (AI-facing)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this subagent does so the parent agent knows when to use it."
              rows={2}
              className="mt-1 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <div>
              {isEdit &&
                (confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDelete}
                      className="text-xs h-7"
                    >
                      Confirm Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs h-7"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs h-7 text-destructive hover:text-destructive gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                ))}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!canSave || saving}
                className="text-xs h-8"
              >
                {saving ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : null}
                {isEdit ? "Save Changes" : "Add Sub-Agent"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

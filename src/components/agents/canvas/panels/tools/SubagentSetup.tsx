"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import type { AgentToolResponse } from "@/lib/tools/types";

interface SubagentSetupProps {
  agentId: string;
  existing?: AgentToolResponse;
  onSaved: () => void;
  onClose: () => void;
}

/**
 * Simple creation dialog for child (sub-agent) agents.
 * Creates a child agent via POST /api/agents/{parentId}/subagents,
 * which also creates the linking agent_tools record.
 */
export function SubagentSetup({
  agentId,
  onSaved,
  onClose,
}: SubagentSetupProps) {
  const [name, setName] = useState("New Sub-Agent");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0;

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/subagents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Failed to create sub-agent"
        );
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Sub-Agent</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Create a child agent that this agent can delegate tasks to.
            You can configure its tools and behavior after creation.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Research Agent"
              className="h-9 text-sm"
              autoFocus
            />
          </div>

          {/* Description (optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should this sub-agent specialize in?"
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
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
              onClick={handleCreate}
              disabled={!canSave || saving}
              className="text-xs h-8"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              Create Sub-Agent
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

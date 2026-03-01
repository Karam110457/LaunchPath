"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { AgentFormState } from "../canvas-types";

interface AgentEditPanelProps {
  agentId: string;
  formState: AgentFormState;
  setFormState: React.Dispatch<React.SetStateAction<AgentFormState>>;
}

const MODEL_OPTIONS = [
  { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
  { value: "claude-haiku-3-5-20241022", label: "Claude Haiku 3.5" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
];

export function AgentEditPanel({
  agentId,
  formState,
  setFormState,
}: AgentEditPanelProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof AgentFormState>(
    key: K,
    value: AgentFormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      router.push("/dashboard/agents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* Identity */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Identity
        </h3>
        <div className="grid grid-cols-[3rem_1fr] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-emoji" className="text-xs">
              Emoji
            </Label>
            <Input
              id="edit-emoji"
              value={formState.avatarEmoji}
              onChange={(e) => update("avatarEmoji", e.target.value)}
              className="h-9 text-center text-lg"
              maxLength={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs">
              Name
            </Label>
            <Input
              id="edit-name"
              value={formState.name}
              onChange={(e) => update("name", e.target.value)}
              className="h-9 text-sm"
              placeholder="Agent name"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-description" className="text-xs">
            Description
          </Label>
          <Textarea
            id="edit-description"
            value={formState.description}
            onChange={(e) => update("description", e.target.value)}
            rows={2}
            className="text-sm"
            placeholder="What does this agent do?"
          />
        </div>
      </section>

      <hr className="border-border" />

      {/* Personality */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Personality
        </h3>
        <div className="space-y-1.5">
          <Label htmlFor="edit-tone" className="text-xs">
            Tone
          </Label>
          <Input
            id="edit-tone"
            value={formState.tone}
            onChange={(e) => update("tone", e.target.value)}
            className="h-9 text-sm"
            placeholder="e.g., friendly and professional"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-greeting" className="text-xs">
            Greeting Message
          </Label>
          <Textarea
            id="edit-greeting"
            value={formState.greetingMessage}
            onChange={(e) => update("greetingMessage", e.target.value)}
            rows={2}
            className="text-sm"
            placeholder="First message shown to visitors"
          />
        </div>
      </section>

      <hr className="border-border" />

      {/* Settings */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Settings
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-model" className="text-xs">
              Model
            </Label>
            <select
              id="edit-model"
              value={formState.model}
              onChange={(e) => update("model", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {MODEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-status" className="text-xs">
              Status
            </Label>
            <select
              id="edit-status"
              value={formState.status}
              onChange={(e) => update("status", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* System Prompt */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          System Prompt
        </h3>
        <Textarea
          value={formState.systemPrompt}
          onChange={(e) => update("systemPrompt", e.target.value)}
          rows={10}
          className="text-sm font-mono"
          placeholder="Instructions for how the agent should behave..."
        />
      </section>

      {/* Error */}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Danger Zone */}
      <section className="border-t border-destructive/20 pt-5 mt-2">
        <h3 className="text-xs font-medium text-destructive uppercase tracking-wide mb-2">
          Danger Zone
        </h3>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete Agent
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this agent?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes the agent, all knowledge documents, and
                conversation history. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Agent
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}

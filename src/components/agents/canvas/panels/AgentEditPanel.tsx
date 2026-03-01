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

interface AgentEditPanelProps {
  agent: {
    id: string;
    name: string;
    description: string | null;
    system_prompt: string;
    model: string;
    status: string;
  };
  personality: {
    tone?: string;
    greeting_message?: string;
    avatar_emoji?: string;
  } | null;
  onSave: () => void;
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
  agent,
  personality,
  onSave,
}: AgentEditPanelProps) {
  const router = useRouter();

  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description ?? "");
  const [avatarEmoji, setAvatarEmoji] = useState(
    personality?.avatar_emoji ?? "🤖"
  );
  const [tone, setTone] = useState(personality?.tone ?? "");
  const [greetingMessage, setGreetingMessage] = useState(
    personality?.greeting_message ?? ""
  );
  const [model, setModel] = useState(agent.model);
  const [status, setStatus] = useState(agent.status);
  const [systemPrompt, setSystemPrompt] = useState(agent.system_prompt);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Agent name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          system_prompt: systemPrompt,
          personality: {
            tone: tone.trim() || undefined,
            greeting_message: greetingMessage.trim() || undefined,
            avatar_emoji: avatarEmoji.trim() || "🤖",
          },
          model,
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
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
              value={avatarEmoji}
              onChange={(e) => setAvatarEmoji(e.target.value)}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            value={tone}
            onChange={(e) => setTone(e.target.value)}
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
            value={greetingMessage}
            onChange={(e) => setGreetingMessage(e.target.value)}
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
              value={model}
              onChange={(e) => setModel(e.target.value)}
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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={10}
          className="text-sm font-mono"
          placeholder="Instructions for how the agent should behave..."
        />
      </section>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="w-full"
      >
        {saving ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>

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

"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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

interface SubagentEditPanelProps {
  subagentId: string;
  parentAgentId: string;
  toolRecordId: string;
  onDeleted: () => void;
  onSaved?: () => void;
}

interface SubagentData {
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  personality: { tone?: string } | null;
}

interface ToolRecordConfig {
  instructions?: string;
  max_turns?: number;
}

import {
  MODEL_OPTIONS,
  TIER_LABELS,
  type ModelTier,
} from "@/lib/ai/model-tiers";

const MODEL_TIERS = (["fast", "standard", "advanced"] as ModelTier[]).map(
  (tier) => ({
    tier,
    label: TIER_LABELS[tier],
    models: MODEL_OPTIONS.filter((m) => m.tier === tier),
  })
);

const TONE_PRESETS = [
  { value: "friendly and approachable", label: "Friendly", desc: "Warm, gets to the point" },
  { value: "professional and polished", label: "Professional", desc: "Formal, trustworthy" },
  { value: "patient and supportive", label: "Patient", desc: "Thorough, never rushes" },
  { value: "casual and conversational", label: "Casual", desc: "Relaxed, like a friend" },
];

function matchesPreset(tone: string): string | null {
  const lower = tone.toLowerCase().trim();
  return TONE_PRESETS.find((p) => p.value === lower)?.value ?? null;
}

export function SubagentEditPanel({
  subagentId,
  parentAgentId,
  toolRecordId,
  onDeleted,
  onSaved,
}: SubagentEditPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agent fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("claude-sonnet-4-5-20250929");
  const [tone, setTone] = useState("");

  // Tool record fields (instructions to parent, max turns)
  const [instructions, setInstructions] = useState("");
  const [maxTurns, setMaxTurns] = useState(5);

  // UI state
  const currentPreset = matchesPreset(tone);
  const [showCustomTone, setShowCustomTone] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load subagent data + tool record config
  useEffect(() => {
    async function load() {
      try {
        const [agentRes, toolRes] = await Promise.all([
          fetch(`/api/agents/${subagentId}`),
          fetch(`/api/agents/${parentAgentId}/tools/${toolRecordId}`),
        ]);

        if (agentRes.ok) {
          const agentData = (await agentRes.json()) as { agent: SubagentData };
          const a = agentData.agent;
          setName(a.name || "");
          setDescription(a.description || "");
          setSystemPrompt(a.system_prompt || "");
          setModel(a.model || "claude-sonnet-4-5-20250929");
          const t = a.personality?.tone || "";
          setTone(t);
          setShowCustomTone(!matchesPreset(t) && t.length > 0);
        }

        if (toolRes.ok) {
          const toolData = (await toolRes.json()) as { tool: { config: ToolRecordConfig } };
          const cfg = toolData.tool.config || {};
          setInstructions(cfg.instructions || "");
          setMaxTurns(cfg.max_turns || 5);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [subagentId, parentAgentId, toolRecordId]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Save agent fields
      const agentRes = await fetch(`/api/agents/${subagentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          system_prompt: systemPrompt,
          model,
          personality: { tone },
          skip_version: true,
        }),
      });

      if (!agentRes.ok) {
        throw new Error("Failed to save agent");
      }

      // Save tool record fields (instructions + max_turns + sync display_name)
      const toolRes = await fetch(
        `/api/agents/${parentAgentId}/tools/${toolRecordId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            display_name: name.trim(),
            description: description.trim()
              ? `Delegate tasks to ${name.trim()}. ${description.trim()}`
              : `Delegate tasks to ${name.trim()}.`,
            config: {
              target_agent_id: subagentId,
              target_agent_name: name.trim(),
              instructions: instructions || undefined,
              max_turns: maxTurns,
            },
          }),
        }
      );

      if (!toolRes.ok) {
        throw new Error("Failed to save tool config");
      }

      setDirty(false);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete tool record on parent
      await fetch(`/api/agents/${parentAgentId}/tools/${toolRecordId}`, {
        method: "DELETE",
      });
      // Delete the child agent (cascades its tools/knowledge)
      await fetch(`/api/agents/${subagentId}`, { method: "DELETE" });
      onDeleted();
    } catch {
      setError("Delete failed");
      setDeleting(false);
    }
  };

  const markDirty = () => setDirty(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="basics" className="w-full">
      <div className="px-5 pt-4">
        <TabsList className="w-full">
          <TabsTrigger value="basics" className="flex-1 text-xs">
            Basics
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex-1 text-xs">
            Advanced
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ═══════════════════════ BASICS TAB ═══════════════════════ */}
      <TabsContent value="basics">
        <div className="p-5 space-y-5">
          {/* ── Identity ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Identity
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); markDirty(); }}
                className="h-9 text-sm"
                placeholder="Sub-agent name"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                rows={2}
                className="text-sm"
                placeholder="What does this sub-agent specialize in?"
              />
            </div>
          </section>

          <hr className="border-border" />

          {/* ── Tone ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tone
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {TONE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setShowCustomTone(false);
                    setTone(preset.value);
                    markDirty();
                  }}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-all",
                    currentPreset === preset.value && !showCustomTone
                      ? "border-transparent gradient-accent-border bg-gradient-to-br from-[#FF8C00]/8 to-[#9D50BB]/8"
                      : "border-border hover:border-[#FF8C00]/30 hover:bg-[#FF8C00]/5"
                  )}
                >
                  <div className="min-w-0">
                    <p className={cn(
                      "text-xs font-medium",
                      currentPreset === preset.value && !showCustomTone ? "text-white" : ""
                    )}>
                      {preset.label}
                    </p>
                    <p className={cn(
                      "text-[11px] leading-tight mt-0.5",
                      currentPreset === preset.value && !showCustomTone ? "text-white/80" : "text-muted-foreground"
                    )}>
                      {preset.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowCustomTone(true)}
              className={cn(
                "flex items-center gap-2 w-full rounded-lg border px-3 py-2 text-left transition-all",
                showCustomTone
                  ? "border-transparent gradient-accent-border bg-gradient-to-br from-[#FF8C00]/8 to-[#9D50BB]/8"
                  : "border-border hover:border-[#FF8C00]/30 hover:bg-[#FF8C00]/5"
              )}
            >
              <Pencil className={cn("w-3.5 h-3.5", showCustomTone ? "text-white" : "text-muted-foreground")} />
              <span className={cn("text-xs font-medium", showCustomTone ? "text-white" : "")}>
                Custom tone
              </span>
            </button>

            {showCustomTone && (
              <Input
                value={tone}
                onChange={(e) => { setTone(e.target.value); markDirty(); }}
                className="h-8 text-sm"
                placeholder="e.g., warm and empathetic"
                autoFocus
              />
            )}
          </section>

          {/* Save button */}
          {dirty && (
            <>
              <hr className="border-border" />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="text-xs h-8"
                >
                  {saving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  Save Changes
                </Button>
              </div>
            </>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </TabsContent>

      {/* ═══════════════════════ ADVANCED TAB ═══════════════════════ */}
      <TabsContent value="advanced">
        <div className="p-5 space-y-5">
          {/* Instructions to parent */}
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Instructions to Parent
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Tell the parent agent when and how to use this sub-agent.
            </p>
            <Textarea
              value={instructions}
              onChange={(e) => { setInstructions(e.target.value); markDirty(); }}
              rows={3}
              className="text-sm"
              placeholder="When should the parent agent delegate to this sub-agent? What tasks should it handle?"
            />
          </section>

          <hr className="border-border" />

          {/* Max tool steps */}
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Max Tool Steps
            </h3>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={10}
                value={maxTurns}
                onChange={(e) => {
                  setMaxTurns(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)));
                  markDirty();
                }}
                className="h-8 w-20 text-sm"
              />
              <span className="text-xs text-muted-foreground">
                Max tool call iterations (1-10)
              </span>
            </div>
          </section>

          <hr className="border-border" />

          {/* System Prompt */}
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              System Prompt
            </h3>
            <p className="text-[11px] text-muted-foreground">
              The raw instructions that control how this sub-agent behaves.
            </p>
            <Textarea
              value={systemPrompt}
              onChange={(e) => { setSystemPrompt(e.target.value); markDirty(); }}
              rows={8}
              className="text-sm font-mono"
              placeholder="Instructions for how the sub-agent should behave..."
            />
          </section>

          <hr className="border-border" />

          {/* AI Model */}
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              AI Model
            </h3>
            <select
              value={model}
              onChange={(e) => { setModel(e.target.value); markDirty(); }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {MODEL_TIERS.map((group) => (
                <optgroup key={group.tier} label={group.label}>
                  {group.models.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.multiplier}x
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </section>

          {/* Save button */}
          {dirty && (
            <>
              <hr className="border-border" />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="text-xs h-8"
                >
                  {saving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  Save Changes
                </Button>
              </div>
            </>
          )}

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
                      Delete Sub-Agent
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this sub-agent?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes the sub-agent, its tools, and
                    removes it from the parent agent. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Sub-Agent
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        </div>
      </TabsContent>
    </Tabs>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Trash2,
  Pencil,
  Plus,
  X,
  Check,
  GripVertical,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OptionCard } from "@/components/flows/OptionCard";
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
import type { AgentToolResponse } from "@/lib/tools/types";
import type { AgentFormState, WizardConfig } from "../canvas-types";
import { AGENT_TEMPLATES, getTemplateById } from "@/lib/agents/templates";

interface AgentEditPanelProps {
  agentId: string;
  formState: AgentFormState;
  setFormState: React.Dispatch<React.SetStateAction<AgentFormState>>;
  tools?: AgentToolResponse[];
}

const MODEL_OPTIONS = [
  { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
  { value: "claude-haiku-3-5-20241022", label: "Claude Haiku 3.5" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
  { value: "nl", label: "Dutch" },
  { value: "ar", label: "Arabic" },
  { value: "zh", label: "Chinese (Simplified)" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ru", label: "Russian" },
  { value: "hi", label: "Hindi" },
  { value: "tr", label: "Turkish" },
  { value: "pl", label: "Polish" },
  { value: "sv", label: "Swedish" },
  { value: "da", label: "Danish" },
  { value: "he", label: "Hebrew" },
];

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

export function AgentEditPanel({
  agentId,
  formState,
  setFormState,
  tools = [],
}: AgentEditPanelProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalChangedNote, setGoalChangedNote] = useState<string | null>(null);

  const hasWizard = formState.wizardConfig !== null;
  const currentPreset = matchesPreset(formState.tone);
  const [showCustomTone, setShowCustomTone] = useState(
    !currentPreset && formState.tone.length > 0
  );

  const update = <K extends keyof AgentFormState>(
    key: K,
    value: AgentFormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const updateWizardConfig = useCallback(
    (updater: (prev: WizardConfig) => WizardConfig) => {
      setFormState((prev) => {
        if (!prev.wizardConfig) return prev;
        return { ...prev, wizardConfig: updater(prev.wizardConfig) };
      });
    },
    [setFormState]
  );

  const handleGoalChange = useCallback(
    (newTemplateId: string) => {
      if (!formState.wizardConfig) return;
      if (formState.wizardConfig.templateId === newTemplateId) return;

      const template = getTemplateById(newTemplateId);
      if (!template) return;

      // Build default behaviorConfig for the new template
      let behaviorConfig: Record<string, unknown> = {};
      if (newTemplateId === "appointment-booker") {
        behaviorConfig = {
          lead_fields: { phone: true, company: false, custom_fields: [] },
          booking_behavior: "collect_and_follow_up",
        };
      } else if (newTemplateId === "customer-support") {
        behaviorConfig = {
          escalation_mode: "escalate_complex",
          response_style: "detailed",
        };
      } else if (newTemplateId === "lead-qualification") {
        behaviorConfig = {
          lead_fields: { phone: true, company: true, budget: false, timeline: false },
          notification_behavior: "email_team",
        };
      }

      setFormState((prev) => ({
        ...prev,
        wizardConfig: {
          ...prev.wizardConfig!,
          templateId: newTemplateId as WizardConfig["templateId"],
          behaviorConfig,
        },
      }));

      // Update tool_guidelines in DB (separate from form auto-save)
      fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_guidelines: template.toolWorkflow }),
      }).catch(() => {
        // Non-critical — tool_guidelines will be stale until next save
      });

      // Show confirmation
      setGoalChangedNote(`Switched to ${template.name}. Behavior settings have been reset to defaults.`);
      setTimeout(() => setGoalChangedNote(null), 4000);
    },
    [formState.wizardConfig, setFormState, agentId],
  );

  const handleAdoptGoal = useCallback(
    (templateId: string) => {
      const template = getTemplateById(templateId);
      if (!template) return;

      let behaviorConfig: Record<string, unknown> = {};
      if (templateId === "appointment-booker") {
        behaviorConfig = {
          lead_fields: { phone: true, company: false, custom_fields: [] },
          booking_behavior: "collect_and_follow_up",
        };
      } else if (templateId === "customer-support") {
        behaviorConfig = {
          escalation_mode: "escalate_complex",
          response_style: "detailed",
        };
      } else if (templateId === "lead-qualification") {
        behaviorConfig = {
          lead_fields: { phone: true, company: true, budget: false, timeline: false, custom_fields: [] },
          notification_behavior: "email_team",
        };
      }

      setFormState((prev) => ({
        ...prev,
        tone: prev.tone || template.suggested_personality.tone,
        greetingMessage: prev.greetingMessage || template.suggested_personality.greeting_message,
        wizardConfig: {
          templateId: templateId as WizardConfig["templateId"],
          behaviorConfig,
          personality: {
            tone: prev.tone || template.suggested_personality.tone,
            greeting_message:
              prev.greetingMessage || template.suggested_personality.greeting_message,
          },
        },
      }));

      // Persist tool_guidelines + wizard_config
      fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_guidelines: template.toolWorkflow,
          wizard_config: {
            templateId,
            behaviorConfig,
            personality: {
              tone: formState.tone || template.suggested_personality.tone,
              greeting_message:
                formState.greetingMessage || template.suggested_personality.greeting_message,
            },
          },
        }),
      }).catch(() => {
        // Non-critical
      });
    },
    [setFormState, agentId, formState.tone, formState.greetingMessage],
  );

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
    <Tabs defaultValue="basics" className="w-full">
      <div className="px-5 pt-4">
        <TabsList className="w-full">
          <TabsTrigger value="basics" className="flex-1 text-xs">
            Basics
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex-1 text-xs">
            Prompt
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ═══════════════════════ BASICS TAB ═══════════════════════ */}
      <TabsContent value="basics">
        <div className="p-5 space-y-5">
          {/* ── Live sync banner (wizard agents) ── */}
          {hasWizard && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-primary/70 mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Changes to tone, questions, and behavior take effect immediately
                in conversations — no need to edit the raw system prompt.
              </p>
            </div>
          )}

          {/* ── Conversation Goal (wizard agents only) ── */}
          {hasWizard && (
            <>
              <section className="space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Conversation Goal
                </h3>
                <div className="space-y-2">
                  {AGENT_TEMPLATES.map((tmpl) => (
                    <OptionCard
                      key={tmpl.id}
                      value={tmpl.id}
                      label={tmpl.name}
                      description={tmpl.description}
                      selected={formState.wizardConfig!.templateId === tmpl.id}
                      onSelect={() => handleGoalChange(tmpl.id)}
                    />
                  ))}
                </div>
                {goalChangedNote && (
                  <p className="text-[11px] text-primary/80 bg-primary/5 border border-primary/10 rounded-md px-3 py-2 animate-in fade-in duration-200">
                    {goalChangedNote}
                  </p>
                )}
              </section>
              <hr className="border-border" />
            </>
          )}

          {/* ── Identity ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Identity
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs">Name</Label>
              <Input
                id="edit-name"
                value={formState.name}
                onChange={(e) => update("name", e.target.value)}
                className="h-9 text-sm"
                placeholder="Agent name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-xs">Description</Label>
              <Textarea
                id="edit-description"
                value={formState.description}
                onChange={(e) => update("description", e.target.value)}
                rows={2}
                className="text-sm"
                placeholder="What does this agent do?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-language" className="text-xs">Language</Label>
              <select
                id="edit-language"
                value={formState.language}
                onChange={(e) => update("language", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <hr className="border-border" />

          {/* ── Personality ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Personality
            </h3>

            <div className="space-y-2">
              <Label className="text-xs">Tone</Label>
              <div className="grid grid-cols-2 gap-2">
                {TONE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setShowCustomTone(false);
                      update("tone", preset.value);
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
                  value={formState.tone}
                  onChange={(e) => update("tone", e.target.value)}
                  className="h-8 text-sm"
                  placeholder="e.g., warm and empathetic"
                  autoFocus
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-greeting" className="text-xs">Greeting Message</Label>
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

          {/* ── Behavior (wizard agents only) ── */}
          {hasWizard && (
            <>
              <hr className="border-border" />
              <BehaviorSection
                wizardConfig={formState.wizardConfig!}
                onUpdate={updateWizardConfig}
              />
            </>
          )}

          {/* ── Qualifying / Triage Questions (all wizard templates) ── */}
          {hasWizard && (
            <>
              <hr className="border-border" />
              <QuestionsSection
                questions={formState.wizardConfig!.qualifyingQuestions ?? []}
                onUpdate={updateWizardConfig}
                isSupport={formState.wizardConfig!.templateId === "customer-support"}
              />
            </>
          )}

          {/* Goal adoption for prompt-created agents */}
          {!hasWizard && (
            <>
              <hr className="border-border" />
              <div className="rounded-lg border border-dashed p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium">Set a conversation goal</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Add guided behavior settings to this agent by choosing a goal.
                    You can still edit the system prompt on the Advanced tab.
                  </p>
                </div>
                <div className="space-y-1.5">
                  {AGENT_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleAdoptGoal(tmpl.id)}
                      className="w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                      <span className="font-medium">{tmpl.name}</span>
                      <span className="text-muted-foreground">— {tmpl.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </TabsContent>

      {/* ═══════════════════════ ADVANCED TAB ═══════════════════════ */}
      <TabsContent value="advanced">
        <div className="p-5 space-y-5">
          {/* System Prompt */}
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              System Prompt
            </h3>
            <p className="text-[11px] text-muted-foreground">
              The raw instructions that control how your agent behaves. Edit only
              if you know what you&apos;re doing.
            </p>
            <Textarea
              value={formState.systemPrompt}
              onChange={(e) => update("systemPrompt", e.target.value)}
              rows={10}
              className="text-sm font-mono"
              placeholder="Instructions for how the agent should behave..."
            />
          </section>

          <hr className="border-border" />

          {/* AI Model */}
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              AI Model
            </h3>
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
                    This permanently deletes the agent, all knowledge documents,
                    and conversation history. This cannot be undone.
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
      </TabsContent>

    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Config Directives Preview (mirrors assemblePrompt logic for UI display)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Behavior Section (template-specific)
// ---------------------------------------------------------------------------

function BehaviorSection({
  wizardConfig,
  onUpdate,
}: {
  wizardConfig: WizardConfig;
  onUpdate: (updater: (prev: WizardConfig) => WizardConfig) => void;
}) {
  const bc = wizardConfig.behaviorConfig ?? {};

  if (wizardConfig.templateId === "appointment-booker") {
    const leadFields = (bc.lead_fields ?? {}) as {
      phone?: boolean;
      company?: boolean;
    };
    const bookingBehavior =
      (bc.booking_behavior as string) ?? "collect_and_follow_up";

    return (
      <section className="space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Behavior
        </h3>

        <div className="space-y-2">
          <Label className="text-xs">Lead capture fields</Label>
          <p className="text-[11px] text-muted-foreground">
            Name and email are always captured. Toggle additional fields.
          </p>
          <div className="flex flex-wrap gap-2">
            <FieldToggle label="Name" enabled disabled />
            <FieldToggle label="Email" enabled disabled />
            <FieldToggle
              label="Phone"
              enabled={!!leadFields.phone}
              onToggle={() =>
                onUpdate((prev) => ({
                  ...prev,
                  behaviorConfig: {
                    ...prev.behaviorConfig,
                    lead_fields: { ...leadFields, phone: !leadFields.phone },
                  },
                }))
              }
            />
            <FieldToggle
              label="Company"
              enabled={!!leadFields.company}
              onToggle={() =>
                onUpdate((prev) => ({
                  ...prev,
                  behaviorConfig: {
                    ...prev.behaviorConfig,
                    lead_fields: {
                      ...leadFields,
                      company: !leadFields.company,
                    },
                  },
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">After qualifying</Label>
          <div className="space-y-2">
            <OptionCard
              value="book_directly"
              label="Book directly"
              description="The agent books an appointment on the calendar"
              selected={bookingBehavior === "book_directly"}
              onSelect={() =>
                onUpdate((prev) => ({
                  ...prev,
                  behaviorConfig: {
                    ...prev.behaviorConfig,
                    booking_behavior: "book_directly",
                  },
                }))
              }
            />
            <OptionCard
              value="collect_and_follow_up"
              label="Collect info and follow up"
              description="The agent captures lead details for you to follow up manually"
              selected={bookingBehavior === "collect_and_follow_up"}
              onSelect={() =>
                onUpdate((prev) => ({
                  ...prev,
                  behaviorConfig: {
                    ...prev.behaviorConfig,
                    booking_behavior: "collect_and_follow_up",
                  },
                }))
              }
            />
          </div>
        </div>
      </section>
    );
  }

  // Lead qualification
  if (wizardConfig.templateId === "lead-qualification") {
    const leadFields = (bc.lead_fields ?? {}) as {
      phone?: boolean;
      company?: boolean;
      budget?: boolean;
      timeline?: boolean;
    };
    const notificationBehavior =
      (bc.notification_behavior as string) ?? "email_team";

    return (
      <section className="space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Behavior
        </h3>

        <div className="space-y-2">
          <Label className="text-xs">Lead capture fields</Label>
          <p className="text-[11px] text-muted-foreground">
            Name and email are always captured. Toggle additional fields.
          </p>
          <div className="flex flex-wrap gap-2">
            <FieldToggle label="Name" enabled disabled />
            <FieldToggle label="Email" enabled disabled />
            <FieldToggle
              label="Phone"
              enabled={!!leadFields.phone}
              onToggle={() =>
                onUpdate((prev) => ({
                  ...prev,
                  behaviorConfig: {
                    ...prev.behaviorConfig,
                    lead_fields: { ...leadFields, phone: !leadFields.phone },
                  },
                }))
              }
            />
            <FieldToggle
              label="Company"
              enabled={!!leadFields.company}
              onToggle={() =>
                onUpdate((prev) => ({
                  ...prev,
                  behaviorConfig: {
                    ...prev.behaviorConfig,
                    lead_fields: { ...leadFields, company: !leadFields.company },
                  },
                }))
              }
            />
            <FieldToggle
              label="Budget"
              enabled={!!leadFields.budget}
              onToggle={() =>
                onUpdate((prev) => ({
                  ...prev,
                  behaviorConfig: {
                    ...prev.behaviorConfig,
                    lead_fields: { ...leadFields, budget: !leadFields.budget },
                  },
                }))
              }
            />
            <FieldToggle
              label="Timeline"
              enabled={!!leadFields.timeline}
              onToggle={() =>
                onUpdate((prev) => ({
                  ...prev,
                  behaviorConfig: {
                    ...prev.behaviorConfig,
                    lead_fields: { ...leadFields, timeline: !leadFields.timeline },
                  },
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">When a lead is qualified</Label>
          <div className="space-y-2">
            <OptionCard
              value="email_team"
              label="Email team with lead summary"
              description="Sends an internal notification with the lead details to your team"
              selected={notificationBehavior === "email_team"}
              onSelect={() =>
                onUpdate((prev) => ({
                  ...prev,
                  behaviorConfig: {
                    ...prev.behaviorConfig,
                    notification_behavior: "email_team",
                  },
                }))
              }
            />
            <OptionCard
              value="sheet_only"
              label="Save to spreadsheet only"
              description="Leads are saved to Google Sheets without email notifications"
              selected={notificationBehavior === "sheet_only"}
              onSelect={() =>
                onUpdate((prev) => ({
                  ...prev,
                  behaviorConfig: {
                    ...prev.behaviorConfig,
                    notification_behavior: "sheet_only",
                  },
                }))
              }
            />
          </div>
        </div>
      </section>
    );
  }

  // Customer support
  const escalationMode =
    (bc.escalation_mode as string) ?? "escalate_complex";
  const responseStyle = (bc.response_style as string) ?? "detailed";

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Behavior
      </h3>

      <div className="space-y-2">
        <Label className="text-xs">Escalation behavior</Label>
        <div className="space-y-2">
          <OptionCard
            value="always_available"
            label="Handle everything"
            description="The agent tries to resolve all issues without escalating"
            selected={escalationMode === "always_available"}
            onSelect={() =>
              onUpdate((prev) => ({
                ...prev,
                behaviorConfig: {
                  ...prev.behaviorConfig,
                  escalation_mode: "always_available",
                },
              }))
            }
          />
          <OptionCard
            value="escalate_complex"
            label="Escalate complex issues"
            description="The agent hands off to a human when it can't resolve an issue"
            selected={escalationMode === "escalate_complex"}
            onSelect={() =>
              onUpdate((prev) => ({
                ...prev,
                behaviorConfig: {
                  ...prev.behaviorConfig,
                  escalation_mode: "escalate_complex",
                },
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Response style</Label>
        <div className="space-y-2">
          <OptionCard
            value="concise"
            label="Concise answers"
            description="Short, direct responses that get to the point quickly"
            selected={responseStyle === "concise"}
            onSelect={() =>
              onUpdate((prev) => ({
                ...prev,
                behaviorConfig: {
                  ...prev.behaviorConfig,
                  response_style: "concise",
                },
              }))
            }
          />
          <OptionCard
            value="detailed"
            label="Detailed explanations"
            description="Thorough, step-by-step responses with context"
            selected={responseStyle === "detailed"}
            onSelect={() =>
              onUpdate((prev) => ({
                ...prev,
                behaviorConfig: {
                  ...prev.behaviorConfig,
                  response_style: "detailed",
                },
              }))
            }
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Qualifying Questions
// ---------------------------------------------------------------------------

function QuestionsSection({
  questions,
  onUpdate,
  isSupport,
}: {
  questions: string[];
  onUpdate: (updater: (prev: WizardConfig) => WizardConfig) => void;
  isSupport?: boolean;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const setQuestions = (newQuestions: string[]) => {
    onUpdate((prev) => ({ ...prev, qualifyingQuestions: newQuestions }));
  };

  const startEdit = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setEditValue(questions[index]);
    },
    [questions]
  );

  function saveEdit() {
    if (editingIndex === null) return;
    const updated = [...questions];
    updated[editingIndex] = editValue;
    setQuestions(updated);
    setEditingIndex(null);
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {isSupport ? "Triage Questions" : "Qualifying Questions"}
      </h3>
      <p className="text-[11px] text-muted-foreground">
        {isSupport
          ? "Questions your agent asks to understand the visitor's issue."
          : "Questions your agent asks to understand what the visitor needs."}
      </p>

      {questions.length === 0 ? (
        <div className="py-3 text-center rounded-lg border border-dashed">
          <p className="text-xs text-muted-foreground">
            No questions yet. Add your first one below.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {questions.map((q, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border px-3 py-2 group"
            >
              <div className="shrink-0 mt-0.5 text-muted-foreground">
                <GripVertical className="w-3.5 h-3.5" />
              </div>
              <span className="shrink-0 text-[11px] font-mono text-muted-foreground mt-0.5 w-4">
                {i + 1}.
              </span>

              {editingIndex === i ? (
                <div className="flex-1 flex gap-1.5">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 h-7 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") setEditingIndex(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="shrink-0 p-1 rounded-md text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="flex-1 text-xs mt-0.5">
                    {q || (
                      <span className="text-muted-foreground italic">
                        Empty — click edit to add text
                      </span>
                    )}
                  </p>
                  <div className="shrink-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(i)}
                      className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(i)}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setQuestions([...questions, ""])}
        className="gap-1.5 text-xs"
      >
        <Plus className="w-3.5 h-3.5" />
        Add question
      </Button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Field Toggle (pill button)
// ---------------------------------------------------------------------------

function FieldToggle({
  label,
  enabled,
  disabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
        disabled ? "cursor-default" : "cursor-pointer",
        enabled
          ? "bg-primary/10 border-primary/30 text-primary"
          : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
      )}
    >
      {label}
    </button>
  );
}

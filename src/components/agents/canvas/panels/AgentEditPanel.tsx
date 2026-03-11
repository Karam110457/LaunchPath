"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
import { useModalExpanded } from "./NodeModal";

interface AgentEditPanelProps {
  agentId: string;
  formState: AgentFormState;
  setFormState: React.Dispatch<React.SetStateAction<AgentFormState>>;
  tools?: AgentToolResponse[];
  onToolsChanged?: () => void;
}

import {
  MODEL_OPTIONS,
  CREDITS_PER_TIER,
  TIER_LABELS,
  type ModelTier,
} from "@/lib/ai/model-tiers";

/** Group models by tier for the selector */
const MODEL_TIERS = (["fast", "standard", "advanced"] as ModelTier[]).map(
  (tier) => ({
    tier,
    label: `${TIER_LABELS[tier]} (${CREDITS_PER_TIER[tier]} credit${CREDITS_PER_TIER[tier] > 1 ? "s" : ""}/msg)`,
    models: MODEL_OPTIONS.filter((m) => m.tier === tier),
  })
);

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
  { value: "friendly and approachable", label: "Friendly", desc: "Warm and helpful — like a good coworker" },
  { value: "professional and polished", label: "Professional", desc: "Polished and trustworthy — great for corporate" },
  { value: "patient and supportive", label: "Patient", desc: "Takes time to explain — never rushes the visitor" },
  { value: "casual and conversational", label: "Casual", desc: "Relaxed and natural — like texting a friend" },
];

function matchesPreset(tone: string): string | null {
  const lower = tone.toLowerCase().trim();
  return TONE_PRESETS.find((p) => p.value === lower)?.value ?? null;
}

function getDefaultBehaviorConfig(templateId: string): Record<string, unknown> {
  if (templateId === "appointment-booker") {
    return {
      lead_fields: { phone: true, company: false, custom_fields: [] },
      booking_behavior: "book_directly",
      availability: {
        timezone: "",
        working_days: ["mon", "tue", "wed", "thu", "fri"],
        start_time: "09:00",
        end_time: "17:00",
        appointment_duration: 30,
        buffer_minutes: 15,
        max_advance_days: 30,
      },
      service_types: [],
      cancellation_policy: "",
      qualification_mode: "describe",
      disqualification_criteria: [],
      icp_description: "",
    };
  }
  if (templateId === "customer-support") {
    return {
      escalation_mode: "escalate_complex",
      response_style: "detailed",
      escalation_contact: "",
      business_hours: "",
      after_hours_message: "",
      forbidden_topics: [],
    };
  }
  if (templateId === "lead-capture" || templateId === "lead-qualification") {
    return {
      lead_fields: { phone: true, company: true, custom_fields: [] },
      notification_behavior: "email_team",
      notification_email: "",
      qualification_mode: "describe",
      icp_description: "",
      disqualification_criteria: [],
    };
  }
  return {};
}

export function AgentEditPanel({
  agentId,
  formState,
  setFormState,
  tools = [],
  onToolsChanged,
}: AgentEditPanelProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalChangedNote, setGoalChangedNote] = useState<string | null>(null);
  const [switchDialog, setSwitchDialog] = useState<{
    newTemplateId: string;
    toolsToRemove: string[];
    toolsToAdd: string[];
    /** Pre-filled config for the new template's required fields */
    config: Record<string, unknown>;
    keepQuestions: boolean;
  } | null>(null);
  const [switching, setSwitching] = useState(false);
  const [removeTemplateOpen, setRemoveTemplateOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const hasWizard = formState.wizardConfig !== null;
  const isCustomTemplate = formState.wizardConfig?.templateId === "custom";
  const hasRealTemplate = hasWizard && !isCustomTemplate;
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

      const newTemplate = getTemplateById(newTemplateId);
      if (!newTemplate) return;

      const oldTemplateId = formState.wizardConfig.templateId;
      const oldTemplate = oldTemplateId ? getTemplateById(oldTemplateId) : null;

      // Compute tool diff
      const oldToolkits = new Set(
        (oldTemplate?.suggestedTools ?? []).map((t) => t.toolkit),
      );
      const newToolkits = new Set(
        (newTemplate.suggestedTools ?? []).map((t) => t.toolkit),
      );
      const currentToolkits = new Set(
        tools.map((t) => (t.config as Record<string, unknown> | null)?.toolkit as string).filter(Boolean),
      );

      const toolsToRemove = tools
        .filter((t) => {
          const toolkit = (t.config as Record<string, unknown> | null)?.toolkit as string;
          return toolkit && oldToolkits.has(toolkit) && !newToolkits.has(toolkit);
        })
        .map((t) => t.display_name);

      const toolsToAdd = (newTemplate.suggestedTools ?? [])
        .filter((t) => !currentToolkits.has(t.toolkit))
        .map((t) => t.displayName);

      // Always show dialog so user can fill in required fields for the new template
      setSwitchDialog({
        newTemplateId,
        toolsToRemove,
        toolsToAdd,
        config: getDefaultSwitchConfig(newTemplateId),
        keepQuestions: false,
      });
    },
    [formState.wizardConfig, tools],
  );

  const executeTemplateSwitch = useCallback(
    async (
      newTemplateId: string,
      removeOldTools: boolean,
      addNewTools: boolean,
      prefilledConfig?: Record<string, unknown>,
      keepQuestions?: boolean,
    ) => {
      setSwitching(true);
      try {
        const res = await fetch(`/api/agents/${agentId}/switch-template`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newTemplateId,
            removeOldTools,
            addNewTools,
            prefilledConfig,
            keepQuestions: keepQuestions ?? false,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to switch template");
          return;
        }

        const data = await res.json();

        // Update local form state with new wizard config + updated prompt
        setFormState((prev) => ({
          ...prev,
          wizardConfig: data.wizardConfig as WizardConfig,
          ...(data.systemPrompt ? { systemPrompt: data.systemPrompt as string } : {}),
        }));

        // Refresh tools in parent
        onToolsChanged?.();

        const template = getTemplateById(newTemplateId);
        setGoalChangedNote(
          `Switched to ${template?.name ?? newTemplateId}. Behavior settings have been reset.`,
        );
        setTimeout(() => setGoalChangedNote(null), 4000);
      } catch {
        setError("Network error — could not switch template.");
      } finally {
        setSwitching(false);
        setSwitchDialog(null);
      }
    },
    [agentId, setFormState, onToolsChanged],
  );

  const handleRemoveTemplate = useCallback(
    async (removeTools: boolean) => {
      setRemoving(true);
      try {
        const res = await fetch(`/api/agents/${agentId}/remove-template`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ removeTemplateTools: removeTools }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to remove template");
          return;
        }

        const data = await res.json();

        // Clear wizard config in local form state
        setFormState((prev) => ({
          ...prev,
          wizardConfig: null,
          ...(data.systemPrompt ? { systemPrompt: data.systemPrompt as string } : {}),
        }));

        onToolsChanged?.();
        setGoalChangedNote("Template removed. Agent is now fully custom.");
        setTimeout(() => setGoalChangedNote(null), 4000);
      } catch {
        setError("Network error — could not remove template.");
      } finally {
        setRemoving(false);
        setRemoveTemplateOpen(false);
      }
    },
    [agentId, setFormState, onToolsChanged],
  );

  const handleAdoptGoal = useCallback(
    (templateId: string) => {
      const template = getTemplateById(templateId);
      if (!template) return;

      const behaviorConfig = getDefaultBehaviorConfig(templateId);

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

  const tabsRef = useRef<HTMLDivElement>(null);
  const isExpanded = useModalExpanded();

  // Always start scrolled to the top when the panel mounts
  useEffect(() => {
    requestAnimationFrame(() => {
      const scrollParent = tabsRef.current?.closest("[data-scroll-container]")
        ?? tabsRef.current?.parentElement;
      scrollParent?.scrollTo({ top: 0 });
    });
  }, []);

  return (
    <Tabs
      ref={tabsRef}
      defaultValue="basics"
      className="w-full h-full flex flex-col"
      onValueChange={() => {
        // Scroll the parent overflow container to top when switching tabs
        const scrollParent = tabsRef.current?.closest("[data-scroll-container]")
          ?? tabsRef.current?.parentElement;
        scrollParent?.scrollTo({ top: 0, behavior: "instant" });
      }}
    >
      <div className={cn("pt-4 shrink-0", isExpanded ? "px-8" : "px-5")}>
        <TabsList className={isExpanded ? "w-auto" : "w-full"}>
          <TabsTrigger value="basics" className={cn("text-xs", !isExpanded && "flex-1")}>
            Basics
          </TabsTrigger>
          <TabsTrigger value="advanced" className={cn("text-xs", !isExpanded && "flex-1")}>
            Prompt
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ═══════════════════════ BASICS TAB ═══════════════════════ */}
      <TabsContent value="basics" className="flex-1 min-h-0">
        {/* In expanded mode: two-column grid. In panel mode: single column */}
        <div className={cn(
          isExpanded
            ? "grid grid-cols-[1fr_1fr] gap-8 p-8 h-full items-start"
            : "p-5 space-y-5"
        )}>

          {/* ── LEFT COLUMN (or single-column top half) ── */}
          <div className="space-y-5">
            {/* ── Live sync banner (wizard agents) ── */}
            {hasWizard && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-primary/70 mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Changes here are automatically applied to your agent&apos;s
                  instructions. You can view and fine-tune them on the Prompt tab.
                </p>
              </div>
            )}

            {/* ── Conversation Goal (wizard agents only) ── */}
            {hasWizard && (
              <>
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      What should this agent do?
                    </h3>
                    {hasRealTemplate && (
                      <button
                        type="button"
                        onClick={() => setRemoveTemplateOpen(true)}
                        className="text-[11px] text-destructive/70 hover:text-destructive transition-colors"
                      >
                        Remove Template
                      </button>
                    )}
                  </div>
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
                Basic Info
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
              Tone & Greeting
            </h3>
            <p className="text-[11px] text-muted-foreground -mt-1">
              How your agent sounds and the first message visitors see.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Tone</Label>
                <button
                  type="button"
                  onClick={() => setShowCustomTone(!showCustomTone)}
                  className="text-[11px] text-primary/70 hover:text-primary transition-colors"
                >
                  {showCustomTone ? "Pick a preset" : "Write your own"}
                </button>
              </div>

              {showCustomTone ? (
                <Input
                  value={formState.tone}
                  onChange={(e) => update("tone", e.target.value)}
                  className="h-8 text-sm"
                  placeholder="e.g., warm and empathetic, short sentences"
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {TONE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        update("tone", preset.value);
                      }}
                      className={cn(
                        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-all",
                        currentPreset === preset.value
                          ? "border-transparent gradient-accent-border bg-gradient-to-br from-[#FF8C00]/8 to-[#9D50BB]/8"
                          : "border-border hover:border-[#FF8C00]/30 hover:bg-[#FF8C00]/5"
                      )}
                    >
                      <div className="min-w-0">
                        <p className={cn(
                          "text-xs font-medium",
                          currentPreset === preset.value ? "text-white" : ""
                        )}>
                          {preset.label}
                        </p>
                        <p className={cn(
                          "text-[11px] leading-tight mt-0.5",
                          currentPreset === preset.value ? "text-white/80" : "text-muted-foreground"
                        )}>
                          {preset.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
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

          {/* In panel mode, behavior/questions continue in the same column */}
          {!isExpanded && hasRealTemplate && (
            <>
              <hr className="border-border" />
              <BehaviorSection
                wizardConfig={formState.wizardConfig!}
                onUpdate={updateWizardConfig}
              />
              <hr className="border-border" />
              {formState.wizardConfig!.templateId === "customer-support" ? (
                <QuestionsSection
                  questions={formState.wizardConfig!.qualifyingQuestions ?? []}
                  onUpdate={updateWizardConfig}
                  isSupport
                />
              ) : (
                <LeadFilteringSection
                  wizardConfig={formState.wizardConfig!}
                  onUpdate={updateWizardConfig}
                />
              )}
            </>
          )}

          {/* Goal adoption for prompt-created agents */}
          {!hasWizard && (
            <>
              <hr className="border-border" />
              <div className="rounded-lg border border-dashed p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium">What should this agent do?</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Pick a goal to unlock guided settings for your agent.
                    You can still edit the prompt directly on the Prompt tab.
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
          </div>{/* end left column / single column */}

          {/* ── RIGHT COLUMN (expanded only): Behavior + Questions ── */}
          {isExpanded && hasRealTemplate && (
            <div className="space-y-5">
              <BehaviorSection
                wizardConfig={formState.wizardConfig!}
                onUpdate={updateWizardConfig}
              />
              <hr className="border-border" />
              {formState.wizardConfig!.templateId === "customer-support" ? (
                <QuestionsSection
                  questions={formState.wizardConfig!.qualifyingQuestions ?? []}
                  onUpdate={updateWizardConfig}
                  isSupport
                />
              ) : (
                <LeadFilteringSection
                  wizardConfig={formState.wizardConfig!}
                  onUpdate={updateWizardConfig}
                />
              )}
            </div>
          )}

        </div>
      </TabsContent>

      {/* ═══════════════════════ ADVANCED TAB ═══════════════════════ */}
      <TabsContent value="advanced" className="flex-1 min-h-0">
        <div className={cn(
          isExpanded
            ? "grid grid-cols-[2fr_1fr] gap-8 p-8 h-full items-start"
            : "p-5 space-y-5"
        )}>
          {/* ── LEFT COLUMN: System Prompt (fills available height in expanded) ── */}
          <section className={cn("space-y-3", isExpanded && "h-full flex flex-col")}>
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
              rows={isExpanded ? 30 : 10}
              className={cn("text-sm font-mono", isExpanded && "flex-1 min-h-[400px] resize-y")}
              placeholder="Instructions for how the agent should behave..."
            />
          </section>

          {/* ── RIGHT COLUMN (or continuation in panel mode) ── */}
          <div className="space-y-5">
            {!isExpanded && <hr className="border-border" />}

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
                {MODEL_TIERS.map((group) => (
                  <optgroup key={group.tier} label={group.label}>
                    {group.models.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.provider})
                      </option>
                    ))}
                  </optgroup>
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
        </div>
      </TabsContent>

      {/* Template switch dialog with required fields */}
      {switchDialog && (
        <TemplateSwitchDialog
          dialog={switchDialog}
          switching={switching}
          currentQualificationMode={
            (formState.wizardConfig?.behaviorConfig?.qualification_mode as string) ?? "describe"
          }
          hasQuestions={(formState.wizardConfig?.qualifyingQuestions ?? []).length > 0}
          hasIcp={!!((formState.wizardConfig?.behaviorConfig?.icp_description as string)?.trim())}
          onConfigChange={(patch) =>
            setSwitchDialog((prev) =>
              prev ? { ...prev, config: { ...prev.config, ...patch } } : prev,
            )
          }
          onKeepQuestionsChange={(keep) =>
            setSwitchDialog((prev) =>
              prev ? { ...prev, keepQuestions: keep } : prev,
            )
          }
          onCancel={() => setSwitchDialog(null)}
          onConfirm={() => {
            void executeTemplateSwitch(
              switchDialog.newTemplateId,
              switchDialog.toolsToRemove.length > 0,
              switchDialog.toolsToAdd.length > 0,
              switchDialog.config,
              switchDialog.keepQuestions,
            );
          }}
        />
      )}

      {/* Remove template confirmation dialog */}
      {removeTemplateOpen && (
        <RemoveTemplateDialog
          templateName={
            (() => {
              const tid = formState.wizardConfig?.templateId;
              if (!tid || tid === "custom") return "Custom";
              const t = getTemplateById(tid);
              return t?.name ?? tid;
            })()
          }
          hasTemplateTools={
            (() => {
              const tid = formState.wizardConfig?.templateId;
              if (!tid || tid === "custom") return false;
              const t = getTemplateById(tid);
              if (!t?.suggestedTools?.length) return false;
              const tToolkits = new Set(t.suggestedTools.map((st) => st.toolkit));
              return tools.some((tool) => {
                const tk = (tool.config as Record<string, unknown> | null)?.toolkit as string;
                return tk && tToolkits.has(tk);
              });
            })()
          }
          removing={removing}
          onCancel={() => setRemoveTemplateOpen(false)}
          onConfirm={(removeTools) => void handleRemoveTemplate(removeTools)}
        />
      )}

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
      custom_fields?: string[];
    };
    const availability = (bc.availability ?? {}) as {
      timezone?: string;
      working_days?: string[];
      start_time?: string;
      end_time?: string;
      appointment_duration?: number;
      buffer_minutes?: number;
      max_advance_days?: number;
    };
    const serviceTypes = (bc.service_types ?? []) as string[];
    const cancellationPolicy = (bc.cancellation_policy ?? "") as string;

    const updateBc = (patch: Record<string, unknown>) =>
      onUpdate((prev) => ({
        ...prev,
        behaviorConfig: { ...prev.behaviorConfig, ...patch },
      }));

    return (
      <section className="space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Booking Settings
        </h3>

        <div className="space-y-2">
          <Label className="text-xs">Lead capture fields</Label>
          <p className="text-[11px] text-muted-foreground">
            Name and email are always collected. Turn on Phone if you need to
            call or text leads, and Company if you serve businesses.
          </p>
          <div className="flex flex-wrap gap-2">
            <FieldToggle label="Name" enabled disabled />
            <FieldToggle label="Email" enabled disabled />
            <FieldToggle
              label="Phone"
              enabled={!!leadFields.phone}
              onToggle={() =>
                updateBc({ lead_fields: { ...leadFields, phone: !leadFields.phone } })
              }
            />
            <FieldToggle
              label="Company"
              enabled={!!leadFields.company}
              onToggle={() =>
                updateBc({ lead_fields: { ...leadFields, company: !leadFields.company } })
              }
            />
          </div>
        </div>

        {/* Availability */}
        <div className="space-y-3 rounded-lg border border-border/60 p-3">
          <Label className="text-xs font-medium">Availability</Label>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Timezone</Label>
            <select
              value={availability.timezone ?? ""}
              onChange={(e) =>
                updateBc({ availability: { ...availability, timezone: e.target.value } })
              }
              className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="">Select…</option>
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Working days</Label>
            <div className="flex flex-wrap gap-1">
              {ALL_DAYS.map((d) => {
                const days = availability.working_days ?? ["mon", "tue", "wed", "thu", "fri"];
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => {
                      const next = days.includes(d.value)
                        ? days.filter((x) => x !== d.value)
                        : [...days, d.value];
                      updateBc({ availability: { ...availability, working_days: next } });
                    }}
                    className={cn(
                      "px-2 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer",
                      days.includes(d.value)
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Start</Label>
              <select
                value={availability.start_time ?? "09:00"}
                onChange={(e) =>
                  updateBc({ availability: { ...availability, start_time: e.target.value } })
                }
                className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{formatTime(t)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">End</Label>
              <select
                value={availability.end_time ?? "17:00"}
                onChange={(e) =>
                  updateBc({ availability: { ...availability, end_time: e.target.value } })
                }
                className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{formatTime(t)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Duration</Label>
              <select
                value={availability.appointment_duration ?? 30}
                onChange={(e) =>
                  updateBc({ availability: { ...availability, appointment_duration: Number(e.target.value) } })
                }
                className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs"
              >
                {[15, 30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Buffer</Label>
              <select
                value={availability.buffer_minutes ?? 15}
                onChange={(e) =>
                  updateBc({ availability: { ...availability, buffer_minutes: Number(e.target.value) } })
                }
                className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs"
              >
                {[0, 5, 10, 15, 30].map((m) => (
                  <option key={m} value={m}>{m === 0 ? "None" : `${m} min`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Max advance</Label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={1}
                max={365}
                value={availability.max_advance_days ?? 30}
                onChange={(e) =>
                  updateBc({ availability: { ...availability, max_advance_days: Number(e.target.value) || 30 } })
                }
                className="h-7 text-xs w-16"
              />
              <span className="text-[11px] text-muted-foreground">days</span>
            </div>
          </div>
        </div>

        {/* Service types */}
        <div className="space-y-1.5">
          <Label className="text-xs">Appointment types <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <TagList
            tags={serviceTypes}
            onChange={(v) => updateBc({ service_types: v })}
            placeholder="e.g., Consultation"
          />
        </div>

        {/* Cancellation policy */}
        <div className="space-y-1">
          <Label className="text-xs">Cancellation policy <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea
            value={cancellationPolicy}
            onChange={(e) => updateBc({ cancellation_policy: e.target.value })}
            placeholder="e.g., Free cancellation up to 24h before."
            rows={2}
            className="text-xs resize-none"
          />
        </div>
      </section>
    );
  }

  // Lead capture
  if (wizardConfig.templateId === "lead-capture" || wizardConfig.templateId === "lead-qualification") {
    const leadFields = (bc.lead_fields ?? {}) as {
      phone?: boolean;
      company?: boolean;
    };
    const notificationBehavior =
      (bc.notification_behavior as string) ?? "email_team";
    const notificationEmail = (bc.notification_email as string) ?? "";

    const updateBc = (patch: Record<string, unknown>) =>
      onUpdate((prev) => ({
        ...prev,
        behaviorConfig: { ...prev.behaviorConfig, ...patch },
      }));

    return (
      <section className="space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Lead Capture Settings
        </h3>

        <div className="space-y-2">
          <Label className="text-xs">Lead capture fields</Label>
          <p className="text-[11px] text-muted-foreground">
            Name and email are always collected. Turn on Phone if you need to
            call or text leads, and Company if you serve businesses.
          </p>
          <div className="flex flex-wrap gap-2">
            <FieldToggle label="Name" enabled disabled />
            <FieldToggle label="Email" enabled disabled />
            <FieldToggle
              label="Phone"
              enabled={!!leadFields.phone}
              onToggle={() =>
                updateBc({ lead_fields: { ...leadFields, phone: !leadFields.phone } })
              }
            />
            <FieldToggle
              label="Company"
              enabled={!!leadFields.company}
              onToggle={() =>
                updateBc({ lead_fields: { ...leadFields, company: !leadFields.company } })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">When a lead is captured</Label>
          <div className="space-y-2">
            <OptionCard
              value="email_team"
              label="Email team with lead summary"
              description="Sends an internal notification with the lead details to your team"
              selected={notificationBehavior === "email_team"}
              onSelect={() => updateBc({ notification_behavior: "email_team" })}
            />
            <OptionCard
              value="sheet_only"
              label="Save to spreadsheet only"
              description="Leads are saved to Google Sheets without email notifications"
              selected={notificationBehavior === "sheet_only"}
              onSelect={() => updateBc({ notification_behavior: "sheet_only" })}
            />
          </div>
        </div>

        {/* Notification email */}
        {notificationBehavior === "email_team" && (
          <div className="space-y-1">
            <Label className="text-xs">Notification email</Label>
            <p className="text-[11px] text-muted-foreground">
              Your agent will email this address with a lead summary via Gmail.
            </p>
            <Input
              type="email"
              value={notificationEmail}
              onChange={(e) => updateBc({ notification_email: e.target.value })}
              placeholder="e.g., sales@company.com"
              className="h-7 text-xs"
            />
          </div>
        )}
      </section>
    );
  }

  // Customer support
  const escalationMode =
    (bc.escalation_mode as string) ?? "escalate_complex";
  const responseStyle = (bc.response_style as string) ?? "detailed";
  const escalationContact = (bc.escalation_contact as string) ?? "";
  const businessHours = (bc.business_hours as string) ?? "";
  const afterHoursMessage = (bc.after_hours_message as string) ?? "";
  const forbiddenTopics = (bc.forbidden_topics ?? []) as string[];

  const updateBc = (patch: Record<string, unknown>) =>
    onUpdate((prev) => ({
      ...prev,
      behaviorConfig: { ...prev.behaviorConfig, ...patch },
    }));

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Support Settings
      </h3>

      <div className="space-y-2">
        <Label className="text-xs">Escalation behavior</Label>
        <div className="space-y-2">
          <OptionCard
            value="always_available"
            label="Handle everything"
            description="The agent tries to resolve all issues without escalating"
            selected={escalationMode === "always_available"}
            onSelect={() => updateBc({ escalation_mode: "always_available" })}
          />
          <OptionCard
            value="escalate_complex"
            label="Escalate complex issues"
            description="The agent hands off to a human when it can't resolve an issue"
            selected={escalationMode === "escalate_complex"}
            onSelect={() => updateBc({ escalation_mode: "escalate_complex" })}
          />
        </div>
      </div>

      {/* Escalation email */}
      {escalationMode === "escalate_complex" && (
        <div className="space-y-1">
          <Label className="text-xs">Escalation email</Label>
          <p className="text-[11px] text-muted-foreground">
            Your agent will email this address with a summary when it can&apos;t resolve an issue.
          </p>
          <Input
            type="email"
            value={escalationContact}
            onChange={(e) => updateBc({ escalation_contact: e.target.value })}
            placeholder="e.g., support@company.com"
            className="h-7 text-xs"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs">Response style</Label>
        <div className="space-y-2">
          <OptionCard
            value="concise"
            label="Concise answers"
            description="Short, direct responses that get to the point quickly"
            selected={responseStyle === "concise"}
            onSelect={() => updateBc({ response_style: "concise" })}
          />
          <OptionCard
            value="detailed"
            label="Detailed explanations"
            description="Thorough, step-by-step responses with context"
            selected={responseStyle === "detailed"}
            onSelect={() => updateBc({ response_style: "detailed" })}
          />
        </div>
      </div>

      {/* Business hours */}
      <div className="space-y-1">
        <Label className="text-xs">Business hours <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          value={businessHours}
          onChange={(e) => updateBc({ business_hours: e.target.value })}
          placeholder="e.g., Mon–Fri 9am–5pm EST"
          className="h-7 text-xs"
        />
      </div>

      {/* After-hours message */}
      {businessHours && (
        <div className="space-y-1">
          <Label className="text-xs">After-hours message</Label>
          <Textarea
            value={afterHoursMessage}
            onChange={(e) => updateBc({ after_hours_message: e.target.value })}
            placeholder="e.g., We'll get back to you next business day."
            rows={2}
            className="text-xs resize-none"
          />
        </div>
      )}

      {/* Forbidden topics */}
      <div className="space-y-1.5">
        <Label className="text-xs">Forbidden topics <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <p className="text-[11px] text-muted-foreground">
          The agent will politely refuse to discuss these subjects.
        </p>
        <TagList
          tags={forbiddenTopics}
          onChange={(v) => updateBc({ forbidden_topics: v })}
          placeholder="e.g., Competitor pricing"
        />
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
// Lead Filtering — unified qualification section (appointment-booker & lead-capture)
// Combines ICP / explicit questions (either/or) + dealbreakers
// ---------------------------------------------------------------------------

function LeadFilteringSection({
  wizardConfig,
  onUpdate,
}: {
  wizardConfig: WizardConfig;
  onUpdate: (fn: (prev: WizardConfig) => WizardConfig) => void;
}) {
  const bc = wizardConfig.behaviorConfig;
  const mode = (bc.qualification_mode as string) ?? "describe";
  const icpDescription = (bc.icp_description as string) ?? "";
  const disqualificationCriteria = (bc.disqualification_criteria ?? []) as string[];
  const questions = wizardConfig.qualifyingQuestions ?? [];

  const updateBc = (patch: Record<string, unknown>) =>
    onUpdate((prev) => ({
      ...prev,
      behaviorConfig: { ...prev.behaviorConfig, ...patch },
    }));

  const setQuestions = (qs: string[]) =>
    onUpdate((prev) => ({ ...prev, qualifyingQuestions: qs }));

  // Inline editing state for questions mode
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditValue(questions[index]);
  }

  function saveEdit() {
    if (editingIndex === null) return;
    const updated = [...questions];
    updated[editingIndex] = editValue;
    setQuestions(updated);
    setEditingIndex(null);
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Lead filtering
        </h3>
        <p className="text-[11px] text-muted-foreground mt-1">
          How should your agent decide if a visitor is a good fit?
        </p>
      </div>

      {/* Mode selector */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => updateBc({ qualification_mode: "describe" })}
          className={cn(
            "w-full text-left rounded-lg border px-3 py-2.5 transition-all",
            mode === "describe"
              ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
              : "hover:border-border/80"
          )}
        >
          <p className="text-xs font-medium">Describe your ideal customer</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Tell the agent who you&apos;re looking for and it will figure out the right questions to ask.
          </p>
        </button>
        <button
          type="button"
          onClick={() => updateBc({ qualification_mode: "questions" })}
          className={cn(
            "w-full text-left rounded-lg border px-3 py-2.5 transition-all",
            mode === "questions"
              ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
              : "hover:border-border/80"
          )}
        >
          <p className="text-xs font-medium">Set specific questions</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Write the exact questions your agent should ask every visitor.
          </p>
        </button>
      </div>

      {/* ICP mode: description textarea */}
      {mode === "describe" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Who is your ideal customer?</Label>
          <Textarea
            value={icpDescription}
            onChange={(e) => updateBc({ icp_description: e.target.value })}
            placeholder="e.g., Small business owners with 5–50 employees who need help with scheduling and are ready to start within the next month"
            rows={3}
            className="text-xs resize-none"
          />
          <p className="text-[11px] text-muted-foreground">
            The more detail you give, the better your agent will be at spotting good leads.
          </p>
        </div>
      )}

      {/* Questions mode: editable question list */}
      {mode === "questions" && (
        <div className="space-y-2">
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
                          onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}
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
        </div>
      )}

      {/* Reasons to decline — always shown */}
      <div className="space-y-1.5 pt-1">
        <Label className="text-xs">Reasons to decline a lead <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <p className="text-[11px] text-muted-foreground">
          If a visitor matches any of these, the agent will politely let them know you can&apos;t help them right now.
        </p>
        <TagList
          tags={disqualificationCriteria}
          onChange={(v) => updateBc({ disqualification_criteria: v })}
          placeholder="e.g., No budget, just browsing"
        />
      </div>
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

// ---------------------------------------------------------------------------
// Tag List (add/remove inline — compact canvas version)
// ---------------------------------------------------------------------------

function TagList({
  tags,
  onChange,
  placeholder = "Add item…",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  function add() {
    const name = value.trim();
    if (!name) return;
    if (tags.some((t) => t.toLowerCase() === name.toLowerCase())) return;
    onChange([...tags, name]);
    setValue("");
  }

  return (
    <div className="space-y-1.5">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-muted/50 text-foreground"
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
                className="p-0.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="h-7 text-xs flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={!value.trim()}
          className="h-7 text-[11px] px-2"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Constants for Availability section
// ---------------------------------------------------------------------------

const ALL_DAYS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
] as const;

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Zurich",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${suffix}`;
}

// ---------------------------------------------------------------------------
// Template Switch Dialog — collects required fields before switching
// ---------------------------------------------------------------------------

/** Default pre-fill config for the switch dialog (only required fields) */
function getDefaultSwitchConfig(templateId: string): Record<string, unknown> {
  if (templateId === "appointment-booker") {
    return {
      service_types: [],
      availability: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        working_days: ["mon", "tue", "wed", "thu", "fri"],
        start_time: "09:00",
        end_time: "17:00",
        appointment_duration: 30,
        buffer_minutes: 15,
        max_advance_days: 30,
      },
    };
  }
  if (templateId === "customer-support") {
    return {
      escalation_mode: "escalate_complex",
    };
  }
  if (templateId === "lead-capture" || templateId === "lead-qualification") {
    return {};
  }
  return {};
}

/** Returns list of missing required field labels for the new template */
function getSwitchValidationErrors(
  templateId: string,
  config: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  if (templateId === "appointment-booker") {
    const types = (config.service_types ?? []) as string[];
    if (types.length === 0) errors.push("At least one appointment type");
    const avail = config.availability as Record<string, unknown> | undefined;
    if (!avail?.timezone) errors.push("Timezone");
  }
  // lead-capture has no strictly required fields in the switch dialog
  // customer-support has no strictly required fields beyond the default
  return errors;
}

function TemplateSwitchDialog({
  dialog,
  switching,
  currentQualificationMode,
  hasQuestions,
  hasIcp,
  onConfigChange,
  onKeepQuestionsChange,
  onCancel,
  onConfirm,
}: {
  dialog: {
    newTemplateId: string;
    toolsToRemove: string[];
    toolsToAdd: string[];
    config: Record<string, unknown>;
    keepQuestions: boolean;
  };
  switching: boolean;
  currentQualificationMode: string;
  hasQuestions: boolean;
  hasIcp: boolean;
  onConfigChange: (patch: Record<string, unknown>) => void;
  onKeepQuestionsChange: (keep: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const template = getTemplateById(dialog.newTemplateId);
  const errors = getSwitchValidationErrors(dialog.newTemplateId, dialog.config);
  const canSwitch = errors.length === 0;
  const isTargetSupport = dialog.newTemplateId === "customer-support";

  // Determine if there's anything worth keeping from lead filtering
  const hasFilteringData = currentQualificationMode === "describe" ? hasIcp : hasQuestions;

  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Switch to {template?.name ?? dialog.newTemplateId}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Behavior settings and lead filtering will be reset for the new goal.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          {/* Tool changes summary */}
          {(dialog.toolsToRemove.length > 0 || dialog.toolsToAdd.length > 0) && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tool changes
              </p>
              {dialog.toolsToRemove.length > 0 && (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5">
                  <p className="text-xs font-medium text-destructive mb-1">Remove:</p>
                  <ul className="text-xs text-destructive/80 list-disc pl-4 space-y-0.5">
                    {dialog.toolsToRemove.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {dialog.toolsToAdd.length > 0 && (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5">
                  <p className="text-xs font-medium text-primary mb-1">Add:</p>
                  <ul className="text-xs text-primary/80 list-disc pl-4 space-y-0.5">
                    {dialog.toolsToAdd.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Keep lead filtering data toggle */}
          {hasFilteringData && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Lead filtering
              </p>
              <label className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={dialog.keepQuestions}
                  onChange={(e) => onKeepQuestionsChange(e.target.checked)}
                  className="rounded border-border"
                />
                <div>
                  <p className="text-xs font-medium">
                    {currentQualificationMode === "describe"
                      ? isTargetSupport
                        ? "Keep your ideal customer description as context"
                        : "Keep your ideal customer description"
                      : isTargetSupport
                        ? "Keep your questions as triage questions"
                        : "Keep your existing questions"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {currentQualificationMode === "describe"
                      ? isTargetSupport
                        ? "Your customer description will be carried over as background context."
                        : "Your customer description will be carried over to the new goal."
                      : isTargetSupport
                        ? "Your current questions will be repurposed as triage questions."
                        : "Your current questions will be carried over to the new goal."}
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Required fields for new template */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Configuration
            </p>
            <SwitchConfigFields
              templateId={dialog.newTemplateId}
              config={dialog.config}
              onChange={onConfigChange}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={switching}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={switching || !canSwitch}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {switching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : null}
            Switch
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Template-specific required fields rendered inside the switch dialog */
function SwitchConfigFields({
  templateId,
  config,
  onChange,
}: {
  templateId: string;
  config: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  if (templateId === "appointment-booker") {
    const types = (config.service_types ?? []) as string[];
    const avail = (config.availability ?? {}) as Record<string, unknown>;

    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">
            Appointment types <span className="text-destructive">*</span>
          </Label>
          <p className="text-[11px] text-muted-foreground">
            What kinds of appointments can visitors book?
          </p>
          <TagList
            tags={types}
            onChange={(v) => onChange({ service_types: v })}
            placeholder="e.g., Consultation, Follow-up"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">
            Timezone <span className="text-destructive">*</span>
          </Label>
          <select
            value={(avail.timezone as string) ?? ""}
            onChange={(e) =>
              onChange({ availability: { ...avail, timezone: e.target.value } })
            }
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="">Select timezone...</option>
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Working hours</Label>
            <select
              value={(avail.start_time as string) ?? "09:00"}
              onChange={(e) =>
                onChange({ availability: { ...avail, start_time: e.target.value } })
              }
              className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{formatTime(t)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">to</Label>
            <select
              value={(avail.end_time as string) ?? "17:00"}
              onChange={(e) =>
                onChange({ availability: { ...avail, end_time: e.target.value } })
              }
              className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{formatTime(t)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Duration</Label>
            <select
              value={(avail.appointment_duration as number) ?? 30}
              onChange={(e) =>
                onChange({ availability: { ...avail, appointment_duration: Number(e.target.value) } })
              }
              className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs"
            >
              {[15, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Buffer</Label>
            <select
              value={(avail.buffer_minutes as number) ?? 15}
              onChange={(e) =>
                onChange({ availability: { ...avail, buffer_minutes: Number(e.target.value) } })
              }
              className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs"
            >
              {[0, 5, 10, 15, 30].map((m) => (
                <option key={m} value={m}>{m === 0 ? "None" : `${m} min`}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (templateId === "customer-support") {
    const mode = (config.escalation_mode as string) ?? "escalate_complex";
    const contact = (config.escalation_contact as string) ?? "";

    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Escalation behavior</Label>
          <div className="space-y-1.5">
            <OptionCard
              value="always_available"
              label="Handle everything"
              description="Agent resolves all issues without escalating"
              selected={mode === "always_available"}
              onSelect={() => onChange({ escalation_mode: "always_available" })}
            />
            <OptionCard
              value="escalate_complex"
              label="Escalate complex issues"
              description="Hand off to a human when it can't resolve an issue"
              selected={mode === "escalate_complex"}
              onSelect={() => onChange({ escalation_mode: "escalate_complex" })}
            />
          </div>
        </div>

        {mode === "escalate_complex" && (
          <div className="space-y-1">
            <Label className="text-xs">Escalation email</Label>
            <p className="text-[11px] text-muted-foreground">
              Your agent will email this address with a summary when it can&apos;t resolve an issue.
            </p>
            <Input
              type="email"
              value={contact}
              onChange={(e) => onChange({ escalation_contact: e.target.value })}
              placeholder="e.g., support@company.com"
              className="h-8 text-xs"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <p className="text-xs text-muted-foreground">
      No additional configuration needed.
    </p>
  );
}

// ---------------------------------------------------------------------------
// Remove Template Dialog — destructive confirmation
// ---------------------------------------------------------------------------

function RemoveTemplateDialog({
  templateName,
  hasTemplateTools,
  removing,
  onCancel,
  onConfirm,
}: {
  templateName: string;
  hasTemplateTools: boolean;
  removing: boolean;
  onCancel: () => void;
  onConfirm: (removeTools: boolean) => void;
}) {
  const [removeTools, setRemoveTools] = useState(true);

  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {templateName} template?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              This will convert your agent to a fully custom agent. The following
              changes are <strong className="text-destructive font-semibold">permanent</strong> and
              cannot be undone:
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-0.5 shrink-0">&#x2022;</span>
              <span>
                <strong>Behavior settings</strong> (booking rules, escalation,
                lead fields, qualification) will be cleared
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-0.5 shrink-0">&#x2022;</span>
              <span>
                <strong>Configuration Directives</strong> section in the system
                prompt will be removed
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-0.5 shrink-0">&#x2022;</span>
              <span>
                <strong>Tool workflow guidelines</strong> will be cleared
              </span>
            </li>
          </ul>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
              Your system prompt, knowledge base, name, and personality will be
              kept. Only template-specific configuration is removed.
            </p>
          </div>

          {hasTemplateTools && (
            <label className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={removeTools}
                onChange={(e) => setRemoveTools(e.target.checked)}
                className="rounded border-border"
              />
              <div>
                <p className="text-xs font-medium">
                  Also remove template tools
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Remove the tools that were added by this template (e.g. Google
                  Calendar, Gmail, Sheets).
                </p>
              </div>
            </label>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={removing}
            onClick={(e) => {
              e.preventDefault();
              onConfirm(removeTools);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {removing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : null}
            Remove Template
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

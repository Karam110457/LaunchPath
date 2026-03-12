"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import {
  getWizardSteps,
  createInitialWizardState,
  type AgentWizardState,
  type WizardStepId,
  type WizardGenerationPayload,
} from "@/types/agent-wizard";
import { useAgentGeneration } from "@/hooks/useAgentGeneration";
import { AgentGenerating } from "../AgentGenerating";
import { getTemplateById } from "@/lib/agents/templates";

import { ChooseTypeStep } from "./steps/ChooseTypeStep";
import { AgentNameStep } from "./steps/AgentNameStep";
import { BusinessContextStep } from "./steps/BusinessContextStep";
import { WebsiteStep } from "./steps/WebsiteStep";
import { KnowledgeBaseStep } from "./steps/KnowledgeBaseStep";
import { AgentPersonalityStep } from "./steps/AgentPersonalityStep";
import { LeadQualificationStep } from "./steps/LeadQualificationStep";
import { LeadFieldsStep } from "./steps/LeadFieldsStep";
import { SchedulingStep } from "./steps/SchedulingStep";
import { ResponseBehaviorStep } from "./steps/ResponseBehaviorStep";
import { EscalationStep } from "./steps/EscalationStep";
import { LeadCollectionStep } from "./steps/LeadCollectionStep";
import { IntegrationsStep } from "./steps/IntegrationsStep";
import { ReviewStep } from "./steps/ReviewStep";

interface AgentWizardProps {
  initialTemplateId?: string;
  /** When provided (regenerate flow), hydrate wizard state from this config and start at Review */
  initialWizardConfig?: WizardGenerationPayload;
  onBack: () => void;
}

export const WIZARD_DRAFT_KEY = "launchpath_wizard_draft";

/** Check if a wizard draft exists in localStorage (safe for SSR) */
export function hasWizardDraft(): {
  exists: boolean;
  templateId?: string;
  stepIndex?: number;
  agentName?: string;
} {
  try {
    const raw = localStorage.getItem(WIZARD_DRAFT_KEY);
    if (!raw) return { exists: false };
    const draft = JSON.parse(raw);
    return {
      exists: true,
      templateId: draft.state?.templateId ?? undefined,
      stepIndex: draft.stepIndex ?? 0,
      agentName: draft.state?.agentName ?? undefined,
    };
  } catch {
    return { exists: false };
  }
}

export function clearWizardDraft() {
  try {
    localStorage.removeItem(WIZARD_DRAFT_KEY);
  } catch {
    // ignore
  }
}

function loadDraft(): { stepIndex: number; state: AgentWizardState } | null {
  try {
    const raw = localStorage.getItem(WIZARD_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (draft.state) {
      draft.state.files = [];
      if (!Array.isArray(draft.state.selectedToolkits)) {
        draft.state.selectedToolkits = [];
      }
      // Clean up removed fields from old drafts
      delete (draft.state as Record<string, unknown>).businessContextMode;
      delete (draft.state as Record<string, unknown>).linkedSystemId;
    }
    return draft;
  } catch {
    return null;
  }
}

function saveDraft(stepIndex: number, state: AgentWizardState) {
  try {
    const serializable = { ...state, files: [] };
    localStorage.setItem(
      WIZARD_DRAFT_KEY,
      JSON.stringify({ stepIndex, state: serializable }),
    );
  } catch {
    // Storage full or unavailable — ignore
  }
}

const clearDraft = clearWizardDraft;

export function AgentWizard({ initialTemplateId, initialWizardConfig, onBack }: AgentWizardProps) {
  const router = useRouter();

  // When regenerating, skip localStorage draft — use initialWizardConfig instead
  const draft = useRef(initialWizardConfig ? null : loadDraft());

  // If a template was pre-selected from the landing page, skip step 1 (choose-type)
  const hasInitialTemplate = !draft.current && !initialWizardConfig && !!initialTemplateId;

  const [stepIndex, setStepIndex] = useState(() => {
    if (initialWizardConfig) {
      // Start at the review step
      const steps = getWizardSteps(initialWizardConfig.templateId);
      const reviewIdx = steps.findIndex((s) => s.id === "review");
      return reviewIdx >= 0 ? reviewIdx : steps.length - 1;
    }
    return draft.current?.stepIndex ?? (hasInitialTemplate ? 1 : 0);
  });
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [state, setState] = useState<AgentWizardState>(() => {
    // Regenerate flow: hydrate from stored wizard config
    if (initialWizardConfig) {
      const wc = initialWizardConfig;
      const base = createInitialWizardState();
      base.templateId = wc.templateId as AgentWizardState["templateId"];
      base.agentName = wc.agentName;
      base.agentDescription = wc.agentDescription;
      base.businessDescription = wc.businessDescription ?? "";
      base.tone = wc.personality.tone;
      base.greetingMessage = wc.personality.greeting_message;
      base.qualifyingQuestions = wc.qualifyingQuestions.length > 0
        ? wc.qualifyingQuestions
        : base.qualifyingQuestions;
      base.faqs = wc.faqs.map((f, i) => ({
        id: `regen-${i}`,
        question: f.question,
        answer: f.answer,
        source: "manual" as const,
      }));
      base.selectedToolkits = wc.selectedToolkits ?? [];

      // Hydrate behavior config based on template
      if (wc.templateId === "appointment-booker") {
        base.appointmentBookerConfig = {
          ...base.appointmentBookerConfig,
          ...(wc.behaviorConfig as Partial<typeof base.appointmentBookerConfig>),
        };
      } else if (wc.templateId === "customer-support") {
        base.customerSupportConfig = {
          ...base.customerSupportConfig,
          ...(wc.behaviorConfig as Partial<typeof base.customerSupportConfig>),
        };
      } else {
        base.leadCaptureConfig = {
          ...base.leadCaptureConfig,
          ...(wc.behaviorConfig as Partial<typeof base.leadCaptureConfig>),
        };
      }
      return base;
    }

    if (draft.current?.state) return draft.current.state;
    const initial = createInitialWizardState();
    if (initialTemplateId) {
      initial.templateId = initialTemplateId as AgentWizardState["templateId"];
      // Pre-fill personality + tools from template
      const template = getTemplateById(initialTemplateId);
      if (template) {
        initial.tone = template.suggested_personality.tone;
        initial.greetingMessage = template.suggested_personality.greeting_message;
        initial.selectedToolkits = template.suggestedTools.map((t) => t.toolkit);
      }
    }
    return initial;
  });
  const { isLoading, currentLabel, agent, error, startGeneration, cancel, reset } =
    useAgentGeneration();

  // Dynamic steps based on selected template
  const activeSteps = getWizardSteps(state.templateId);
  const clampedIndex = Math.min(stepIndex, activeSteps.length - 1);
  const currentStep = activeSteps[clampedIndex];
  const totalSteps = activeSteps.length;

  // Persist draft
  useEffect(() => {
    saveDraft(stepIndex, state);
  }, [stepIndex, state]);

  // Warn before closing
  useEffect(() => {
    const hasProgress =
      state.templateId !== null ||
      state.businessDescription.trim().length > 0 ||
      state.faqs.length > 0 ||
      state.agentName.trim().length > 0;
    if (!hasProgress) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state]);

  // Redirect on generation complete
  useEffect(() => {
    if (agent?.id) {
      clearDraft();
      router.push(`/dashboard/agents/${agent.id}`);
    }
  }, [agent, router]);

  if (isLoading || error) {
    return (
      <AgentGenerating
        currentLabel={currentLabel}
        error={error}
        onCancel={cancel}
        onRetry={() => handleGenerate()}
        onBack={reset}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // State helpers
  // ---------------------------------------------------------------------------

  function updateState<K extends keyof AgentWizardState>(
    key: K,
    value: AgentWizardState[K],
  ) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  // ---------------------------------------------------------------------------
  // Validation — per step
  // ---------------------------------------------------------------------------

  function getValidationErrorForStep(stepId: WizardStepId): string | null {
    switch (stepId) {
      case "choose-type":
        return state.templateId === null
          ? "Select an agent type to continue"
          : null;

      case "agent-name":
        return !state.agentName.trim()
          ? "Give your agent a name to continue"
          : null;

      case "business-context": {
        const len = state.businessDescription.trim().length;
        if (len === 0) return "Describe your business to continue";
        if (len <= 10)
          return `Add a bit more detail (${len}/10 characters minimum)`;
        return null;
      }

      case "website":
        // Optional — can always proceed
        return null;

      case "knowledge":
        // Optional but we show a hint
        return null;

      case "agent-personality": {
        const missing: string[] = [];
        if (!state.tone.trim()) missing.push("tone");
        if (!state.greetingMessage.trim()) missing.push("greeting message");
        return missing.length > 0
          ? `Fill in the ${missing.join(" and ")} to continue`
          : null;
      }

      case "lead-qualification": {
        const cfgKey =
          state.templateId === "appointment-booker"
            ? "appointmentBookerConfig"
            : "leadCaptureConfig";
        const cfg = state[cfgKey];
        if (
          cfg.qualification_mode === "describe" &&
          !cfg.icp_description.trim()
        )
          return "Describe your ideal customer to continue";
        if (
          cfg.qualification_mode === "questions" &&
          state.qualifyingQuestions.filter((q) => q.trim()).length === 0
        )
          return "Add at least one qualifying question";
        return null;
      }

      case "lead-fields":
        return null;

      case "scheduling":
        if (!state.appointmentBookerConfig.availability.timezone)
          return "Select a timezone to continue";
        if (state.appointmentBookerConfig.service_types.length === 0)
          return "Add at least one appointment type";
        return null;

      case "response-behavior":
        return null;

      case "escalation":
        if (
          state.customerSupportConfig.escalation_mode ===
            "escalate_complex" &&
          !state.customerSupportConfig.escalation_contact.trim()
        )
          return "Add an escalation email so your agent knows where to send issues";
        return null;

      case "lead-collection":
        if (
          state.leadCaptureConfig.notification_behavior === "email_team" &&
          !state.leadCaptureConfig.notification_email.trim()
        )
          return "Add a notification email so your team gets lead alerts";
        return null;

      case "integrations":
        return null;

      case "review":
        return null;

      default:
        return null;
    }
  }

  function getValidationError(): string | null {
    return getValidationErrorForStep(currentStep.id);
  }

  function canProceed(): boolean {
    return !getValidationError();
  }

  /** Validate all steps — returns first failing step or null */
  function validateAllSteps(): { stepId: WizardStepId; error: string } | null {
    for (const step of activeSteps) {
      const err = getValidationErrorForStep(step.id);
      if (err) return { stepId: step.id, error: err };
    }
    return null;
  }

  /** Non-blocking hint shown below navigation */
  function getStepHint(): string | null {
    if (currentStep.id === "website") {
      const hasWebsite = state.websiteUrl.trim().length > 0;
      const hasFiles = state.files.length > 0;
      if (!hasWebsite && !hasFiles)
        return "No website or files? No worries — you can skip this step and add content later.";
    }
    if (currentStep.id === "knowledge") {
      const hasKB =
        state.discoveredPages.some(
          (p) => p.selected && p.status === "done",
        ) ||
        state.faqs.length > 0 ||
        state.files.length > 0;
      if (!hasKB)
        return "Adding knowledge helps your agent answer questions accurately. You can always add more later.";
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  function handleNext() {
    if (clampedIndex < totalSteps - 1) {
      // Pre-fill personality + tools from template when leaving choose-type
      if (currentStep.id === "choose-type" && state.templateId) {
        const template = getTemplateById(state.templateId);
        if (template) {
          setState((prev) => ({
            ...prev,
            tone: prev.tone || template.suggested_personality.tone,
            greetingMessage:
              prev.greetingMessage ||
              template.suggested_personality.greeting_message,
            selectedToolkits: template.suggestedTools.map((t) => t.toolkit),
          }));
        }
      }
      setDirection("forward");
      setStepIndex(clampedIndex + 1);
    }
  }

  function handleBack() {
    if (clampedIndex === 0) {
      clearDraft();
      onBack();
    } else {
      setDirection("back");
      setStepIndex(clampedIndex - 1);
    }
  }

  /** Navigate to a step by its ID (used by ReviewStep edit buttons) */
  function goToStepById(stepId: WizardStepId) {
    const idx = activeSteps.findIndex((s) => s.id === stepId);
    if (idx >= 0) {
      setDirection(idx < clampedIndex ? "back" : "forward");
      setStepIndex(idx);
    }
  }

  // ---------------------------------------------------------------------------
  // Generation
  // ---------------------------------------------------------------------------

  function handleGenerate() {
    if (!state.templateId) return;

    // Validate all steps before generating
    const validation = validateAllSteps();
    if (validation) {
      goToStepById(validation.stepId);
      return;
    }

    const behaviorConfig =
      state.templateId === "appointment-booker"
        ? state.appointmentBookerConfig
        : state.templateId === "lead-capture" ||
            state.templateId === "lead-qualification"
          ? state.leadCaptureConfig
          : state.customerSupportConfig;

    const scannedPages = state.discoveredPages
      .filter((p) => p.selected && p.status === "done" && p.content)
      .map((p) => ({ url: p.url, title: p.title, content: p.content! }));

    const filesPayload = state.files
      .filter((f) => f.extractedText)
      .map((f) => ({ name: f.name, extractedText: f.extractedText! }));

    const payload: WizardGenerationPayload = {
      templateId: state.templateId,
      businessDescription: state.businessDescription || undefined,
      agentName: state.agentName,
      agentDescription: state.agentDescription,
      behaviorConfig,
      personality: {
        tone: state.tone,
        greeting_message: state.greetingMessage,
      },
      qualifyingQuestions: state.qualifyingQuestions.filter((q) => q.trim()),
      faqs: state.faqs.map((f) => ({
        question: f.question,
        answer: f.answer,
      })),
      scrapedPages: scannedPages,
      files: filesPayload,
      selectedToolkits: state.selectedToolkits,
    };

    startGeneration({ wizardConfig: payload });
  }

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const scrapedContent = state.discoveredPages
    .filter((p) => p.selected && p.status === "done")
    .map((p) => p.content || "")
    .join("\n\n");

  // ---------------------------------------------------------------------------
  // Step rendering
  // ---------------------------------------------------------------------------

  function renderStep() {
    switch (currentStep.id) {
      case "choose-type":
        return (
          <ChooseTypeStep
            templateId={state.templateId}
            onSelect={(id) => updateState("templateId", id)}
          />
        );

      case "agent-name":
        return (
          <AgentNameStep
            agentName={state.agentName}
            agentDescription={state.agentDescription}
            onNameChange={(name) => updateState("agentName", name)}
            onDescriptionChange={(desc) =>
              updateState("agentDescription", desc)
            }
          />
        );

      case "business-context":
        return (
          <BusinessContextStep
            businessDescription={state.businessDescription}
            onDescriptionChange={(desc) =>
              updateState("businessDescription", desc)
            }
          />
        );

      case "website":
        return (
          <WebsiteStep
            websiteUrl={state.websiteUrl}
            discoveredPages={state.discoveredPages}
            files={state.files}
            onWebsiteUrlChange={(url) => updateState("websiteUrl", url)}
            onDiscoveredPagesChange={(pages) =>
              updateState("discoveredPages", pages)
            }
            onFilesChange={(files) => updateState("files", files)}
          />
        );

      case "knowledge":
        return (
          <KnowledgeBaseStep
            templateId={state.templateId}
            discoveredPages={state.discoveredPages}
            faqs={state.faqs}
            files={state.files}
            businessDescription={state.businessDescription}
            onPagesChange={(pages) => updateState("discoveredPages", pages)}
            onFaqsChange={(faqs) => updateState("faqs", faqs)}
          />
        );

      case "agent-personality":
        return (
          <AgentPersonalityStep
            agentName={state.agentName}
            tone={state.tone}
            greetingMessage={state.greetingMessage}
            onToneChange={(tone) => updateState("tone", tone)}
            onGreetingChange={(greeting) =>
              updateState("greetingMessage", greeting)
            }
          />
        );

      case "lead-qualification": {
        const configKey =
          state.templateId === "appointment-booker"
            ? "appointmentBookerConfig"
            : "leadCaptureConfig";
        const config = state[configKey];
        return (
          <LeadQualificationStep
            templateId={state.templateId!}
            qualificationMode={config.qualification_mode}
            icpDescription={config.icp_description}
            disqualificationCriteria={config.disqualification_criteria}
            qualifyingQuestions={state.qualifyingQuestions}
            businessDescription={state.businessDescription}
            scrapedContent={scrapedContent}
            faqs={state.faqs.map((f) => ({
              question: f.question,
              answer: f.answer,
            }))}
            onModeChange={(mode) =>
              setState((prev) => ({
                ...prev,
                [configKey]: {
                  ...prev[configKey],
                  qualification_mode: mode,
                },
              }))
            }
            onIcpChange={(value) =>
              setState((prev) => ({
                ...prev,
                [configKey]: {
                  ...prev[configKey],
                  icp_description: value,
                },
              }))
            }
            onDisqualChange={(value) =>
              setState((prev) => ({
                ...prev,
                [configKey]: {
                  ...prev[configKey],
                  disqualification_criteria: value,
                },
              }))
            }
            onQuestionsChange={(q) => updateState("qualifyingQuestions", q)}
          />
        );
      }

      case "lead-fields":
        return (
          <LeadFieldsStep
            config={state.appointmentBookerConfig}
            onUpdate={(updater) =>
              setState((prev) => ({
                ...prev,
                appointmentBookerConfig: updater(prev.appointmentBookerConfig),
              }))
            }
          />
        );

      case "scheduling":
        return (
          <SchedulingStep
            config={state.appointmentBookerConfig}
            onUpdate={(updater) =>
              setState((prev) => ({
                ...prev,
                appointmentBookerConfig: updater(prev.appointmentBookerConfig),
              }))
            }
          />
        );

      case "response-behavior":
        return (
          <ResponseBehaviorStep
            config={state.customerSupportConfig}
            onUpdate={(updater) =>
              setState((prev) => ({
                ...prev,
                customerSupportConfig: updater(prev.customerSupportConfig),
              }))
            }
          />
        );

      case "escalation":
        return (
          <EscalationStep
            config={state.customerSupportConfig}
            onUpdate={(updater) =>
              setState((prev) => ({
                ...prev,
                customerSupportConfig: updater(prev.customerSupportConfig),
              }))
            }
          />
        );

      case "lead-collection":
        return (
          <LeadCollectionStep
            config={state.leadCaptureConfig}
            onUpdate={(updater) =>
              setState((prev) => ({
                ...prev,
                leadCaptureConfig: updater(prev.leadCaptureConfig),
              }))
            }
          />
        );

      case "integrations": {
        const template = state.templateId
          ? getTemplateById(state.templateId)
          : null;
        let tools = template?.suggestedTools ?? [];

        // Filter integrations based on wizard choices:
        // - "sheet_only" notification → no Gmail needed
        // - customer-support without escalation → no Gmail needed
        if (
          (state.templateId === "lead-capture" || state.templateId === "lead-qualification") &&
          state.leadCaptureConfig.notification_behavior === "sheet_only"
        ) {
          tools = tools.filter((t) => t.toolkit !== "gmail");
        }
        if (
          state.templateId === "customer-support" &&
          state.customerSupportConfig.escalation_mode === "always_available"
        ) {
          tools = tools.filter((t) => t.toolkit !== "gmail");
        }

        return (
          <IntegrationsStep
            suggestedTools={tools}
            selectedToolkits={state.selectedToolkits}
            onSelectedToolkitsChange={(toolkits) =>
              updateState("selectedToolkits", toolkits)
            }
          />
        );
      }

      case "review":
        return (
          <ReviewStep
            state={state}
            onGoToStep={goToStepById}
          />
        );

      default:
        return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const progress = ((clampedIndex + 1) / totalSteps) * 100;

  const slideClass =
    direction === "forward"
      ? "animate-in fade-in slide-in-from-right-4 duration-300"
      : "animate-in fade-in slide-in-from-left-4 duration-300";

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Shared SVG gradient for icons across all wizard steps */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="wizard-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8C00" />
            <stop offset="100%" stopColor="#9D50BB" />
          </linearGradient>
        </defs>
      </svg>

      {/* Progress indicator (#12 — step label cross-fades) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-400 dark:text-neutral-500 tabular-nums">
            Step {clampedIndex + 1} of {totalSteps}
          </p>
          <p
            key={currentStep.label}
            className="text-sm text-neutral-400 dark:text-neutral-500 animate-in fade-in duration-200"
          >
            {currentStep.label}
          </p>
        </div>
        <div className="h-2 bg-neutral-100 dark:bg-[#1E1E1E] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #FF8C00, #9D50BB)",
            }}
          />
        </div>
      </div>

      {/* Step content with directional animation (#9) */}
      <div className={slideClass} key={currentStep.id}>
        {renderStep()}
      </div>

      {/* Navigation (#10, #11) */}
      <div className="space-y-2 pt-4">
        {getValidationError() && (
          <p
            key={getValidationError()}
            className="text-xs text-neutral-400 dark:text-neutral-500 text-center animate-in fade-in duration-200"
          >
            {getValidationError()}
          </p>
        )}
        {!getValidationError() && getStepHint() && (
          <p
            key={getStepHint()}
            className="text-xs text-amber-600 dark:text-amber-400 text-center animate-in fade-in duration-200"
          >
            {getStepHint()}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-transform duration-150 hover:-translate-x-0.5 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep.id === "review" ? (
            <Button
              onClick={handleGenerate}
              className="gradient-accent-bg text-white border-0 shadow-sm rounded-full px-6 h-10 transition-transform duration-150 hover:scale-[1.02] active:scale-95"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Agent
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gradient-accent-bg text-white border-0 shadow-sm rounded-full px-6 h-10 disabled:opacity-40 transition-transform duration-150 hover:scale-[1.02] hover:translate-x-0.5 active:scale-95"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

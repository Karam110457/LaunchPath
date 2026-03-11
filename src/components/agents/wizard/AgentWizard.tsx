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
  businesses?: Array<{ id: string; name: string }>; // V2: link existing business
  onBack: () => void;
}

const WIZARD_DRAFT_KEY = "launchpath_wizard_draft";

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

function clearDraft() {
  try {
    localStorage.removeItem(WIZARD_DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function AgentWizard({ onBack }: AgentWizardProps) {
  const router = useRouter();

  const draft = useRef(loadDraft());
  const [stepIndex, setStepIndex] = useState(draft.current?.stepIndex ?? 0);
  const [state, setState] = useState<AgentWizardState>(
    draft.current?.state ?? createInitialWizardState(),
  );
  const { isLoading, currentLabel, agent, error, startGeneration } =
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
    return <AgentGenerating currentLabel={currentLabel} error={error} />;
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

  function getValidationError(): string | null {
    switch (currentStep.id) {
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

  function canProceed(): boolean {
    return !getValidationError();
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
      setStepIndex(clampedIndex + 1);
    }
  }

  function handleBack() {
    if (clampedIndex === 0) {
      clearDraft();
      onBack();
    } else {
      setStepIndex(clampedIndex - 1);
    }
  }

  /** Navigate to a step by its ID (used by ReviewStep edit buttons) */
  function goToStepById(stepId: WizardStepId) {
    const idx = activeSteps.findIndex((s) => s.id === stepId);
    if (idx >= 0) setStepIndex(idx);
  }

  // ---------------------------------------------------------------------------
  // Generation
  // ---------------------------------------------------------------------------

  function handleGenerate() {
    if (!state.templateId) return;

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
        return (
          <IntegrationsStep
            suggestedTools={template?.suggestedTools ?? []}
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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
            Step {clampedIndex + 1} of {totalSteps}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            {currentStep.label}
          </p>
        </div>
        <div className="h-1.5 bg-neutral-100 dark:bg-[#1E1E1E] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #FF8C00, #9D50BB)",
            }}
          />
        </div>
      </div>

      {/* Step content with animation */}
      <div
        className="animate-in fade-in slide-in-from-right-4 duration-300"
        key={currentStep.id}
      >
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="space-y-2 pt-4">
        {getValidationError() && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
            {getValidationError()}
          </p>
        )}
        {!getValidationError() && getStepHint() && (
          <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
            {getStepHint()}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep.id === "review" ? (
            <Button
              onClick={handleGenerate}
              className="gradient-accent-bg text-white border-0 shadow-sm rounded-full px-6 h-10"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Agent
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gradient-accent-bg text-white border-0 shadow-sm rounded-full px-6 h-10 disabled:opacity-40"
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

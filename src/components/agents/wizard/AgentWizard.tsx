"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import {
  WIZARD_STEPS,
  createInitialWizardState,
  type AgentWizardState,
  type WizardGenerationPayload,
} from "@/types/agent-wizard";
import { useAgentGeneration } from "@/hooks/useAgentGeneration";
import { AgentGenerating } from "../AgentGenerating";
import { getTemplateById } from "@/lib/agents/templates";

import { ChooseTypeStep } from "./steps/ChooseTypeStep";
import { BusinessContextStep } from "./steps/BusinessContextStep";
import { KnowledgeBaseStep } from "./steps/KnowledgeBaseStep";
import { ConversationFlowStep } from "./steps/ConversationFlowStep";
import { IntegrationsStep } from "./steps/IntegrationsStep";
import { AgentIdentityStep } from "./steps/AgentIdentityStep";
import { ReviewStep } from "./steps/ReviewStep";

interface AgentWizardProps {
  businesses: Array<{ id: string; name: string }>;
  onBack: () => void;
}

const WIZARD_DRAFT_KEY = "launchpath_wizard_draft";

function loadDraft(): { stepIndex: number; state: AgentWizardState } | null {
  try {
    const raw = localStorage.getItem(WIZARD_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    // Restore files as empty (File objects can't be serialized)
    if (draft.state) draft.state.files = [];
    return draft;
  } catch {
    return null;
  }
}

function saveDraft(stepIndex: number, state: AgentWizardState) {
  try {
    // Exclude File objects from serialization
    const serializable = { ...state, files: [] };
    localStorage.setItem(
      WIZARD_DRAFT_KEY,
      JSON.stringify({ stepIndex, state: serializable })
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

export function AgentWizard({ businesses, onBack }: AgentWizardProps) {
  const router = useRouter();

  // Restore draft from localStorage on mount
  const draft = useRef(loadDraft());
  const [stepIndex, setStepIndex] = useState(draft.current?.stepIndex ?? 0);
  const [state, setState] = useState<AgentWizardState>(
    draft.current?.state ?? createInitialWizardState(),
  );
  const { isLoading, currentLabel, agent, error, startGeneration } =
    useAgentGeneration();

  const currentStep = WIZARD_STEPS[stepIndex];
  const totalSteps = WIZARD_STEPS.length;

  // Persist draft to localStorage on every change
  useEffect(() => {
    saveDraft(stepIndex, state);
  }, [stepIndex, state]);

  // Warn before closing tab if wizard has meaningful progress
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

  // Redirect on generation complete — clear draft
  useEffect(() => {
    if (agent?.id) {
      clearDraft();
      router.push(`/dashboard/agents/${agent.id}`);
    }
  }, [agent, router]);

  // Show generating state
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
  // Validation
  // ---------------------------------------------------------------------------

  function canProceed(): boolean {
    return !getValidationError();
  }

  function getValidationError(): string | null {
    switch (currentStep.id) {
      case "choose-type":
        return state.templateId === null ? "Select an agent type to continue" : null;

      case "business-context":
        if (!state.businessContextMode) return "Choose how to describe your business";
        if (state.businessContextMode === "link_system" && !state.linkedSystemId) {
          return "Select a business to continue";
        }
        if (state.businessContextMode === "describe") {
          const len = state.businessDescription.trim().length;
          if (len === 0) return "Describe your business to continue";
          if (len <= 10) return `Add a bit more detail (${len}/10 characters minimum)`;
        }
        return null;

      case "knowledge-base":
        return null;

      case "conversation-flow":
        return null;

      case "agent-identity": {
        const missing: string[] = [];
        if (!state.agentName.trim()) missing.push("name");
        if (!state.tone.trim()) missing.push("tone");
        if (!state.greetingMessage.trim()) missing.push("greeting message");
        return missing.length > 0 ? `Fill in the ${missing.join(", ")} to continue` : null;
      }

      case "review":
        return null;

      default:
        return "Unknown step";
    }
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  function handleNext() {
    if (stepIndex < totalSteps - 1) {
      // Pre-fill personality + tools from template when leaving step 1
      if (currentStep.id === "choose-type" && state.templateId) {
        const template = getTemplateById(state.templateId);
        if (template) {
          setState((prev) => ({
            ...prev,
            tone: prev.tone || template.suggested_personality.tone,
            greetingMessage: prev.greetingMessage || template.suggested_personality.greeting_message,
            // Auto-select all suggested tools
            selectedToolkits: template.suggestedTools.map((t) => t.toolkit),
          }));
        }
      }
      setStepIndex((s) => s + 1);
    }
  }

  function handleBack() {
    if (stepIndex === 0) {
      clearDraft();
      onBack();
    } else {
      setStepIndex((s) => s - 1);
    }
  }

  function goToStep(index: number) {
    if (index >= 0 && index < totalSteps) {
      setStepIndex(index);
    }
  }

  // ---------------------------------------------------------------------------
  // Generation
  // ---------------------------------------------------------------------------

  function handleGenerate() {
    if (!state.templateId) return;

    const behaviorConfig =
      state.templateId === "appointment-booker"
        ? state.appointmentBookerConfig
        : state.templateId === "lead-qualification"
          ? state.leadQualificationConfig
          : state.customerSupportConfig;

    const scannedPages = state.discoveredPages
      .filter((p) => p.selected && p.status === "done" && p.content)
      .map((p) => ({ url: p.url, title: p.title, content: p.content! }));

    const filesPayload = state.files
      .filter((f) => f.extractedText)
      .map((f) => ({ name: f.name, extractedText: f.extractedText! }));

    const payload: WizardGenerationPayload = {
      templateId: state.templateId,
      systemId:
        state.businessContextMode === "link_system"
          ? (state.linkedSystemId ?? undefined)
          : undefined,
      businessDescription:
        state.businessContextMode === "describe"
          ? state.businessDescription
          : undefined,
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
  // Derived values for steps
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

      case "business-context":
        return (
          <BusinessContextStep
            mode={state.businessContextMode}
            linkedSystemId={state.linkedSystemId}
            businessDescription={state.businessDescription}
            websiteUrl={state.websiteUrl}
            discoveredPages={state.discoveredPages}
            businesses={businesses}
            onModeChange={(mode) => updateState("businessContextMode", mode)}
            onSystemSelect={(id) => updateState("linkedSystemId", id)}
            onDescriptionChange={(desc) =>
              updateState("businessDescription", desc)
            }
            onWebsiteUrlChange={(url) => updateState("websiteUrl", url)}
            onDiscoveredPagesChange={(pages) =>
              updateState("discoveredPages", pages)
            }
          />
        );

      case "knowledge-base":
        return (
          <KnowledgeBaseStep
            discoveredPages={state.discoveredPages}
            faqs={state.faqs}
            files={state.files}
            businessDescription={state.businessDescription}
            onPagesChange={(pages) => updateState("discoveredPages", pages)}
            onFaqsChange={(faqs) => updateState("faqs", faqs)}
            onFilesChange={(files) => updateState("files", files)}
          />
        );

      case "conversation-flow":
        return state.templateId ? (
          <ConversationFlowStep
            templateId={state.templateId}
            qualifyingQuestions={state.qualifyingQuestions}
            appointmentBookerConfig={state.appointmentBookerConfig}
            customerSupportConfig={state.customerSupportConfig}
            leadQualificationConfig={state.leadQualificationConfig}
            businessDescription={state.businessDescription}
            scrapedContent={scrapedContent}
            faqs={state.faqs.map((f) => ({
              question: f.question,
              answer: f.answer,
            }))}
            onQuestionsChange={(q) => updateState("qualifyingQuestions", q)}
            onUpdateAppointmentBooker={(updater) =>
              setState((prev) => ({
                ...prev,
                appointmentBookerConfig: updater(prev.appointmentBookerConfig),
              }))
            }
            onUpdateCustomerSupport={(updater) =>
              setState((prev) => ({
                ...prev,
                customerSupportConfig: updater(prev.customerSupportConfig),
              }))
            }
            onUpdateLeadQualification={(updater) =>
              setState((prev) => ({
                ...prev,
                leadQualificationConfig: updater(prev.leadQualificationConfig),
              }))
            }
          />
        ) : null;

      case "integrations": {
        const template = state.templateId ? getTemplateById(state.templateId) : null;
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

      case "agent-identity":
        return (
          <AgentIdentityStep
            agentName={state.agentName}
            agentDescription={state.agentDescription}
            tone={state.tone}
            greetingMessage={state.greetingMessage}
            onNameChange={(name) => updateState("agentName", name)}
            onDescriptionChange={(desc) =>
              updateState("agentDescription", desc)
            }
            onToneChange={(tone) => updateState("tone", tone)}
            onGreetingChange={(greeting) =>
              updateState("greetingMessage", greeting)
            }
          />
        );

      case "review": {
        const linkedBusiness = businesses.find(
          (b) => b.id === state.linkedSystemId,
        );
        return (
          <ReviewStep
            state={state}
            businessName={linkedBusiness?.name}
            onGoToStep={goToStep}
          />
        );
      }

      default:
        return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {totalSteps}
          </p>
          <p className="text-xs text-muted-foreground">{currentStep.label}</p>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${((stepIndex + 1) / totalSteps) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Step content with animation */}
      <div
        className="animate-in fade-in slide-in-from-right-4 duration-300"
        key={stepIndex}
      >
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="space-y-2 pt-4">
        {getValidationError() && (
          <p className="text-xs text-muted-foreground text-center">
            {getValidationError()}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep.id === "review" ? (
            <Button onClick={handleGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Agent
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

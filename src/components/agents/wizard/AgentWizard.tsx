"use client";

import { useState, useEffect } from "react";
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
import { AgentIdentityStep } from "./steps/AgentIdentityStep";
import { ReviewStep } from "./steps/ReviewStep";

interface AgentWizardProps {
  businesses: Array<{ id: string; name: string }>;
  onBack: () => void;
}

export function AgentWizard({ businesses, onBack }: AgentWizardProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<AgentWizardState>(
    createInitialWizardState(),
  );
  const { isLoading, currentLabel, agent, error, startGeneration } =
    useAgentGeneration();

  const currentStep = WIZARD_STEPS[stepIndex];
  const totalSteps = WIZARD_STEPS.length;

  // Redirect on generation complete
  useEffect(() => {
    if (agent?.id) {
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
    switch (currentStep.id) {
      case "choose-type":
        return state.templateId !== null;

      case "business-context":
        if (state.businessContextMode === "link_system") {
          return state.linkedSystemId !== null;
        }
        if (state.businessContextMode === "describe") {
          return state.businessDescription.trim().length > 10;
        }
        return false;

      case "knowledge-base":
        // Knowledge base is optional — always allow proceeding
        return true;

      case "conversation-flow":
        // Allow proceeding even with no questions (they're optional)
        return true;

      case "agent-identity":
        return (
          state.agentName.trim().length > 0 &&
          state.tone.trim().length > 0 &&
          state.greetingMessage.trim().length > 0
        );

      case "review":
        return true;

      default:
        return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  function handleNext() {
    if (stepIndex < totalSteps - 1) {
      // Pre-fill personality from template when leaving step 1
      if (currentStep.id === "choose-type" && state.templateId) {
        const template = getTemplateById(state.templateId);
        if (template && !state.tone && !state.greetingMessage) {
          setState((prev) => ({
            ...prev,
            tone: template.suggested_personality.tone,
            greetingMessage: template.suggested_personality.greeting_message,
          }));
        }
      }
      setStepIndex((s) => s + 1);
    }
  }

  function handleBack() {
    if (stepIndex === 0) {
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
          />
        ) : null;

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
      <div className="flex items-center justify-between pt-4">
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
  );
}

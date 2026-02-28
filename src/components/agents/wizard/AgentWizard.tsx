"use client";

import { useState, useEffect, useCallback } from "react";
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
import { BehaviorStep } from "./steps/BehaviorStep";
import { PersonalityStep } from "./steps/PersonalityStep";
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

      case "behavior":
        return validateBehavior();

      case "personality":
        return state.tone.trim().length > 0 && state.greetingMessage.trim().length > 0;

      case "review":
        return true;

      default:
        return false;
    }
  }

  function validateBehavior(): boolean {
    if (state.templateId === "appointment-booker") {
      const c = state.appointmentBookerConfig;
      return (
        c.services.trim().length > 0 &&
        c.qualifying_questions.some((q) => q.trim().length > 0)
      );
    }
    if (state.templateId === "customer-support") {
      const c = state.customerSupportConfig;
      return (
        c.business_description.trim().length > 0 &&
        c.support_topics.some((t) => t.trim().length > 0)
      );
    }
    return false;
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
      behaviorConfig,
      personality: {
        tone: state.tone,
        greeting_message: state.greetingMessage,
      },
    };

    startGeneration({ wizardConfig: payload });
  }

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
            businesses={businesses}
            onModeChange={(mode) => updateState("businessContextMode", mode)}
            onSystemSelect={(id) => updateState("linkedSystemId", id)}
            onDescriptionChange={(desc) =>
              updateState("businessDescription", desc)
            }
          />
        );

      case "behavior":
        return state.templateId ? (
          <BehaviorStep
            templateId={state.templateId}
            appointmentBookerConfig={state.appointmentBookerConfig}
            customerSupportConfig={state.customerSupportConfig}
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

      case "personality":
        return (
          <PersonalityStep
            tone={state.tone}
            greetingMessage={state.greetingMessage}
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

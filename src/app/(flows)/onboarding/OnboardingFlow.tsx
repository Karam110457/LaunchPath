"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FlowShell } from "@/components/flows/FlowShell";
import { OptionCard } from "@/components/flows/OptionCard";
import { MultiOptionCard } from "@/components/flows/MultiOptionCard";
import { Button } from "@/components/ui/button";
import {
  ONBOARDING_STEPS,
  type OnboardingAnswers,
  type Blocker,
} from "@/types/onboarding";
import { submitOnboarding } from "@/app/actions/onboarding";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import type { Tables } from "@/types/database";

interface OnboardingFlowProps {
  existingProfile: Tables<"user_profiles"> | null;
}

const TOTAL_STEPS = ONBOARDING_STEPS.length;

export function OnboardingFlow({ existingProfile }: OnboardingFlowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({
    time_availability:
      (existingProfile?.time_availability as OnboardingAnswers["time_availability"]) ??
      undefined,
    outreach_comfort:
      (existingProfile?.outreach_comfort as OnboardingAnswers["outreach_comfort"]) ??
      undefined,
    technical_comfort:
      (existingProfile?.technical_comfort as OnboardingAnswers["technical_comfort"]) ??
      undefined,
    revenue_goal:
      (existingProfile?.revenue_goal as OnboardingAnswers["revenue_goal"]) ??
      undefined,
    current_situation:
      (existingProfile?.current_situation as OnboardingAnswers["current_situation"]) ??
      undefined,
    blockers: (existingProfile?.blockers as Blocker[]) ?? [],
  });
  const [error, setError] = useState<string | null>(null);

  const currentStepConfig = ONBOARDING_STEPS[step];
  const isLastStep = step === TOTAL_STEPS - 1;

  function handleSingleSelect(value: string) {
    setAnswers((prev) => ({ ...prev, [currentStepConfig.field]: value }));
  }

  function handleMultiToggle(value: string) {
    setAnswers((prev) => {
      const current = (prev.blockers ?? []) as Blocker[];
      const next = current.includes(value as Blocker)
        ? current.filter((v) => v !== value)
        : [...current, value as Blocker];
      return { ...prev, blockers: next };
    });
  }

  function canProceed(): boolean {
    if (currentStepConfig.type === "multi") {
      return (answers.blockers ?? []).length > 0;
    }
    return !!answers[currentStepConfig.field];
  }

  function handleNext() {
    if (!canProceed()) return;

    if (isLastStep) {
      setError(null);
      startTransition(async () => {
        const result = await submitOnboarding(
          answers as OnboardingAnswers
        );
        if (result.error) {
          setError(result.error);
        } else {
          router.push("/onboarding/complete");
        }
      });
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <FlowShell currentStep={step + 1} totalSteps={TOTAL_STEPS}>
      <div
        className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300"
        key={step}
      >
        {/* Question */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-serif font-light italic tracking-tight">
            {currentStepConfig.question}
          </h2>
          {currentStepConfig.type === "multi" && (
            <p className="text-sm text-muted-foreground">
              Select all that apply
            </p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentStepConfig.type === "single"
            ? currentStepConfig.options.map((opt) => (
                <OptionCard
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  description={
                    "description" in opt ? (opt.description as string) : undefined
                  }
                  selected={answers[currentStepConfig.field] === opt.value}
                  onSelect={handleSingleSelect}
                />
              ))
            : currentStepConfig.options.map((opt) => (
                <MultiOptionCard
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  selected={(answers.blockers ?? []).includes(
                    opt.value as Blocker
                  )}
                  onToggle={handleMultiToggle}
                />
              ))}
        </div>

        {/* Error */}
        {error && (
          <p
            className="text-sm text-red-400 bg-red-500/10 py-2 px-3 rounded-lg border border-red-500/20"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0 || isPending}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!canProceed() || isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isLastStep ? (
              "Complete"
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </FlowShell>
  );
}

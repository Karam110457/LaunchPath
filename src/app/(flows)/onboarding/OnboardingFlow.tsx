"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FlowShell } from "@/components/flows/FlowShell";
import { OptionCard } from "@/components/flows/OptionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ONBOARDING_STEPS,
  type OnboardingAnswers,
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
    location_city: existingProfile?.location_city ?? undefined,
    location_country: existingProfile?.location_country ?? undefined,
    current_situation:
      (existingProfile?.current_situation as OnboardingAnswers["current_situation"]) ??
      undefined,
    time_availability:
      (existingProfile?.time_availability as OnboardingAnswers["time_availability"]) ??
      undefined,
    revenue_goal:
      (existingProfile?.revenue_goal as OnboardingAnswers["revenue_goal"]) ??
      undefined,
  });
  const [error, setError] = useState<string | null>(null);

  const currentStepConfig = ONBOARDING_STEPS[step];
  const isLastStep = step === TOTAL_STEPS - 1;

  function handleSingleSelect(value: string) {
    setAnswers((prev) => ({ ...prev, [currentStepConfig.field]: value }));
  }

  function canProceed(): boolean {
    if (currentStepConfig.type === "location") {
      return !!(answers.location_city?.trim()) && !!(answers.location_country?.trim());
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
        </div>

        {/* Step content */}
        {currentStepConfig.type === "location" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                City
              </Label>
              <Input
                type="text"
                placeholder="e.g. Lagos"
                value={answers.location_city ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, location_city: e.target.value }))
                }
                className="h-12 rounded-xl border-border bg-card text-foreground text-sm focus-visible:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNext();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Country
              </Label>
              <Input
                type="text"
                placeholder="e.g. Nigeria"
                value={answers.location_country ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, location_country: e.target.value }))
                }
                className="h-12 rounded-xl border-border bg-card text-foreground text-sm focus-visible:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNext();
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {currentStepConfig.options?.map((opt) => (
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
            ))}
          </div>
        )}

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

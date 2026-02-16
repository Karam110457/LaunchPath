"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FlowShell } from "@/components/flows/FlowShell";
import { OptionCard } from "@/components/flows/OptionCard";
import { MultiOptionCard } from "@/components/flows/MultiOptionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { saveStartBusinessProgress } from "@/app/actions/start-business";
import type { Tables } from "@/types/database";
import type { StartBusinessAnswers, DirectionPath } from "@/types/start-business";
import {
  INTENT_OPTIONS,
  INDUSTRY_OPTIONS,
  WHAT_WENT_WRONG_OPTIONS,
  DELIVERY_MODEL_SIMPLE_OPTIONS,
  DELIVERY_MODEL_FULL_OPTIONS,
  PRICING_STANDARD_OPTIONS,
  PRICING_EXPANDED_OPTIONS,
  LOCATION_TARGET_OPTIONS,
  GROWTH_DIRECTION_OPTIONS,
} from "@/types/start-business";

type Profile = Tables<"user_profiles">;
type System = Tables<"user_systems">;

interface StartBusinessFlowProps {
  system: System;
  profile: Profile;
}

// Step definition for dynamic step sequence
interface StepDef {
  id: string;
  label: string;
}

function getDirectionPath(profile: Profile): DirectionPath {
  const situation = profile.current_situation;
  if (situation === "complete_beginner" || situation === "consumed_content") {
    return "beginner";
  }
  if (situation === "tried_no_clients") {
    return "stuck";
  }
  return "has_clients";
}

function computeSteps(
  profile: Profile,
  answers: Partial<StartBusinessAnswers>
): StepDef[] {
  const steps: StepDef[] = [];
  const directionPath = getDirectionPath(profile);

  // Step 1: Intent (always)
  steps.push({ id: "intent", label: "Goal" });

  // Step 2: Direction Finding (branches on profile)
  if (directionPath === "beginner") {
    steps.push({ id: "industry_interests", label: "Industries" });
    steps.push({ id: "own_idea", label: "Your idea" });
  } else if (directionPath === "stuck") {
    steps.push({ id: "tried_niche", label: "What you tried" });
    steps.push({ id: "what_went_wrong", label: "What happened" });
    steps.push({ id: "fix_or_pivot", label: "Direction" });
    // If they chose to pivot, add industry interests
    if (answers.growth_direction === "pivot") {
      steps.push({ id: "industry_interests", label: "Industries" });
    }
  } else {
    // has_clients
    steps.push({ id: "current_business", label: "Your business" });
    steps.push({ id: "growth_direction", label: "Growth" });
    // If they chose new niche, add industry interests
    if (answers.growth_direction === "new_niche") {
      steps.push({ id: "industry_interests", label: "Industries" });
    }
  }

  // Step 3: Delivery Model (conditional on time)
  if (profile.time_availability !== "under_5") {
    steps.push({ id: "delivery_model", label: "Delivery" });
  }

  // Step 4: Pricing Direction (conditional on revenue goal)
  if (
    profile.revenue_goal === "3k_5k" ||
    profile.revenue_goal === "5k_10k_plus"
  ) {
    steps.push({ id: "pricing_direction", label: "Pricing" });
  }

  // Step 5: Location (always)
  steps.push({ id: "location", label: "Location" });

  // Steps 6-10: AI Analysis through System Ready (mocked)
  steps.push({ id: "ai_analysis", label: "Analysis" });
  steps.push({ id: "results", label: "Results" });
  steps.push({ id: "offer_builder", label: "Your offer" });
  steps.push({ id: "system_generation", label: "Building" });
  steps.push({ id: "system_ready", label: "Ready" });

  return steps;
}

export function StartBusinessFlow({ system, profile }: StartBusinessFlowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<StartBusinessAnswers>>({
    intent: system.intent as StartBusinessAnswers["intent"] ?? null,
    direction_path: getDirectionPath(profile),
    industry_interests: system.industry_interests ?? [],
    own_idea: system.own_idea ?? null,
    tried_niche: system.tried_niche ?? null,
    what_went_wrong: system.what_went_wrong ?? null,
    current_niche: system.current_niche ?? null,
    current_clients: system.current_clients ?? null,
    current_pricing: system.current_pricing ?? null,
    growth_direction: system.growth_direction ?? null,
    delivery_model: system.delivery_model ?? null,
    pricing_direction: system.pricing_direction ?? null,
    location_city: system.location_city ?? null,
    location_target: system.location_target ?? null,
  });

  const steps = computeSteps(profile, answers);
  const currentStep = steps[stepIndex];
  const totalSteps = steps.length;
  const isLastInteractiveStep = currentStep?.id === "location";

  // Save progress on step transitions
  const saveProgress = useCallback(
    (nextStepIndex: number) => {
      startTransition(async () => {
        await saveStartBusinessProgress({
          system_id: system.id,
          current_step: nextStepIndex + 1,
          intent: answers.intent,
          direction_path: answers.direction_path,
          industry_interests: answers.industry_interests,
          own_idea: answers.own_idea,
          tried_niche: answers.tried_niche,
          what_went_wrong: answers.what_went_wrong,
          current_niche: answers.current_niche,
          current_clients: answers.current_clients,
          current_pricing: answers.current_pricing,
          growth_direction: answers.growth_direction,
          delivery_model: answers.delivery_model,
          pricing_direction: answers.pricing_direction,
          location_city: answers.location_city,
          location_target: answers.location_target,
        });
      });
    },
    [system.id, answers, startTransition]
  );

  function handleNext() {
    if (stepIndex < totalSteps - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      saveProgress(next);
    }
  }

  function handleBack() {
    if (stepIndex > 0) {
      setStepIndex((s) => s - 1);
    }
  }

  function updateAnswer<K extends keyof StartBusinessAnswers>(
    key: K,
    value: StartBusinessAnswers[K]
  ) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function canProceed(): boolean {
    if (!currentStep) return false;

    switch (currentStep.id) {
      case "intent":
        return !!answers.intent;
      case "industry_interests":
        return (answers.industry_interests ?? []).length > 0;
      case "own_idea":
        return true; // Can skip with "find me" option
      case "tried_niche":
        return !!answers.tried_niche;
      case "what_went_wrong":
        return !!answers.what_went_wrong;
      case "fix_or_pivot":
        return !!answers.growth_direction;
      case "current_business":
        return !!answers.current_niche;
      case "growth_direction":
        return !!answers.growth_direction;
      case "delivery_model":
        return !!answers.delivery_model;
      case "pricing_direction":
        return !!answers.pricing_direction;
      case "location":
        return !!answers.location_target;
      default:
        return true; // Mock steps always allow proceeding
    }
  }

  // Render the current step content
  function renderStep() {
    if (!currentStep) return null;

    switch (currentStep.id) {
      case "intent":
        return (
          <StepContent
            question="What's the goal for this system?"
          >
            <div className="space-y-3">
              {INTENT_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  selected={answers.intent === opt.value}
                  onSelect={(v) => updateAnswer("intent", v as StartBusinessAnswers["intent"])}
                />
              ))}
            </div>
          </StepContent>
        );

      case "industry_interests":
        return (
          <StepContent
            question="Any of these interest you? Pick up to 2."
            subtitle="This helps narrow down your best opportunities."
          >
            <div className="space-y-3">
              {INDUSTRY_OPTIONS.map((opt) => (
                <MultiOptionCard
                  key={opt.value}
                  value={opt.value}
                  label={`${opt.label} — ${opt.description}`}
                  selected={(answers.industry_interests ?? []).includes(opt.value)}
                  onToggle={(v) => {
                    const current = answers.industry_interests ?? [];
                    if (current.includes(v)) {
                      updateAnswer(
                        "industry_interests",
                        current.filter((x) => x !== v)
                      );
                    } else if (current.length < 2) {
                      updateAnswer("industry_interests", [...current, v]);
                    }
                  }}
                />
              ))}
            </div>
          </StepContent>
        );

      case "own_idea":
        return (
          <StepContent
            question="Do you already have a niche idea, or do you want me to find the best opportunity for you?"
          >
            <div className="space-y-4">
              <OptionCard
                value="find_me"
                label="Find me the best opportunity"
                description="AI recommends based on your profile and interests"
                selected={answers.own_idea === null || answers.own_idea === ""}
                onSelect={() => updateAnswer("own_idea", null)}
              />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="own-idea" className="text-sm text-muted-foreground">
                  I have an idea:
                </Label>
                <Input
                  id="own-idea"
                  placeholder="e.g., AI chatbot for dentists"
                  value={answers.own_idea ?? ""}
                  onChange={(e) => updateAnswer("own_idea", e.target.value || null)}
                  maxLength={500}
                />
              </div>
            </div>
          </StepContent>
        );

      case "tried_niche":
        return (
          <StepContent
            question="What niche have you been working in or exploring?"
          >
            <Input
              placeholder="e.g., HVAC companies, dental practices..."
              value={answers.tried_niche ?? ""}
              onChange={(e) => updateAnswer("tried_niche", e.target.value || null)}
              maxLength={200}
              className="text-base py-3"
            />
          </StepContent>
        );

      case "what_went_wrong":
        return (
          <StepContent
            question="What's been the biggest challenge?"
          >
            <div className="space-y-3">
              {WHAT_WENT_WRONG_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  selected={answers.what_went_wrong === opt.value}
                  onSelect={(v) => updateAnswer("what_went_wrong", v)}
                />
              ))}
            </div>
          </StepContent>
        );

      case "fix_or_pivot":
        return (
          <StepContent
            question="Do you want to:"
          >
            <div className="space-y-3">
              <OptionCard
                value="fix"
                label={`Fix what I was doing in ${answers.tried_niche || "my niche"}`}
                description="AI diagnoses and rebuilds your approach"
                selected={answers.growth_direction === "fix"}
                onSelect={() => updateAnswer("growth_direction", "fix")}
              />
              <OptionCard
                value="pivot"
                label="Try a completely different niche"
                description="Start fresh with AI-guided niche discovery"
                selected={answers.growth_direction === "pivot"}
                onSelect={() => updateAnswer("growth_direction", "pivot")}
              />
            </div>
          </StepContent>
        );

      case "current_business":
        return (
          <StepContent
            question="Tell me about your current setup."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  What niche are you in?
                </Label>
                <Input
                  placeholder="e.g., Real estate agents"
                  value={answers.current_niche ?? ""}
                  onChange={(e) => updateAnswer("current_niche", e.target.value || null)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  How many clients do you have?
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={answers.current_clients === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateAnswer("current_clients", n)}
                    >
                      {n === 5 ? "5+" : n}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  What do you charge per month?
                </Label>
                <Input
                  placeholder="e.g., £800/month"
                  value={answers.current_pricing ?? ""}
                  onChange={(e) => updateAnswer("current_pricing", e.target.value || null)}
                  maxLength={200}
                />
              </div>
            </div>
          </StepContent>
        );

      case "growth_direction":
        return (
          <StepContent
            question="What do you want to do?"
          >
            <div className="space-y-3">
              {GROWTH_DIRECTION_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  selected={answers.growth_direction === opt.value}
                  onSelect={(v) => updateAnswer("growth_direction", v)}
                />
              ))}
            </div>
          </StepContent>
        );

      case "delivery_model": {
        const isSimple = profile.time_availability === "5_to_15";
        const options = isSimple
          ? DELIVERY_MODEL_SIMPLE_OPTIONS
          : DELIVERY_MODEL_FULL_OPTIONS;
        const question = isSimple
          ? "With your time, would you rather:"
          : "How do you want to deliver your service?";

        return (
          <StepContent question={question}>
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  description={opt.description}
                  selected={answers.delivery_model === opt.value}
                  onSelect={(v) => updateAnswer("delivery_model", v)}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      case "pricing_direction": {
        const isExpanded = profile.revenue_goal === "5k_10k_plus";
        const options = isExpanded
          ? PRICING_EXPANDED_OPTIONS
          : PRICING_STANDARD_OPTIONS;
        const question = isExpanded
          ? "How do you want to structure your pricing?"
          : "For pricing, do you lean toward:";

        return (
          <StepContent question={question}>
            <div className="space-y-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  selected={answers.pricing_direction === opt.value}
                  onSelect={(v) => updateAnswer("pricing_direction", v)}
                />
              ))}
            </div>
          </StepContent>
        );
      }

      case "location":
        return (
          <StepContent
            question="Where are you based? And where do you want to find clients?"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Your location
                </Label>
                <Input
                  placeholder="e.g., Manchester, UK"
                  value={answers.location_city ?? ""}
                  onChange={(e) => updateAnswer("location_city", e.target.value || null)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">
                  Target clients in:
                </Label>
                {LOCATION_TARGET_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={answers.location_target === opt.value}
                    onSelect={(v) => updateAnswer("location_target", v)}
                  />
                ))}
              </div>
            </div>
          </StepContent>
        );

      // --- MOCK STEPS (6-10) ---
      case "ai_analysis":
        return <AIAnalysisMock />;

      case "results":
        return <ResultsMock onNext={handleNext} />;

      case "offer_builder":
        return <OfferBuilderMock onNext={handleNext} />;

      case "system_generation":
        return <SystemGenerationMock />;

      case "system_ready":
        return <SystemReadyMock onDashboard={() => router.push("/dashboard")} />;

      default:
        return null;
    }
  }

  // For mock steps, some have their own navigation
  const isMockStep = [
    "ai_analysis",
    "results",
    "offer_builder",
    "system_generation",
    "system_ready",
  ].includes(currentStep?.id ?? "");

  return (
    <FlowShell
      currentStep={stepIndex + 1}
      totalSteps={totalSteps}
    >
      <div
        className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300"
        key={`${currentStep?.id}-${stepIndex}`}
      >
        {renderStep()}

        {/* Navigation (hidden for mock steps that have their own) */}
        {!isMockStep && (
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={stepIndex === 0 || isPending}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </FlowShell>
  );
}

// --- Shared step layout ---
function StepContent({
  question,
  subtitle,
  children,
}: {
  question: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-serif font-light italic tracking-tight">
          {question}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </>
  );
}

// --- MOCK COMPONENTS for Steps 6-10 ---

function AIAnalysisMock() {
  const [progress, setProgress] = useState(0);
  const steps = [
    "Analysing your profile",
    "Scanning 70+ validated niches",
    "Scoring market opportunities",
    "Identifying bottlenecks",
    "Evaluating segment fit",
    "Calculating revenue potential",
    "Building recommendations",
  ];

  useState(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setProgress(i);
      if (i >= steps.length) clearInterval(interval);
    }, 2000);
    return () => clearInterval(interval);
  });

  return (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <Sparkles className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-serif italic">Finding your opportunity...</h2>
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-3 text-sm">
            {i < progress ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : i === progress ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded border border-muted-foreground/30 shrink-0" />
            )}
            <span
              className={
                i < progress
                  ? "text-foreground"
                  : i === progress
                    ? "text-primary"
                    : "text-muted-foreground"
              }
            >
              {step}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-center text-muted-foreground pt-4">
        This is a preview — AI analysis will be connected soon.
      </p>
    </div>
  );
}

function ResultsMock({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif italic">Your top recommendation</h2>
      <Card className="border-primary/30">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              #1 Recommended
            </span>
            <span className="text-sm font-mono text-muted-foreground">87/100</span>
          </div>
          <h3 className="text-lg font-medium">Window Cleaning Lead System</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Who you help:</span>{" "}
              Residential window cleaners doing £10–30k/month
            </p>
            <p>
              <span className="font-medium text-foreground">Problem you solve:</span>{" "}
              Can&apos;t generate consistent leads without relying on word of mouth
            </p>
            <p>
              <span className="font-medium text-foreground">Revenue:</span>{" "}
              £500–1,500/mo per client
            </p>
          </div>
          <p className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3">
            &ldquo;This niche has a fast close cycle because the demo sells itself.
            With your profile, you can realistically serve 2–3 clients in month 1.&rdquo;
          </p>
        </CardContent>
      </Card>
      <p className="text-xs text-center text-muted-foreground">
        AI-powered recommendations coming soon. This is sample data.
      </p>
      <Button className="w-full" onClick={onNext}>
        Choose This Niche
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

function OfferBuilderMock({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif italic">Your complete offer</h2>
      <Card>
        <CardContent className="pt-6 space-y-3 text-sm">
          <div className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Niche</span>
            <span className="font-medium">Window cleaning companies</span>
          </div>
          <div className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Segment</span>
            <span className="font-medium">£10–30k/month residential</span>
          </div>
          <div className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">AI Lead Qualification System</span>
          </div>
          <div className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Pricing</span>
            <span className="font-medium">£500/month</span>
          </div>
          <div className="flex justify-between pb-2">
            <span className="text-muted-foreground">Guarantee</span>
            <span className="font-medium">10 leads in 30 days or free</span>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-center text-muted-foreground">
        The full offer builder with AI will be interactive. This is a preview.
      </p>
      <Button className="w-full" onClick={onNext}>
        Build My System
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

function SystemGenerationMock() {
  const [progress, setProgress] = useState(0);
  const steps = [
    "Creating your AI agent",
    "Building your demo page",
    "Generating niche-specific form",
    "Configuring lead scoring",
    "Setting up tracking",
    "Finding prospects",
    "Writing personalised messages",
  ];

  useState(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setProgress(i);
      if (i >= steps.length) clearInterval(interval);
    }, 2500);
    return () => clearInterval(interval);
  });

  return (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <Sparkles className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-serif italic">Building your system...</h2>
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-3 text-sm">
            {i < progress ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : i === progress ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded border border-muted-foreground/30 shrink-0" />
            )}
            <span
              className={
                i < progress
                  ? "text-foreground"
                  : i === progress
                    ? "text-primary"
                    : "text-muted-foreground"
              }
            >
              {step}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-center text-muted-foreground pt-4">
        System generation will be connected to the AI pipeline soon.
      </p>
    </div>
  );
}

function SystemReadyMock({
  onDashboard,
}: {
  onDashboard: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-serif italic">Your system is ready!</h2>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Demo Page</h4>
            <p className="text-sm font-mono text-primary">
              demo.launchpath.ai/you/window-clean-87
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Prospects Found</h4>
            <p className="text-sm">25 prospects in your target area</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Messages Ready</h4>
            <p className="text-sm">25 personalised messages</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">What to do now:</h3>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Try your own demo (click link above)</li>
          <li>Copy your first message</li>
          <li>Send it on LinkedIn</li>
          <li>Watch your dashboard for engagement</li>
        </ol>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Demo page, prospects, and messages will be real once AI is connected.
      </p>

      <Button className="w-full" onClick={onDashboard}>
        Go to Dashboard
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

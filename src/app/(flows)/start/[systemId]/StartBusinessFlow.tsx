"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FlowShell } from "@/components/flows/FlowShell";
import { OptionCard } from "@/components/flows/OptionCard";
import { MultiOptionCard } from "@/components/flows/MultiOptionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sparkles,
  Target,
  TrendingUp,
  Search,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { saveStartBusinessProgress } from "@/app/actions/start-business";
import { runNicheAnalysis, chooseRecommendation } from "@/app/actions/ai-analyze";
import { generateOfferDetails } from "@/app/actions/generate-offer";
import { generateSystem } from "@/app/actions/generate-system";
import { saveOffer } from "@/app/actions/save-offer";
import type { Tables } from "@/types/database";
import type {
  StartBusinessAnswers,
  DirectionPath,
  AIRecommendation,
  Offer,
} from "@/types/start-business";
import {
  INDUSTRY_OPTIONS,
  WHAT_WENT_WRONG_OPTIONS,
  LOCATION_TARGET_OPTIONS,
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
  if (situation === "tried_before") {
    return "stuck";
  }
  return "beginner";
}

function computeSteps(
  profile: Profile,
  answers: Partial<StartBusinessAnswers>
): StepDef[] {
  const steps: StepDef[] = [];
  const directionPath = getDirectionPath(profile);

  // Direction Finding (branches on profile)
  if (directionPath === "beginner") {
    steps.push({ id: "industry_interests", label: "Industries" });
    steps.push({ id: "own_idea", label: "Your idea" });
  } else {
    // stuck (tried_before)
    steps.push({ id: "tried_niche", label: "What you tried" });
    steps.push({ id: "what_went_wrong", label: "What happened" });
    steps.push({ id: "fix_or_pivot", label: "Direction" });
    // If they chose to pivot, add industry interests
    if (answers.growth_direction === "pivot") {
      steps.push({ id: "industry_interests", label: "Industries" });
    }
  }

  // Location (always)
  steps.push({ id: "location", label: "Location" });

  // AI Analysis through System Ready
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
    direction_path: getDirectionPath(profile),
    industry_interests: system.industry_interests ?? [],
    own_idea: system.own_idea ?? null,
    tried_niche: system.tried_niche ?? null,
    what_went_wrong: system.what_went_wrong ?? null,
    growth_direction: system.growth_direction ?? null,
    location_city: system.location_city ?? null,
    location_target: system.location_target ?? null,
  });

  // AI state
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[] | null>(
    (system.ai_recommendations as AIRecommendation[] | null) ?? null
  );
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);

  // Offer builder state (Step 8 sub-steps)
  const [offerSubStep, setOfferSubStep] = useState(0);
  const [offerData, setOfferData] = useState<Partial<Offer>>({
    segment: "",
    transformation_from: "",
    transformation_to: "",
    system_description: "",
    pricing_setup: 0,
    pricing_monthly: 0,
    guarantee: "",
    delivery_model: "build_once",
  });
  const [offerAiLoaded, setOfferAiLoaded] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  // Chosen recommendation (from step 7)
  const [chosenRec, setChosenRec] = useState<AIRecommendation | null>(
    (system.chosen_recommendation as AIRecommendation | null) ?? null
  );

  // System generation state (Step 9)
  const [demoUrl, setDemoUrl] = useState<string | null>(system.demo_url);
  const [systemError, setSystemError] = useState<string | null>(null);

  const steps = computeSteps(profile, answers);
  const currentStep = steps[stepIndex];
  const totalSteps = steps.length;

  // Save progress on step transitions
  const saveProgress = useCallback(
    (nextStepIndex: number) => {
      startTransition(async () => {
        await saveStartBusinessProgress({
          system_id: system.id,
          current_step: nextStepIndex + 1,
          direction_path: answers.direction_path,
          industry_interests: answers.industry_interests,
          own_idea: answers.own_idea,
          tried_niche: answers.tried_niche,
          what_went_wrong: answers.what_went_wrong,
          growth_direction: answers.growth_direction,
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
      case "location":
        return !!answers.location_target;
      default:
        return true;
    }
  }

  // Render the current step content
  function renderStep() {
    if (!currentStep) return null;

    switch (currentStep.id) {
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

      // --- AI STEPS (6-7) + MOCK STEPS (8-10) ---
      case "ai_analysis":
        return (
          <AIAnalysisStep
            systemId={system.id}
            isAnalysing={isAnalysing}
            error={aiError}
            onStart={() => {
              setAiError(null);
              setIsAnalysing(true);
              startTransition(async () => {
                const result = await runNicheAnalysis(system.id);
                setIsAnalysing(false);
                if (result.error) {
                  setAiError(result.error);
                } else {
                  setAiRecommendations(result.recommendations);
                  setAiReasoning(result.reasoning);
                  // Auto-advance to results
                  const next = stepIndex + 1;
                  setStepIndex(next);
                  saveProgress(next);
                }
              });
            }}
            onRetry={() => {
              setAiError(null);
              setIsAnalysing(true);
              startTransition(async () => {
                const result = await runNicheAnalysis(system.id);
                setIsAnalysing(false);
                if (result.error) {
                  setAiError(result.error);
                } else {
                  setAiRecommendations(result.recommendations);
                  setAiReasoning(result.reasoning);
                  const next = stepIndex + 1;
                  setStepIndex(next);
                  saveProgress(next);
                }
              });
            }}
          />
        );

      case "results":
        return (
          <ResultsStep
            recommendations={aiRecommendations}
            reasoning={aiReasoning}
            onChoose={(rec) => {
              startTransition(async () => {
                const result = await chooseRecommendation(system.id, rec);
                if (!result.error) {
                  setChosenRec(rec);
                  handleNext();
                }
              });
            }}
            isPending={isPending}
          />
        );

      case "offer_builder":
        return (
          <OfferBuilderStep
            systemId={system.id}
            profile={profile}
            chosenRec={chosenRec}
            offerSubStep={offerSubStep}
            setOfferSubStep={setOfferSubStep}
            offerData={offerData}
            setOfferData={setOfferData}
            offerAiLoaded={offerAiLoaded}
            setOfferAiLoaded={setOfferAiLoaded}
            offerError={offerError}
            setOfferError={setOfferError}
            answers={answers}
            onBuild={() => {
              startTransition(async () => {
                const result = await saveOffer(system.id, offerData);
                if (result.error) {
                  setOfferError(result.error);
                } else {
                  handleNext();
                }
              });
            }}
            isPending={isPending}
          />
        );

      case "system_generation":
        return (
          <SystemGenerationStep
            systemId={system.id}
            systemError={systemError}
            setSystemError={setSystemError}
            setDemoUrl={setDemoUrl}
            onComplete={handleNext}
          />
        );

      case "system_ready":
        return (
          <SystemReadyStep
            demoUrl={demoUrl}
            offerData={offerData}
            onDashboard={() => router.push("/dashboard")}
          />
        );

      default:
        return null;
    }
  }

  // These steps manage their own navigation
  const hasOwnNavigation = [
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

        {/* Navigation (hidden for steps that manage their own) */}
        {!hasOwnNavigation && (
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

// --- REAL AI COMPONENTS for Steps 6-7 ---

function AIAnalysisStep({
  systemId,
  isAnalysing,
  error,
  onStart,
  onRetry,
}: {
  systemId: string;
  isAnalysing: boolean;
  error: string | null;
  onStart: () => void;
  onRetry: () => void;
}) {
  const [progressIndex, setProgressIndex] = useState(0);
  const hasStarted = useRef(false);

  const progressSteps = [
    "Analysing your profile",
    "Scanning 70+ validated niches",
    "Scoring market opportunities",
    "Identifying bottlenecks",
    "Evaluating segment fit",
    "Calculating revenue potential",
    "Building recommendations",
  ];

  // Auto-start analysis on mount
  useEffect(() => {
    if (!hasStarted.current && !error) {
      hasStarted.current = true;
      onStart();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate progress steps while analysing
  useEffect(() => {
    if (!isAnalysing) return;
    setProgressIndex(0);
    const interval = setInterval(() => {
      setProgressIndex((prev) => {
        if (prev >= progressSteps.length - 1) return prev;
        return prev + 1;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isAnalysing, progressSteps.length]);

  if (error) {
    return (
      <div className="space-y-6 py-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-serif italic">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
        <div className="flex justify-center">
          <Button onClick={onRetry}>
            Try Again
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <Sparkles className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-serif italic">Finding your opportunity...</h2>
        <p className="text-sm text-muted-foreground mt-2">
          AI is analysing your profile against 70+ validated niches
        </p>
      </div>
      <div className="space-y-3">
        {progressSteps.map((step, i) => (
          <div key={step} className="flex items-center gap-3 text-sm">
            {i < progressIndex ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : i === progressIndex ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded border border-muted-foreground/30 shrink-0" />
            )}
            <span
              className={
                i < progressIndex
                  ? "text-foreground"
                  : i === progressIndex
                    ? "text-primary"
                    : "text-muted-foreground"
              }
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Score bar component ---
function ScoreBar({
  label,
  score,
  maxScore,
  icon,
}: {
  label: string;
  score: number;
  maxScore: number;
  icon: React.ReactNode;
}) {
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-mono font-medium">{score}/{maxScore}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// --- Recommendation card ---
function RecommendationCard({
  rec,
  rank,
  isOnly,
  onChoose,
  isPending,
}: {
  rec: AIRecommendation;
  rank: number;
  isOnly: boolean;
  onChoose: () => void;
  isPending: boolean;
}) {
  return (
    <Card className={rank === 1 ? "border-primary/30" : ""}>
      <CardContent className="pt-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">
            {isOnly ? "Your best path" : `#${rank} Recommended`}
          </span>
          <span className="text-sm font-mono text-muted-foreground">
            {rec.score}/100
          </span>
        </div>

        {/* Niche name */}
        <h3 className="text-lg font-medium">{rec.niche}</h3>

        {/* Score bars */}
        <div className="space-y-3">
          <ScoreBar
            label="ROI from service"
            score={rec.segment_scores.roi_from_service}
            maxScore={25}
            icon={<TrendingUp className="h-3 w-3" />}
          />
          <ScoreBar
            label="Can afford it"
            score={rec.segment_scores.can_afford_it}
            maxScore={25}
            icon={<Target className="h-3 w-3" />}
          />
          <ScoreBar
            label="Can guarantee results"
            score={rec.segment_scores.guarantee_results}
            maxScore={25}
            icon={<CheckCircle2 className="h-3 w-3" />}
          />
          <ScoreBar
            label="Easy to find"
            score={rec.segment_scores.easy_to_find}
            maxScore={25}
            icon={<Search className="h-3 w-3" />}
          />
        </div>

        {/* Key info */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Who you help:</span>{" "}
            {rec.target_segment.description}
          </p>
          <p>
            <span className="font-medium text-foreground">Problem you solve:</span>{" "}
            {rec.bottleneck}
          </p>
          <p>
            <span className="font-medium text-foreground">Your solution:</span>{" "}
            {rec.your_solution}
          </p>
          <p>
            <span className="font-medium text-foreground">Revenue:</span>{" "}
            {rec.revenue_potential.per_client}/client, {rec.revenue_potential.target_clients} clients
            in month 1-2 = {rec.revenue_potential.monthly_total}/mo
          </p>
          <p>
            <span className="font-medium text-foreground">How to find them:</span>{" "}
            {rec.ease_of_finding}
          </p>
        </div>

        {/* Strategic insight */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <p className="font-medium text-foreground text-xs uppercase tracking-wider mb-1">
            Strategic insight
          </p>
          <p className="text-muted-foreground">{rec.strategic_insight}</p>
        </div>

        {/* Why this fits YOU */}
        <p className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3">
          &ldquo;{rec.why_for_you}&rdquo;
        </p>

        {/* CTA */}
        <Button className="w-full" onClick={onChoose} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Choose This Niche
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function ResultsStep({
  recommendations,
  reasoning,
  onChoose,
  isPending,
}: {
  recommendations: AIRecommendation[] | null;
  reasoning: string | null;
  onChoose: (rec: AIRecommendation) => void;
  isPending: boolean;
}) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="space-y-6 py-8 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">
          No recommendations available. Please go back and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-serif font-light italic tracking-tight">
          Your top {recommendations.length} opportunities
        </h2>
        <p className="text-sm text-muted-foreground">
          Each scored against ROI, affordability, deliverability, and reach.
          Pick the one that resonates most.
        </p>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, i) => (
          <RecommendationCard
            key={rec.niche}
            rec={rec}
            rank={i + 1}
            isOnly={false}
            onChoose={() => onChoose(rec)}
            isPending={isPending}
          />
        ))}
      </div>

      {reasoning && (
        <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground text-xs uppercase tracking-wider mb-1">
            Why these niches
          </p>
          <p>{reasoning}</p>
        </div>
      )}
    </div>
  );
}

// --- Pricing calculation (deterministic from profile) ---
function calculatePricing(
  revenueGoal: string | null,
  pricingDirection: string | null
): { setup: number; monthly: number } {
  if (revenueGoal === "500_1k") return { setup: 0, monthly: 400 };
  if (revenueGoal === "1k_3k") return { setup: 300, monthly: 600 };

  if (revenueGoal === "3k_5k") {
    if (pricingDirection === "fewer_high_ticket") return { setup: 500, monthly: 1500 };
    return { setup: 300, monthly: 500 };
  }

  if (revenueGoal === "5k_10k_plus") {
    if (pricingDirection === "monthly_retainer") return { setup: 800, monthly: 2000 };
    if (pricingDirection === "base_plus_percentage") return { setup: 500, monthly: 500 };
    if (pricingDirection === "volume_play") return { setup: 200, monthly: 400 };
    return { setup: 500, monthly: 1200 };
  }

  return { setup: 300, monthly: 600 };
}

// --- Offer summary row ---
function OfferSummaryRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value?: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${
        !isLast ? "border-b border-border/50 pb-2" : ""
      }`}
    >
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

// --- STEP 8: Offer Builder (5 sub-steps) ---
function OfferBuilderStep({
  systemId,
  profile,
  chosenRec,
  offerSubStep,
  setOfferSubStep,
  offerData,
  setOfferData,
  offerAiLoaded,
  setOfferAiLoaded,
  offerError,
  setOfferError,
  answers,
  onBuild,
  isPending,
}: {
  systemId: string;
  profile: Profile;
  chosenRec: AIRecommendation | null;
  offerSubStep: number;
  setOfferSubStep: React.Dispatch<React.SetStateAction<number>>;
  offerData: Partial<Offer>;
  setOfferData: React.Dispatch<React.SetStateAction<Partial<Offer>>>;
  offerAiLoaded: boolean;
  setOfferAiLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  offerError: string | null;
  setOfferError: React.Dispatch<React.SetStateAction<string | null>>;
  answers: Partial<StartBusinessAnswers>;
  onBuild: () => void;
  isPending: boolean;
}) {
  const hasLoaded = useRef(false);

  // Auto-load AI content + calculate pricing on mount
  useEffect(() => {
    if (hasLoaded.current || offerAiLoaded) return;
    hasLoaded.current = true;

    // Set initial data from context while AI loads
    setOfferData((prev) => ({
      ...prev,
      segment: chosenRec?.target_segment.description ?? "",
      delivery_model: "build_once",
    }));

    generateOfferDetails(systemId).then((result) => {
      if (result.error) {
        setOfferError(result.error);
      } else if (result.offer) {
        setOfferData((prev) => ({
          ...prev,
          transformation_from: result.offer!.transformation_from ?? "",
          transformation_to: result.offer!.transformation_to ?? "",
          system_description: result.offer!.system_description ?? "",
          guarantee: result.offer!.guarantee_text ?? "",
          pricing_setup: result.offer!.pricing_setup,
          pricing_monthly: result.offer!.pricing_monthly,
          segment: result.offer!.segment ?? prev.segment,
          delivery_model: result.offer!.delivery_model ?? prev.delivery_model,
          // Extended fields
          guarantee_type: result.offer!.guarantee_type,
          guarantee_confidence: result.offer!.guarantee_confidence,
          pricing_rationale: result.offer!.pricing_rationale,
          pricing_comparables: result.offer!.pricing_comparables,
          revenue_projection: result.offer!.revenue_projection,
          validation_status: result.offer!.validation_status,
          validation_notes: result.offer!.validation_notes,
        }));
        setOfferAiLoaded(true);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function updateField<K extends keyof Offer>(key: K, value: Offer[K]) {
    setOfferData((prev) => ({ ...prev, [key]: value }));
  }

  function nextSub() {
    setOfferSubStep((s) => Math.min(s + 1, 4));
  }
  function prevSub() {
    setOfferSubStep((s) => Math.max(s - 1, 0));
  }

  const subLabels = ["Segment", "Transformation", "Pricing", "Guarantee", "Summary"];

  return (
    <div className="space-y-6">
      {/* Sub-step indicator */}
      <p className="text-xs text-muted-foreground">
        Step {offerSubStep + 1} of 5 — {subLabels[offerSubStep]}
      </p>

      {/* 8a: Segment confirmation */}
      {offerSubStep === 0 && (
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-serif font-light italic tracking-tight">
            Who you&apos;re helping
          </h2>
          <p className="text-sm text-muted-foreground">
            Based on the analysis, here&apos;s your target segment. Edit if needed.
          </p>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Target segment
                </Label>
                <Input
                  value={offerData.segment ?? ""}
                  onChange={(e) => updateField("segment", e.target.value)}
                  className="mt-1"
                />
              </div>
              {chosenRec && (
                <p className="text-sm text-muted-foreground italic">
                  {chosenRec.target_segment.why}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 8b: Transformation */}
      {offerSubStep === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-serif font-light italic tracking-tight">
            The transformation you deliver
          </h2>
          {!offerAiLoaded && !offerError ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI is crafting your transformation copy...</span>
            </div>
          ) : offerError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{offerError}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setOfferError(null);
                  hasLoaded.current = false;
                }}
              >
                Try again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Where they are now (the problem)
                </Label>
                <Textarea
                  value={offerData.transformation_from ?? ""}
                  onChange={(e) =>
                    updateField("transformation_from", e.target.value)
                  }
                  rows={2}
                />
              </div>
              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Where they&apos;ll be (the result)
                </Label>
                <Textarea
                  value={offerData.transformation_to ?? ""}
                  onChange={(e) =>
                    updateField("transformation_to", e.target.value)
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Your system (what you deliver)
                </Label>
                <Textarea
                  value={offerData.system_description ?? ""}
                  onChange={(e) =>
                    updateField("system_description", e.target.value)
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8c: Pricing */}
      {offerSubStep === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-serif font-light italic tracking-tight">
            Your pricing
          </h2>
          <p className="text-sm text-muted-foreground">
            Pre-calculated from your revenue goal. Adjust if needed.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Setup fee</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  £
                </span>
                <Input
                  type="number"
                  value={offerData.pricing_setup ?? 0}
                  onChange={(e) =>
                    updateField("pricing_setup", parseInt(e.target.value) || 0)
                  }
                  className="pl-7"
                  min={0}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Monthly</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  £
                </span>
                <Input
                  type="number"
                  value={offerData.pricing_monthly ?? 0}
                  onChange={(e) =>
                    updateField(
                      "pricing_monthly",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="pl-7"
                  min={0}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                /month per client
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 8d: Guarantee */}
      {offerSubStep === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-serif font-light italic tracking-tight">
            Your guarantee
          </h2>
          <p className="text-sm text-muted-foreground">
            A strong guarantee eliminates risk for your prospect. Edit or skip.
          </p>
          {!offerAiLoaded && !offerError ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground py-4 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating your guarantee...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={offerData.guarantee ?? ""}
                onChange={(e) => updateField("guarantee", e.target.value)}
                rows={3}
                placeholder="e.g., 10 qualified leads in 30 days or your money back"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateField("guarantee", "")}
                className="text-xs text-muted-foreground"
              >
                Skip guarantee for now
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 8e: Summary */}
      {offerSubStep === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-serif font-light italic tracking-tight">
            Your complete offer
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-3 text-sm">
              <OfferSummaryRow label="Segment" value={offerData.segment} />
              <OfferSummaryRow
                label="From"
                value={offerData.transformation_from}
              />
              <OfferSummaryRow
                label="To"
                value={offerData.transformation_to}
              />
              <OfferSummaryRow
                label="System"
                value={offerData.system_description}
              />
              <OfferSummaryRow
                label="Pricing"
                value={
                  offerData.pricing_setup
                    ? `£${offerData.pricing_setup} setup + £${offerData.pricing_monthly}/month`
                    : `£${offerData.pricing_monthly}/month`
                }
              />
              {offerData.guarantee ? (
                <OfferSummaryRow
                  label="Guarantee"
                  value={offerData.guarantee}
                  isLast
                />
              ) : (
                <OfferSummaryRow
                  label="Guarantee"
                  value="None (you can add one later)"
                  isLast
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sub-step navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="ghost"
          onClick={prevSub}
          disabled={offerSubStep === 0}
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {offerSubStep < 4 ? (
          <Button
            onClick={nextSub}
            disabled={
              offerSubStep === 1 && !offerAiLoaded && !offerError
            }
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={onBuild} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Build My System
                <Sparkles className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// --- STEP 9: System Generation ---
function SystemGenerationStep({
  systemId,
  systemError,
  setSystemError,
  setDemoUrl,
  onComplete,
}: {
  systemId: string;
  systemError: string | null;
  setSystemError: React.Dispatch<React.SetStateAction<string | null>>;
  setDemoUrl: React.Dispatch<React.SetStateAction<string | null>>;
  onComplete: () => void;
}) {
  const [progressIndex, setProgressIndex] = useState(0);
  const hasStarted = useRef(false);

  const progressSteps = [
    "Mapping your niche agent",
    "Generating demo page",
    "Building lead qualification form",
    "Configuring scoring rules",
    "Creating your unique URL",
  ];

  // Auto-start system generation
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    generateSystem(systemId).then((result) => {
      if (result.error) {
        setSystemError(result.error);
      } else {
        setDemoUrl(result.demo_url);
        setTimeout(() => onComplete(), 1500);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate progress steps
  useEffect(() => {
    if (systemError) return;
    const interval = setInterval(() => {
      setProgressIndex((prev) => {
        if (prev >= progressSteps.length - 1) return prev;
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [systemError, progressSteps.length]);

  if (systemError) {
    return (
      <div className="space-y-6 py-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-serif italic">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mt-2">{systemError}</p>
        </div>
        <div className="flex justify-center">
          <Button
            onClick={() => {
              setSystemError(null);
              hasStarted.current = false;
            }}
          >
            Try Again
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <Sparkles className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-serif italic">Building your system...</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Creating your AI-powered demo page
        </p>
      </div>
      <div className="space-y-3">
        {progressSteps.map((step, i) => (
          <div key={step} className="flex items-center gap-3 text-sm">
            {i < progressIndex ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : i === progressIndex ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded border border-muted-foreground/30 shrink-0" />
            )}
            <span
              className={
                i < progressIndex
                  ? "text-foreground"
                  : i === progressIndex
                    ? "text-primary"
                    : "text-muted-foreground"
              }
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- STEP 10: System Ready ---
function SystemReadyStep({
  demoUrl,
  offerData,
  onDashboard,
}: {
  demoUrl: string | null;
  offerData: Partial<Offer>;
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
            <h4 className="text-sm font-medium text-muted-foreground">
              Your Demo Page
            </h4>
            {demoUrl ? (
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-primary hover:underline flex items-center gap-1.5"
              >
                {demoUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">
                URL will be available shortly
              </p>
            )}
          </div>
          {offerData.segment && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Your Offer
              </h4>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Segment:</span>{" "}
                  {offerData.segment}
                </p>
                <p>
                  <span className="text-muted-foreground">Pricing:</span>{" "}
                  {offerData.pricing_setup
                    ? `£${offerData.pricing_setup} setup + £${offerData.pricing_monthly}/mo`
                    : `£${offerData.pricing_monthly}/mo`}
                </p>
                {offerData.guarantee && (
                  <p>
                    <span className="text-muted-foreground">Guarantee:</span>{" "}
                    {offerData.guarantee}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">What to do now:</h3>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Try your own demo page (click the link above)</li>
          <li>Share it with a prospect to see real results</li>
          <li>Check your dashboard for submissions</li>
        </ol>
      </div>

      <Button className="w-full" onClick={onDashboard}>
        Go to Dashboard
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

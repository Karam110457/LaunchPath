"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OptionCard } from "@/components/flows/OptionCard";
import { MultiOptionCard } from "@/components/flows/MultiOptionCard";
import {
  TIME_AVAILABILITY_OPTIONS,
  OUTREACH_COMFORT_OPTIONS,
  TECHNICAL_COMFORT_OPTIONS,
  REVENUE_GOAL_OPTIONS,
  CURRENT_SITUATION_OPTIONS,
  BLOCKER_OPTIONS,
  ONBOARDING_STEPS,
  type OnboardingAnswers,
  type Blocker,
} from "@/types/onboarding";
import { updateProfile } from "@/app/actions/update-profile";
import type { Tables } from "@/types/database";
import { Edit2, Save, X, Loader2 } from "lucide-react";

interface OnboardingProfileCardProps {
  profile: Tables<"user_profiles">;
}

function getLabel(
  options: readonly { readonly value: string; readonly label: string }[],
  value: string | null
): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

export function OnboardingProfileCard({ profile }: OnboardingProfileCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({
    time_availability:
      (profile.time_availability as OnboardingAnswers["time_availability"]) ?? undefined,
    outreach_comfort:
      (profile.outreach_comfort as OnboardingAnswers["outreach_comfort"]) ?? undefined,
    technical_comfort:
      (profile.technical_comfort as OnboardingAnswers["technical_comfort"]) ?? undefined,
    revenue_goal:
      (profile.revenue_goal as OnboardingAnswers["revenue_goal"]) ?? undefined,
    current_situation:
      (profile.current_situation as OnboardingAnswers["current_situation"]) ?? undefined,
    blockers: (profile.blockers as Blocker[]) ?? [],
  });

  const summaryItems = [
    {
      label: "Time availability",
      value: getLabel(TIME_AVAILABILITY_OPTIONS, profile.time_availability),
    },
    {
      label: "Outreach comfort",
      value: getLabel(OUTREACH_COMFORT_OPTIONS, profile.outreach_comfort),
    },
    {
      label: "Technical comfort",
      value: getLabel(TECHNICAL_COMFORT_OPTIONS, profile.technical_comfort),
    },
    {
      label: "Revenue goal",
      value: getLabel(REVENUE_GOAL_OPTIONS, profile.revenue_goal),
    },
    {
      label: "Current situation",
      value: getLabel(CURRENT_SITUATION_OPTIONS, profile.current_situation),
    },
  ];

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateProfile(answers as OnboardingAnswers);
      if (result.error) {
        setError(result.error);
      } else {
        setIsEditing(false);
        router.refresh();
      }
    });
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Onboarding Profile</CardTitle>
              <CardDescription>
                Edit your profile answers. Changes affect future recommendations.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {ONBOARDING_STEPS.map((step) => (
            <div key={step.id} className="space-y-2">
              <h4 className="text-sm font-medium">{step.question}</h4>
              <div className="space-y-2">
                {step.type === "single"
                  ? step.options.map((opt) => (
                      <OptionCard
                        key={opt.value}
                        value={opt.value}
                        label={opt.label}
                        description={
                          "description" in opt
                            ? (opt.description as string)
                            : undefined
                        }
                        selected={answers[step.field] === opt.value}
                        onSelect={(v) =>
                          setAnswers((prev) => ({ ...prev, [step.field]: v }))
                        }
                      />
                    ))
                  : step.options.map((opt) => (
                      <MultiOptionCard
                        key={opt.value}
                        value={opt.value}
                        label={opt.label}
                        selected={(answers.blockers ?? []).includes(
                          opt.value as Blocker
                        )}
                        onToggle={(v) => {
                          const current = (answers.blockers ?? []) as Blocker[];
                          const next = current.includes(v as Blocker)
                            ? current.filter((x) => x !== v)
                            : [...current, v as Blocker];
                          setAnswers((prev) => ({ ...prev, blockers: next }));
                        }}
                      />
                    ))}
              </div>
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 py-2 px-3 rounded-lg border border-red-500/20">
              {error}
            </p>
          )}

          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Onboarding Profile</CardTitle>
            <CardDescription>
              Your profile shapes AI recommendations and the Start Business flow.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0"
          >
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-sm font-medium text-right">{item.value}</span>
          </div>
        ))}
        <div className="py-2">
          <span className="text-sm text-muted-foreground block mb-2">
            Blockers
          </span>
          <div className="flex flex-wrap gap-2">
            {(profile.blockers ?? []).map((b) => (
              <span
                key={b}
                className="inline-flex text-xs px-2.5 py-1 rounded-full bg-muted border border-border/50"
              >
                {BLOCKER_OPTIONS.find((o) => o.value === b)?.label ?? b}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionCard } from "@/components/flows/OptionCard";
import {
  TIME_AVAILABILITY_OPTIONS,
  REVENUE_GOAL_OPTIONS,
  CURRENT_SITUATION_OPTIONS,
  ONBOARDING_STEPS,
  type OnboardingAnswers,
} from "@/types/onboarding";
import { updateProfile } from "@/app/actions/update-profile";
import type { Tables } from "@/types/database";
import { Edit2, Save, X, Loader2, Check } from "lucide-react";

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

function SettingsOptionCard({
  value,
  label,
  description,
  selected,
  onSelect,
}: {
  value: string;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]/50 ${
        selected
          ? "border-[#FF8C00] bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 shadow-sm shadow-[#FF8C00]/10"
          : "border-border bg-card hover:border-[#FF8C00]/40 hover:bg-[#FF8C00]/5"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className={`font-medium text-sm ${selected ? "text-[#FF8C00]" : ""}`}>
            {label}
          </div>
          {description && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {description}
            </div>
          )}
        </div>
        {selected && (
          <div className="shrink-0 h-5 w-5 rounded-full gradient-accent-bg flex items-center justify-center border-0">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

export function OnboardingProfileCard({ profile }: OnboardingProfileCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({
    location_city: profile.location_city ?? undefined,
    location_country: profile.location_country ?? undefined,
    current_situation:
      (profile.current_situation as OnboardingAnswers["current_situation"]) ?? undefined,
    time_availability:
      (profile.time_availability as OnboardingAnswers["time_availability"]) ?? undefined,
    revenue_goal:
      (profile.revenue_goal as OnboardingAnswers["revenue_goal"]) ?? undefined,
  });

  const locationDisplay = [profile.location_city, profile.location_country]
    .filter(Boolean)
    .join(", ") || "—";

  const summaryItems = [
    {
      label: "Location",
      value: locationDisplay,
    },
    {
      label: "Current situation",
      value: getLabel(CURRENT_SITUATION_OPTIONS, profile.current_situation),
    },
    {
      label: "Time availability",
      value: getLabel(TIME_AVAILABILITY_OPTIONS, profile.time_availability),
    },
    {
      label: "Revenue goal",
      value: getLabel(REVENUE_GOAL_OPTIONS, profile.revenue_goal),
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
      <Card className="rounded-[32px] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 border border-black/5 dark:border-[#2A2A2A] shadow-none">
        <CardHeader className="px-8 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Onboarding Profile</CardTitle>
              <CardDescription className="text-neutral-500 dark:text-neutral-400 mt-1">
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
        <CardContent className="space-y-6 px-8 pb-8">
          {ONBOARDING_STEPS.map((step) => (
            <div key={step.id} className="space-y-2">
              <h4 className="text-sm font-medium">{step.question}</h4>
              {step.type === "location" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-city" className="text-xs text-muted-foreground">City</Label>
                    <Input
                      id="edit-city"
                      placeholder="e.g. Lagos"
                      value={answers.location_city ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, location_city: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-country" className="text-xs text-muted-foreground">Country</Label>
                    <Input
                      id="edit-country"
                      placeholder="e.g. Nigeria"
                      value={answers.location_country ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, location_country: e.target.value }))
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {step.options?.map((opt) => (
                    <SettingsOptionCard
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
                  ))}
                </div>
              )}
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 py-2 px-3 rounded-lg border border-red-500/20">
              {error}
            </p>
          )}

          <Button onClick={handleSave} disabled={isPending} className="shadow-md gradient-accent-bg text-white hover:scale-[1.02] transition-transform border-0">
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
    <Card className="rounded-[32px] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 border border-black/5 dark:border-[#2A2A2A] shadow-none">
      <CardHeader className="px-8 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Onboarding Profile</CardTitle>
            <CardDescription className="text-neutral-500 dark:text-neutral-400 mt-1">
              Your profile shapes AI recommendations and the Start Business flow.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-8 pb-8">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="flex items-start justify-between gap-4 py-3 border-b border-border/50 last:border-0"
          >
            <span className="text-sm text-neutral-500 dark:text-neutral-400">{item.label}</span>
            <span className="text-sm font-medium text-right text-neutral-900 dark:text-neutral-100">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

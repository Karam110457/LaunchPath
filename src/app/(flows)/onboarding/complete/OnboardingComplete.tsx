"use client";

import { useRouter } from "next/navigation";
import { FlowShell } from "@/components/flows/FlowShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  TIME_AVAILABILITY_OPTIONS,
  REVENUE_GOAL_OPTIONS,
  CURRENT_SITUATION_OPTIONS,
} from "@/types/onboarding";
import type { Tables } from "@/types/database";

interface OnboardingCompleteProps {
  profile: Tables<"user_profiles">;
}

function getLabel(
  options: readonly { readonly value: string; readonly label: string }[],
  value: string | null
): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

export function OnboardingComplete({ profile }: OnboardingCompleteProps) {
  const router = useRouter();

  const summaryItems = [
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

  return (
    <FlowShell
      currentStep={3}
      totalSteps={3}
      showProgress={false}
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-serif italic">Got it. Here&apos;s your profile.</h2>
          <p className="text-sm text-muted-foreground">
            Edit anytime in settings.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0"
              >
                <span className="text-sm text-muted-foreground shrink-0">
                  {item.label}
                </span>
                <span className="text-sm font-medium text-right">
                  {item.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={() => router.push("/start")}
        >
          Start Your First Business
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </FlowShell>
  );
}

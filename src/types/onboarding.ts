export const CURRENT_SITUATION_OPTIONS = [
  { value: "ready_to_start", label: "Ready to start", description: "I haven't started yet but I'm ready to" },
  { value: "tried_before", label: "Tried before", description: "I've tried this before and got stuck" },
] as const;

export const TIME_AVAILABILITY_OPTIONS = [
  { value: "under_5", label: "Under 5 hours", description: "Side project" },
  { value: "5_to_15", label: "5–15 hours", description: "Serious side hustle" },
  { value: "15_to_30", label: "15–30 hours", description: "Part-time focus" },
  { value: "30_plus", label: "30+ hours", description: "Full-time" },
] as const;

export const REVENUE_GOAL_OPTIONS = [
  { value: "500_1k", label: "First meaningful win", description: "Enough to prove the model works" },
  { value: "1k_3k", label: "Real side income", description: "Consistent monthly revenue" },
  { value: "3k_5k", label: "Replace my salary", description: "Full-time income level" },
  { value: "5k_10k_plus", label: "Build a real business", description: "Scaling beyond yourself" },
] as const;

export type CurrentSituation = (typeof CURRENT_SITUATION_OPTIONS)[number]["value"];
export type TimeAvailability = (typeof TIME_AVAILABILITY_OPTIONS)[number]["value"];
export type RevenueGoal = (typeof REVENUE_GOAL_OPTIONS)[number]["value"];

export interface OnboardingAnswers {
  location_city: string;
  location_country: string;
  current_situation: CurrentSituation;
  time_availability: TimeAvailability;
  revenue_goal: RevenueGoal;
}

export interface OnboardingStepConfig {
  id: number;
  field: keyof OnboardingAnswers;
  question: string;
  type: "single" | "location";
  options?: readonly { readonly value: string; readonly label: string; readonly description?: string }[];
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 1,
    field: "location_city",
    question: "Where are you based?",
    type: "location",
  },
  {
    id: 2,
    field: "current_situation",
    question: "Where are you right now?",
    type: "single",
    options: CURRENT_SITUATION_OPTIONS,
  },
  {
    id: 3,
    field: "time_availability",
    question: "How many hours per week can you realistically put into this?",
    type: "single",
    options: TIME_AVAILABILITY_OPTIONS,
  },
  {
    id: 4,
    field: "revenue_goal",
    question: "What's your monthly income target from this?",
    type: "single",
    options: REVENUE_GOAL_OPTIONS,
  },
];

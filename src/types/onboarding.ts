export const TIME_AVAILABILITY_OPTIONS = [
  { value: "under_5", label: "Under 5 hours", description: "Side project" },
  { value: "5_to_15", label: "5–15 hours", description: "Serious side hustle" },
  { value: "15_to_30", label: "15–30 hours", description: "Part-time focus" },
  { value: "30_plus", label: "30+ hours", description: "Full-time" },
] as const;

export const OUTREACH_COMFORT_OPTIONS = [
  { value: "never_done", label: "Never done it, not sure I can" },
  { value: "nervous_willing", label: "Nervous but I'll push through" },
  { value: "fairly_comfortable", label: "Done it before, fairly comfortable" },
  { value: "love_sales", label: "Love sales, it's my strength" },
] as const;

export const TECHNICAL_COMFORT_OPTIONS = [
  { value: "use_apps", label: "I can use apps but don't build things" },
  { value: "used_tools", label: "I've used tools like Zapier, Canva, or Notion" },
  { value: "built_basic", label: "I've built basic websites or automations" },
  { value: "can_code", label: "I can code or have built software" },
] as const;

export const REVENUE_GOAL_OPTIONS = [
  { value: "500_1k", label: "£500–1,000", description: "First meaningful win" },
  { value: "1k_3k", label: "£1,000–3,000", description: "Real side income" },
  { value: "3k_5k", label: "£3,000–5,000", description: "Replace my salary" },
  { value: "5k_10k_plus", label: "£5,000–10,000+", description: "Build a real business" },
] as const;

export const CURRENT_SITUATION_OPTIONS = [
  { value: "complete_beginner", label: "Complete beginner", description: "Never tried making money online" },
  { value: "consumed_content", label: "Consumed courses/content", description: "But haven't started" },
  { value: "tried_no_clients", label: "Tried but no clients", description: "Haven't landed a paying client yet" },
  { value: "has_clients", label: "Have 1–2 clients", description: "Want to scale" },
] as const;

export const BLOCKER_OPTIONS = [
  { value: "no_niche", label: "I don't know what niche to pick" },
  { value: "no_offer", label: "I don't know what to sell or how to price it" },
  { value: "cant_build", label: "I can't build anything technical" },
  { value: "cant_find_clients", label: "I've built things but can't find clients" },
  { value: "scared_delivery", label: "I'm scared I'll sell something I can't deliver" },
  { value: "keep_switching", label: "I keep switching between ideas and never commit" },
] as const;

export type TimeAvailability = (typeof TIME_AVAILABILITY_OPTIONS)[number]["value"];
export type OutreachComfort = (typeof OUTREACH_COMFORT_OPTIONS)[number]["value"];
export type TechnicalComfort = (typeof TECHNICAL_COMFORT_OPTIONS)[number]["value"];
export type RevenueGoal = (typeof REVENUE_GOAL_OPTIONS)[number]["value"];
export type CurrentSituation = (typeof CURRENT_SITUATION_OPTIONS)[number]["value"];
export type Blocker = (typeof BLOCKER_OPTIONS)[number]["value"];

export interface OnboardingAnswers {
  time_availability: TimeAvailability;
  outreach_comfort: OutreachComfort;
  technical_comfort: TechnicalComfort;
  revenue_goal: RevenueGoal;
  current_situation: CurrentSituation;
  blockers: Blocker[];
}

export interface OnboardingStepConfig {
  id: number;
  field: keyof OnboardingAnswers;
  question: string;
  type: "single" | "multi";
  options: readonly { readonly value: string; readonly label: string; readonly description?: string }[];
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 1,
    field: "time_availability",
    question: "How many hours per week can you realistically put into this?",
    type: "single",
    options: TIME_AVAILABILITY_OPTIONS,
  },
  {
    id: 2,
    field: "outreach_comfort",
    question: "How do you feel about reaching out to businesses you don't know?",
    type: "single",
    options: OUTREACH_COMFORT_OPTIONS,
  },
  {
    id: 3,
    field: "technical_comfort",
    question: "How comfortable are you with technology?",
    type: "single",
    options: TECHNICAL_COMFORT_OPTIONS,
  },
  {
    id: 4,
    field: "revenue_goal",
    question: "What's your monthly income target from this?",
    type: "single",
    options: REVENUE_GOAL_OPTIONS,
  },
  {
    id: 5,
    field: "current_situation",
    question: "Where are you right now?",
    type: "single",
    options: CURRENT_SITUATION_OPTIONS,
  },
  {
    id: 6,
    field: "blockers",
    question: "What's the main thing that's held you back? Pick all that apply.",
    type: "multi",
    options: BLOCKER_OPTIONS,
  },
];

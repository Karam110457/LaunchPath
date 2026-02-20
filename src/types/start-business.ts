export type DirectionPath = "beginner" | "stuck";
export type SystemStatus = "in_progress" | "complete" | "archived";

export interface StartBusinessAnswers {
  direction_path: DirectionPath | null;
  industry_interests: string[];
  own_idea: string | null;
  tried_niche: string | null;
  what_went_wrong: string | null;
  growth_direction: string | null;
  location_city: string | null;
  location_target: string | null;
}

export type { AIRecommendation } from "@/lib/ai/schemas";

export interface Offer {
  segment: string;
  transformation_from: string;
  transformation_to: string;
  system_description: string;
  pricing_setup: number;
  pricing_monthly: number;
  guarantee: string;
  delivery_model: string;
  // Extended fields from AI generation (optional for backward compatibility)
  guarantee_type?: "time_bound" | "outcome_based" | "risk_reversal";
  guarantee_confidence?: string;
  pricing_rationale?: string;
  pricing_comparables?: { service: string; price_range: string }[];
  revenue_projection?: { clients_needed: number; monthly_revenue: string };
  validation_status?: "passed" | "needs_review" | "failed";
  validation_notes?: string[];
}

export const INDUSTRY_OPTIONS = [
  { value: "home_services", label: "Home services", description: "Roofing, cleaning, plumbing, HVAC, landscaping, pest control, pool" },
  { value: "health_wellness", label: "Health & wellness", description: "Dental, physio, chiropractic, med spa" },
  { value: "professional_services", label: "Professional services", description: "Real estate, legal, accounting, insurance" },
  { value: "automotive", label: "Automotive", description: "Repair shops, detailing, dealerships" },
  { value: "food_hospitality", label: "Food & hospitality", description: "Restaurants, catering, cafes, events" },
  { value: "no_preference", label: "I genuinely have no preference", description: "Surprise me" },
] as const;

export const WHAT_WENT_WRONG_OPTIONS = [
  { value: "cant_find_prospects", label: "Couldn't find anyone to sell to" },
  { value: "cant_close", label: "Had no clear offer or pricing" },
  { value: "cant_deliver", label: "Didn't know how to build the tech" },
  { value: "overwhelmed", label: "Got overwhelmed and stopped" },
] as const;

export const LOCATION_TARGET_OPTIONS = [
  { value: "local", label: "My local area", description: "Within 50 miles" },
  { value: "national", label: "Anywhere in my country", description: "Nationwide" },
  { value: "international", label: "International / English-speaking countries", description: "Global reach" },
  { value: "anywhere", label: "Doesn't matter", description: "Open to any location" },
] as const;

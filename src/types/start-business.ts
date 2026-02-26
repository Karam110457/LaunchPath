export type DirectionPath = "beginner" | "stuck";
export type SystemStatus = "in_progress" | "complete" | "archived";

export interface StartBusinessAnswers {
  direction_path: DirectionPath | null;
  client_preferences: string[];
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
  guarantee_text: string;
  delivery_model: string;
  // Short pitch versions (1-sentence each, user-facing and editable)
  pitch_from?: string;
  pitch_to?: string;
  // Extended fields from AI generation (optional for backward compatibility)
  guarantee_type?: "time_bound" | "outcome_based" | "risk_reversal";
  guarantee_confidence?: string;
  pricing_rationale?: string;
  pricing_comparables?: { service: string; price_range: string }[];
  revenue_projection?: { clients_needed: number; monthly_revenue: string };
  validation_status?: "passed" | "needs_review" | "failed";
  validation_notes?: string[];
}

export const CLIENT_PREFERENCE_OPTIONS = [
  { value: "hands_on_trades", label: "Hands-on tradespeople", description: "Roofers, plumbers, landscapers — people who work with their hands" },
  { value: "practice_owners", label: "Practice owners with staff", description: "Dentists, physios, vets — professionals running a team" },
  { value: "solo_professionals", label: "Solo professionals", description: "Agents, advisors, consultants — one-person operations" },
  { value: "shop_owners", label: "Local shop or garage owners", description: "Auto repair, detailing, retail — foot traffic businesses" },
  { value: "service_managers", label: "Service business managers", description: "Cleaning companies, pest control, property management" },
  { value: "no_preference", label: "Open to anything", description: "Best opportunity wins" },
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

/**
 * Countries where local/national target markets are viable
 * because all generated content is in English.
 * Lowercase for case-insensitive matching.
 */
const ENGLISH_SPEAKING_COUNTRIES = new Set([
  "uk", "united kingdom", "england", "scotland", "wales", "northern ireland",
  "us", "usa", "united states", "united states of america", "america",
  "canada", "australia", "new zealand", "ireland", "south africa",
]);

/** Check if a country is English-speaking (local/national markets are viable). */
export function isEnglishSpeakingCountry(country: string | null): boolean {
  if (!country) return false;
  return ENGLISH_SPEAKING_COUNTRIES.has(country.trim().toLowerCase());
}

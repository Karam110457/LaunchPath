export type SystemIntent = "first_client" | "new_service" | "test_niche" | "content";
export type DirectionPath = "beginner" | "stuck" | "has_clients";
export type SystemStatus = "in_progress" | "complete" | "archived";

export interface StartBusinessAnswers {
  intent: SystemIntent | null;
  direction_path: DirectionPath | null;
  industry_interests: string[];
  own_idea: string | null;
  tried_niche: string | null;
  what_went_wrong: string | null;
  current_niche: string | null;
  current_clients: number | null;
  current_pricing: string | null;
  growth_direction: string | null;
  delivery_model: string | null;
  pricing_direction: string | null;
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

export const INTENT_OPTIONS = [
  { value: "first_client", label: "Get my first paying client" },
  { value: "new_service", label: "Add a new service to offer existing clients" },
  { value: "test_niche", label: "Test a new niche idea" },
  { value: "content", label: "Build something to show in my content" },
] as const;

export const INDUSTRY_OPTIONS = [
  { value: "home_services", label: "Home services", description: "Roofing, cleaning, plumbing, HVAC, landscaping, pest control, pool" },
  { value: "health_wellness", label: "Health & wellness", description: "Dental, physio, chiropractic, med spa" },
  { value: "professional_services", label: "Professional services", description: "Real estate, legal, accounting, insurance" },
  { value: "automotive", label: "Automotive", description: "Repair shops, detailing, dealerships" },
  { value: "food_hospitality", label: "Food & hospitality", description: "Restaurants, catering, cafes, events" },
  { value: "no_preference", label: "I genuinely have no preference", description: "Surprise me" },
] as const;

export const WHAT_WENT_WRONG_OPTIONS = [
  { value: "cant_find_prospects", label: "Couldn't find the right prospects to contact" },
  { value: "cant_close", label: "Had conversations but couldn't close deals" },
  { value: "cant_deliver", label: "Closed a client but couldn't deliver results" },
  { value: "overwhelmed", label: "Got overwhelmed by everything and stopped" },
] as const;

export const DELIVERY_MODEL_SIMPLE_OPTIONS = [
  { value: "system_self_serve", label: "Sell a system clients use themselves", description: "Less time per client" },
  { value: "done_for_you", label: "Do the work for clients", description: "More hands-on but higher price" },
] as const;

export const DELIVERY_MODEL_FULL_OPTIONS = [
  { value: "build_once", label: "Build once, sell to many", description: "Build one system template, deploy to multiple clients. Most scalable." },
  { value: "custom_dfy", label: "Custom done-for-you", description: "Build bespoke solutions per client. Higher price, more time." },
  { value: "hybrid", label: "Hybrid — start custom, then productise", description: "Do it manually for first clients, then turn it into a repeatable system." },
  { value: "help_decide", label: "Not sure — help me decide", description: "AI recommends based on your profile." },
] as const;

export const PRICING_STANDARD_OPTIONS = [
  { value: "fewer_high_ticket", label: "Fewer clients paying £1,000–2,000+/month each" },
  { value: "more_mid_ticket", label: "More clients at £300–500/month each" },
] as const;

export const PRICING_EXPANDED_OPTIONS = [
  { value: "monthly_retainer", label: "Monthly retainer (£1,000–3,000/month per client)" },
  { value: "base_plus_percentage", label: "Lower base + percentage of their growth" },
  { value: "volume_play", label: "Volume play — many clients at £300–500/month" },
  { value: "help_decide", label: "Help me figure out the best model" },
] as const;

export const LOCATION_TARGET_OPTIONS = [
  { value: "local", label: "My local area", description: "Within 50 miles" },
  { value: "national", label: "Anywhere in my country", description: "Nationwide" },
  { value: "international", label: "International / English-speaking countries", description: "Global reach" },
  { value: "anywhere", label: "Doesn't matter", description: "Open to any location" },
] as const;

export const GROWTH_DIRECTION_OPTIONS = [
  { value: "more_clients", label: "Get more clients in my current niche" },
  { value: "new_service", label: "Add a new service for my existing clients" },
  { value: "new_niche", label: "Expand into a new niche entirely" },
] as const;

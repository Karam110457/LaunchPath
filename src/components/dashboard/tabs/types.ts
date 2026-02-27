export interface Offer {
  segment?: string;
  system_description?: string;
  transformation_from?: string;
  transformation_to?: string;
  pitch_from?: string;
  pitch_to?: string;
  guarantee_text?: string;
  guarantee_type?: "time_bound" | "outcome_based" | "risk_reversal";
  guarantee_confidence?: string;
  pricing_setup?: number;
  pricing_monthly?: number;
  pricing_rationale?: string;
  pricing_comparables?: Array<{ service: string; price_range: string }>;
  revenue_projection?: { clients_needed: number; monthly_revenue: string };
  delivery_model?: string;
}

export interface Recommendation {
  niche?: string;
  score?: number;
  bottleneck?: string;
  your_solution?: string;
  target_segment?: { description?: string };
  strategic_insight?: string;
}

export interface Submission {
  result: { priority?: string } | null;
  created_at: string;
}

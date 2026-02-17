/**
 * Guarantee agent system prompt.
 * Generates a niche-specific, achievable guarantee for the offer.
 *
 * Cacheable — identical for every user. Only the user context changes.
 */
export const GUARANTEE_SYSTEM_PROMPT = `You are LaunchPath's guarantee specialist. You craft specific, compelling guarantees for AI-powered services that are realistic and achievable.

## Your Job

Given a chosen niche, delivery model, and user profile, generate a guarantee that:
1. References the specific bottleneck being solved
2. Matches the delivery model (build-once systems get different guarantees than custom done-for-you)
3. Accounts for the user's time availability (can they deliver on a time-bound guarantee?)
4. Is achievable by an AI-powered system (not manual labor)
5. Makes the prospect feel safe saying yes

## Guarantee Types

- **time_bound**: "X result within Y days or Z" — Use when the deliverable has a clear timeline (e.g., "Your lead qualification system live within 7 days or your setup fee refunded"). Best for build-once/system delivery models.
- **outcome_based**: "We guarantee X outcome" — Use when results are measurable (e.g., "Guaranteed minimum 20 qualified leads in your first month"). Best for done-for-you models where the provider controls the outcome.
- **risk_reversal**: "Try it risk-free: X" — Use when the user has limited time or the niche is skeptical (e.g., "Full refund within 30 days if you don't see value"). Best as a fallback or for users worried about delivery.

## Output Rules

1. Return ONLY valid JSON matching the schema.
2. The guarantee must be specific to the niche — no generic "satisfaction guaranteed" language.
3. The guarantee must be achievable by an AI system, not manual effort.
4. confidence_notes should explain WHY this guarantee is realistic (1-2 sentences).
5. Keep language professional and direct. No hype.

## Output Schema

{
  "guarantee_text": "string — the full guarantee statement",
  "guarantee_type": "time_bound | outcome_based | risk_reversal",
  "confidence_notes": "string — why this guarantee is achievable"
}`;

/**
 * Build user context for the guarantee generation call.
 * Includes full cross-agent context so the guarantee aligns with pricing and transformation.
 */
export function buildGuaranteeContext(
  chosenRecommendation: {
    niche: string;
    bottleneck: string;
    your_solution: string;
    target_segment: { description: string; why: string };
    strategic_insight: string;
    revenue_potential: {
      per_client: string;
      target_clients: number;
      monthly_total: string;
    };
  },
  profile: {
    time_availability: string | null;
    revenue_goal: string | null;
    blockers: string[];
  },
  answers: {
    delivery_model: string | null;
    pricing_direction: string | null;
  }
): string {
  const lines: string[] = [];

  lines.push("## Niche Context");
  lines.push(`- Niche: ${chosenRecommendation.niche}`);
  lines.push(`- Target segment: ${chosenRecommendation.target_segment.description}`);
  lines.push(`- Bottleneck being solved: ${chosenRecommendation.bottleneck}`);
  lines.push(`- AI solution: ${chosenRecommendation.your_solution}`);
  lines.push(`- Strategic insight: ${chosenRecommendation.strategic_insight}`);
  lines.push(`- Client revenue potential: ${chosenRecommendation.revenue_potential.per_client} per client`);

  lines.push("\n## Delivery Context");
  lines.push(`- Delivery model: ${answers.delivery_model ?? "not specified"}`);
  lines.push(`- User time availability: ${profile.time_availability ?? "not specified"}`);
  lines.push(`- Revenue goal: ${profile.revenue_goal ?? "not specified"}`);
  lines.push(`- Pricing direction: ${answers.pricing_direction ?? "not specified"}`);

  lines.push("\n## Cross-Agent Alignment");
  lines.push("The pricing being set in parallel reflects value delivered, not effort. Your guarantee must be achievable at a premium price point — it should justify the investment, not undermine it.");
  if (answers.pricing_direction === "fewer_high_ticket" || answers.pricing_direction === "monthly_retainer") {
    lines.push("The pricing will be at the higher end of the range. Your guarantee must be substantive enough to justify this — use outcome_based or time_bound with a specific, high-value deliverable.");
  } else if (answers.pricing_direction === "volume_play" || answers.pricing_direction === "more_mid_ticket") {
    lines.push("The pricing will be mid-range to encourage volume. Use risk_reversal or time_bound to reduce friction for new clients.");
  }

  if (profile.blockers.includes("scared_delivery")) {
    lines.push(
      "\nIMPORTANT: This user is worried about delivering results. The guarantee MUST emphasise that the AI SYSTEM delivers, not the person. Choose risk_reversal or time_bound over outcome_based."
    );
  }

  if (profile.time_availability === "1-2h") {
    lines.push(
      "\nIMPORTANT: User has very limited time (1-2h/week). Avoid time_bound guarantees that require manual effort. Prefer outcome_based tied to the AI system's automated outputs."
    );
  }

  if (answers.delivery_model === "build_once") {
    lines.push(
      "\nNOTE: Build-once model — the system is deployed once and runs autonomously. Guarantee should relate to system setup speed or automated output quality."
    );
  } else if (answers.delivery_model === "custom_dfy") {
    lines.push(
      "\nNOTE: Custom done-for-you model — the user builds bespoke solutions. Guarantee can be more outcome-focused since there's hands-on involvement."
    );
  }

  return lines.join("\n");
}

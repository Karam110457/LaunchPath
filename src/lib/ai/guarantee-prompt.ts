/**
 * Guarantee agent system prompt.
 * Generates a niche-specific, achievable guarantee for the offer.
 *
 * Cacheable — identical for every user. Only the user context changes.
 */
export const GUARANTEE_SYSTEM_PROMPT = `You are LaunchPath's guarantee specialist. You craft specific, compelling guarantees for AI-powered services that are realistic and achievable.

## Your Job

Given a chosen niche and user profile, generate a guarantee that:
1. References the specific bottleneck being solved
2. Aligns with a build-once delivery model (the AI system is deployed once and runs autonomously)
3. Is achievable by an AI-powered system (not manual labor)
4. Makes the prospect feel safe saying yes

## Guarantee Types

- **time_bound**: "X result within Y days or Z" — Use when the deliverable has a clear timeline (e.g., "Your lead qualification system live within 7 days or your setup fee refunded"). Best for build-once systems where setup speed is a selling point.
- **outcome_based**: "We guarantee X outcome" — Use when results are measurable (e.g., "Guaranteed minimum 20 qualified leads in your first month"). Use when the AI system's automated outputs are reliably measurable.
- **risk_reversal**: "Try it risk-free: X" — Use when the niche is skeptical about AI or new technology (e.g., "Full refund within 30 days if you don't see value"). Good default for first-time sellers.

## Quality Rules

1. The guarantee must be specific to the niche — no generic "satisfaction guaranteed" language.
2. The guarantee must be achievable by an AI system, not manual effort.
3. confidence_notes should explain WHY this guarantee is realistic (1-2 sentences).
4. Keep language professional and direct. No hype.`;

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
  lines.push(`- Delivery model: build_once (the system is deployed once and runs autonomously)`);
  lines.push(`- User time availability: ${profile.time_availability ?? "not specified"}`);
  lines.push(`- Revenue goal: ${profile.revenue_goal ?? "not specified"}`);

  lines.push("\n## Cross-Agent Alignment");
  lines.push("The pricing being set in parallel reflects value delivered, not effort. Your guarantee must be achievable at a premium price point — it should justify the investment, not undermine it.");
  lines.push("Guarantee should relate to system setup speed or automated output quality — the user deploys it once and the AI runs autonomously from there.");

  return lines.join("\n");
}

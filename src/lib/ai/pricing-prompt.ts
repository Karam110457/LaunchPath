/**
 * Pricing agent system prompt.
 * Generates AI-informed pricing based on niche, delivery model, and revenue goals.
 *
 * Replaces the hardcoded calculatePricing() switch statement.
 * Cacheable — identical for every user. Only the user context changes.
 */
export const PRICING_SYSTEM_PROMPT = `You are LaunchPath's pricing strategist. You determine optimal pricing for AI-powered services sold to local businesses.

## Your Job

Given a niche, revenue goal, and target segment, calculate:
1. **Setup fee** — One-time fee to build/deploy the AI system
2. **Monthly fee** — Recurring fee for ongoing AI service
3. **Rationale** — Why this pricing makes sense (2-3 sentences)
4. **Comparable services** — 2-3 real-world services in this niche at similar price points (helps the prospect anchor the price)
5. **Revenue projection** — How many clients the user needs at this price to hit their revenue goal

## Pricing Principles

- Price based on VALUE delivered, not effort required. AI systems deliver outsized value relative to cost.
- Setup fee covers the work to configure and deploy. Range: GBP 200-3,000 depending on complexity.
- Monthly fee covers ongoing AI operation + support. Range: GBP 200-3,000/month depending on niche and value.
- The target segment must be able to afford this. If their revenue is £50k/year, a £2,000/month service is too expensive.
- Pricing must make the user's revenue goal achievable with a realistic number of clients (2-5 in month 1-2).
- The delivery model is always build-once: deploy the AI system once, charge monthly for operation + support.
- Higher-revenue niches (dental, real estate) support higher monthly fees; lower-revenue niches (window cleaning, pest control) need to stay competitive.

## Revenue Goal Pricing Ranges

Use the user's revenue goal as the target and the niche data as the anchor. Position within these ranges:
- 500_1k goal: target £400-500/month per client, ~2 clients
- 1k_3k goal: target £500-800/month per client, ~3 clients
- 3k_5k goal: target £800-1,500/month per client, ~3-4 clients
- 5k_10k_plus goal: target £1,500-2,500/month per client, ~3-5 clients

These are ranges, not fixed prices. The niche's revenue_potential.per_client from Serge is your anchor — adjust within the range based on the niche's ability to pay and the value delivered.

## Currency

Always price in GBP (£). The user and their market are UK-based unless otherwise specified.

## Quality Rules

1. Comparable services must be realistic for the niche (not made up).
2. Revenue projection must use correct math.
3. Keep rationale concise and jargon-free.`;

/**
 * Build user context for the pricing generation call.
 * Includes full cross-agent context so pricing aligns with guarantee and transformation.
 */
export function buildPricingContext(
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
    revenue_goal: string | null;
    time_availability: string | null;
  }
): string {
  const lines: string[] = [];

  lines.push("## Niche & Segment");
  lines.push(`- Niche: ${chosenRecommendation.niche}`);
  lines.push(`- Target segment: ${chosenRecommendation.target_segment.description}`);
  lines.push(`- Why this segment: ${chosenRecommendation.target_segment.why}`);
  lines.push(`- Bottleneck: ${chosenRecommendation.bottleneck}`);
  lines.push(`- AI solution: ${chosenRecommendation.your_solution}`);
  lines.push(`- Strategic insight: ${chosenRecommendation.strategic_insight}`);

  lines.push("\n## Revenue Context");
  lines.push(`- Niche estimated per_client revenue: ${chosenRecommendation.revenue_potential.per_client}`);
  lines.push(`- Niche estimated target_clients: ${chosenRecommendation.revenue_potential.target_clients}`);
  lines.push(`- Niche estimated monthly_total: ${chosenRecommendation.revenue_potential.monthly_total}`);

  lines.push("\n## User Profile");
  lines.push(`- Revenue goal: ${profile.revenue_goal ?? "not specified"}`);
  lines.push(`- Time availability: ${profile.time_availability ?? "not specified"}`);
  lines.push(`- Delivery model: build_once`);

  lines.push("\n## Pricing Instructions");
  lines.push(`The user's revenue goal is ${profile.revenue_goal ?? "not specified"}. The niche data suggests ${chosenRecommendation.revenue_potential.per_client} per client is realistic for ${chosenRecommendation.niche}. Price accordingly — higher-value niches (roofing, dental) support higher monthly fees; lower-value niches (window cleaning, detailing) need to stay competitive.`);
  lines.push("Use the revenue goal as the target and the niche revenue_potential as the anchor. Position the price so the user can realistically reach their goal with 2-5 clients.");

  lines.push("\n## Cross-Agent Alignment");
  lines.push("The offer transformation being written in parallel will describe a vivid before/after story. Your pricing rationale must reflect the value of that transformation — price the OUTCOME, not the tool.");

  return lines.join("\n");
}

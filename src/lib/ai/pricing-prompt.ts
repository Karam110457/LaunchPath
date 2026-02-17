/**
 * Pricing agent system prompt.
 * Generates AI-informed pricing based on niche, delivery model, and revenue goals.
 *
 * Replaces the hardcoded calculatePricing() switch statement.
 * Cacheable — identical for every user. Only the user context changes.
 */
export const PRICING_SYSTEM_PROMPT = `You are LaunchPath's pricing strategist. You determine optimal pricing for AI-powered services sold to local businesses.

## Your Job

Given a niche, delivery model, revenue goal, and target segment, calculate:
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
- Pricing must make the user's revenue goal achievable. If they want £5,000/month and the monthly fee is £500, they need 10 clients.
- Done-for-you commands higher prices than build-once/self-serve.
- Higher-revenue niches (dental, real estate) can afford more than lower-revenue niches (window cleaning, pest control).

## Currency

Always price in GBP (£). The user and their market are UK-based unless otherwise specified.

## Output Rules

1. Return ONLY valid JSON matching the schema.
2. Comparable services must be realistic for the niche (not made up).
3. Revenue projection must use correct math.
4. Keep rationale concise and jargon-free.

## Output Schema

{
  "pricing_setup": number,
  "pricing_monthly": number,
  "rationale": "string — why this pricing works (2-3 sentences)",
  "comparable_services": [{ "service": "string", "price_range": "string" }],
  "revenue_projection": { "clients_needed": number, "monthly_revenue": "string" }
}`;

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
    blockers: string[];
  },
  answers: {
    delivery_model: string | null;
    pricing_direction: string | null;
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
  lines.push(`- AI estimated per_client revenue: ${chosenRecommendation.revenue_potential.per_client}`);
  lines.push(`- AI estimated target_clients: ${chosenRecommendation.revenue_potential.target_clients}`);
  lines.push(`- AI estimated monthly_total: ${chosenRecommendation.revenue_potential.monthly_total}`);

  lines.push("\n## User Preferences");
  lines.push(`- Revenue goal: ${profile.revenue_goal ?? "not specified"}`);
  lines.push(`- Time availability: ${profile.time_availability ?? "not specified"}`);
  lines.push(`- Delivery model: ${answers.delivery_model ?? "not specified"}`);
  lines.push(`- Pricing direction: ${answers.pricing_direction ?? "not specified"}`);

  lines.push("\n## Cross-Agent Alignment");
  lines.push("The offer transformation being written in parallel will describe a vivid before/after story. Your pricing rationale must reflect the value of that transformation — price the OUTCOME, not the tool.");
  if (profile.blockers.includes("scared_delivery")) {
    lines.push("The user is worried about delivery. Do not set prices so high that they feel pressure to over-deliver manually. Price for what the AI system can confidently deliver automatically.");
  }
  if (profile.blockers.includes("cant_find_clients")) {
    lines.push("The user struggles to find clients. Price at a level that allows them to offer a trial or pilot to their first client without financial risk to the prospect.");
  }

  if (answers.pricing_direction === "fewer_high_ticket") {
    lines.push(
      "\nUser prefers FEWER clients paying MORE. Price towards the higher end of the range."
    );
  } else if (answers.pricing_direction === "more_mid_ticket") {
    lines.push(
      "\nUser prefers MORE clients paying LESS. Price towards the lower-mid range to maximise client count."
    );
  } else if (answers.pricing_direction === "monthly_retainer") {
    lines.push(
      "\nUser wants a monthly retainer model (£1,000-3,000/month per client)."
    );
  } else if (answers.pricing_direction === "base_plus_percentage") {
    lines.push(
      "\nUser wants a lower base fee + percentage of growth. Set a moderate monthly base and note that a revenue share component can be added."
    );
  } else if (answers.pricing_direction === "volume_play") {
    lines.push(
      "\nUser wants a volume play — many clients at £300-500/month. Price at the lower end."
    );
  }

  return lines.join("\n");
}

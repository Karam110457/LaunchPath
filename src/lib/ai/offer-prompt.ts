/**
 * Offer generation system prompt.
 * Called after user chooses a niche recommendation.
 * Generates polished transformation copy + guarantee text.
 *
 * Cacheable — identical for every user. Only the user context changes.
 */
export const OFFER_SYSTEM_PROMPT = `You are LaunchPath's offer builder. You take a chosen niche recommendation and craft polished, compelling offer copy that helps someone sell an AI-powered service to businesses.

## Your Job

Given a chosen niche recommendation and the user's profile, generate:

1. **transformation_from** — A vivid 1-2 sentence description of the prospect's current pain (the "before" state). Write from the prospect's perspective. Make it specific to the niche.

2. **transformation_to** — A vivid 1-2 sentence description of the desired outcome (the "after" state). Be specific and measurable where possible.

3. **system_description** — A polished, one-sentence description of what the AI system does. Should sound professional enough for a sales page. Not technical jargon.

4. **guarantee** — A specific, measurable guarantee the user can offer prospects. Format: "[Specific deliverable] in [timeframe] or [consequence]." Must be achievable by the AI system.

## Output Rules

1. Return ONLY valid JSON. No markdown, no explanation outside the JSON.
2. The transformation should feel like a before/after story, not a feature list.
3. The guarantee must be realistic and specific to the niche.
4. Keep language professional but approachable. No hype.

## Output Schema

{
  "transformation_from": "string — the current painful state (1-2 sentences)",
  "transformation_to": "string — the desired outcome state (1-2 sentences)",
  "system_description": "string — what the AI system does (one sentence)",
  "guarantee": "string — specific measurable guarantee"
}`;

/**
 * Build user context for the offer generation call.
 */
export function buildOfferContext(
  chosenRecommendation: {
    niche: string;
    bottleneck: string;
    your_solution: string;
    target_segment: { description: string; why: string };
    revenue_potential: {
      per_client: string;
      target_clients: number;
      monthly_total: string;
    };
    strategic_insight: string;
  },
  profile: {
    time_availability: string | null;
    revenue_goal: string | null;
    blockers: string[];
  },
  answers: {
    delivery_model: string | null;
    pricing_direction: string | null;
    location_city: string | null;
  }
): string {
  const lines: string[] = [];

  lines.push("## Chosen Niche");
  lines.push(`- Niche: ${chosenRecommendation.niche}`);
  lines.push(`- Target segment: ${chosenRecommendation.target_segment.description}`);
  lines.push(`- Why this segment: ${chosenRecommendation.target_segment.why}`);
  lines.push(`- Bottleneck: ${chosenRecommendation.bottleneck}`);
  lines.push(`- Solution: ${chosenRecommendation.your_solution}`);
  lines.push(`- Strategic insight: ${chosenRecommendation.strategic_insight}`);

  lines.push("\n## User Context");
  lines.push(`- Revenue goal: ${profile.revenue_goal ?? "not specified"}`);
  lines.push(`- Time: ${profile.time_availability ?? "not specified"}`);
  lines.push(`- Delivery model: ${answers.delivery_model ?? "not specified"}`);
  lines.push(`- Location: ${answers.location_city ?? "not specified"}`);

  if (profile.blockers.includes("scared_delivery")) {
    lines.push(
      "\nIMPORTANT: Frame the guarantee to emphasise the SYSTEM delivers, not the person. The user is worried about delivering results manually."
    );
  }

  if (profile.blockers.includes("cant_find_clients")) {
    lines.push(
      "\nIMPORTANT: The guarantee should emphasise lead generation outcomes (e.g., qualified leads, appointments) since this user struggles to find clients."
    );
  }

  return lines.join("\n");
}

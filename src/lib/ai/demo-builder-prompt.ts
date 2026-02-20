/**
 * Demo builder agent system prompt.
 * Generates a complete demo page configuration from a user's offer and niche recommendation.
 *
 * Cacheable — identical for every user. Only the user context changes.
 */
export const DEMO_BUILDER_SYSTEM_PROMPT = `You are LaunchPath's demo page builder. You create complete, compelling demo page configurations for AI-powered lead qualification services.

## What Is a Demo Page?

A demo page is a public-facing landing page where the user's prospects can:
1. See a compelling headline about how the AI service solves their specific problem
2. Fill out a short form with details about their business
3. Get an instant AI-powered analysis showing them the value they'd receive
4. Feel compelled to take the next step (book a call, start a trial, etc.)

## Your Job

Given the user's offer (transformation, guarantee, pricing) and their niche recommendation, generate a complete demo page config:

1. **Hero copy** — Headline and subheadline derived directly from the offer's transformation
2. **Form fields** — 3-5 fields optimised for conversion that collect the right qualifying data
3. **Scoring prompt** — A system prompt for the AI agent that will score form submissions
4. **Offer integration** — Whether/how to display the guarantee and pricing on the page
5. **CTA text** — Button text that drives action

## CRITICAL: Hero Copy Must Derive From the Offer Transformation

The offer section of your context contains transformation_from and transformation_to copy. Your hero copy IS NOT independent — it compresses and reflects those exact transformation states.

Rules:
- hero_headline: Compress the transformation_to state into one punchy line (max 12 words). Use words from the transformation_to text. This is NOT creative liberty — this is alignment.
- hero_subheadline: Expand on the headline by referencing WHO it's for (the target segment) and HOW (the system_description). 1-2 sentences.
- transformation_headline: A "From [state A] to [state B]" one-liner. Pull directly from transformation_from/to.
- Never use "AI" in the headline. The prospect cares about results.
- Use the niche-specific language from the offer — not generic marketing speak.

## Headline Formula (choose one and apply it)

Select the formula that best fits this niche and transformation:
- **outcome_timeframe**: "[Specific result] [in/within X period] — [without pain]" — e.g., "5 qualified leads per week — without cold calling"
- **before_after**: "[Stop/End X]. [Start/Get Y automatically]." — e.g., "Stop missing calls. Start booking jobs automatically."
- **for_who_benefit**: "For [specific segment who want] [specific outcome]" — e.g., "For HVAC owners who want a full calendar without buying ads"
- **problem_solved**: "The [specific problem] that [costs them something] — solved." — e.g., "The missed-call problem that kills roofing businesses — solved."

## Form Field Conversion Rules (MANDATORY)

These rules are non-negotiable. Every extra field reduces conversion.

- **Target 3-5 fields.** Only go above 5 if the niche genuinely requires 6 qualifying dimensions. Never exceed 5 without strong justification.
- **Field ordering**: Easy first (name, company) → Qualifying (size, revenue, current method) → Commitment (challenge, timeline). Never start with hard questions.
- **Contact method**: Collect EITHER email OR phone. Never both. Choose whichever suits the niche (email for B2B services, phone for tradespeople).
- **Every field must earn its place**: If a field does not directly influence the score (HIGH/MEDIUM/LOW), remove it.
- **"textarea" fields**: Maximum one per form, only if it replaces 2+ specific fields and adds genuine qualifying value.
- Use "select" type for any field with predefined options — easier to fill, cleaner data.

## Scoring Prompt Rules

The scoring prompt will be the system prompt for an AI agent receiving form submissions. It must:
- Reference every form field by its exact name (snake_case)
- Define what HIGH means (the ideal client profile for this niche + bottleneck)
- Define what MEDIUM means (potential clients who need nurturing)
- Define what LOW means — include specific disqualifying signals (no budget, outside area, wrong size)
- Be specific enough that the AI produces consistent, calibrated scores
- Include at least one numeric threshold (e.g., "revenue above £X = HIGH signal")

## Quality Rules

1. Form fields must have correct types and all required properties.
2. Scoring prompt must reference every form field name you defined.
3. CTA button text should be action-oriented (not "Submit").
4. niche_slug should be lowercase, hyphen-separated (e.g., "hvac-lead-qualifier").`;

/**
 * Build user context for the demo builder call.
 * Includes the offer, recommendation, and optionally a reference agent from the registry.
 * Hero copy alignment is explicitly directed — not left to creative interpretation.
 */
export function buildDemoBuilderContext(
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
  offer: {
    segment: string;
    transformation_from: string;
    transformation_to: string;
    system_description: string;
    guarantee_text: string;
    guarantee_type: string;
    pricing_setup: number;
    pricing_monthly: number;
    pricing_rationale: string;
    delivery_model: string;
  },
  registryExample?: {
    formFields: { name: string; label: string; type: string; placeholder: string; required: boolean; options?: string[] }[];
    systemPrompt: string;
    agentName: string;
  }
): string {
  const lines: string[] = [];

  lines.push("## User's Offer");
  lines.push(`- Segment: ${offer.segment}`);
  lines.push(`- System: ${offer.system_description}`);
  lines.push(`- Guarantee: ${offer.guarantee_text} (${offer.guarantee_type})`);
  lines.push(`- Pricing: £${offer.pricing_setup} setup + £${offer.pricing_monthly}/month`);
  lines.push(`- Pricing rationale: ${offer.pricing_rationale}`);
  lines.push(`- Delivery model: ${offer.delivery_model}`);

  lines.push("\n## CRITICAL: Hero Copy Source Material");
  lines.push("Your hero_headline and hero_subheadline MUST derive from these transformation states.");
  lines.push("Do not invent new framing. Compress and reflect what is written below.");
  lines.push(`- FROM (transformation_from): "${offer.transformation_from}"`);
  lines.push(`- TO (transformation_to): "${offer.transformation_to}"`);
  lines.push(`- transformation_headline must be a direct 'From X to Y' compression of the above.`);

  lines.push("\n## Niche Recommendation");
  lines.push(`- Niche: ${chosenRecommendation.niche}`);
  lines.push(`- Bottleneck: ${chosenRecommendation.bottleneck}`);
  lines.push(`- Solution: ${chosenRecommendation.your_solution}`);
  lines.push(`- Target segment: ${chosenRecommendation.target_segment.description}`);
  lines.push(`- Why: ${chosenRecommendation.target_segment.why}`);
  lines.push(`- Strategic insight: ${chosenRecommendation.strategic_insight}`);
  lines.push(`- Revenue potential: ${chosenRecommendation.revenue_potential.per_client} per client, targeting ${chosenRecommendation.revenue_potential.target_clients} clients for ${chosenRecommendation.revenue_potential.monthly_total}/month`);

  lines.push("\n## Form Field Reminder");
  lines.push("Target 3-5 fields. Every field must be used in the scoring_prompt. Remove any field you cannot score against.");

  if (registryExample) {
    lines.push("\n## Reference Agent (adapt for this specific offer — do not copy wholesale)");
    lines.push(`- Agent name: ${registryExample.agentName}`);
    lines.push(`- Form fields used: ${JSON.stringify(registryExample.formFields)}`);
    lines.push(`- Scoring approach (first 400 chars): ${registryExample.systemPrompt.slice(0, 400)}...`);
    lines.push("Note: adapt the form fields and scoring logic to match THIS offer's transformation and guarantee. Do not copy the reference verbatim.");
  }

  return lines.join("\n");
}

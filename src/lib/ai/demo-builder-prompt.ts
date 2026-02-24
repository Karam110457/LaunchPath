/**
 * Demo builder agent system prompt.
 * Generates a complete demo page configuration from a user's offer and niche recommendation.
 *
 * Cacheable — identical for every user. Only the user context changes.
 */
export const DEMO_BUILDER_SYSTEM_PROMPT = `You are LaunchPath's demo page builder. Generate complete demo page configs for AI-powered lead qualification landing pages.

A demo page: prospect sees headline → fills short form → gets instant AI analysis → takes next step.

You produce: hero copy, 3 benefits, 3-5 form fields, scoring prompt, offer integration, CTA text, and theme.

## Hero Copy (CRITICAL)

hero_headline and hero_subheadline MUST derive from the offer's transformation_from/transformation_to. This is alignment, not creative liberty.

- hero_headline: Compress transformation_to into one punchy line (max 12 words). Use its actual words.
- hero_subheadline: Reference WHO (target segment) and HOW (system_description). 1-2 sentences.
- transformation_headline: "From [state A] to [state B]" — pull directly from transformation_from/to.
- Never use "AI" in headlines. Use niche language, not generic marketing.

Headline formulas (pick one):
- outcome_timeframe: "[Result] [in X period] — [without pain]"
- before_after: "[Stop X]. [Start Y automatically]."
- for_who_benefit: "For [segment who want] [outcome]"
- problem_solved: "The [problem] that [costs them] — solved."

## Benefits

Exactly 3, shown as a grid between hero and form. Each has:
- icon: "chart" | "clock" | "target" | "shield" | "zap" | "users"
- title: 2-4 niche-specific words (not generic)
- description: 1 sentence in the prospect's language answering "why fill this form?"

## Form Fields

Target 3-5 fields. Every extra field reduces conversion.
- Order: easy (name) → qualifying (size, revenue) → commitment (challenge)
- Collect email OR phone, never both (email for B2B, phone for trades)
- Every field must influence the score. Use "select" for predefined options.
- Max one "textarea" field, only if it replaces 2+ specific fields.

## Scoring Prompt

System prompt for the AI scoring form submissions. Must:
- Reference every form field by exact snake_case name
- Define HIGH (ideal client), MEDIUM (needs nurturing), LOW (disqualified) with specific signals
- Include at least one numeric threshold (e.g., "revenue above £X = HIGH")

## Theme

- accent_color: "emerald" (tech/SaaS), "blue" (finance/healthcare), "violet" (creative/luxury), "amber" (construction/trades), "rose" (wellness/beauty), "cyan" (professional services)
- cta_color: Default "orange". Options: "orange", "emerald", "blue", "rose", "amber". Warm colors convert best.
- headline_style: "sans-bold" (trades/direct) or "serif-italic" (premium/creative)

## Rules

1. Form fields must have correct types and all required properties.
2. Scoring prompt must reference every form field name defined.
3. CTA text must be action-oriented (not "Submit").
4. niche_slug: lowercase, hyphen-separated.`;

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
  },
  answers?: {
    location_city: string | null;
    location_target: string | null;
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

  lines.push("\n## Benefits Reminder");
  lines.push("Generate exactly 3 niche-specific benefits. Each must speak to this prospect's pain: " + chosenRecommendation.bottleneck);

  lines.push("\n## Form Field Reminder");
  lines.push("Target 3-5 fields. Every field must be used in the scoring_prompt. Remove any field you cannot score against.");

  lines.push("\n## Theme Reminder");
  lines.push("Select a theme that matches this niche. Pick an accent_color appropriate for " + chosenRecommendation.niche + ". Default cta_color to 'orange'. Choose headline_style based on niche tone (sans-bold for trades/direct, serif-italic for premium/creative).");

  if (registryExample) {
    lines.push("\n## Reference Agent (adapt for this specific offer — do not copy wholesale)");
    lines.push(`- Agent name: ${registryExample.agentName}`);
    lines.push(`- Form fields used: ${JSON.stringify(registryExample.formFields)}`);
    lines.push(`- Scoring approach (first 400 chars): ${registryExample.systemPrompt.slice(0, 400)}...`);
    lines.push("Note: adapt the form fields and scoring logic to match THIS offer's transformation and guarantee. Do not copy the reference verbatim.");
  }

  if (answers) {
    lines.push("\n## Market Context");
    lines.push(`- Location: ${answers.location_city ?? "not specified"}`);
    lines.push(`- Target area: ${answers.location_target ?? "not specified"}`);
    lines.push("- All form field placeholders, pricing references, and location examples must match this market. Use local currency, city names, and terminology. Adapt for ANY country — the user may be anywhere in the world.");
  }

  return lines.join("\n");
}

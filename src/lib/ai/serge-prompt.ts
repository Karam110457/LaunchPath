/**
 * The Serge framework system prompt for niche analysis.
 * This is the core intelligence behind LaunchPath's recommendation engine.
 *
 * Cacheable — identical for every user. Only the user context changes.
 */
export const SERGE_SYSTEM_PROMPT = `You are Serge, LaunchPath's niche analysis engine. You help people find the best AI-powered service business to start.

## Your Framework

You evaluate niches using 4 criteria, each weighted 25% (max 25 points each, total 100):

### 1. ROI from Service (0-25)
Would the business owner see clear, measurable ROI from this AI service?
- 20-25: Service directly increases revenue or saves significant measurable time/money
- 15-19: Clear benefit but harder to measure precisely
- 10-14: Nice to have but not critical
- 0-9: Unclear value proposition

### 2. Can Afford It (0-25)
Can the target segment realistically pay the recommended monthly price?
- 20-25: Monthly fee is <2% of their revenue. Easy decision.
- 15-19: Affordable but requires some budget consideration
- 10-14: Significant expense relative to their size
- 0-9: Would be a stretch for most in this segment

### 3. Can Guarantee Results (0-25)
Can you confidently guarantee specific outcomes within 30 days?
- 20-25: Yes — measurable output (leads, appointments, quotes) that AI reliably produces
- 15-19: Mostly — results are likely but timing may vary
- 10-14: Partially — some results but hard to commit to specifics
- 0-9: No — too many external factors

### 4. Easy to Find (0-25)
How easy is it to find and contact these businesses?
- 20-25: Google Maps, Yelp, industry directories — visible, contactable, plentiful
- 15-19: Findable with some research (LinkedIn, niche directories)
- 10-14: Requires effort (conferences, referrals, paid lists)
- 0-9: Hard to identify or reach

## Niche Knowledge Base

You know these proven niches deeply:

**Home Services:** Roofing, window cleaning, HVAC, landscaping, plumbing, pest control, pool service, electrical, painting, flooring, fencing, garage doors, pressure washing, gutter cleaning, tree service

**Health & Wellness:** Dental practices, physiotherapy, chiropractic, med spas, veterinary clinics, optometry, mental health practices, dermatology

**Professional Services:** Real estate agents, law firms, accounting firms, insurance agents, financial advisors, mortgage brokers, recruitment agencies

**Automotive:** Auto repair shops, detailing, dealerships, tyre shops, body shops, oil change centres

**Food & Hospitality:** Restaurants, catering, cafes, event venues, food trucks, bakeries

For each niche you recommend, you understand:
- The specific bottleneck AI can solve (lead qualification, appointment setting, quote generation, etc.)
- Typical revenue range of the target segment
- What the AI system would actually do (form → agent → output)
- Why the demo sells itself
- How to find prospects (Google Maps, Yelp, LinkedIn, directories)

## Output Rules

1. Return ONLY valid JSON. No markdown, no explanation outside the JSON.
2. Each recommendation must include all fields in the schema.
3. The "why_for_you" field MUST reference the user's specific profile answers (time, comfort, goals, blockers).
4. Score honestly — not every niche scores 85+. A realistic spread is 65-92.
5. The "strategic_insight" should reveal something non-obvious about the niche that makes the user feel informed.
6. Revenue estimates must be realistic for the segment size and location.

## Output Schema

Return JSON matching this exact structure:
{
  "recommendations": [
    {
      "niche": "string — the niche name",
      "score": "number — total score 0-100",
      "target_segment": {
        "description": "string — who exactly (revenue range, type, size)",
        "why": "string — why this segment specifically"
      },
      "bottleneck": "string — the specific problem AI solves for them",
      "strategic_insight": "string — non-obvious insight about this niche",
      "your_solution": "string — what the AI system does, in one sentence",
      "revenue_potential": {
        "per_client": "string — monthly fee range",
        "target_clients": "number — realistic client count in month 1-2",
        "monthly_total": "string — total monthly revenue"
      },
      "why_for_you": "string — personalised explanation referencing their profile",
      "ease_of_finding": "string — how to find these businesses",
      "segment_scores": {
        "roi_from_service": "number 0-25",
        "can_afford_it": "number 0-25",
        "guarantee_results": "number 0-25",
        "easy_to_find": "number 0-25",
        "total": "number 0-100"
      }
    }
  ],
  "reasoning": "string — brief explanation of why these were chosen over other options"
}`;

/**
 * Build the user context message from profile + Start Business answers.
 */
export function buildUserContext(
  profile: {
    time_availability: string | null;
    outreach_comfort: string | null;
    technical_comfort: string | null;
    revenue_goal: string | null;
    current_situation: string | null;
    blockers: string[];
  },
  answers: {
    intent: string | null;
    direction_path: string | null;
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
  },
  recommendationCount: number
): string {
  const lines: string[] = [];

  lines.push("## User Profile");
  lines.push(`- Time availability: ${profile.time_availability ?? "not specified"}`);
  lines.push(`- Outreach comfort: ${profile.outreach_comfort ?? "not specified"}`);
  lines.push(`- Technical comfort: ${profile.technical_comfort ?? "not specified"}`);
  lines.push(`- Revenue goal: ${profile.revenue_goal ?? "not specified"}`);
  lines.push(`- Current situation: ${profile.current_situation ?? "not specified"}`);
  lines.push(`- Blockers: ${profile.blockers.length > 0 ? profile.blockers.join(", ") : "none specified"}`);

  lines.push("\n## Start Business Answers");
  lines.push(`- Intent: ${answers.intent ?? "not specified"}`);
  lines.push(`- Direction path: ${answers.direction_path ?? "not specified"}`);

  if (answers.industry_interests.length > 0) {
    lines.push(`- Industry interests: ${answers.industry_interests.join(", ")}`);
  }
  if (answers.own_idea) {
    lines.push(`- Their own idea: "${answers.own_idea}"`);
  }
  if (answers.tried_niche) {
    lines.push(`- Previously tried niche: "${answers.tried_niche}"`);
  }
  if (answers.what_went_wrong) {
    lines.push(`- What went wrong: ${answers.what_went_wrong}`);
  }
  if (answers.current_niche) {
    lines.push(`- Current niche: "${answers.current_niche}"`);
  }
  if (answers.current_clients != null) {
    lines.push(`- Current clients: ${answers.current_clients}`);
  }
  if (answers.current_pricing) {
    lines.push(`- Current pricing: ${answers.current_pricing}`);
  }
  if (answers.growth_direction) {
    lines.push(`- Growth direction: ${answers.growth_direction}`);
  }
  if (answers.delivery_model) {
    lines.push(`- Preferred delivery model: ${answers.delivery_model}`);
  }
  if (answers.pricing_direction) {
    lines.push(`- Pricing direction: ${answers.pricing_direction}`);
  }
  if (answers.location_city) {
    lines.push(`- Location: ${answers.location_city}`);
  }
  if (answers.location_target) {
    lines.push(`- Target area: ${answers.location_target}`);
  }

  lines.push(`\n## Instructions`);
  lines.push(`Return exactly ${recommendationCount} recommendation(s).`);

  if (answers.direction_path === "stuck" && answers.growth_direction === "fix") {
    lines.push(`This user tried "${answers.tried_niche}" but got stuck. Diagnose what likely went wrong and rebuild the approach for the SAME niche. Frame it as "here's what was missing and how to fix it."`);
  }

  if (answers.direction_path === "has_clients" && answers.growth_direction === "more_clients") {
    lines.push(`This user already has clients in "${answers.current_niche}". Focus on optimising their current niche — better targeting, better positioning, better pricing. Don't suggest a different niche.`);
  }

  if (answers.direction_path === "has_clients" && answers.growth_direction === "new_service") {
    lines.push(`This user has clients in "${answers.current_niche}". Recommend adjacent AI services they could offer to their EXISTING clients.`);
  }

  if (profile.blockers.includes("keep_switching")) {
    lines.push(`IMPORTANT: This user keeps switching between ideas. Be extra directive. Frame your recommendation with commitment language: "This is your best path based on the data. Trust the process."`);
  }

  if (profile.blockers.includes("scared_delivery")) {
    lines.push(`This user is scared they can't deliver. Emphasise in why_for_you that the AI system runs automatically — they're not doing the work themselves.`);
  }

  if (profile.blockers.includes("cant_find_clients")) {
    lines.push(`This user has struggled to find clients before. Emphasise ease_of_finding with specific, actionable steps (not vague advice).`);
  }

  return lines.join("\n");
}

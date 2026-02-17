/**
 * Output processor for the demo builder agent.
 * Validates the generated demo page configuration.
 *
 * Checks:
 * 1. Form fields have consistent references in the scoring prompt
 * 2. At least one qualifying field beyond business_name/contact info
 * 3. Scoring prompt mentions HIGH/MEDIUM/LOW with specific disqualifying signals for LOW
 * 4. Hero headline is concise (max 12 words)
 * 5. Field count is within conversion-optimal range (3-5 fields)
 * 6. Hero copy alignment: headline must reflect the offer's transformation_to
 */

import type { OutputProcessor, ProcessOutputStepArgs } from "@mastra/core/processors";

/**
 * Extract the transformation_to text from the user message context.
 * buildDemoBuilderContext writes it as: - TO (transformation_to): "..."
 */
function extractTransformationTo(messages: Array<{ role: string; content: unknown }>): string | null {
  for (const msg of messages) {
    if (msg.role !== "user") continue;
    const content = typeof msg.content === "string"
      ? msg.content
      : Array.isArray(msg.content)
        ? msg.content
            .map((c: unknown) => (typeof c === "object" && c !== null && "text" in c ? (c as { text: string }).text : ""))
            .join(" ")
        : "";
    const match = content.match(/- TO \(transformation_to\):\s*"([^"]+)"/i);
    if (match) return match[1].trim();
  }
  return null;
}

/**
 * Extract key outcome words from the transformation_to text.
 * These should appear in the headline.
 */
function extractOutcomeKeywords(transformationTo: string): string[] {
  const stopWords = new Set([
    "their", "with", "that", "from", "this", "they", "have", "will", "your",
    "more", "been", "when", "what", "into", "than", "over", "some", "also",
  ]);
  return transformationTo
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !stopWords.has(w))
    .slice(0, 10);
}

export const demoConfigQualityProcessor: OutputProcessor = {
  id: "demo-config-quality",
  name: "Demo Config Quality Check",
  description:
    "Validates demo page config: form field consistency, scoring prompt completeness, conversion optimization, hero copy alignment",

  async processOutputStep({
    text,
    abort,
    retryCount,
    messages,
  }: ProcessOutputStepArgs) {
    if (!text || retryCount >= 2) return messages;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      return messages;
    }

    const errors: string[] = [];

    const formFields = parsed.form_fields;
    const scoringPrompt = parsed.scoring_prompt;
    const heroHeadline = parsed.hero_headline;

    // 1. Check form fields are referenced in scoring prompt
    if (Array.isArray(formFields) && typeof scoringPrompt === "string") {
      const unreferenced: string[] = [];
      for (const field of formFields) {
        if (
          typeof field === "object" &&
          field !== null &&
          "name" in field &&
          typeof field.name === "string"
        ) {
          if (!scoringPrompt.includes(field.name)) {
            unreferenced.push(field.name);
          }
        }
      }
      if (unreferenced.length > 0) {
        errors.push(
          `Scoring prompt doesn't reference these form fields: ${unreferenced.join(", ")}. Every field collected must be used in scoring.`
        );
      }
    }

    // 2. Check scoring prompt mentions all priority levels + has disqualifying signal for LOW
    if (typeof scoringPrompt === "string") {
      const hasHigh = /HIGH/i.test(scoringPrompt);
      const hasMedium = /MEDIUM/i.test(scoringPrompt);
      const hasLow = /LOW/i.test(scoringPrompt);
      if (!hasHigh || !hasMedium || !hasLow) {
        errors.push(
          "Scoring prompt must define criteria for HIGH, MEDIUM, and LOW priority leads."
        );
      }
      // LOW must include a specific disqualifying signal
      const hasDisqualifier = /LOW.*(?:outside|no budget|too small|disqualif|not a fit|avoid|small|minimal|low revenue)/i.test(scoringPrompt);
      if (hasLow && !hasDisqualifier) {
        errors.push(
          "LOW priority definition must include at least one specific disqualifying signal (e.g., 'outside service area', 'no budget', 'too small'). Vague LOW criteria produce inconsistent scoring."
        );
      }
    }

    // 3. Check at least one qualifying field beyond basics
    if (Array.isArray(formFields)) {
      const basicFieldNames = new Set([
        "business_name",
        "company_name",
        "name",
        "email",
        "phone",
        "contact_email",
        "contact_phone",
        "full_name",
      ]);
      const qualifyingFields = formFields.filter(
        (f) =>
          typeof f === "object" &&
          f !== null &&
          "name" in f &&
          typeof f.name === "string" &&
          !basicFieldNames.has(f.name)
      );
      if (qualifyingFields.length === 0) {
        errors.push(
          "Form must include at least one qualifying field beyond business name and contact info (e.g., revenue range, team size, current challenge)."
        );
      }
    }

    // 4. Field count: conversion-optimised range is 3-5
    if (Array.isArray(formFields)) {
      if (formFields.length > 5) {
        errors.push(
          `Form has ${formFields.length} fields — too many for conversion. Reduce to 5 fields maximum. ` +
          `Remove any field that does not directly influence the HIGH/MEDIUM/LOW score. ` +
          `Consider consolidating two select fields into one.`
        );
      }
      if (formFields.length < 3) {
        errors.push(
          `Form has only ${formFields.length} fields — not enough to qualify leads. Add at least one qualifying field.`
        );
      }
    }

    // 5. Hero headline conciseness
    if (typeof heroHeadline === "string") {
      const wordCount = heroHeadline.split(/\s+/).length;
      if (wordCount > 12) {
        errors.push(
          `Hero headline is too long (${wordCount} words). Keep it under 12 words for impact.`
        );
      }
    }

    // 6. Hero copy alignment: headline must reflect the offer's transformation_to
    const transformationTo = extractTransformationTo(messages as Array<{ role: string; content: unknown }>);
    if (transformationTo && typeof heroHeadline === "string") {
      const outcomeKeywords = extractOutcomeKeywords(transformationTo);
      const headlineLower = heroHeadline.toLowerCase();
      const hasAlignment = outcomeKeywords.some((kw) => headlineLower.includes(kw));
      if (!hasAlignment && outcomeKeywords.length > 0) {
        errors.push(
          `Hero headline does not reflect the offer's transformation. ` +
          `The headline must derive from: "${transformationTo.slice(0, 120)}". ` +
          `Use outcome words from that text in your headline.`
        );
      }
    }

    if (errors.length > 0) {
      abort(
        `Demo config quality check failed:\n${errors.join("\n")}\n\nPlease fix these issues and regenerate.`,
        { retry: true }
      );
    }

    return messages;
  },
};

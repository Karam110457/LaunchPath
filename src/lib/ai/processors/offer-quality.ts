/**
 * Output processor for the offer agent.
 * Validates quality of transformation copy after generation.
 *
 * Checks:
 * 1. Minimum length — transformation fields must be substantive (>20 chars)
 * 2. No PII patterns — no emails, phone numbers, or addresses in output
 * 3. No generic filler — rejects vague output like "they have problems"
 * 4. Framework compliance — enforces Serge Gatari structural requirements:
 *    a. transformation_from must reference the specific bottleneck
 *    b. transformation_to must contain a measurable outcome indicator
 *    c. system_description must describe output, not technology
 */

import type { OutputProcessor, ProcessOutputStepArgs } from "@mastra/core/processors";

const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // email
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // phone (US)
  /\b0\d{3,4}\s?\d{6,7}\b/, // phone (UK)
  /\b\d{1,5}\s\w+\s(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln)\b/i, // address
];

const GENERIC_FILLER = [
  "they have problems",
  "businesses struggle",
  "many companies",
  "various challenges",
  "improve their business",
  "better results",
  "lorem ipsum",
];

// Technology/tool language that belongs in the system, not in outcome copy
const TECH_LANGUAGE = [
  "ai system",
  "machine learning",
  "algorithm",
  "neural network",
  "language model",
  "llm",
  "gpt",
  "claude",
  "artificial intelligence",
];

// Measurable outcome signals — at least one must appear in transformation_to
const MEASURABLE_OUTCOME_PATTERN =
  /\d+|\bmore\b|\bless\b|\bfaster\b|\bfewer\b|\bno more\b|\bconsistent\b|\breliable\b|\bautomatic\b|\bguaranteed\b|\bevery\b|\bdaily\b|\bweekly\b|\bmonthly\b/i;

const MIN_FIELD_LENGTH = 20;

/**
 * Extract the bottleneck from the user message in the conversation history.
 * The buildOfferContext function writes "- Bottleneck: X" — we read it back here.
 */
function extractBottleneck(messages: Array<{ role: string; content: unknown }>): string | null {
  for (const msg of messages) {
    if (msg.role !== "user") continue;
    const content = typeof msg.content === "string"
      ? msg.content
      : Array.isArray(msg.content)
        ? msg.content
            .map((c: unknown) => (typeof c === "object" && c !== null && "text" in c ? (c as { text: string }).text : ""))
            .join(" ")
        : "";
    const match = content.match(/[-–]\s*Bottleneck(?:\s+being\s+solved)?:\s*(.+)/i);
    if (match) return match[1].trim();
  }
  return null;
}

/**
 * Extract one or two keywords from the bottleneck string for matching.
 * e.g. "missing calls after hours" → ["missing calls", "after hours"]
 */
function extractBottleneckKeywords(bottleneck: string): string[] {
  // Take the first 5 words and build 2-word bigrams for fuzzy matching
  const words = bottleneck.toLowerCase().split(/\s+/).slice(0, 6);
  const keywords: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    keywords.push(`${words[i]} ${words[i + 1]}`);
  }
  // Also add individual key nouns (words > 4 chars)
  words.forEach((w) => { if (w.length > 4) keywords.push(w); });
  return keywords;
}

export const offerQualityProcessor: OutputProcessor = {
  id: "offer-quality",
  name: "Offer Quality Check",
  description:
    "Validates offer copy meets minimum quality: length, no PII, no generic filler, and Serge framework compliance",

  async processOutputStep({
    text,
    abort,
    retryCount,
    messages,
  }: ProcessOutputStepArgs) {
    // Only validate if we have text output and haven't retried too many times
    if (!text || retryCount >= 2) return messages;

    // Try to extract JSON from the text
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Not JSON — might be a tool call or intermediate step, skip
      return messages;
    }

    const errors: string[] = [];

    // 1. Minimum length check
    for (const field of [
      "transformation_from",
      "transformation_to",
      "system_description",
    ]) {
      const value = parsed[field];
      if (typeof value === "string" && value.length < MIN_FIELD_LENGTH) {
        errors.push(
          `${field} is too short (${value.length} chars). Must be >${MIN_FIELD_LENGTH} chars and specific to the niche.`
        );
      }
    }

    // 2. PII check across all string fields
    for (const [field, value] of Object.entries(parsed)) {
      if (typeof value !== "string") continue;
      for (const pattern of PII_PATTERNS) {
        if (pattern.test(value)) {
          errors.push(
            `${field} contains potential PII (matched pattern). Remove personal information.`
          );
          break;
        }
      }
    }

    // 3. Generic filler check
    for (const field of [
      "transformation_from",
      "transformation_to",
      "system_description",
    ]) {
      const value = parsed[field];
      if (typeof value !== "string") continue;
      const lower = value.toLowerCase();
      for (const filler of GENERIC_FILLER) {
        if (lower.includes(filler)) {
          errors.push(
            `${field} contains generic filler ("${filler}"). Be specific to the niche and target segment.`
          );
          break;
        }
      }
    }

    // 4a. Framework compliance: transformation_from must reference the bottleneck
    const bottleneck = extractBottleneck(messages as Array<{ role: string; content: unknown }>);
    if (bottleneck) {
      const keywords = extractBottleneckKeywords(bottleneck);
      const fromText = (parsed["transformation_from"] as string ?? "").toLowerCase();
      const referenced = keywords.some((kw) => fromText.includes(kw));
      if (!referenced) {
        errors.push(
          `transformation_from does not reference the specific bottleneck ("${bottleneck}"). ` +
          `The 'before' state must describe the exact problem being solved, not a generic business challenge.`
        );
      }
    }

    // 4b. Framework compliance: transformation_to must include a measurable outcome indicator
    const toText = parsed["transformation_to"];
    if (typeof toText === "string" && !MEASURABLE_OUTCOME_PATTERN.test(toText)) {
      errors.push(
        `transformation_to lacks a measurable outcome indicator. ` +
        `The 'after' state must include something specific and concrete — ` +
        `a number, frequency, or clear change in state (e.g., "5 qualified leads per week", "no missed calls", "consistent pipeline every month").`
      );
    }

    // 4c. Framework compliance: system_description must describe output, not technology
    const sysDesc = parsed["system_description"];
    if (typeof sysDesc === "string") {
      const lower = sysDesc.toLowerCase();
      const usesTechLanguage = TECH_LANGUAGE.some((term) => lower.includes(term));
      if (usesTechLanguage) {
        errors.push(
          `system_description uses technology language. Describe what the system PRODUCES (the outcome), ` +
          `not what it IS (the technology). ` +
          `Instead of "an AI system that..." write "a fully automated [specific service] that..."`
        );
      }
    }

    if (errors.length > 0) {
      abort(
        `Offer quality check failed:\n${errors.join("\n")}\n\nPlease regenerate with more specific, niche-relevant copy.`,
        { retry: true }
      );
    }

    return messages;
  },
};

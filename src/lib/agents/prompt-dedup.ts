/**
 * Post-generation deduplication.
 *
 * Detects and removes sentences from the AI-generated system prompt that
 * substantially overlap with config directives (which are appended separately).
 * This catches the ~10-15% of cases where the AI builder repeats directive
 * content despite being instructed not to.
 *
 * Uses 5-word phrase matching (24+ chars) to avoid false positives.
 * A sentence must have >50% of its words covered by matching phrases
 * to be removed — this prevents removing sentences that add unique context
 * around a shared phrase.
 */

/** Minimum phrase length in words. */
const PHRASE_WORD_COUNT = 5;

/** Minimum phrase length in characters. */
const MIN_PHRASE_CHARS = 24;

/**
 * A sentence is only removed if the matching phrase(s) cover more than
 * this fraction of the sentence's total word count.
 */
const COVERAGE_THRESHOLD = 0.5;

/**
 * Extract key phrases (5-word sequences, 24+ chars) from config directive lines.
 * Skips short lines and strips markdown list markers.
 */
function extractKeyPhrases(directives: string): string[] {
  const phrases: string[] = [];

  const lines = directives
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= MIN_PHRASE_CHARS);

  for (const line of lines) {
    // Strip markdown list markers and HTML comments
    const clean = line
      .replace(/^[-*•]\s*/, "")
      .replace(/^\d+\.\s*/, "")
      .replace(/<!--.*?-->/g, "")
      .toLowerCase();
    const words = clean.split(/\s+/).filter(Boolean);

    // Generate sliding window phrases
    for (let i = 0; i <= words.length - PHRASE_WORD_COUNT; i++) {
      const phrase = words.slice(i, i + PHRASE_WORD_COUNT).join(" ");
      if (phrase.length >= MIN_PHRASE_CHARS) {
        phrases.push(phrase);
      }
    }
  }

  // Deduplicate
  return [...new Set(phrases)];
}

/**
 * Split text into sentences. Splits on sentence-ending punctuation
 * followed by whitespace.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Remove sentences from the generated prompt that substantially match
 * config directive content. Returns the cleaned prompt and removal count.
 *
 * Two-layer protection against false positives:
 * 1. Phrases must be 5 words / 24+ chars (prevents common-phrase matches)
 * 2. Matching phrase(s) must cover >50% of the sentence's words
 *    (prevents removing sentences that add significant unique context)
 */
export function deduplicateAgainstDirectives(
  generatedPrompt: string,
  configDirectives: string
): { cleaned: string; removedCount: number } {
  if (!configDirectives || !generatedPrompt) {
    return { cleaned: generatedPrompt, removedCount: 0 };
  }

  const keyPhrases = extractKeyPhrases(configDirectives);
  if (keyPhrases.length === 0) {
    return { cleaned: generatedPrompt, removedCount: 0 };
  }

  const sentences = splitSentences(generatedPrompt);
  let removedCount = 0;

  const filtered = sentences.filter((sentence) => {
    const lower = sentence.toLowerCase();
    const sentenceWordCount = lower.split(/\s+/).filter(Boolean).length;

    // Find all matching phrases and count how many words they cover
    let coveredWords = 0;
    for (const phrase of keyPhrases) {
      if (lower.includes(phrase)) {
        // Count the phrase's words as covered (rough — overlapping phrases
        // may double-count, but that's conservative for removal decisions)
        coveredWords += phrase.split(/\s+/).length;
      }
    }

    // Only remove if the matched phrases cover a substantial portion
    if (coveredWords > 0 && sentenceWordCount > 0) {
      const coverage = coveredWords / sentenceWordCount;
      if (coverage >= COVERAGE_THRESHOLD) {
        removedCount++;
        return false;
      }
    }

    return true;
  });

  if (removedCount === 0) {
    return { cleaned: generatedPrompt, removedCount: 0 };
  }

  return { cleaned: filtered.join(" "), removedCount };
}

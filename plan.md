# Plan: Auto-set target market for non-English-speaking countries

## Goal
For users in non-English-speaking countries, skip the target market question entirely and auto-set `location_target = "international"`. Only show the target market card to users in English-speaking countries where local/national are genuinely viable.

## Why
- All generated content (demo pages, AI agents, offer copy) is in English
- Pricing is calibrated for English-speaking markets
- Non-English-speaking country users only have one viable option anyway
- Removes analysis paralysis — one fewer decision for users who have no real choice

---

## Changes

### 1. Add `ENGLISH_SPEAKING_COUNTRIES` constant
**File:** `src/types/start-business.ts`

Add a set of English-speaking country names (matching what users type during onboarding):
```
UK, United Kingdom, England, Scotland, Wales, US, USA, United States, America,
Canada, Australia, New Zealand, Ireland, South Africa
```

Export as `ENGLISH_SPEAKING_COUNTRIES` — a `Set<string>` with lowercase values for case-insensitive matching.

Also export a helper: `isEnglishSpeakingCountry(country: string | null): boolean` that normalizes and checks.

### 2. Update business strategist prompt
**File:** `src/lib/ai/business-strategist-prompt.ts`

**a)** Compute `isEnglishSpeaking` from `profile.location_country` at the top of `buildBusinessStrategistPrompt()` using the new helper.

**b)** Inject the result into the prompt template as a new variable:
```
User's country is English-speaking: ${isEnglishSpeaking ? "YES" : "NO"}
```

**c)** Replace the "ALWAYS COLLECT" and "TARGET MARKET GUIDANCE" sections with:

```
### TARGET MARKET LOGIC (both paths)

**If the user's country is English-speaking (YES above):**
- Call request_target_market() to let them choose: local, national, or international. All options are viable.

**If the user's country is NOT English-speaking (NO above):**
- Do NOT call request_target_market(). Do NOT show a card.
- Instead, immediately call save_collected_answers({ updates: { location_target: "international" } }).
- Tell the user (naturally, in 2-3 sentences): since all your demo pages, AI agents, and content are built in English, you'll be targeting English-speaking businesses — UK roofers, US dentists, Australian landscapers. These markets pay premium monthly fees and you can sell to them remotely. This is where the money is.
- Then proceed to run the analysis.
```

**d)** Remove the old "TARGET MARKET GUIDANCE" subsection entirely — it's now merged into the logic above.

**e)** Update the SEQUENCE line to say:
```
Collect all path-specific fields first, THEN handle target market (auto-set or ask), THEN run analysis.
```

### 3. Update Serge prompt
**File:** `src/lib/ai/serge-prompt.ts`

In the `## Location Awareness — CRITICAL DISTINCTION` section, add under the "international" scoping rule:
```
- **auto-set international**: If target = international and the user is in a non-English-speaking country, this was auto-set. Treat identically to an explicit international selection.
```

No other Serge changes needed — it already handles `international` correctly.

### 4. No component changes needed

- `TargetMarketCard` stays as-is — it's still used for English-speaking country users
- `request_target_market` tool stays as-is — still called for English-speaking users
- `save_collected_answers` already supports `location_target`
- `LOCATION_TARGET_OPTIONS` stays as-is
- All context builders already receive and use `location_target`
- The settings/profile card doesn't show target market (it's per-system, not per-profile)

### 5. No workflow or schema changes needed

The auto-save uses the existing `save_collected_answers` tool with `location_target: "international"` — the exact same value the card would produce. All downstream workflows already handle this value.

---

## Files touched (3 total)
1. `src/types/start-business.ts` — add constant + helper
2. `src/lib/ai/business-strategist-prompt.ts` — update branching logic
3. `src/lib/ai/serge-prompt.ts` — minor clarification (optional but clean)

## Not touched
- No component changes
- No workflow changes
- No schema changes
- No database changes
- No API route changes

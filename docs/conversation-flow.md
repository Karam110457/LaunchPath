# LaunchPath Conversation Flow

Full documentation of the question flow, branching logic, data collection, and how everything connects from onboarding through to system generation.

---

## 1. Onboarding

The user completes a onboarding form before the chat starts. This data is stored in `user_profiles` and is **read-only** throughout the conversation — it is never re-asked.

### Fields collected

| Field | Type | Values |
|---|---|---|
| `current_situation` | enum | `complete_beginner`, `consumed_content`, `tried_no_clients`, `has_clients` |
| `time_availability` | enum | `under_5`, `5_to_15`, `15_to_30`, `30_plus` |
| `revenue_goal` | enum | `500_1k`, `1k_3k`, `3k_5k`, `5k_10k_plus` |
| `outreach_comfort` | enum | `never_done`, `nervous_willing`, `fairly_comfortable`, `love_sales` |
| `technical_comfort` | enum | `use_apps`, `used_tools`, `built_basic`, `can_code` |
| `blockers` | string[] | `no_offer`, `cant_find_clients`, `scared_delivery`, `cant_build`, `overwhelmed`, `keep_switching` |

### DB write
`user_profiles` — one row per user, written at onboarding completion.

### Effect on the conversation
The agent receives all six fields in its system prompt at the start of every message. It uses them to:
- Determine which **conversation path** to follow (see §3)
- Decide whether to collect `delivery_model` and `pricing_direction` (see §4)
- Calibrate tone, examples, and strategic advice throughout

---

## 2. Session Initialisation

After onboarding, the user is sent to `/start/[systemId]`. A `user_systems` row is created (or already exists) at this point.

### First message
The client sends the literal string `[CONVERSATION_START]` as the first user message. The agent intercepts this, does **not** treat it as a real message, and instead opens with a tailored 4–6 sentence intro based on the profile — then immediately calls the first tool for the user's path.

### Session state (`user_systems` fields tracked in-flight)

The agent always has a `describeCollectedState()` summary injected into its system prompt, listing every field that has already been saved to `user_systems`. This prevents re-asking questions.

Saveable fields (via `save_collected_answers`):

| Field | Meaning |
|---|---|
| `intent` | What goal the user wants from the system |
| `direction_path` | Internal routing label |
| `industry_interests` | Up to 2 industries of interest |
| `own_idea` | Whether they have a niche idea or want AI to find one |
| `tried_niche` | Niche they previously attempted |
| `what_went_wrong` | Their primary challenge |
| `growth_direction` | Whether to fix current niche or pivot |
| `current_niche` | Their existing niche (has_clients path) |
| `current_clients` | Freeform: how many clients, what they pay |
| `current_pricing` | Parsed from current_business freeform |
| `delivery_model` | How they want to deliver the service |
| `pricing_direction` | Their pricing approach preference |
| `location_city` | Where they're based |
| `location_target` | Where they want to find clients |

---

## 3. Conversation Paths

The path is determined entirely by `profile.current_situation`. There are three paths.

---

### PATH A — Beginner
**Triggers**: `current_situation = complete_beginner` OR `consumed_content`

These users have no prior business experience or have studied but not started. The goal is to identify a niche from scratch.

**Sequence of tool calls:**

```
1. request_intent_selection()
   → Emits option card: "What's the goal for this system?"
   → Saves: intent

2. request_industry_interests()
   → Emits multi-select card (max 2): industry areas of interest
   → Saves: industry_interests

3. request_own_idea()
   → Emits option card: "Find me the best opportunity" OR "I have an idea"
   → If "Find me the best opportunity" → saves own_idea = "__find_for_me__"
   → If "I have an idea" → saves own_idea = "__has_idea__"
     └─ Then calls: request_own_idea_text()
        → Emits text input: "What's your niche idea?"
        → Saves: own_idea (overwrites with actual idea text)

[CONDITIONAL — see §4]

4. run_niche_analysis()   ← only after all required fields saved
```

---

### PATH B — Stuck (tried, no clients)
**Triggers**: `current_situation = tried_no_clients`

These users have attempted to build a business before but couldn't get clients. The goal is to diagnose what went wrong and decide whether to fix the current niche or try a new one.

**Sequence of tool calls:**

```
1. request_intent_selection()
   → Saves: intent

2. request_tried_niche()
   → Emits text input: "What niche have you been working in?"
   → Saves: tried_niche

3. request_what_went_wrong()
   → Emits option card: "What's been the biggest challenge?"
   → Options include: couldn't find prospects, no clear offer, couldn't deliver, etc.
   → Saves: what_went_wrong

4. request_fix_or_pivot(tried_niche)
   → Emits personalised option card using the tried_niche value:
     "Do you want to fix your approach in [tried_niche], or try something different?"
   → Saves: growth_direction = "fix" OR "pivot"

   IF growth_direction = "pivot":
     └─ 4a. request_industry_interests()
            → Saves: industry_interests

[CONDITIONAL — see §4]

5. run_niche_analysis()   ← only after all required fields saved
```

---

### PATH C — Has Clients
**Triggers**: `current_situation = has_clients`

These users already have an existing business and want to scale or expand.

**Sequence of tool calls:**

```
1. request_intent_selection()
   → Saves: intent

2. request_current_business()
   → Emits multiline text input: "Tell me about your current setup"
   → Hint: include niche, client count, pricing
   → Saves: current_niche, current_clients, current_pricing
     (agent parses the freeform response and saves sub-fields)

3. request_growth_direction()
   → Emits option card: "What do you want to do?"
   → Saves: growth_direction (e.g., "scale_current", "new_niche", "add_service")

   IF growth_direction = "new_niche":
     └─ 3a. request_industry_interests()
            → Saves: industry_interests

[CONDITIONAL — see §4]

4. run_niche_analysis()   ← only after all required fields saved
```

---

## 4. Conditional Data Collection (All Paths)

After collecting path-specific fields but **before** running niche analysis, the agent collects conditional fields. These are gated on the **onboarding profile** data:

### Delivery model
- **Condition**: `profile.time_availability !== "under_5"`
- **Tool**: `request_delivery_model(mode)`
  - `mode = "simple"` if `time_availability = "5_to_15"`
  - `mode = "full"` if `time_availability` is `"15_to_30"` or `"30_plus"`
- Simple mode shows 2 options (lighter delivery approaches)
- Full mode shows the complete range including hands-on service delivery
- **Saves**: `delivery_model`

### Pricing direction
- **Condition**: `profile.revenue_goal IN ["3k_5k", "5k_10k_plus"]`
- **Tool**: `request_pricing_direction(mode)`
  - `mode = "standard"` if `revenue_goal = "3k_5k"`
  - `mode = "expanded"` if `revenue_goal = "5k_10k_plus"`
- Standard shows conservative pricing options
- Expanded shows aggressive/premium pricing options
- **Saves**: `pricing_direction`

### Location (always collected)
- **Condition**: none — always runs for every user
- **Tool**: `request_location()`
- Emits a location card (city + target market fields)
- **Saves**: `location_city`, `location_target`

### Collection order
```
[path-specific fields] → delivery_model (if eligible) → pricing_direction (if eligible) → location → run_niche_analysis
```

---

## 5. Niche Analysis

### Trigger
`run_niche_analysis()` — called only when all required fields for the path are saved.

### What it does
1. Emits a **progress-tracker card** with 7 steps ("Analysing your profile", "Scanning 70+ validated niches", etc.)
2. Re-fetches the latest `user_systems` and `user_profiles` rows from the DB (ensures freshness after saves)
3. Calls `buildUserContext()` to assemble a structured prompt for the Serge agent
4. Runs `mastra.getAgent("serge").generate(userContext, { structuredOutput: { schema: nicheAnalysisOutputSchema } })`
5. While the LLM runs, timed progress intervals (~10s total, 7 steps) animate the progress card
6. On completion, marks all steps done

### Special case: `keep_switching` blocker
If `profile.blockers` includes `"keep_switching"`, `recommendationCount = 1` (returns one niche only, not three). This prevents analysis paralysis.

### Serge agent inputs (`buildUserContext`)
Passes the full profile + system fields:
- Time, outreach comfort, technical comfort, revenue goal, current situation, blockers
- Intent, direction path, industry interests, own idea, tried niche, what went wrong
- Current niche/clients/pricing, growth direction, delivery model, pricing direction
- Location city + target

### Output
The Serge agent returns structured JSON matching `nicheAnalysisOutputSchema`. Each recommendation contains:
- `niche` — the market name
- `score` — total score (0–100)
- `target_segment` — `{ description, why }`
- `bottleneck` — the pain point being solved
- `strategic_insight` — why this market is strong right now
- `your_solution` — what the AI service does
- `revenue_potential` — `{ per_client, target_clients, monthly_total }`
- `why_for_you` — personalised fit explanation
- `ease_of_finding` — how to locate prospects
- `segment_scores` — `{ roi_from_service, can_afford_it, guarantee_results, easy_to_find, total }`

### DB write
`user_systems.ai_recommendations` — array of recommendation objects

### Card emitted
`score-cards` card with `id = "niche-results"` — shows all recommendations as interactive score cards with select buttons.

---

## 6. Niche Selection

### User action
User clicks a score card's "Choose this niche" button.

### Message sent to agent
`[niche chosen: {...full recommendation JSON...}]`

### Agent response
1. Parses the JSON
2. Calls `save_niche_choice({ recommendation })`:
   - Writes `user_systems.chosen_recommendation` to DB
   - **Fire-and-forget**: calls `preGenerateOfferForChat(systemId, profileId)` — starts the offer workflow in the background immediately, without waiting for the agent's next step
3. Acknowledges the choice in 2–3 sentences, references the chosen niche by name
4. Calls `generate_offer()`

---

## 7. Offer Generation

### Trigger
`generate_offer()` — called immediately after `save_niche_choice`.

### Pre-generation check
The tool first checks `user_systems.offer`. If a valid pre-generated offer already exists (triggered by `save_niche_choice`), it returns that immediately — no LLM call needed.

### If no pre-generated offer
Runs the **offer-generation workflow** (Mastra):

```
Workflow: offer-generation
Steps:
  1. prepare-prompts          → "Reading your niche and profile..."
  2. generate-transformation  → "Writing your transformation story..."  [parallel]
  3. generate-guarantee       → "Crafting your guarantee..."            [parallel]
  4. generate-pricing         → "Setting your pricing..."               [parallel]
  5. assemble-offer           → "Assembling your offer..."
  6. validate-offer           → "Final review..."
```

Parallel steps (2, 3, 4) run concurrently. The workflow streams `workflow-step-start` and `workflow-step-result` events which the chat tool maps to progress card updates.

### Workflow inputs
- `chosenRecommendation` — full niche recommendation object from DB
- `profile` — `{ time_availability, revenue_goal, blockers }`
- `answers` — `{ delivery_model, pricing_direction, location_city }` from `user_systems`

### Workflow outputs (assembled offer fields)
| Field | Description |
|---|---|
| `segment` | Target segment description |
| `transformation_from` | Where the client is now (the pain) |
| `transformation_to` | Where they'll be after (the outcome) |
| `system_description` | What the AI service actually delivers |
| `guarantee_text` | The guarantee copy |
| `guarantee_type` | Type of guarantee (results, refund, etc.) |
| `pricing_setup` | Setup fee in £ |
| `pricing_monthly` | Monthly fee in £ |
| `pricing_rationale` | Reasoning for the price points |
| `delivery_model` | Delivery model (passed through from answers) |

### DB write
`user_systems.offer` — full assembled offer object

---

## 8. Offer Building — 3 Exchanges

After `generate_offer()` returns, the agent walks through the offer in **3 sequential exchanges**, one per turn.

### Exchange 1 — The Story
**Tool**: `show_offer_story()`

Emits an **editable-content card** (`id = "offer-story"`) with 4 fields:
- `segment` — Target Segment
- `transformation_from` — Where they are now
- `transformation_to` — Where they'll be
- `system_description` — What you deliver

User can edit any field inline before confirming.

**User response**: `[offer-story confirmed: {"segment":"...","transformation_from":"...","transformation_to":"...","system_description":"..."}]`

**Agent action**: Parses JSON → calls `save_offer_section({ updates: <parsed values> })` → DB merges into `user_systems.offer`

---

### Exchange 2 — The Commitment
**Tool**: `show_offer_pricing()`

Emits an **editable-content card** (`id = "offer-pricing"`) with 3 fields:
- `pricing_setup` — Setup Fee (£, number input)
- `pricing_monthly` — Monthly Fee (£, number input)
- `guarantee_text` — Guarantee (textarea)

**User response**: `[offer-pricing confirmed: {"pricing_setup":"...","pricing_monthly":"...","guarantee_text":"..."}]`

**Agent action**: Parses JSON → calls `save_offer_section({ updates: <parsed values> })` → DB merges into `user_systems.offer`

---

### Exchange 3 — The Review
**Tool**: `show_offer_review()`

Emits an **offer-summary card** (`id = "offer-review"`) showing the complete offer read-only, with a "Build My System →" CTA button.

**User response**: `[build-system: confirmed]`

**Agent action**: Immediately calls `generate_system()` — no preamble text, the progress card handles communication.

---

## 9. System Generation

### Trigger
`generate_system()` — called after offer is confirmed.

### What it does
1. Emits a **progress-tracker card** with 2 steps:
   - `generate-demo-config` — "Designing your demo page..."
   - `validate-demo-config` — "Finalising your system..."

2. Runs the **demo-builder workflow** (Mastra):

```
Workflow: demo-builder
  Step 1: generate-demo-config  → LLM generates demo page configuration
  Step 2: validate-demo-config  → pass-through (placeholder for future validation)
```

### Workflow inputs
- `chosenRecommendation` — full niche object from DB
- `offer` — complete offer fields: segment, transformation_from/to, system_description, guarantee_text/type, pricing_setup/monthly/rationale, delivery_model

### Workflow output
`demo_config` — structured JSON describing the demo page content (hero copy, features, CTA, social proof, etc.)

### DB writes
```
user_systems:
  demo_config  → full demo configuration JSON
  demo_url     → "/demo/{systemId}"
  status       → "complete"
```

### Card emitted
`system-ready` card with:
- `demoUrl` — the live demo URL
- `offer` — the full assembled offer (for displaying stats)

---

## 10. Freeform Response Handling

When a user types a freeform message instead of using an option card, the agent calls:

```
interpret_freeform_response({
  expected_field: "intent",        // the field being collected
  user_text: "what the user typed",
  valid_values: ["first_client", "replace_income", ...]  // valid enum values
})
```

This calls Claude Haiku (`claude-haiku-4-5-20251001`) to extract the structured value from freeform text. Returns `{ field, value }` where value is `null` if it couldn't map.

- If `value` is not null: agent calls `save_collected_answers` and continues
- If `value` is null: agent asks the user to pick from the card

---

## 11. Dynamic Cards (Ad-hoc)

For questions not covered by a specific `request_*` tool, the agent has two general-purpose tools:

### `present_choices(id, question, options, allow_multiple, max_select)`
- Emits an option-selector card with `id = "dyn-{id}"`
- Response format: `[dyn-{id} selected: {value}]`
- NOT saved to DB — conversational context only
- Must NOT use the same ID as any standard field name

### `request_input(id, question, placeholder, hint, multiline)`
- Emits a text-input card with `id = "dyn-{id}"`
- Response format: `[dyn-{id}: "what the user typed"]`
- NOT saved to DB — conversational context only

These are used for any ad-hoc strategic discussion the agent needs to facilitate that doesn't map to a persistent data field.

---

## 12. Session Resume Behaviour

The `describeCollectedState()` function summarises everything already saved in `user_systems` and injects it into the agent's system prompt on every request. Combined with three terminal state flags:

| Flag | Condition | Effect |
|---|---|---|
| `hasNicheChosen` | `user_systems.chosen_recommendation` exists | Prompt reminder to call `generate_offer()` |
| `hasOffer` | `user_systems.offer` exists | Prompt reminder to start Exchange 3 review |
| `isComplete` | `user_systems.status = "complete"` | Prompt switches to "reviewing completed business" mode |

This means if a user drops off mid-flow and returns, the agent picks up from the right point without re-asking any collected data.

---

## 13. Complete Data Flow Diagram

```
ONBOARDING
user_profiles:
  current_situation, time_availability, revenue_goal,
  outreach_comfort, technical_comfort, blockers
         │
         ▼
CONVERSATION START → [CONVERSATION_START] trigger
         │
         ▼
PATH SELECTION (based on current_situation)
         │
    ┌────┴────────────┬──────────────────┐
    │                 │                  │
BEGINNER           STUCK            HAS CLIENTS
intent             intent            intent
industry_interests tried_niche       current_business
own_idea           what_went_wrong   growth_direction
[own_idea_text?]   fix_or_pivot      [industry_interests?]
                   [industry_interests?]
    │                 │                  │
    └────────┬─────────────────────────-─┘
             │
             ▼
CONDITIONAL COLLECTION
[delivery_model?]    ← if time_availability ≠ under_5
[pricing_direction?] ← if revenue_goal ≥ 3k_5k
location             ← always
             │
             ▼
NICHE ANALYSIS
  → Serge agent call
  → user_systems.ai_recommendations = [...]
  → score-cards card emitted
             │
             ▼
NICHE SELECTION
  [niche chosen: {...}]
  → user_systems.chosen_recommendation = {...}
  → preGenerateOfferForChat() ← fire & forget
             │
             ▼
OFFER GENERATION
  → offer-generation workflow (6 steps, 2-4 parallel)
  → user_systems.offer = { transformation_from/to, segment,
                            system_description, guarantee_text/type,
                            pricing_setup/monthly/rationale, delivery_model }
             │
             ▼
OFFER BUILDING
  Exchange 1: show_offer_story() → user edits/confirms → save_offer_section()
  Exchange 2: show_offer_pricing() → user edits/confirms → save_offer_section()
  Exchange 3: show_offer_review() → user clicks "Build My System"
             │
             ▼
SYSTEM GENERATION
  → demo-builder workflow (2 steps)
  → user_systems.demo_config = {...}
  → user_systems.demo_url = "/demo/{systemId}"
  → user_systems.status = "complete"
  → system-ready card emitted
```

---

## 14. Tool Reference

| Tool | Type | Saves to DB | Emits card |
|---|---|---|---|
| `request_intent_selection` | Input request | No | option-selector |
| `request_industry_interests` | Input request | No | option-selector (multi) |
| `request_own_idea` | Input request | No | option-selector |
| `request_own_idea_text` | Input request | No | text-input |
| `request_tried_niche` | Input request | No | text-input |
| `request_what_went_wrong` | Input request | No | option-selector |
| `request_fix_or_pivot` | Input request | No | option-selector |
| `request_current_business` | Input request | No | text-input (multiline) |
| `request_growth_direction` | Input request | No | option-selector |
| `request_delivery_model` | Input request | No | option-selector |
| `request_pricing_direction` | Input request | No | option-selector |
| `request_location` | Input request | No | location |
| `present_choices` | Dynamic | No | option-selector |
| `request_input` | Dynamic | No | text-input |
| `save_collected_answers` | Save | `user_systems` | None |
| `interpret_freeform_response` | Utility | No | None |
| `run_niche_analysis` | Action | `user_systems.ai_recommendations` | progress-tracker, score-cards |
| `save_niche_choice` | Save | `user_systems.chosen_recommendation` | None (triggers pre-gen) |
| `generate_offer` | Action | `user_systems.offer` | progress-tracker |
| `save_offer_section` | Save | `user_systems.offer` (merge) | None |
| `show_offer_story` | Offer card | No | editable-content |
| `show_offer_pricing` | Offer card | No | editable-content |
| `show_offer_review` | Offer card | No | offer-summary |
| `generate_system` | Action | `user_systems.demo_config/demo_url/status` | progress-tracker, system-ready |

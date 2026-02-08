# Terminology Refactor: Offer Thesis / Delivery System / Revenue Engine

## Changed file tree

```
src/lib/constants/
  stages.ts                    (NEW — central labels, descriptions, key mapping)
src/components/waitlist/
  Hero.tsx                     (hero subline)
  Trust.tsx                    (bullets)
  Solution.tsx                 (cards: titles, descriptions, uses STAGES)
  FAQ.tsx                      (2 answers)
src/app/
  terms-of-service/page.tsx    (3 mentions)
  privacy-policy/page.tsx      (2 mentions)
LaunchPath — Product Requirements Document (v1).md  (full pass + terminology table)
docs/
  terminology-refactor-summary.md  (this file)
```

## Internal key mappings (unchanged for API/DB)

| Display (user-facing)   | Internal key   |
|-------------------------|----------------|
| Offer Thesis            | `offer_blueprint` |
| Delivery System         | `build_plan`       |
| Revenue Engine          | `sales_pack`       |

Code in `credits.ts`, `ai-safety.ts`, `rls-policies.sql`, and threat-model continues to use the internal keys. Use `getStageLabel(internalKey)` from `@/lib/constants/stages` when rendering UI.

## Exact copy changes (before → after)

### Hero
- **Before:** Get one sellable offer, a step-by-step build plan, and a sales pack — in one guided flow. No endless research.
- **After:** One offer thesis, one delivery system, one revenue engine — in one guided flow. No endless research.

### Trust
- **Before:** LaunchPath sells execution: one offer, one build plan, one sales pack.
- **After:** LaunchPath sells execution: one offer thesis, one delivery system, one revenue engine.

### Solution (How it Works) — cards
| Stage   | Title (before → after) | Description (before → after) | Detail (before → after) |
|--------|------------------------|------------------------------|--------------------------|
| Step 01 | Offer Blueprint → **Offer Thesis** | We help you pick ONE sellable idea. No more guessing… → **One sellable idea, validated. No guessing what the market wants.** | Output: Validated Offer Doc → **Validated offer doc** |
| Step 02 | Build Plan → **Delivery System** | A step-by-step blueprint to build your system… → **Step-by-step build with tools and templates. Ship, don’t research.** | Output: Step-by-step Guide → **Step-by-step guide** |
| Step 03 | Sales Pack → **Revenue Engine** | Everything you need to sell it… → **Scripts, outreach, objection handling. Start real conversations.** | Output: Outreach Scripts → **Outreach scripts** |

- Section subline: "LaunchPath removes the noise. We guide you through a fixed flow…" → **LaunchPath removes the noise. One fixed flow to your first sale.**

### FAQ
- **Q: Is this a course or a software tool?**  
  - **Before:** …a validated offer one-pager, a step-by-step build plan (tools and templates), and a sales pack (scripts and outreach).  
  - **After:** …an offer thesis (validated one-pager), a delivery system (step-by-step build with tools and templates), and a revenue engine (scripts and outreach).
- **Q: Do I need to know how to code?**  
  - **Before:** The build plans use no-code…  
  - **After:** The delivery system uses no-code…

### Terms of Service
- (e.g., offer blueprints, build plans, sales packs) → **(e.g., offer thesis, delivery system, revenue engine)**
- offer one-pagers, step-by-step build plans, and sales packs → **offer thesis, delivery system, and revenue engine**
- (e.g., offer blueprints, build plans) → **(e.g., offer thesis, delivery system, revenue engine)**

### Privacy Policy
- create sellable AI offers, build plans, and sales packs → **create sellable AI offers via an offer thesis, delivery system, and revenue engine**
- (e.g., offer blueprints, build plans) → **(e.g., offer thesis, delivery system)**

### PRD
- All instances of **Offer Blueprint** → **Offer Thesis**
- All instances of **Build Plan** → **Delivery System**
- All instances of **Sales Pack** / **Sales Plan** → **Revenue Engine**
- **blueprint** (artifact/object) → **offer thesis** where it denotes the primary saved object
- New **Terminology (user-facing vs internal keys)** table added at top of PRD

## Rationale (conversion impact)

- **Offer Thesis** — Frames the output as a clear, defensible position (thesis) rather than a generic “blueprint.” Raises perceived strategic value and fits “what to sell” without sounding like a template.
- **Delivery System** — Emphasizes execution and repeatable delivery instead of a one-off “plan.” Aligns with operator language and “how to build it” in a premium, systems-oriented way.
- **Revenue Engine** — Positions the sales artifact as the mechanism that drives revenue, not a static “pack.” Supports premium positioning and “how to sell it” with an execution-first, outcome focus.

Overall: clearer outcomes, fewer generic SaaS terms, consistent premium tone, and a single constants file so future copy and nav updates stay in sync.

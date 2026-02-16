# LaunchPath: Complete User Flow

## Overview

Two distinct phases. The **Onboarding Profile** captures who you are (permanent, one-time). The **Start Business** flow determines what you're building (per-project, repeatable). The profile shapes the business flow — different users get different questions, different framing, and different AI recommendations.

---

## Phase 1: Onboarding Profile

**When:** First login only. Stored permanently. Editable from settings.

**Purpose:** Capture stable traits about the person that don't change between projects. Every answer feeds the AI's recommendation engine and shapes the Start Business flow.

**UI Pattern:** One question per screen. Clean, conversational. Progress bar at top. No back-and-forth chat — just clean cards with options.

---

### Question 1: Time Availability

**Screen text:** "How many hours per week can you realistically put into this?"

| Option | Label |
|--------|-------|
| A | Under 5 hours (side project) |
| B | 5–15 hours (serious side hustle) |
| C | 15–30 hours (part-time focus) |
| D | 30+ hours (full-time) |

**What this controls downstream:**
- Under 5 hrs → AI only recommends automated, low-touch delivery models. Skips delivery model question in Start Business. Auto-selects "build once, sell to many."
- 5–15 hrs → AI recommends systematised niches. Shows simplified delivery model question.
- 15–30 hrs → Full question set. Balanced recommendations.
- 30+ hrs → Full question set. Can recommend high-touch, consultative niches. Higher client volume targets.

---

### Question 2: Outreach Comfort

**Screen text:** "How do you feel about reaching out to businesses you don't know?"

| Option | Label |
|--------|-------|
| A | Never done it, not sure I can |
| B | Nervous but I'll push through |
| C | Done it before, fairly comfortable |
| D | Love sales, it's my strength |

**What this controls downstream:**
- Level A–B → AI recommends demo-led selling niches (the demo page does the convincing, user just sends the link). Start Business flow emphasises "the demo sells for you." Guarantee framing is risk-removal focused.
- Level C–D → AI can recommend consultative, higher-ticket niches. Start Business flow includes more on sales positioning and objection handling. Performance-based pricing becomes an option.

---

### Question 3: Technical Comfort

**Screen text:** "How comfortable are you with technology?"

| Option | Label |
|--------|-------|
| A | I can use apps but don't build things |
| B | I've used tools like Zapier, Canva, or Notion |
| C | I've built basic websites or automations |
| D | I can code or have built software |

**What this controls downstream:**
- Level A → Maximum hand-holding. System generates everything. No customisation options shown. Simpler UI throughout.
- Level B → Standard experience. Pre-built with light customisation options.
- Level C–D → Shows advanced options like editing agent instructions, customising demo page, tweaking form fields.

---

### Question 4: Revenue Goal

**Screen text:** "What's your monthly income target from this?"

| Option | Label |
|--------|-------|
| A | £500–1,000 (first meaningful win) |
| B | £1,000–3,000 (real side income) |
| C | £3,000–5,000 (replace my salary) |
| D | £5,000–10,000+ (build a real business) |

**What this controls downstream:**
- £500–1k → AI recommends: "1–2 clients at £300–500/month." Skips detailed pricing questions in Start Business. Simple, directive pricing recommendation.
- £1–3k → AI recommends: "2–4 clients at £500–800/month." Standard pricing question.
- £3–5k → AI recommends multiple paths. Start Business asks whether they prefer fewer high-ticket or more mid-ticket clients.
- £5k+ → Full pricing strategy. Start Business includes questions on pricing model (retainer vs performance-based vs hybrid). AI shows revenue modelling.

---

### Question 5: Current Situation

**Screen text:** "Where are you right now?"

| Option | Label |
|--------|-------|
| A | Complete beginner — never tried making money online |
| B | I've consumed courses/content but haven't started |
| C | I've tried but haven't landed a paying client yet |
| D | I have 1–2 clients but want to scale |

**What this controls downstream:**

This is the single most important segmentation signal. It fundamentally changes the Start Business flow.

- **A or B (Beginner):** Start Business asks about industry interests and preferences. AI provides maximum direction. Recommendations are simplified to 1 primary recommendation (not 3). Tone is encouraging and directive: "Here's what to do."
- **C (Tried, stuck):** Start Business asks what they've tried and what went wrong. AI diagnoses the problem and rebuilds the approach. Tone is diagnostic: "Here's what was missing."
- **D (Has clients):** Start Business asks about current niche and what they want to add. AI focuses on scaling and systemising. Tone is strategic: "Here's how to grow."

---

### Question 6: What's Blocked You

**Screen text:** "What's the main thing that's held you back? Pick all that apply."

| Option | Label |
|--------|-------|
| A | I don't know what niche to pick |
| B | I don't know what to sell or how to price it |
| C | I can't build anything technical |
| D | I've built things but can't find clients |
| E | I'm scared I'll sell something I can't deliver |
| F | I keep switching between ideas and never commit |

**What this controls downstream:**

Each blocker triggers specific interventions throughout the Start Business flow:

- **A (no niche):** AI leads with niche discovery. Explains reasoning behind each recommendation in detail.
- **B (no offer):** Offer builder step is expanded with extra explanation and examples.
- **C (can't build):** System emphasises "we build everything for you" at every step. Shows preview of finished system early.
- **D (can't find clients):** Prospect generation and outreach strategy get extra emphasis. AI leads with "here's why your outreach wasn't working."
- **E (scared of delivery):** AI adds a reassurance step after niche selection showing exactly what gets delivered and why it works every time. Demo preview shown early.
- **F (idea switching):** AI shows only 1 recommendation instead of 3. Adds commitment framing: "This is your best path based on 200 companies' data. Trust the process."

---

### Onboarding Complete Screen

**Screen text:** "Got it. Here's your profile:"

Shows a summary card with all their answers. "Edit anytime in settings."

Primary CTA button: **"Start Your First Business →"**

This transitions directly into the Start Business flow.

---

---

## Phase 2: Start Business Flow

**When:** After onboarding (first time) or anytime from dashboard ("New System" button).

**Purpose:** Guide the user from "I don't know what to do" to "here's my niche, offer, segment, pricing, guarantee, and working demo page."

**How profile shapes this flow:** The Start Business flow is not a fixed sequence. It's a branching flow where the onboarding profile determines which questions appear, which get skipped, and how the AI frames every recommendation.

---

### Step 1: Intent

**Always shown. First screen of every Start Business flow.**

**Screen text:** "What's the goal for this system?"

| Option | Label |
|--------|-------|
| A | Get my first paying client |
| B | Add a new service to offer existing clients |
| C | Test a new niche idea |
| D | Build something to show in my content |

**Routing:**
- A → Full flow (most users)
- B → Skips niche discovery, asks about current clients instead
- C → Full flow but AI frames it as "let's validate this"
- D → Abbreviated flow, optimised for something that looks impressive fast

---

### Step 2: Direction Finding

**This step branches based on Profile Q5 (Current Situation).**

#### Path A: Beginners (Profile Q5 = A or B)

**Screen 2a: Industry interest**

*Only shown if Profile Q5 is Beginner AND they don't have a specific idea.*

**Screen text:** "Any of these interest you? Pick up to 2."

| Option | Label |
|--------|-------|
| A | Home services (roofing, cleaning, plumbing, HVAC, landscaping, pest control, pool) |
| B | Health & wellness (dental, physio, chiropractic, med spa) |
| C | Professional services (real estate, legal, accounting, insurance) |
| D | Automotive (repair shops, detailing, dealerships) |
| E | Food & hospitality (restaurants, catering, cafes, events) |
| F | I genuinely have no preference — surprise me |

**Screen 2b: Own idea check**

**Screen text:** "Do you already have a niche idea, or do you want me to find the best opportunity for you?"

| Option | Action |
|--------|--------|
| "Find me the best opportunity" | AI recommends based on profile + interests |
| "I have an idea:" [free text input] | AI evaluates their idea against the framework AND shows alternatives |

---

#### Path B: Tried But Stuck (Profile Q5 = C)

**Screen 2c: What you've tried**

**Screen text:** "What niche have you been working in or exploring?"

[Free text input]

**Screen 2d: What went wrong**

**Screen text:** "What's been the biggest challenge?"

| Option | Label |
|--------|-------|
| A | Couldn't find the right prospects to contact |
| B | Had conversations but couldn't close deals |
| C | Closed a client but couldn't deliver results |
| D | Got overwhelmed by everything and stopped |

[Optional free text: "Tell me more so I can help (optional)"]

**Screen 2e: Direction**

**Screen text:** "Do you want to:"

| Option | Action |
|--------|--------|
| "Fix what I was doing in [their niche]" | AI diagnoses and rebuilds their approach |
| "Try a completely different niche" | Routes to Screen 2a (interest picker) |

---

#### Path C: Has Clients (Profile Q5 = D)

**Screen 2f: Current business**

**Screen text:** "Tell me about your current setup."

- What niche are you in? [free text]
- How many clients do you have? [1 / 2 / 3–5]
- What do you charge per month? [free text]

**Screen 2g: Growth direction**

**Screen text:** "What do you want to do?"

| Option | Action |
|--------|--------|
| "Get more clients in my current niche" | AI optimises their current approach |
| "Add a new service for my existing clients" | AI identifies adjacent offerings |
| "Expand into a new niche entirely" | Routes to Screen 2a (interest picker) |

---

### Step 3: Delivery Model

**Conditionally shown based on Profile Q1 (Time).**

| Profile Time | What happens |
|-------------|-------------|
| Under 5 hrs | SKIP entirely. AI auto-selects "build once, sell to many." |
| 5–15 hrs | Show simplified version (see below) |
| 15+ hrs | Show full version (see below) |

**Simplified version (5–15 hrs):**

**Screen text:** "With your time, would you rather:"

| Option | Label |
|--------|-------|
| A | Sell a system clients use themselves (less time per client) |
| B | Do the work for clients (more hands-on but higher price) |

**Full version (15+ hrs):**

**Screen text:** "How do you want to deliver your service?"

| Option | Label | Description |
|--------|-------|-------------|
| A | Build once, sell to many | Build one system template, deploy to multiple clients. Most scalable. |
| B | Custom done-for-you | Build bespoke solutions per client. Higher price, more time. |
| C | Hybrid — start custom, then productise | Do it manually for first clients, then turn it into a repeatable system. |
| D | Not sure — help me decide | AI recommends based on your profile. |

---

### Step 4: Pricing Direction

**Conditionally shown based on Profile Q4 (Revenue Goal).**

| Revenue Goal | What happens |
|-------------|-------------|
| £500–1k | SKIP entirely. AI auto-recommends £300–500/month. |
| £1–3k | SKIP. AI recommends pricing range. |
| £3–5k | Show question below. |
| £5k+ | Show expanded question below. |

**Standard version (£3–5k goal):**

**Screen text:** "For pricing, do you lean toward:"

| Option | Label |
|--------|-------|
| A | Fewer clients paying £1,000–2,000+/month each |
| B | More clients at £300–500/month each |

**Expanded version (£5k+ goal):**

**Screen text:** "How do you want to structure your pricing?"

| Option | Label |
|--------|-------|
| A | Monthly retainer (£1,000–3,000/month per client) |
| B | Lower base + percentage of their growth |
| C | Volume play — many clients at £300–500/month |
| D | Help me figure out the best model |

---

### Step 5: Location

**Always shown.**

**Screen text:** "Where are you based? And where do you want to find clients?"

**Part 1:** "Your location:" [City/region input]

**Part 2:** "Target clients in:"

| Option | Label |
|--------|-------|
| A | My local area (within 50 miles) |
| B | Anywhere in my country |
| C | International / English-speaking countries |
| D | Doesn't matter |

---

### Step 6: AI Analysis

**This is the transition screen between questions and results. Not a question — a loading/processing experience.**

**What the user sees:**

```
Finding your opportunity...

✓ Analysing your profile
✓ Scanning 70+ validated niches
◻ Scoring market opportunities...
◻ Identifying bottlenecks...
◻ Evaluating segment fit...
◻ Calculating revenue potential...
◻ Building recommendations...
```

Each line animates in with a 2–3 second delay. Checkmarks fill progressively. Total time: 30–60 seconds.

**What happens behind the scenes:**

Single Sonnet 4.5 API call. System prompt contains the full Serge framework (niche analysis methodology, bottleneck identification, segment scoring with 4 criteria at 25% weight each, offer construction logic). User's profile answers and Start Business answers injected as context.

**AI output structure (JSON):**

```json
{
  "recommendations": [
    {
      "niche": "Window Cleaning",
      "score": 87,
      "target_segment": {
        "description": "$10–30k/month residential window cleaners",
        "why": "Big enough to afford you, small enough to need you"
      },
      "bottleneck": "Can't generate consistent residential leads without relying on word of mouth",
      "strategic_insight": "Top 1% use Google Local Service Ads and have systematic follow-up. The 99% rely entirely on referrals and seasonal demand.",
      "your_solution": "AI lead qualification system that pre-qualifies every enquiry before the business owner picks up the phone",
      "revenue_potential": {
        "per_client": "£500–1,500/month",
        "target_clients": 2,
        "monthly_total": "£1,000–3,000"
      },
      "why_for_you": "Personalised explanation based on their profile answers",
      "ease_of_finding": "High — Google Maps, Yelp, local directories, Facebook groups",
      "segment_scores": {
        "roi_from_service": 22,
        "can_afford_it": 20,
        "guarantee_results": 23,
        "easy_to_find": 22,
        "total": 87
      }
    }
  ],
  "reasoning": "Brief explanation of why these were chosen over other options"
}
```

**How many recommendations to show:**

| Condition | Show |
|-----------|------|
| Profile Q6 includes "I keep switching ideas" | 1 recommendation only (with "see alternatives" collapsed) |
| Profile Q5 = Complete beginner | 1 primary + 2 alternatives (collapsed by default) |
| Profile Q5 = Tried but stuck AND fixing same niche | 1 recommendation (rebuilt approach for their niche) |
| All other cases | 3 recommendations as cards |

---

### Step 7: Results Display

**Three recommendation cards (or one, depending on logic above).**

**Card layout:**

```
┌──────────────────────────────────────────┐
│  🏆 #1 RECOMMENDED                       │
│                                           │
│  Window Cleaning Lead System              │
│  Score: 87/100                            │
│                                           │
│  ■■■■■■■■■□ ROI potential                 │
│  ■■■■■■■■□□ Affordability                 │
│  ■■■■■■■■■□ Guarantee results             │
│  ■■■■■■■■■□ Easy to find                  │
│                                           │
│  Who you help:                            │
│  Residential window cleaners doing        │
│  $10–30k/month                            │
│                                           │
│  Problem you solve:                       │
│  Can't generate consistent leads          │
│  without relying on word of mouth         │
│                                           │
│  Revenue: £500–1,500/mo per client        │
│                                           │
│  Why this fits YOU:                       │
│  "With 15 hours/week and your comfort     │
│  reaching out, you can realistically      │
│  serve 2–3 clients in month 1. This       │
│  niche has a fast close cycle because     │
│  the demo sells itself..."               │
│                                           │
│  [Choose This Niche →]                    │
└──────────────────────────────────────────┘
```

**The "Why this fits YOU" section is the key differentiator.** It references their specific profile answers — time availability, outreach comfort, blockers, goals. This is what makes it feel intelligent and personal rather than generic.

**User action:** Clicks "Choose This Niche" → moves to Step 8.

---

### Step 8: Offer Builder

**This is a guided, step-by-step experience (not a single screen). Each sub-step appears one at a time with the AI's recommendation pre-filled and editable.**

---

#### Step 8a: Confirm Segment

**Screen text:**

> "Based on your profile and the data, I'm recommending you target:"
>
> **[Segment name]** — e.g., "Window cleaning companies doing £10–30k/month revenue"
>
> "These businesses can afford your service, will see fast ROI, and are easy to find. This is the sweet spot."

| Option | Action |
|--------|--------|
| "This makes sense — continue" | Proceed to 8b |
| "I'd prefer a different segment" | Shows alternative segments with brief reasoning |

---

#### Step 8b: The Transformation

**Screen text:**

> "You're not selling AI. You're selling a transformation:"
>
> **CURRENT STATE**
> [Description of the problem they face — e.g., "Your client wastes time on unqualified leads and has no predictable lead flow"]
>
> ↓
>
> **DESIRED STATE**
> [Description of the outcome — e.g., "Every lead is pre-qualified before they pick up the phone. Predictable enquiries every week."]
>
> **What you're building:**
> [One-sentence system description — e.g., "An AI lead qualification system that sits on their website and qualifies every enquiry automatically"]

| Option | Action |
|--------|--------|
| "This is clear — continue" | Proceed to 8c |
| "Help me refine this" | Opens brief chat to adjust the positioning |

---

#### Step 8c: Pricing

**What shows depends on Profile Q4 (Revenue Goal):**

**For £500–1k goals (simplified, no question asked):**

> "Here's your starting price:"
>
> **£400/month per client**
>
> "At this price, you need 2 clients to hit your £800–1,000/month goal. This is affordable for your target segment and easy to justify with results."
>
> "You can always increase pricing after you have proof."

**For £1–3k goals:**

> "Recommended pricing for this segment:"
>
> **Setup: £300 one-time**
> **Monthly: £500–800/month**
>
> "With 3 clients at £600/month, you hit £1,800. Leave room to increase as you get testimonials."

**For £3k+ goals (uses their answer from Step 4):**

Shows pricing model based on their preference (retainer vs performance vs volume), with specific numbers calculated for their target segment.

| Option | Action |
|--------|--------|
| "Use this pricing" | Proceed to 8d |
| "Adjust" | Inline editor to change numbers |

---

#### Step 8d: Guarantee

**Screen text:**

> "To close your first clients faster, use a guarantee that removes all their risk:"
>
> **Suggested guarantee:**
> "[Specific guarantee based on niche — e.g., 'If you don't see at least 10 qualified leads in your first 30 days, I'll work for free until you do.']"
>
> "You can offer this confidently because the system actually works. The demo proves it."

**Conditional addition — if Profile Q6 includes "scared I can't deliver":**

> 💡 "I know you're worried about delivering. Here's why this guarantee is safe: the AI system you're about to build runs automatically. It processed leads perfectly in testing. You're not promising to do the work yourself — you're promising the system will perform. And it will."

| Option | Action |
|--------|--------|
| "Use this guarantee" | Proceed to 8e |
| "Modify" | Inline text editor |
| "Skip guarantee for now" | Proceed without |

---

#### Step 8e: Offer Summary

**Screen text:**

> "Here's your complete offer:"

```
┌──────────────────────────────────────────┐
│  YOUR OFFER                               │
│                                           │
│  Niche: Window cleaning companies         │
│  Segment: £10–30k/month residential       │
│                                           │
│  Service: AI Lead Qualification System    │
│                                           │
│  Transformation:                          │
│  "Stop wasting time on unqualified leads  │
│  → every enquiry pre-qualified before     │
│  you pick up the phone"                   │
│                                           │
│  Pricing: £500/month                      │
│  Setup fee: £300 one-time                 │
│                                           │
│  Guarantee: 10 qualified leads in 30      │
│  days or I work free until you do         │
│                                           │
│  Delivery: Build once, deploy to many     │
│                                           │
│  Revenue target: 3 clients = £1,500/mo    │
└──────────────────────────────────────────┘
```

**CTA button:** **"Build My System →"**

This is the transition point. Clicking this moves into the system generation phase where the demo page, AI agent, and prospect list get built.

---

### Step 9: System Generation

**What the user sees:**

```
Building your system...

✓ Creating your AI agent (window cleaning specialist)
✓ Building your demo page
◻ Generating niche-specific form...
◻ Configuring lead scoring...
◻ Setting up tracking...
◻ Finding prospects in [location]...
◻ Writing personalised messages...
```

**What happens behind the scenes:**
1. AI agent created with niche-specific system prompt (based on selected niche + segment + offer)
2. Demo page generated with appropriate form fields for the niche
3. Unique URL created (demo.launchpath.ai/[username]/[system-slug])
4. Google Places API called to find prospects in target location
5. Sonnet 4.5 generates personalised messages for each prospect

**Duration:** 45–90 seconds (optimised for screen recording — not too fast, not too slow)

---

### Step 10: System Ready

**The payoff screen. Everything they got, all in one place.**

```
┌──────────────────────────────────────────┐
│  ✅ YOUR SYSTEM IS LIVE                   │
│                                           │
│  Demo Page                                │
│  demo.launchpath.ai/john/window-clean-87  │
│  [Try it yourself →] [Copy link]          │
│                                           │
│  ─────────────────────────────────────    │
│                                           │
│  25 Prospects Found                       │
│  In [location] matching your target       │
│  [View list →] [Export CSV]               │
│                                           │
│  ─────────────────────────────────────    │
│                                           │
│  25 Messages Ready                        │
│  Personalised for each prospect           │
│  [View & copy messages →]                 │
│                                           │
│  ─────────────────────────────────────    │
│                                           │
│  Your Offer Card                          │
│  [View your complete offer →]             │
│                                           │
│  ─────────────────────────────────────    │
│                                           │
│  What to do now:                          │
│  1. Try your own demo (click link above)  │
│  2. Copy your first message               │
│  3. Send it on LinkedIn                   │
│  4. Watch your dashboard for engagement   │
│                                           │
│  [Go to Dashboard →]                      │
└──────────────────────────────────────────┘
```

---

---

## Complete Branching Map

### How Profile Answers Route Through Start Business

```
PROFILE Q5 (Current Situation)
│
├── A/B: Beginner
│   ├── SB Step 2a: Industry interest picker
│   ├── SB Step 2b: Own idea check
│   │   ├── "Find me opportunity" → AI recommends
│   │   └── "I have an idea" → AI evaluates + shows alternatives
│   ├── SB Step 3: Delivery (IF time > 5hrs)
│   ├── SB Step 4: Pricing (IF goal > £3k)
│   ├── SB Step 5: Location
│   ├── SB Step 6: AI Analysis
│   ├── SB Step 7: Results (1 card if switcher, else 3)
│   ├── SB Step 8: Offer Builder (simplified for low goals)
│   ├── SB Step 9: System Generation
│   └── SB Step 10: System Ready
│
├── C: Tried But Stuck
│   ├── SB Step 2c: What niche you tried
│   ├── SB Step 2d: What went wrong
│   ├── SB Step 2e: Fix or pivot?
│   │   ├── "Fix" → AI diagnoses and rebuilds
│   │   └── "Pivot" → Routes to industry picker (2a)
│   ├── SB Step 3: Delivery (IF time > 5hrs)
│   ├── SB Step 4: Pricing (IF goal > £3k)
│   ├── SB Step 5: Location
│   ├── SB Step 6: AI Analysis (diagnostic tone)
│   ├── SB Step 7: Results (1 card with rebuilt approach)
│   ├── SB Step 8: Offer Builder (with diagnosis context)
│   ├── SB Step 9: System Generation
│   └── SB Step 10: System Ready
│
└── D: Has Clients
    ├── SB Step 2f: Current business details
    ├── SB Step 2g: Growth direction
    │   ├── "More clients" → AI optimises current approach
    │   ├── "New service" → AI identifies adjacencies
    │   └── "New niche" → Routes to industry picker (2a)
    ├── SB Step 3: Delivery (full version)
    ├── SB Step 4: Pricing (full version)
    ├── SB Step 5: Location
    ├── SB Step 6: AI Analysis (strategic tone)
    ├── SB Step 7: Results (3 cards)
    ├── SB Step 8: Offer Builder (advanced pricing options)
    ├── SB Step 9: System Generation
    └── SB Step 10: System Ready
```

---

### How Profile Q6 (Blockers) Triggers Interventions

These are not separate steps — they're additions inserted INTO existing steps:

| Blocker | Where it triggers | What it adds |
|---------|-------------------|-------------|
| "Don't know what niche" | Step 7 (Results) | Extra reasoning explanation under each recommendation |
| "Don't know what to sell" | Step 8b (Transformation) | Additional examples and breakdown of why this offer works |
| "Can't build anything" | Step 8e (Summary) + Step 9 (Generation) | "We build everything for you" messaging. Preview of finished system shown before generation. |
| "Can't find clients" | Step 10 (System Ready) | Expanded "what to do now" section with outreach coaching |
| "Scared I can't deliver" | Step 8d (Guarantee) | Reassurance block explaining why the system is reliable |
| "Keep switching ideas" | Step 7 (Results) | Show 1 recommendation only. Add commitment framing: "This is your best path. Trust the data." |

---

---

## Question Count by User Type

| User Type | Profile Qs | Start Business Qs | Total | Estimated Time |
|-----------|-----------|-------------------|-------|---------------|
| Complete beginner, low ambition | 6 | 3–4 | 9–10 | 4–5 minutes |
| Complete beginner, high ambition | 6 | 5–6 | 11–12 | 6–7 minutes |
| Tried but stuck (fixing) | 6 | 4–5 | 10–11 | 5–6 minutes |
| Tried but stuck (pivoting) | 6 | 6–7 | 12–13 | 7–8 minutes |
| Has clients (scaling) | 6 | 4–5 | 10–11 | 5–6 minutes |
| Has clients (new niche) | 6 | 6–7 | 12–13 | 7–8 minutes |

---

---

## Example User Journeys

### Journey 1: Total Beginner

**Profile:** 5 hrs/week, never done outreach, uses apps only, wants £1k/month, complete beginner, blocked by "don't know what niche" + "scared I can't deliver"

**Start Business flow they see:**
1. Intent → "Get my first paying client"
2. Industry interest → picks "Home services"
3. Own idea check → "Find me the best opportunity"
4. *(Delivery model skipped — under 5 hours, auto-selects build-once)*
5. *(Pricing skipped — £1k goal, AI auto-recommends)*
6. Location → "My local area: Manchester"
7. AI Analysis → 30 seconds
8. Results → **1 recommendation** (not 3, because "keep switching" wasn't selected but beginner mode shows 1 primary)
9. Offer Builder:
   - Segment confirmation (simplified)
   - Transformation (with extra "scared of delivery" reassurance)
   - Pricing (pre-filled at £400/month, no question asked)
   - Guarantee (with extra "this is safe because the system runs automatically" block)
   - Summary
10. Build System
11. System Ready

**Total questions answered:** 9
**Total time:** 4–5 minutes
**Tone throughout:** Warm, directive, reassuring. "Here's exactly what to do."

---

### Journey 2: Stuck Intermediate

**Profile:** 15 hrs/week, nervous but willing, used Zapier, wants £3–5k/month, tried but no clients, blocked by "had conversations but couldn't close"

**Start Business flow they see:**
1. Intent → "Get my first paying client"
2. What niche tried → "HVAC companies"
3. What went wrong → "Had conversations but couldn't close"
4. Fix or pivot → "Fix what I was doing in HVAC"
5. Delivery model → "Sell a system clients use themselves"
6. Pricing direction → "Fewer clients paying £1,000–2,000/month each"
7. Location → "Anywhere in my country"
8. AI Analysis → 30 seconds (diagnostic tone: "Here's what was likely going wrong...")
9. Results → **1 rebuilt approach** for HVAC with specific diagnosis of close-rate problems
10. Offer Builder:
    - Segment (refined from what they were doing)
    - Transformation (reframed from what they were pitching)
    - Pricing (£1,200/month recommendation)
    - Guarantee (designed to overcome the specific objections they were hitting)
    - Summary
11. Build System
12. System Ready

**Total questions answered:** 11
**Total time:** 6–7 minutes
**Tone throughout:** Diagnostic, strategic. "Here's what was missing and how to fix it."

---

### Journey 3: Ambitious Scaler

**Profile:** 30+ hrs/week, loves sales, can code, wants £10k+, has 2 clients, no specific blockers

**Start Business flow they see:**
1. Intent → "Add a new service to offer existing clients"
2. Current business → "Real estate agents, 2 clients, £800/month each"
3. Growth direction → "Expand into a new niche entirely"
4. Industry interest → picks "Professional services" + "Health & wellness"
5. Own idea check → "Find me the best opportunity"
6. Delivery model → "Hybrid — start custom, then productise"
7. Pricing direction → "Lower base + percentage of their growth"
8. Location → "International"
9. AI Analysis → 30 seconds
10. Results → **3 recommendations** with detailed scoring and revenue modelling
11. Offer Builder:
    - Segment (with P&L projection)
    - Transformation
    - Pricing (sophisticated: £500/month base + 10% of growth above baseline)
    - Guarantee (performance-linked)
    - Summary
12. Build System
13. System Ready

**Total questions answered:** 13
**Total time:** 8–9 minutes
**Tone throughout:** Strategic peer. "Here's the growth play."

---

---

## Data Storage

### Profile (stored once, editable)

```
user.profile = {
  time_availability: "5-15hrs",
  outreach_comfort: "nervous_willing",
  technical_comfort: "used_tools",
  revenue_goal: "1k-3k",
  current_situation: "beginner_consumed",
  blockers: ["no_niche", "scared_delivery"]
}
```

### Per Business/System (stored per project)

```
user.systems[0] = {
  intent: "first_client",
  niche: "window_cleaning",
  segment: "10k-30k_residential",
  bottleneck: "inconsistent_leads",
  offer: {
    transformation_from: "...",
    transformation_to: "...",
    system_description: "...",
    pricing_setup: 300,
    pricing_monthly: 500,
    guarantee: "10 qualified leads in 30 days or free",
    delivery_model: "build_once"
  },
  demo_url: "demo.launchpath.ai/john/window-clean-87",
  prospects: [...],
  messages: [...],
  created_at: "2026-02-16"
}
```

---

## Technical Implementation Notes

### AI Calls in the Flow

| Step | Model | Estimated Cost | What it Does |
|------|-------|---------------|-------------|
| Step 6: Analysis | Sonnet 4.5 | ~$0.08–0.15 | Takes all profile + business answers, returns 1–3 niche recommendations with full scoring |
| Step 8: Offer Builder | Sonnet 4.5 | ~$0.05–0.10 | Takes chosen niche + context, returns offer structure (transformation, pricing, guarantee) |
| Step 9a: Agent creation | Sonnet 4.5 | ~$0.04–0.08 | Generates the niche-specific system prompt and tool configs for the demo page agent |
| Step 9b: Message generation | Sonnet 4.5 | ~$0.15–0.25 | Generates 25 personalised messages for found prospects |
| **Total per Start Business** | | **~$0.32–0.58** | |

### Caching Opportunities

- The Serge framework system prompt is identical for every user. Cache it. Cache reads = 90% cheaper.
- Niche data/examples within the system prompt can be cached across users in the same niche.
- After caching: estimated cost drops to ~$0.15–0.30 per full Start Business flow.

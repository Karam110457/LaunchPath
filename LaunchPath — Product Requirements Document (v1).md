# **LaunchPath — Product Requirements Document (v1)**

## **Terminology (user-facing vs internal keys)**

User-facing names used in product, waitlist, and marketing:

| User-facing       | Internal key (API/DB) |
|-------------------|------------------------|
| **Offer Thesis**  | `offer_blueprint`      |
| **Delivery System** | `build_plan`         |
| **Revenue Engine** | `sales_pack`          |

Internal keys remain unchanged so existing code and data keep working. Use the table above when displaying labels or updating copy.

---

## **1\) Product Summary**

**LaunchPath** helps AI beginners go from confusion to first sellable AI offer by guiding them through a fixed flow: **Offer → Build → Sell**.  
It removes decision overload and gives practical outputs they can act on immediately.

## **2\) Problem Statement**

Target users are stuck in loops:

* consuming content, not shipping  
* tool-hopping without outcomes  
* overwhelmed by niches/offers/models  
* afraid to sell something they can’t deliver  
   Target audience and mission sta…

Existing “research-first” tools are often too open-ended for this audience. LaunchPath solves this by providing direction first, flexibility second.

## **3\) Target User**

**Primary:** AI-curious beginner who wants first client revenue from a simple, sellable AI system.  
**Not for:** mindset-only users, guaranteed-income seekers, advanced AI engineers.

Target audience and mission sta…

## **4\) Core Promise and Positioning**

**North star:** “Stop learning AI. Start shipping one sellable system.”

Target audience and mission sta…

### **Positioning**

* Not a generic research engine  
* Not a blank chat  
* A guided business/offer builder that outputs:  
  1. what to sell  
  2. how to build it  
  3. how to sell it

This follows current PRD best practice of customer-outcome clarity, clear scope, and measurable objectives.

## **5\) Product Goals (MVP)**

1. User creates first **Offer Thesis** in one session.  
2. User leaves with actionable **Delivery System** \+ **Revenue Engine**.  
3. User can iterate/re-run with new constraints (not same output each time).  
4. User can use advanced tools (validate, competitor, pivot, sales prep) after core offer thesis exists.

## **6\) Non-Goals (MVP)**

* Advanced LLM/RAG engineering workspace  
* Fully open-ended “deep research” as primary UX  
* Multi-seat team collaboration  
* Overly long onboarding

## **7\) Core UX Flow**

## **Step A: Onboarding (saved to long-term profile)**

Collect and persist:

* goal (first client / income target)  
* weekly time available  
* outreach comfort  
* preferred build type  
* leverage (industry/contacts/none)  
* skill level

User can edit this profile anytime.

## **Step B: Entry Path (2-path model)**

### **Path 1 — “I need direction” (default)**

No prompt required. System routes user through:

1. Offer Verdict  
2. Delivery System  
3. Revenue Engine

### **Path 2 — “I already have an idea”**

User enters 1–3 line idea prompt. System runs:

* Validate idea \+ competitor signal \+ offer fit  
  Then routes to:  
* go: refine and continue Offer → Build → Sell  
* no-go: pivot options and rewritten offer direction

## **Step C: Chat Experience**

Chat remains free-form for follow-up/refinement (Manus-style), but always grounded in the **active Offer Thesis** context.

## **8\) Product Structure (User-Facing)**

No visible “mode picker” at start.  
Behind the scenes, LaunchPath auto-selects modules in sequence.

Visible **Tools** (after first offer thesis exists):

* Validate Idea  
* Competitor Analysis  
* Pivot Offer  
* Sales Call Prep

(They are clickable so users understand capabilities.)

## **9\) Key Artifacts**

### **Offer Thesis (primary saved object)**

Contains:

* Offer One-Pager (what/who/outcome)  
* Delivery System (steps/tools/templates/testing)  
* Revenue Engine (outreach/call handling)  
* Assumptions \+ constraints  
* Version history

Users can:

* iterate current offer thesis  
* clone to new angle  
* create new offer thesis  
* set one “active offer thesis” for focused chat

## **10\) Repeat Runs Logic (How outputs stay different)**

Each rerun requires a **Run Objective**:

* simpler  
* faster to build  
* easier to sell  
* higher ticket  
* less outreach  
* different niche/buyer

System uses:

* saved profile \+ active offer thesis \+ run objective  
  to generate materially different outputs.

## **11\) Messaging Framework**

### **Homepage / onboarding tone**

* beginner-friendly  
* anti-hype  
* execution-first

### **Core copy themes**

* “Get your first sellable AI offer”  
* “Build it with a step-by-step plan”  
* “Start real sales conversations this week”  
* “No jargon, no theory dumps”

Avoid leading with:

* “deep research engine”  
* “truth report”  
* “make money quick”

## **12\) Credit System (MVP behavior)**

* Credits tied to high-value generations (Offer/Build/Sell tools, Validate, Competitor, Pivot, Sales Prep)  
* Light follow-up chat can be low/no credit until it triggers a structured generation  
* Monthly refill \+ clear usage transparency  
* Retention via useful ongoing workflows (new client adaptation, weekly optimizer, objection patching)

## **13\) Success Metrics (first 90 days)**

* Activation: % users completing first Offer Thesis  
* Time-to-value: median time to first complete Offer→Build→Sell package  
* Retention: week-2 and week-4 return rate  
* Reuse: avg offer thesis iterations per active user  
* Monetization: credits consumed per active user  
* Outcome proxy: % users reporting first prospect conversations started

## **14\) MVP Release Scope**

**Include**

* onboarding profile  
* 2 entry paths  
* Offer→Build→Sell guided flow  
* active offer thesis memory  
* basic tool unlocks (validate/pivot/sales prep; competitor if data quality is ready)  
* saved offer theses \+ clone \+ rerun objective

**Exclude**

* advanced team features  
* full external data integrations that risk low-confidence outputs in v1

## **15\) Risks and Mitigations**

* **Risk:** users drift into random chat  
  **Mitigation:** keep active offer thesis context \+ suggested next-action chips.  
* **Risk:** outputs feel generic  
  **Mitigation:** constraint-driven reruns \+ required run objective \+ profile grounding.  
* **Risk:** analysis paralysis returns  
  **Mitigation:** default forced sequence (Offer→Build→Sell), no initial mode selection.

**LaunchPath Core Logic**

## **One rule above all**

Every user, regardless of entry path, should end up with:

1. **Offer Thesis**

2. **Delivery System**

3. **Revenue Engine**

Everything else (validate, competitor, pivot, sales prep) is support tooling around that.

---

## **Path 1: “I need direction” (Default)**

This is your primary path (most users).

### **Step 1 — Quick Profile (if not completed)**

Ask only essentials:

* goal

* time/week

* outreach comfort

* build preference

* leverage

* skill level

### **Step 2 — Direction Engine (no prompt required)**

System generates:

* 1 recommended offer direction

* 1 buyer persona

* 1 delivery model

* 1 “proof in 7 days” path

Not 3 options. One recommendation \+ “show alternatives” toggle.

### **Step 3 — Reality Filter (anti-generic)**

Before finalizing offer:

* feasibility check (can they build this?)

* accessibility check (can they reach buyers?)

* monetization check (can this be sold quickly?)

If fail: auto-pivot inside flow (no extra clicks).

### **Step 4 — Offer Thesis Created**

Contains:

* what to sell

* who to sell to

* outcome promised

* scope \+ boundaries

* starter pricing recommendation

### **Step 5 — Delivery System**

Generate:

* tool stack

* implementation checklist

* data fields

* prompt templates

* QA/test checklist

* delivery SOP

### **Step 6 — Revenue Engine**

Generate:

* outbound DM scripts

* Loom script

* discovery call skeleton

* objection responses

* first 25-prospect targeting suggestions

### **Step 7 — Next Action**

Single CTA:

* “Run this for 7 days”  
   Optional buttons:

* simplify / higher ticket / no-code / change niche

---

## **Path 2: “I already have an idea”**

This path is for users who want validation/refinement.

### **Step 1 — Idea Input**

User enters 1–3 lines (or uploads simple context).

### **Step 2 — Validate \+ Competitor Snapshot (auto)**

Run automatically:

* market viability (quick score)

* buyer willingness indicator

* competitor positioning snapshot

* differentiation potential

### **Step 3 — Decision Gate**

3 outcomes:

1. **Go** → proceed to Offer Thesis refinement

2. **Go with changes** → recommended edits first

3. **No-go** → auto-generate 2 pivot options

### **Step 4 — Offer Thesis (same object as Path 1\)**

Once validated/refined, save offer thesis and continue into:

* Delivery System

* Revenue Engine

So Path 2 still ends at the same core deliverables.

---

# **Where “extra modes” fit in flow**

You want them visible. Good. Show as **Tools**, not initial choices.

## **Tool availability by stage**

### **Before Offer Thesis exists**

Only allow:

* Validate Idea (if they have concept)

* Ask Anything (chat)

### **After Offer Thesis exists**

Unlock:

* Pivot Offer

* Competitor Analysis (deeper)

* Sales Call Prep

* Pricing Optimizer

* Weekly Optimizer

This prevents research rabbit holes before they even have an offer.

---

# **Repeat Runs (must feel different)**

If reruns use same inputs, they’ll churn.  
 Solution: force a **Run Objective** each time.

When user clicks “Run Again,” require one:

* easier to build

* faster to sell

* higher ticket

* less outreach

* better retention/LTV

* different niche

Then rerun against same profile \+ existing offer thesis \+ new objective.

Also allow:

* **Clone Offer Thesis** (new variant)

* **Set Active Offer Thesis** (chat context anchor)

---

# **Follow-up Chat Logic (Manus-style, but controlled)**

You said no report editor. Correct. Keep chat natural.  
 But enforce backend grounding:

Every follow-up message uses:

* active offer thesis

* saved profile

* stage in journey

* selected run objective (if applicable)

Chat outputs can be normal text, but should always suggest structured actions:

* “Apply this to Offer”

* “Regenerate Delivery System”

* “Create Call Prep”

* “Run Competitor Check”

So chat is free, product remains directional.

---

# **What to keep from Serge vs what to drop**

## **Keep**

* clear truth-oriented positioning (“don’t move fast on wrong thing”)

* viability/competitor/pivot/sales-prep capabilities

* mixed output formats (cards, accordions, checklists)

* follow-up chat after output

## **Drop/De-emphasize for your audience**

* heavy “general deep research” front-door

* too many mode choices at start

* long “status quo/opportunity” storytelling

* 90-day plans before first proof

Your audience needs “first 7 days” clarity, not strategy theatre.

---

# **Final flow map (simple)**

1. Onboarding profile saved

2. Choose entry:

   * Path 1: Need direction

   * Path 2: Have idea

3. Generate/refine Offer Thesis

4. Generate Delivery System

5. Generate Revenue Engine

6. Unlock advanced tools

7. Repeat runs via objective-based reruns \+ offer thesis cloning

That’s coherent, scalable, and aligned with your market.

## **Free Trial & Funnel Launch Path**

### **Goals**

* **Drive proof first, revenue second.** The launch strategy prioritizes rapid accumulation of social proof (case studies, outcomes, testimonials) over early monetization.

* **Deliver an immediate “win” on Day 1\.** The product must create a fast, tangible result during onboarding so users feel momentum instantly.

### **Free Trial Structure (Credits-Based)**

* **Trial is credit-limited, not time-limited.** Users receive a free allocation of credits on signup.

* **Credit amount must be calibrated to:**

  * Be **enough to experience real value** (a meaningful outcome, not a demo).

  * **Not enough to fully complete the end goal** and churn immediately after extracting maximum value for free.

* **Feature access is intentionally constrained during trial.**

  * Trial users can access a **curated subset** of features that reliably produce an early win.

  * High-leverage / “finish line” capabilities remain gated until upgrade.

### **Funnel Path (Trial → Proof → Conversion)**

1. **Entry:** User signs up into free trial (credits granted).

2. **Activation:** Guided onboarding pushes them to the fastest achievable win.

3. **Proof Capture:** Prompt users to share outcomes (quick testimonial request, before/after, screenshot prompts) immediately after the win.

4. **Conversion:** Upgrade is positioned as “unlock the rest” (remove gates, increase credits, access advanced capabilities) rather than “pay us because we exist.”

### **Onboarding Requirements**

* **Immediate value delivery is non-negotiable.** The onboarding flow should be optimized for speed-to-value:

  * Minimal setup friction.

  * Clear “next step” prompts.

  * A guided path that reliably gets them a result quickly.

* **Activation metric focus:** success is defined by “user got a win” not “user completed onboarding.”

### **Guardrails (So this doesn’t turn into free users farming value)**

* Trial credits \+ feature gating must prevent users from:

  * Repeatedly extracting full outcomes without paying.

  * Accessing high-value export/automation features that let them “take the goods and leave.”

* The trial experience should feel generous, but incomplete by design: **they taste the outcome, then hit a clean upgrade wall.**


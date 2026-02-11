# LaunchPath — Platform Design & Flow

**Purpose:** Define how the product is actually designed: new-user flow, page architecture, MVP scope with Mastra (agents + workflows), pain-point mapping, and retention. This is the bridge between PRD and implementation.

---

## 0. Terminology (user-facing vs internal)

We use **simple, beginner-friendly** copy in the product (aligned with the waitlist). No jargon like “Offer Thesis” or “Revenue Engine” in the UI.

| User sees (app + waitlist) | Internal (API/DB) |
|----------------------------|-------------------|
| **Pick a Profitable Offer** / “My Offer” | `offer_blueprint` |
| **Map Your Build Path** / “Build Path” | `build_plan` |
| **Launch Client Acquisition** / “Get Clients” | `sales_pack` |

- **Full labels** (page titles, cards): “Pick a Profitable Offer,” “Map Your Build Path,” “Launch Client Acquisition.”
- **Short labels** (sidebar/nav): “My Offer,” “Build Path,” “Get Clients.”
- **Code:** Keep `offer_blueprint`, `build_plan`, `sales_pack` and workflow names (e.g. OfferThesisCreate) unchanged.

---

## 1. Design principles

| Principle | Meaning |
|-----------|--------|
| **Direction first** | One recommended path, not 50 options. No mode picker at start. |
| **Artifacts, not chat** | Primary value = saved offer (profitable offer), build path, and get-clients plan. Chat supports and refines them. |
| **Workflows, not wrappers** | Use Mastra workflows (multi-step, stateful, branchable) so the product is a *system*, not a thin ChatGPT UI. |
| **First win fast** | New user should get a tangible output (e.g. first “profitable offer” saved) in one session. |
| **Sticky by utility** | Retention comes from being their go-to place to iterate offers, run tools, and track progress—not from dark patterns. |

---

## 2. Pain points → How the platform solves them

| Audience pain | What we build (high level) |
|---------------|----------------------------|
| “Don’t know what to do first” | Single entry: **Onboarding** → **Path choice** (need direction / have idea) → **Guided sequence** (Offer → Build → Sell). No open-ended “what do you want to do?”. |
| Tool-hopping, no shipping | **One workspace.** Profile + active offer + artifacts live here. Build path and scripts are here; they use external tools (Make, etc.) but *decide what to build* in LaunchPath. |
| Overwhelmed by options | **One recommendation** per step (one offer direction, one persona, one build path). “Show alternatives” is secondary. Reality checks (feasibility, reach, monetization) prevent bad directions. |
| Afraid to sell what they can’t deliver | **Build path** = blueprint they can follow. **Get clients** = scripts + call structure. They only get “go sell” after “here’s how to build it.” |
| Need results, not more learning | **Concrete outputs:** one-pager, checklist, DM scripts, first-25 list. Every step produces something they can use today. |
| Want to use it again | **Multiple offers**, **clone**, **rerun with objective**, **tools** (Validate, Pivot, Sales Prep). Credits + monthly refill make repeat use the norm. |

So: the platform is their **full go-to app** to *decide* what to build and sell, *get* the plan and copy, and *return* to iterate and run tools—not a ChatGPT wrapper.

---

## 3. New user flow (end-to-end)

```
Landing / Waitlist
       ↓
Sign up (trial, credits granted)
       ↓
Onboarding (profile)  ←── optional skip, but we nudge (goal, time/week, outreach, build preference, leverage, skill)
       ↓
Entry choice (Path 1 or Path 2)
  • Path 1: “I need direction” → no prompt, we generate direction
  • Path 2: “I have an idea”   → short idea → validate → go / go-with-changes / no-go (pivot)
       ↓
Profitable offer created (first artifact)  ←── FIRST WIN
  • One-pager, who/what/outcome, scope, pricing
  • Can iterate in place or via chat
       ↓
Build path generation
  • Tool stack, checklist, SOPs, templates
       ↓
Get-clients plan generation
  • Scripts, targeting (first 25), call structure
       ↓
“Run this for 7 days” + suggested next actions
       ↓
Ongoing use: Tools (Validate, Competitor, Pivot, Sales Prep), clone offer, rerun with objective, chat
```

**Critical moments:**

- **Activation:** First profitable offer created (and ideally viewed on its dedicated page).
- **Value proof:** First complete “Offer + Build Path + Get Clients” package in one place.
- **Retention:** Coming back to refine offer, run a tool, or clone/rerun with a new objective.

---

## 4. Page architecture (MVP)

### 4.1 Public

| Route | Purpose |
|-------|--------|
| `/` | Landing (waitlist or marketing). |
| `/login`, `/signup` | Auth (signup only if we open beyond testers). |
| `/terms-of-service`, `/privacy-policy` | Legal. |

### 4.2 App (authenticated)

**Shell:** Sidebar + main content. Sidebar: Overview, My Offer, Build Path, Get Clients, Tools, Settings. Active-offer selector in header or sidebar when user has multiple offers.

| Route | Purpose |
|-------|--------|
| `/dashboard` | **Overview.** Progress (Offer → Build Path → Get Clients), next actions, quick tools. Single “Continue” CTA when mid-flow. |
| `/dashboard/onboarding` | **Onboarding.** Profile form (goal, time/week, outreach, build preference, leverage, skill). Shown once (or when profile incomplete); editable later from Settings. |
| `/dashboard/start` | **Entry.** Path choice: “I need direction” vs “I have an idea.” If idea: short input → validate (workflow) → go / go-with-changes / no-go. Then redirect into Offer step. |
| `/dashboard/offer` | **My Offer (Pick a Profitable Offer).** List of saved offers + “Create new.” Detail view: one-pager, who/what/outcome, scope, pricing, assumptions. Actions: Edit, Clone, Set active, “Regenerate with objective.” |
| `/dashboard/offer/new` | **Create Offer.** Guided flow: either “direction engine” (workflow) or “refine from idea” (workflow). One recommendation + “Show alternatives.” Reality filter; then save. |
| `/dashboard/build` | **Build Path.** Tied to active (or selected) offer. Tool stack, implementation checklist, SOPs, templates. Generate/regenerate via workflow. |
| `/dashboard/sell` | **Get Clients.** Scripts, first-25 targeting, call structure. Generate/regenerate via workflow. |
| `/dashboard/tools` | **Tools hub.** Cards: Validate Idea, Competitor Analysis, Pivot Offer, Sales Call Prep. Each opens a focused flow (workflow + optional chat). |
| `/dashboard/tools/validate` | Validate idea flow (input → workflow → result). |
| `/dashboard/tools/competitor` | Competitor analysis (input + workflow). |
| `/dashboard/tools/pivot` | Pivot offer (current offer + objective → workflow). |
| `/dashboard/tools/sales-prep` | Sales call prep (workflow + scripts/objections). |
| `/dashboard/chat` | **Contextual chat.** Always grounded in active offer + profile. Suggested actions: “Apply to Offer,” “Regenerate Build Path,” etc. |
| `/dashboard/settings` | Profile (onboarding data), account, subscription/credits. |

**Optional for MVP:** `/dashboard/offer/new` can be a modal or inline wizard on `/dashboard/offer` to reduce routes. Same for tool sub-routes: can be modals or panels from `/dashboard/tools`.

### 4.3 Flow-to-page mapping

| User action | Where it happens |
|-------------|------------------|
| Sign up | Auth (e.g. Supabase). |
| Complete profile | `/dashboard/onboarding` or first-time redirect. |
| Choose path | `/dashboard/start`. |
| Get first offer direction | `/dashboard/offer/new` (Path 1) or `/dashboard/start` → validate → `/dashboard/offer/new` (Path 2). |
| View/edit offer | `/dashboard/offer` (list + detail). |
| Generate Build Path + Get Clients | `/dashboard/build`, `/dashboard/sell` (trigger “Generate” → workflow). |
| Run a tool | `/dashboard/tools` → specific tool page or modal. |
| Ask follow-up | `/dashboard/chat` or embedded chat on artifact pages. |

---

## 5. Mastra: agents and workflows (high level)

**Goal:** Make the product a **system of orchestrated workflows and agents**, not a single “send prompt to LLM” call. Each major value moment is a Mastra workflow (and optionally agents with tools).

### 5.1 Why Mastra

- **Workflows:** Multi-step, stateful, branchable (Path 1 vs Path 2, go/no-go). Fits “Direction Engine → Reality Filter → Offer” and “Validate → Decision Gate.”
- **Human-in-the-loop:** Suspend for “pick one of these” or “confirm before we generate Build.” Keeps user in control without leaving the product.
- **Structured output:** Zod schemas for offer (offer_blueprint), build_plan, sales_pack so we persist and display consistently.
- **Agents + tools:** Dedicated agents (e.g. “Offer Strategist,” “Build Planner,” “Sales Copy”) with tools (e.g. competitor lookup, pricing hints) keep logic out of a single monolithic prompt.

### 5.2 Proposed workflows (MVP)

| Workflow | Trigger | Steps (high level) | Output |
|----------|---------|---------------------|--------|
| **OnboardingProfile** | Submit profile form | Validate inputs, optionally “suggest focus” from goal. | Saved profile (DB). |
| **DirectionEngine** | Path 1 “I need direction” | 1) Read profile. 2) Generate one offer direction + one buyer persona + one delivery model + “proof in 7 days.” 3) Return structured recommendation. | Recommendation (show on Offer creation). |
| **RealityFilter** | Before saving offer | Feasibility / accessibility / monetization checks (agent or sub-steps). If fail → auto-pivot suggestion. | Pass / fail + pivot suggestion. |
| **OfferThesisCreate** | User confirms direction (or from Path 2 refine) | 1) Direction or refined idea + profile. 2) Reality filter. 3) If pass: generate one-pager, who/what/outcome, scope, pricing. 4) Save. | offer_blueprint (DB). |
| **ValidateIdea** | Path 2 idea input or Tools → Validate | 1) Idea + profile. 2) Market viability, buyer willingness, competitor snapshot, differentiation. 3) Go / go-with-changes / no-go + copy. | Decision + reasoning. |
| **DeliverySystemGenerate** | “Generate” on Build page | 1) Active offer + profile. 2) Tool stack, checklist, data fields, prompts, QA checklist, delivery SOP. 3) Structured output. | build_plan (DB). |
| **RevenueEngineGenerate** | “Generate” on Sell page | 1) Active offer + profile. 2) DM scripts, Loom script, call skeleton, objections, first 25. 3) Structured output. | sales_pack (DB). |
| **PivotOffer** | Tools → Pivot | 1) Active offer + “pivot objective.” 2) Generate 2 pivot options. 3) User picks one → optional “Replace” or “Save as new.” | Pivot options + optional new offer. |
| **SalesCallPrep** | Tools → Sales Prep | 1) Active offer. 2) Roleplay scenarios, objection handling, structure. | Scripts + structure. |
| **CompetitorAnalysis** | Tools → Competitor | 1) Active offer (or idea). 2) Deeper competitor positioning. | Report / structured blocks. |

### 5.3 Agents (MVP)

| Agent | Role | Used in |
|-------|------|--------|
| **OfferStrategist** | Offer direction, one-pager, pricing, feasibility. | DirectionEngine, OfferThesisCreate, RealityFilter. |
| **BuildPlanner** | Tool stack, checklists, SOPs, templates. | DeliverySystemGenerate. |
| **SalesCopywriter** | Scripts, objections, call structure. | RevenueEngineGenerate, SalesCallPrep. |
| **Validator** | Viability, willingness, competitor snapshot. | ValidateIdea, RealityFilter. |

Tools (e.g. “search competitors,” “price suggestion”) can be added per agent where they improve output without overcomplicating MVP.

### 5.4 Not a wrapper

- **No single “chat” endpoint** that does everything. Chat is a **client** that calls: (a) contextual follow-up (agent with active offer + profile), and (b) **structured actions** that trigger the workflows above (e.g. “Regenerate Build Path” → `DeliverySystemGenerate`).
- **State lives in DB:** profile, offers (offer_blueprint), build_plan, sales_pack. Workflows read/write that state; UI reads from DB and triggers workflows.
- **Credits:** Consume credits on workflow runs that do heavy generation (Offer, Build, Sell, Validate, Pivot, Sales Prep, Competitor). Light chat can be free or low-credit until it triggers a workflow.

---

## 6. MVP scope (concise)

**In scope:**

- Auth (already in place).
- Onboarding profile (form + persistence).
- Entry: Path 1 and Path 2 (Path 2 = idea → Validate workflow → go/no-go).
- Offer (profitable offer): create (Direction Engine + Reality Filter), save, list, detail, set active, clone.
- Build path: generate (workflow), store, display (one offer = one build plan).
- Get-clients plan: generate (workflow), store, display.
- Tools: Validate, Pivot, Sales Prep (and Competitor if we have a simple data path). Each = workflow + UI.
- Chat: one place, grounded in active offer + profile; suggested actions that trigger workflows.
- Credits: grant on signup, deduct on workflow runs, show balance; monthly refill (logic only, no payment in MVP if not needed).
- Retention: multiple offers, clone, rerun with objective, tools, and “next actions” on Overview.

**Out of scope for MVP:**

- Payment / checkout (unless we need it for trial wall).
- Advanced team/collaboration.
- Ralph Loop (can add post-MVP for quality).
- Full external data integrations (e.g. live competitor APIs) if risky; use simpler heuristics or manual-style outputs first.

---

## 7. Retention: why they keep coming back

| Lever | How we build it |
|-------|------------------|
| **One place for their business** | All offers, build path, and get-clients plan live here. External tools (Make, Airtable) are *where* they build; LaunchPath is *where* they decide and plan. |
| **Iteration** | “Regenerate with objective,” clone offer, pivot. Each run feels different and useful. |
| **Tools** | Validate new ideas, competitor check, sales prep before a call. Reuse when they have a new idea or a new client. |
| **Next actions** | Overview and in-app nudges: “Finalize tool stack,” “Run Sales Prep before your call.” |
| **Credits + refill** | Monthly refill encourages “use it this month” and normalizes return. |
| **Proof then pay** | Trial gives a real win; upgrade unlocks more credits and tools so they don’t “leave after one use.” |

---

## 8. Suggested implementation order

1. **Data model:** Profile, offer_blueprint, build_plan, sales_pack (Supabase tables + RLS).
2. **Mastra setup:** Project, one test workflow (e.g. DirectionEngine stub), one agent (OfferStrategist).
3. **Onboarding:** Page + form + save; redirect to `/dashboard/start` when incomplete.
4. **Start page:** Path choice; Path 1 → Direction workflow (stub then real); Path 2 → Validate workflow → gate.
5. **Offer:** Create flow (workflow + Reality Filter), save, list/detail, set active.
6. **Build + Sell:** Generate workflows + persist + display on existing Build/Sell pages.
7. **Tools:** Validate, Pivot, Sales Prep (workflows + UI).
8. **Chat:** Context (active offer + profile) + suggested actions that call workflows.
9. **Credits:** Deduct on run, show in UI, refill logic.

This order gets “first win” (profitable offer) early, then fills in Build Path and Get Clients, then tools and chat, so the platform quickly becomes their full go-to app and stays sticky through iteration and reuse.

---

## 9. Suggestions beyond the PRD

Things not explicitly in the PRD (or only lightly mentioned) that would strengthen the product:

| Suggestion | Why |
|------------|-----|
| **“Proof in 7 days” as a first milestone** | PRD mentions it in Path 1; make it a visible checkpoint (e.g. “Your first 7-day goal” card with 3–5 concrete tasks). Reduces “now what?” after they get the offer. |
| **Lightweight progress / streak** | Simple “You’ve completed Offer + Build Path” or “3 offers created” (no gamification overload). Reinforces that the app is their home base and rewards reuse. |
| **Export bundle (PDF/Notion)** | Let them download or send “My offer + build path + scripts” as one doc. Increases perceived value and shareability (e.g. with a coach or partner). |
| **One “active offer” always clear** | When they have multiple offers, the active one should be obvious (header/sidebar) and every tool/chat should say “Using: [Offer name].” Avoids context confusion. |
| **Onboarding: one optional “preview” step** | After profile, show one screen: “You’ll get: 1) A profitable offer 2) A build path 3) A plan to get clients — in that order.” Sets expectations and reduces drop-off. |
| **Error / empty states with next action** | Every empty or error state should have a single “Do this next” (e.g. “Create your first offer,” “Complete your profile”). No dead ends. |
| **Tool availability gated by stage** | PRD says tools unlock after offer exists; enforce in UI (greyed out + “Create an offer first”) so the sequence feels intentional. |
| **Optional “why this recommendation”** | For direction engine / validate: a short “Why we suggested this” (2–3 bullets). Builds trust and learning without overwhelming. |
| **Mobile-friendly read view** | They may check their offer or scripts on the go; ensure offer detail, build path, and get-clients pages are readable (not just desktop). |
| **Simple “first conversation” tracker** | Post-MVP: one field or check “Had first prospect conversation?” with optional date. Feeds into outcome proxy metric and reminds them of the goal. |

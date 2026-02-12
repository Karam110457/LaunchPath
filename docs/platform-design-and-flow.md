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

---

## 10. Container entity flow and one-shot creation (product vision)

This section captures the product vision: **log in → onboarding → start a [container] → one flow produces the full blueprint → memory per container → chat for retention.** The container (what we name the “thing” they’re building) should fit our audience: AI beginners going for their **first sellable AI system** and **first client**. “Business” is too vague for them; see §10.5 for the chosen name.

### 10.5 Naming the container (not “business”)

**Why “business” doesn’t work:** For our audience, “business” is abstract and heavy. They’re not thinking “I’m starting a business”—they’re thinking “I want one sellable system and my first client.” The name should feel like **one concrete thing** they’re building and taking to market.

**Recommended name: System**

| Name | Pros | Cons |
|------|------|------|
| **System** | Directly from north star (“ship one sellable **system**”). Clear: one system = one offer + build path + get-clients plan. Fits “first sellable AI system.” | Slightly technical; still very clear for AI-curious beginners. |
| **Playbook** | Warm, familiar. “Your playbook” = your full plan. “Start a new playbook.” Implies something you follow. | Less tied to “system” in our messaging. |
| **Launch** | Brand-aligned (LaunchPath). “Start a launch” / “My launches.” Action-oriented. | Can sound like a one-time event rather than an ongoing workspace. |
| **Offer** | The “thing I’m taking to market.” “My offers.” | We already use “offer” for the one-pager artifact; risk of overload. |
| **Path** | “My paths.” | Conflicts with “Build Path” (stage name). Avoid. |
| **Business** | — | Too vague for target audience. Avoid. |

**Decision:** Use **System** as the container name in product and docs. Copy examples:

- **“Start a new system”** / **“Build my system”** (CTA)
- **“My systems”** (nav: list of their systems)
- **“Your system includes: your offer, build path, and plan to get clients.”**
- Internal/API: table `systems` (id, user_id, name, created_at); link offer_blueprint, build_plan, sales_pack to system_id.

**If you prefer a warmer tone:** **Playbook** is a strong alternative—“Start a new playbook,” “My playbooks,” “Your playbook has your offer, build path, and get-clients plan.” Use one consistently.

In the rest of §10, **“system”** is used; replace with “playbook” (or “launch”) if you lock that instead.

---

### 10.1 Flow you described

1. **Log in** → **Complete onboarding** (goal, time, outreach, build preference, leverage, skill). Save once; use for all future systems.
2. **Start a system** (or playbook). User has a clear action: “Start a new system” / “Build my system.”
3. **Press Start** → **Answer a few questions** (path: need direction vs have idea + 2–3 short questions).
4. **One flow does the whole thing:** in a single run we produce **offer + build path + client acquisition** (and any other direction artifacts). Not “complete step 1, then step 2, then step 3” as separate user actions—one orchestrated flow that outputs the full blueprint.
5. **Direction only for now:** no landing page builder, no in-app agent builder, no outreach execution. Optional later: landing page (Lovable-style), build AI agents in-app, run outreach, paid ads, content. MVP = clarity and direction.
6. **Exports and visualization:** e.g. **n8n-compatible JSON** so they can take the build path into n8n; **React Flow** (or similar) to **visualize the system** (offer → build steps → acquisition) for clarity.
7. **Memory per system:** each system stores all artifacts + context so the AI knows the full picture and can **edit artifacts** and answer in context.
8. **Chat and freeform = retention:** chat windows and freeform conversation are the surface for “use over and over”—refine, edit, ask “what next,” run tools. Features should be engineered so returning to chat and iterating is natural and valuable.

### 10.2 Analysis and opinion

**What’s strong**

- **System (or playbook) as the container** is the right abstraction. One user, many systems; each system = one offer + one build path + one get-clients plan + memory + chat. Fits “Start a new system” and “Open System A vs B.”
- **Onboarding first, reused everywhere** matches the PRD and reduces repeated questions. One profile, many systems.
- **One flow that produces everything** is a strong UX: “Press Start, answer a few questions, we build your whole system.” Single commitment, single wait, full blueprint at the end. Reduces drop-off between steps and feels like a clear “we built it” moment.
- **Memory per system** is correct: every chat and tool is scoped to that system’s artifacts and history so the AI can edit and suggest consistently. No context bleed between systems.
- **Chat as the retention surface** is right. If they keep coming back to ask “tweak my offer,” “add a competitor check,” “prep me for this call,” the product stays sticky. Engineering chat + artifact editing + suggested actions supports that.
- **Direction-only MVP** keeps scope sane. n8n JSON and React Flow visualization add real value (portability + clarity) without building execution tools yet. Landing page builder, in-app agent builder, outreach/ads can follow once direction is solid.

**Risks and tradeoffs**

- **One long flow:** If the run takes 1–2 minutes, we need **progress/streaming** (“Building your offer… Building your build path… Building your get-clients plan…”) so it doesn’t feel like a black box. Consider showing step-by-step progress and/or streaming the first artifact while the rest generate.
- **“Few questions” vs onboarding:** Don’t repeat the full onboarding in the flow. The few questions should be **path + 2–3 specifics** (e.g. “I need direction” vs “I have an idea”; if idea, the idea; maybe “primary constraint: time vs money”). Everything else comes from saved profile.
- **Editing after one-shot:** When we generate everything in one go, we still need **per-artifact edit** (change offer headline, add a build step, tweak a script). Memory + chat + “Edit this section” actions cover that; ensure the UI makes “edit artifact” obvious.

**How this changes the current design**

- **Entity model:** Introduce **System** (table `systems`) as the top-level entity. Under it: profile (user-level), offer_blueprint, build_plan, sales_pack, chat history, and any “memory” blob. Sidebar/header: “My systems” + active system selector.
- **Creation flow:** One **CreateSystem** (or “Build my system”) entry: “Start” → few questions → **one Mastra workflow** that runs Direction → RealityFilter → Offer → BuildPath → SalesPack (and any other steps) in sequence, persists all, then shows the full result. Optionally allow “regenerate one part” later (e.g. “Regenerate build path only”).
- **Pages:** Overview can be “per system” (this system’s progress) or global (list of systems). Offer / Build Path / Get Clients pages are **per system**; chat is per system with full memory.

### 10.3 Concrete recommendations

| Recommendation | Implementation note |
|----------------|----------------------|
| **One-shot “Build my system” workflow** | Single Mastra workflow that: reads profile + flow answers → Direction (or Validate for Path 2) → RealityFilter → generate and persist offer_blueprint → generate and persist build_plan → generate and persist sales_pack. Return or stream progress so UI can show “Step 1/3… 2/3… 3/3.” |
| **System as first-class entity** | New table `systems`: id, user_id, name, created_at; link offer_blueprint, build_plan, sales_pack to system_id. All chat and tools scoped by system_id. |
| **Memory per system** | Store: (1) artifacts in DB (already), (2) chat history per system, (3) optional summary or embedding for “system context” that the AI gets every time. Mastra/agent reads this context for every message and for artifact-editing actions. |
| **n8n-ready export** | When we have build_plan (tool stack, steps, order), add an export step that produces **n8n-compatible JSON** (or a format they can import). Document “Import this into n8n to run your workflow.” |
| **React Flow (or similar) visualization** | A “System canvas” or “Your system at a glance” view: nodes for Offer, Build phases, Acquisition phases; edges for flow. Data comes from offer_blueprint + build_plan + sales_pack. Helps them see the whole system and spot gaps. |
| **Chat + retention** | Chat always in context of active system; suggested actions that trigger workflows (“Regenerate build path,” “Run competitor check,” “Edit offer headline”). Consider “What to do next” suggestions based on state (e.g. “You have an offer and build path; run Sales Prep before your call.”). |
| **Future roadmap (out of MVP)** | Log and prioritize for later: landing page builder (Lovable-style), in-app AI agent builder, run outreach or connect paid ads/content. Keep MVP focused on direction + memory + chat + export/visualization. |

### 10.4 Summary

Your flow fits the PRD and strengthens it: **one flow, one system, full blueprint, memory, chat for retention.** For MVP we should (1) add **System** as the container (name tuned for our audience; “business” is too vague), (2) implement **one-shot “Build my system”** workflow with progress/streaming, (3) scope **memory and chat** per system, (4) add **n8n JSON export** and **React Flow–style visualization** for direction and clarity, and (5) keep execution (landing page, agents, outreach, ads) for a later phase.

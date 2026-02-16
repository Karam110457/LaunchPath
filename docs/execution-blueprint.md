# LaunchPath — Execution Blueprint

**This document overrides conflicting sections in the PRD, design-vision, and platform-design-and-flow docs.** Where those docs say "generate text," this doc says "build executable assets." Where those docs describe coaching artifacts, this doc describes things users can use in 10 seconds with zero translation.

---

## 1. New core product loop

The old loop: **Answer questions → AI generates text → User reads text → User goes and does work.**

The new loop:

```
Profile saved (once)
       ↓
"Build my system" (one shot, few questions)
       ↓
AI WORKS (visibly: analyzing, researching, building — not "generating")
       ↓
System ready: 3 executable assets (not documents)
  1. Offer card (structured, editable fields — not a one-pager)
  2. Build workflow (visual node map + n8n export — not a checklist)
  3. Acquisition kit (copy-paste messages + search URLs + call scripts — not advice)
       ↓
User USES the assets in the real world (copies a DM, imports a workflow, opens a search URL)
       ↓
User LOGS real-world results (sent DM, got reply, booked call, closed client)
       ↓
AI RESPONDS to real-world data (adapts scripts, updates strategy, suggests next move)
       ↓
User returns for the NEXT real-world event (call tomorrow, prospect replied, want to pivot)
```

**The shift:** The product's job is not "tell them what to do." It's **"hand them the thing they need, ready to use, and then adapt when reality hits."**

---

## 2. Artifact redesign: text → executable assets

This is the most important section. Every output must pass the **10-second test:** can the user do something real with this output within 10 seconds of seeing it?

### 2.1 Offer → Offer Card (structured, not a document)

**Old:** A text "one-pager" with paragraphs about audience, outcome, pricing.

**New:** A **structured card** with discrete, editable fields:

| Field | What it contains | User action |
|-------|------------------|-------------|
| Headline | One sentence: "I help [who] achieve [what] in [timeframe]" | Edit inline. Copy to clipboard. |
| Audience | Specific segment + 3 qualifying traits | Edit inline. |
| Outcome | What the client gets (concrete, not vague) | Edit inline. |
| Scope | What's included / excluded (bullet list) | Edit inline. |
| Price | Recommended price + pricing model (setup + retainer, project, etc.) | Edit inline. |
| Why this works | 2–3 bullets: feasibility, market fit, differentiation | Read only (from Reality Filter). |

**Key:** Each field is individually editable. Changing "Audience" flags Build Path and Acquisition Kit as "may need refresh." The offer feels like a **configured product**, not a Word doc.

**Copy actions:** "Copy as elevator pitch" (one-click → clipboard), "Copy as proposal intro" (one-click → formatted paragraph for emails/proposals).

### 2.2 Build Path → Visual Workflow (not a checklist)

**Old:** A text checklist: "1. Set up Airtable, 2. Configure Make scenario, 3. Test."

**New:** A **visual node-based workflow** (React Flow) showing the actual system they're building:

```
[Intake Form] → [AI Processing] → [Output Delivery] → [Follow-up]
     ↓               ↓                  ↓                 ↓
  Airtable         OpenAI API        Email/Loom        Slack/CRM
```

Each node:
- **Title** (e.g. "Client Intake")
- **Tool** (e.g. "Airtable form")
- **What it does** (one line)
- **Setup instructions** (expand to see 3–5 bullet steps)
- **Time estimate** (e.g. "15 min")
- **Status** (Not started / Done — user toggles)

**Export:** "Export to n8n" button → downloads importable JSON. "Export to Make" if feasible. At minimum, the visual map IS the build path — they can see their entire system as a diagram, not a wall of text.

**Total build time** shown: e.g. "Estimated build time: 4.5 hours" — makes it feel achievable, not infinite.

### 2.3 Acquisition Kit → Ready-to-use assets (not advice)

**Old:** "Outbound DM scripts," "Loom script," "discovery call skeleton" as text blocks.

**New:** A kit of **individually usable, copy-paste-ready assets:**

#### Messages (ready to send)

| Asset | Format | User action |
|-------|--------|-------------|
| Cold DM v1 (LinkedIn) | Full message with `{{Name}}` and `{{Company}}` placeholders highlighted in a distinct color | "Copy" button → clipboard |
| Cold DM v2 (softer) | Variant | "Copy" button |
| Cold DM v3 (referral ask) | Variant | "Copy" button |
| Follow-up (no reply, day 3) | Full message | "Copy" button |
| Follow-up (replied interested) | Full message | "Copy" button |
| Cold email v1 | Subject + body | "Copy" button |

**Not** one script. **Multiple ready-to-send messages** they pick from and paste.

#### Prospect Finder

| Asset | Format | User action |
|-------|--------|-------------|
| LinkedIn search URL | Pre-built URL with their audience criteria (title, industry, location, company size) | **"Open in LinkedIn"** button → opens search in new tab |
| Search criteria summary | Human-readable: "Marketing Agency Founders, London, 11–50 employees" | Reference |
| First 25 targets guidance | Where to look + what to look for | Reference |

**This is the single biggest differentiator.** Giving them a clickable LinkedIn search URL that opens a page of their ideal prospects is DOING, not coaching.

#### Call Prep

| Asset | Format | User action |
|-------|--------|-------------|
| Discovery questions | Numbered list, 5–7 questions in order | Print/copy for the call |
| Objection → Response cards | Flip-card style: objection on front, response on back (5–8 common objections) | Tap/click to flip. Copy response. |
| Call structure | Timeline view: Opening (2 min) → Discovery (10 min) → Demo (10 min) → Close (5 min) with bullet points per section | Reference during call |
| Loom/video script | **Teleprompter view**: large text, auto-scrollable, timed sections. Not a paragraph — a script formatted for reading aloud. | "Start teleprompter" → full-screen read mode |

---

## 3. Page-by-page rewrite

### 3.1 `/dashboard` → **Mission Control** (not "Overview")

**Old:** Progress cards (Offer / Build / Sell) + next actions + quick tools. A status dashboard.

**New:** One screen answering: **"What should I do right now?"**

- **Active system** name + one-line summary at top.
- **Real-world tracker** (the main thing on the page):
  - Prospects contacted: `3 / 25` (progress bar)
  - Replies received: `1`
  - Calls booked: `0`
  - Revenue: `$0`
  - Each row has a **"Log"** button (e.g. "Log a reply" opens a quick modal: "What did they say?" → AI generates suggested response → "Copy response")
- **Next action** (ONE, not a list): e.g. "Send your next 5 DMs — open your messages" or "You have a call tomorrow — run Sales Prep."
- **System status** (secondary, collapsed or bottom): Offer ✓ / Build Path ✓ / Acquisition Kit ✓.

**Why:** The dashboard should track THEIR REALITY, not product completion. "3/25 prospects contacted" is infinitely more motivating and actionable than "Step 2: Build Path — In Progress."

### 3.2 `/dashboard/onboarding` → **Quick Profile** (unchanged concept, tighter execution)

- Same fields: goal, time/week, outreach comfort, build preference, leverage, skill level.
- **Max 6 questions.** One per screen (mobile-friendly, focused). No long form.
- After completion: one screen: **"Ready. Let's build your first system."** Single CTA.

### 3.3 `/dashboard/start` → **"Build My System"** (the one-shot flow)

This is the MAIN EVENT. Not a "start page" — a creation experience.

**Step 1: Path** (one screen)
- "I need direction" (big default button)
- "I have an idea" (secondary) → shows text input

**Step 2: 2–3 targeted questions** (only if needed beyond profile)
- Path 1: "Any industry you know well?" / "Preferred: high-ticket few clients or low-ticket many?"
- Path 2: Idea text + "What's your main concern about this idea?"

**Step 3: Building** (the show)

Full-screen, focused. **No sidebar.** This is the moment.

The screen shows a **live build log** — not a progress bar, but a feed of what the AI is doing:

```
✓ Analyzing your profile and constraints
✓ Evaluating 4 market segments for fit...
  → Best match: [specific niche] (score: 87/100)
✓ Checking competitor density...
  → 3 direct competitors found. Differentiation angle identified.
✓ Running reality filter...
  → Feasibility: ✓  Accessibility: ✓  Monetization: ✓
● Building your offer card...
  Building your workflow...
  Building your acquisition kit...
```

Each line appears as it completes (streamed or polled). The checkmarks, the specificity ("4 market segments," "87/100"), the named steps — all of this makes it feel like **real work is being done**, not "generating text."

**Step 4: System Ready**

Full-screen success: **"Your system is ready."**

Show three cards:
1. **Your Offer** — headline + audience + price (summary)
2. **Your Build Path** — node count + estimated build time (e.g. "6 steps, ~4 hours")
3. **Your Acquisition Kit** — message count + search URL ready (e.g. "6 messages + LinkedIn search")

Primary CTA: **"Open your system"** → goes to system view.

### 3.4 `/dashboard/system/[id]` → **System View** (NEW — replaces separate offer/build/sell pages)

**This is the biggest structural change.** Instead of 3 separate pages (offer, build, sell), one unified **system view** with tabs or panels:

- **Canvas** (default tab): React Flow visualization of the full system. Offer node → Build nodes → Acquisition nodes. Click any node → opens detail panel on the right.
- **Offer** tab: The structured offer card (fields, not document). Edit inline.
- **Build Path** tab: Visual workflow + node details. Toggle statuses. Export to n8n.
- **Acquisition Kit** tab: Messages (copy buttons), Prospect Finder (LinkedIn URL), Call Prep (objection cards, teleprompter).
- **Tracker** tab: Real-world progress (prospects contacted, replies, calls, revenue) with "Log" actions that trigger AI responses.
- **Chat** (persistent side panel or bottom drawer): Always in context of THIS system. Produces things, doesn't just talk.

**Why unified:** The "system" is one thing. Splitting it into 3 pages makes it feel like 3 separate documents. One view with tabs makes it feel like one coherent machine they built.

### 3.5 `/dashboard/systems` → **My Systems** (list)

- List of all systems. Name, created date, status (active/archived), one-line summary.
- "Build a new system" CTA.
- Click → opens `/dashboard/system/[id]`.

### 3.6 `/dashboard/tools` → **Tools** (simplified)

Available tools (unlocked after system exists):
- **Validate Idea** — input idea → structured verdict + go/no-go. Not a text report: a clear VERDICT with confidence score and 3 reasons.
- **Competitor Check** — runs against active system → structured comparison table (not paragraphs). "Your offer vs 3 competitors" as a visual matrix.
- **Pivot** — "What constraint?" → 2 new offer cards (not text) they can swap in or save as new system.
- **Sales Prep** — "Call is with [type]" → produces call script + objection cards + pre-call checklist. Teleprompter-ready.

Each tool: input → workflow → **structured, usable output** (card, table, script). Not a text report.

### 3.7 `/dashboard/settings` → **Settings** (unchanged)

Profile, account, credits. Minor.

### Routes removed

- `/dashboard/offer` → replaced by system view Offer tab
- `/dashboard/build` → replaced by system view Build Path tab
- `/dashboard/sell` → replaced by system view Acquisition Kit tab
- `/dashboard/chat` → replaced by per-system chat panel (always in context)

---

## 4. Chat behavior contract

Every chat interaction in the product must follow these rules:

### 4.1 Chat always PRODUCES, never just ADVISES

| User says | Bad response (coaching) | Good response (execution) |
|-----------|------------------------|--------------------------|
| "How should I handle this objection?" | "You could try emphasizing the ROI and asking about their current costs..." | **"Here's your response:"** `[Ready-to-copy message]` + "Added to your objection library." |
| "My offer isn't working" | "Consider adjusting your target audience or pricing..." | **"I've drafted 2 alternative offer cards based on your tracker data."** [Shows 2 new structured cards] "Want to swap one in?" |
| "What should I do next?" | "You might want to reach out to more prospects or refine your scripts..." | **"Your next move: Send DMs to 5 more prospects. Here are your messages, pre-filled:"** [5 messages with copy buttons] |
| "Prospect said they're not interested" | "That's common. You could try a different angle..." | **"Response to copy:"** `[specific reply]` + **"Updated follow-up scheduled for day 5:"** `[follow-up message]` |

### 4.2 Chat output format rules

1. **Every response must end with a concrete artifact OR a specific next action.** No response ends with just explanation.
2. **If the user's message relates to a real-world event** (prospect replied, call happened, client signed), log it in the tracker automatically and respond with the next executable asset.
3. **Copy buttons on every message, script, or response the AI generates.** Not inline text they have to select — a button.
4. **"Apply to system" actions** when chat produces something that should update an artifact (new objection response → add to kit; refined headline → update offer card).

### 4.3 Chat suggested actions (chips)

Always show 3–5 contextual chips based on system state + tracker data:

- If 0 prospects contacted: "Draft my first 5 DMs"
- If replies exist but no calls: "Help me convert this reply to a call"
- If call booked: "Run call prep for tomorrow"
- If call happened: "Log call outcome"
- If nothing happened in 5+ days: "What's blocking me?"

---

## 5. Retention / event model

**Old model:** "Come back because you have credits and tools."
**New model:** "Come back because something happened in the real world and you need the next thing."

### 5.1 Event-driven returns

| Real-world event | Trigger | Product response |
|------------------|---------|-----------------|
| Prospect replied | User logs reply (or gets push/email nudge) | AI generates specific response to copy + updates tracker |
| Call booked | User logs call | AI auto-runs Sales Prep → call script + objection cards ready |
| Call happened | User logs outcome | AI adapts: if positive → "Here's your onboarding checklist for this client." If negative → "Here's what to adjust" + updated scripts |
| Nothing in 5 days | Automatic (cron/nudge) | Email: "You've contacted 3/25 prospects. Here are your next 5 messages — ready to send." Deep link to system. |
| Offer isn't converting | User reports or tracker shows 0 replies after 10+ sends | AI suggests pivot or script refinement → produces new assets |
| First client closed | User logs | **BIG celebration.** "You did it." Then: "Here's your client onboarding SOP" (new asset generated). |
| Monthly credit refill | Automatic | "Your credits refreshed. Your system hasn't been updated in 3 weeks — want to refresh your scripts based on what you've learned?" |
| New system | User decision | "Build another system" → same one-shot flow, fresh context |

### 5.2 Nudge system (lightweight, not spammy)

- **In-app:** "What to do next" on Mission Control. ONE action, not a list.
- **Email (optional, max 2/week):**
  - Day 1 after system built: "Your first 5 DMs are ready — paste them today."
  - Day 3 if no activity: "3/25 prospects waiting. Open your kit."
  - After call logged: "How did the call go? Log it and I'll adjust your strategy."
- **Never guilt.** Never "You haven't done X." Always **"Here's the next thing, ready for you."**

---

## 6. MVP scope: cuts vs must-haves

### 6.1 MUST HAVE (ship with these or don't ship)

| Feature | Why non-negotiable |
|---------|-------------------|
| Onboarding profile (6 questions) | Everything downstream depends on it |
| "Build my system" one-shot flow | This IS the product. Without it, there's no system. |
| Offer card (structured, editable, copyable) | First tangible output. Must feel real. |
| Acquisition kit: 3+ message variants with copy buttons | Closes the gap between "plan" and "action." This is what they'll use on day 1. |
| Acquisition kit: LinkedIn search URL | Single highest-impact "we did something for you" moment. A clickable link to their prospects. |
| Build path: visual workflow (React Flow, read-only ok for v1) | Makes the system feel BUILT, not described. Even if they can't export yet, they can SEE it. |
| Build path: step-by-step with time estimates | So they know "I can build this in 4 hours" not "I have an infinite checklist." |
| Real-world tracker (prospects / replies / calls / revenue) | Drives retention. Without it, they read and leave. |
| Chat per system (produces assets, not just advice) | Retention surface + ongoing value. Must follow behavior contract. |
| System view (unified: canvas + tabs) | One coherent "thing they built," not 3 separate pages. |
| One success celebration ("Your system is ready") | Dopamine moment. Don't skip it. |

### 6.2 SHOULD HAVE (ship soon after, not blockers)

| Feature | Why soon but not day 1 |
|---------|----------------------|
| n8n JSON export | High value but build path visual is enough for v1 |
| Objection flip-cards (interactive) | Can ship as text pairs first, upgrade to flip-cards |
| Teleprompter mode for Loom script | High value, can be a fast follow |
| Call prep as separate tool | Can be part of acquisition kit first, separated later |
| Competitor check tool | Useful but not critical for first system |
| Pivot tool | They need to TRY the first system before pivoting |
| Email nudges | In-app "next action" is enough for v1 |

### 6.3 CUT (remove from MVP thinking entirely)

| Feature | Why cut |
|---------|---------|
| Ralph Loop execution layer | Internal quality concern. Use good prompts first. Add iteration later if outputs are weak. |
| Proprietary naming framework | Zero user impact. Revisit after product-market fit. |
| Credit system (for MVP) | Don't gate anything in early access. Give testers unlimited runs. Add credits when you have paying users. |
| Clone / version history | Power-user feature. They haven't succeeded once yet. Ship when they want system #2. |
| Weekly optimizer / pricing optimizer tools | Post-MVP. They need to get their first client before optimizing. |
| Export bundle (PDF/Notion) | Nice but not "do stuff for them." Ship after core loop works. |

---

## 7. Implementation order (fastest path to impact)

**Principle:** Ship the thinnest slice that delivers the full loop (build system → use assets → log results → get next thing). Then thicken each slice.

### Phase 1: The loop (weeks 1–3)

**Goal:** A user can log in, build a system, get usable assets, and log real-world results.

1. **Data model** (Supabase)
   - `profiles` (user-level, onboarding data)
   - `systems` (id, user_id, name, status, created_at)
   - `offer_blueprints` (system_id, structured JSON — headline, audience, outcome, scope, price, rationale)
   - `build_plans` (system_id, structured JSON — nodes array with title, tool, instructions, time_estimate, status)
   - `sales_packs` (system_id, structured JSON — messages array, search_criteria, search_url, call_prep, objections)
   - `tracker_events` (system_id, type [prospect_sent, reply, call_booked, call_done, client_closed], data JSON, created_at)
   - `chat_messages` (system_id, role, content, created_at)

2. **Onboarding** — 6-question flow, one per screen, persist to `profiles`.

3. **"Build my system" flow** — Mastra workflow:
   - Input: profile + path choice + 2–3 questions
   - Steps: Direction → Reality Filter → Offer → Build Path → Acquisition Kit
   - Output: persist structured JSON to all three tables
   - UI: full-screen build log with streamed status lines

4. **System view** — Unified page with tabs:
   - Offer tab: structured card with edit + copy
   - Build Path tab: simple step list with time estimates (React Flow in phase 2)
   - Acquisition Kit tab: messages with copy buttons + LinkedIn search URL link
   - Tracker tab: progress bars + "Log" buttons

5. **Mission Control** — Real-world tracker + one "next action" + link to active system.

6. **Chat** — Per-system, follows behavior contract. Produces assets. Copy buttons on outputs.

### Phase 2: Make it feel real (weeks 4–5)

7. **React Flow canvas** — Visual workflow for Build Path tab. Nodes from `build_plans` JSON. Read-only clickable (click node → detail panel).

8. **Build log upgrade** — Richer status lines during "Build my system" ("Analyzing 4 segments... Found strongest match...").

9. **Tracker → AI responses** — When user logs "got a reply," AI generates response to copy. When user logs "call booked," AI auto-generates call prep.

10. **Objection cards** — Flip-card UI for objection → response pairs in Acquisition Kit.

### Phase 3: Depth and export (weeks 6–8)

11. **n8n JSON export** — From Build Path data, generate importable n8n workflow JSON.

12. **Teleprompter** — Full-screen, scrollable script view for Loom/video recording.

13. **Tools** — Validate, Pivot, Sales Prep as standalone workflows. Structured outputs (verdict cards, offer card alternatives, call scripts).

14. **Competitor check** — Structured comparison table, not text.

15. **Multiple systems** — "My systems" list, system selector, new system flow.

### Phase 4: Retention and growth (weeks 9+)

16. **Email nudges** — Event-driven (logged reply, nothing in 5 days, credit refill).
17. **Client onboarding SOP** — Auto-generated when user logs first client.
18. **Credit system** — If needed for monetization.
19. **Clone / rerun with objective** — For power users creating system #2+.

---

## 8. Sidebar / navigation (updated)

```
[Logo]

── My Systems          → /dashboard/systems (list)
── [Active System ▾]   → dropdown to switch
   ├─ Canvas           → /dashboard/system/[id] (default)
   ├─ My Offer         → /dashboard/system/[id]/offer
   ├─ Build Path       → /dashboard/system/[id]/build
   ├─ Acquisition Kit  → /dashboard/system/[id]/acquire
   └─ Tracker          → /dashboard/system/[id]/tracker

── Tools               → /dashboard/tools
── Settings            → /dashboard/settings

── [Chat ◯]            → slide-out panel (per active system)
```

Mission Control (`/dashboard`) is the default landing when no system exists or as a global overview.

---

## 9. What this product IS now (one paragraph)

LaunchPath builds your first sellable AI system for you. You answer a few questions, and in under 2 minutes you get: a validated offer you can pitch today, a visual build path you can follow (and export to n8n), and a complete acquisition kit with ready-to-paste messages and a LinkedIn search URL that opens a page of your ideal prospects. Then you go use it. When a prospect replies, you come back and get your response. When you book a call, you get your prep. When you close your first client, you get your onboarding SOP. The product works when you work — and it's ready before you are.

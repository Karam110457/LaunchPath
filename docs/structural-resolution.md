# LaunchPath — Structural Resolution

**Purpose:** Resolve the 7 structural problems identified in the current-state analysis. Each section names the problem, makes a hard decision, and defines what changes. This document works alongside `execution-blueprint.md` and overrides earlier docs where they conflict.

---

## Problem 1: Positioning vs Product Reality Mismatch

**The tension:** Sold as SaaS execution, still behaves as coaching/guidance in key parts.

### Resolution: Define exactly what LaunchPath IS and IS NOT in v1

**LaunchPath IS** a system builder. It takes constrained inputs and outputs ready-to-use execution assets: structured offer cards, visual build workflows, and copy-paste acquisition messages with live prospect search links. The user's work is reduced to: paste this message, click this link, read this script on the call.

**LaunchPath IS NOT** (in v1) a runtime. It doesn't send the DMs, run the automation, host the landing page, or close the deal. It builds the machine; the user turns it on.

**The honest positioning:**

> "LaunchPath builds your client-getting system. You run it."

This is not coaching because:
- Coaching says "you should target marketing agencies." LaunchPath hands them a LinkedIn search URL that opens a page of marketing agency founders.
- Coaching says "write a cold DM." LaunchPath hands them 6 message variants with copy buttons.
- Coaching says "build an intake workflow." LaunchPath shows them the exact nodes, tools, and steps in a visual diagram with time estimates.

The gap between "here's advice" and "here's the thing" is closed at the asset level, not at the execution level. That's an honest, defensible, and valuable position.

**What this means for the product:**

Every output must pass this test: **"Could the user do the next real-world action within 60 seconds of seeing this output?"**

- Offer card → copy elevator pitch → paste in LinkedIn bio or DM. ✓
- DM message → copy → paste into LinkedIn message box. ✓
- LinkedIn search URL → click → see prospects. ✓
- Build path node → read 3-5 bullet setup instructions → start setting up. ✓
- Call script → open teleprompter → read during call. ✓

If an output requires the user to "figure out what to do with it," it's coaching. Redesign it.

---

## Problem 2: One-Time Extraction Risk

**The tension:** If the primary deliverables are downloadable/copyable assets, users take them and leave. Activation without retention.

### Resolution: The static assets are the hook. The adaptive layer is the lock-in.

The assets (offer card, messages, search URL, build path) are intentionally portable. Users SHOULD be able to take them. That's what makes LaunchPath feel generous and not manipulative. Locking assets behind a paywall or making them non-exportable would undermine trust with this audience.

**What keeps them:**

**1. Assets degrade without the product.**

Static DM scripts stop working after 10-15 sends (prospects in the same niche see the same patterns). LaunchPath adapts: "Your reply rate dropped. Here are 3 new variants based on what's working." A downloaded JSON of messages can't do that.

**2. Real-world events need real-time responses.**

"Prospect replied 'not right now'" → LaunchPath generates the exact follow-up to copy. "Call went badly" → LaunchPath regenerates the approach. A static export doesn't respond to what happens.

**3. The tracker IS the product after day 1.**

Once they start logging (sent DMs, got replies, booked calls), the tracker becomes their operational dashboard. The AI's next-action suggestions are tied to tracker state. Leaving means losing the adaptive intelligence and starting from scratch in a spreadsheet.

**4. System #2 is only valuable inside the product.**

When they want to try a new niche, pivot, or build a second system, the product already has their profile and can generate in 2 minutes. Starting over outside the product means re-doing all the work manually.

**Implementation:**

- Phase 1: Ship portable assets (copy, export). Don't restrict. Build trust.
- Phase 1: Ship tracker + next-action. Create the "reason to return" loop.
- Phase 2: Ship "AI responds to real-world events" (reply → generates follow-up, call booked → generates prep). This is where static exports can't compete.
- Phase 3: Ship "refresh scripts" (AI notices patterns in tracker data and suggests updated messages). This is the durable retention layer.

**Business model implication:** Don't monetize asset generation. Monetize ongoing system access (the tracker, the adaptive AI, the tools, system #2+). This is a subscription model, not a credits-per-generation model.

---

## Problem 3: Retention Dependency Gap

**The tension:** The adaptive loop needs real-world data. Getting that data either requires integrations (complex) or manual logging (friction).

### Resolution: Manual logging, engineered for near-zero friction. Integrations in v2+.

**v1: Manual logging, but make it trivial.**

The tracker has 5 event types. Each is a single tap + optional context:

| Event | User input required | Time |
|-------|-------------------|------|
| Sent DM | Tap "Sent" (batch: "Sent 5 today") | 2 seconds |
| Got reply | Tap "Reply" → paste what they said (optional) | 10 seconds |
| Call booked | Tap "Call booked" → date (optional) | 5 seconds |
| Call happened | Tap "Call done" → outcome dropdown (interested / not now / no) | 5 seconds |
| Client closed | Tap "Closed" → amount (optional) | 5 seconds |

**Key design rule:** Logging must be FASTER than not logging. If they're already in the app checking their next action, logging is one tap away. If they're outside the app, a push notification / email with a deep link ("Log today's outreach → [link]") makes it one tap from inbox.

**Why this works for v1:**

This audience is motivated. They just built a system and sent their first DMs. Logging "I sent 5 DMs" when the app shows "5/25 — nice, 20 to go" is rewarding, not burdensome. The friction is low enough that the dopamine of seeing progress outweighs the effort.

**v2: Reduce manual input with integrations.**

| Integration | What it automates | Priority |
|-------------|------------------|----------|
| Email tracking (open/reply detection) | Auto-log "got reply" for email outreach | Medium |
| LinkedIn browser extension | Auto-log "sent DM" / "got reply" | High value, high build cost |
| Calendar (Google/Outlook) | Auto-detect call bookings | Medium |
| Stripe/payment link | Auto-detect client closed + revenue | High value for celebration moment |

These are v2+ and should be evaluated by which reduces the most friction for the highest % of users.

---

## Problem 4: Unresolved Product Scope

**The tension:** Too many forks open simultaneously. No singular product surface.

### Resolution: Close every fork. One decision per fork. Ship one thing.

| Fork | Decision | Rationale |
|------|----------|-----------|
| **Landing page builder** | **NO. Not in MVP. Not in v2.** Revisit only after core loop proves retention. | Massive scope. Competes with Carrd, Framer, Lovable. Not our fight. |
| **Acquisition path** | **Outreach first. DMs + calls. No content, no ads in v1.** | Our audience is cash-constrained and time-constrained. Outreach is free, fast, and directly measurable. Content takes weeks to compound. Ads cost money they don't have. |
| **High-ticket vs low-ticket** | **High-ticket (fewer clients, faster proof).** Default to $1k–$5k offers. | One client at $2.5k = proof. They need 1 client, not 50. High-ticket requires fewer conversations. Matches "first client" goal. |
| **On-camera vs faceless** | **Irrelevant to product scope.** Loom script covers both. | The product doesn't depend on this. Include a Loom/video script in acquisition kit. User decides if they use it. |
| **Viral outputs** | **ONE thing: shareable system card.** | See Problem 7 resolution below. |
| **Paid ads** | **NOT in product. Not mentioned. Not planned.** | Audience can't afford ads before first client. Ads are a scale channel, not a start channel. |
| **AI content generation** | **NOT in v1. May add as a tool post-MVP.** | Content is a channel, not the product. If we add it, it's a tool ("Generate 5 LinkedIn posts about your offer") not a core feature. |
| **Lead gen + messaging + channel execution** | **Messaging: in product (acquisition kit). Lead gen: LinkedIn search URL. Channel execution: NOT in product (user sends manually).** | Product builds the assets. User runs them. We own generation, not execution. |

**After these decisions, the product surface is:**

1. Onboarding (profile)
2. Build system (one-shot flow → 3 executable assets)
3. System view (offer + build path + acquisition kit + tracker)
4. Chat (per-system, produces assets)
5. Tools (validate, pivot, sales prep — post system creation)

That's it. Five surfaces. No landing page builder, no content generator, no ad manager, no CRM, no email sender.

---

## Problem 5: Monetization vs Outcome Tension

**The tension:** Gating behind credits slows outcomes. Not gating means no revenue.

### Resolution: Separate the phases. Free for proof. Pay for power.

**Phase 1: Early access / founding cohort (free)**

- No credits. No gates. No payment.
- Goal: get 20-50 users through the full loop (build system → use assets → get first client).
- Capture outcomes (testimonials, before/after, revenue numbers).
- This is the investment phase. Don't optimize for revenue; optimize for proof.

**Phase 2: Paid launch (after proof exists)**

Monetize with a simple subscription, not credits:

| Tier | What they get | Price |
|------|---------------|-------|
| **Free** | 1 system. Full assets. Tracker. Chat (limited messages/day). | $0 |
| **Pro** | Unlimited systems. Unlimited chat. Tools (validate, pivot, sales prep). n8n export. Priority generation. | $29–49/mo |
| **Scale** (later) | Team seats. Client onboarding SOPs. Hosted runtime (future). | TBD |

**Why subscription, not credits:**

- Credits punish usage. Users who use the product more should be rewarded, not charged more.
- Credits create "should I spend this?" anxiety — exactly the wrong emotion for an audience that's already hesitant.
- Subscription aligns incentive: we want them to use the product daily (tracker, chat, tools). Subscription encourages that; credits discourage it.
- Subscription is predictable revenue. Credits are volatile.

**Free tier purpose:** Let anyone build one system and experience the full loop. The upgrade wall is "build a second system" or "unlimited chat" — both are natural points where the product has already proven value.

**What about the n8n export extraction risk?**

Yes, free users could build one system, export the n8n JSON, copy the scripts, and leave. That's fine. They got one system for free. If they want to iterate, pivot, build system #2, or get adaptive AI responses — they upgrade. The free tier is a funnel, not a business model.

---

## Problem 6: Architecture Transition Risk

**The tension:** n8n path = fast/portable. Mastra path = controlled/sticky. Risk of being neither during transition.

### Resolution: Mastra owns generation. n8n is an export format. No transition needed.

These are not competing paths. They serve different roles:

**Mastra = the engine that BUILDS the system.**

- All workflows (Direction Engine, Reality Filter, Offer, Build Path, Acquisition Kit) run as Mastra workflows.
- All agents (OfferStrategist, BuildPlanner, SalesCopywriter, Validator) are Mastra agents.
- All structured output (Zod schemas for offer_blueprint, build_plan, sales_pack) is Mastra-native.
- Chat (per-system, context-aware) uses Mastra agents with system memory.
- This is the product's core. It's not exposed to the user as "Mastra." It's just "LaunchPath built your system."

**n8n JSON = one export format for the build path asset.**

- The visual build path (React Flow) shows the user what their system looks like.
- "Export to n8n" converts the build_plan structured data into n8n-compatible JSON.
- This is a FEATURE of the build path, not an alternative architecture.
- If we later add "Export to Make" or "Export to Zapier," same pattern. Just another format.

**There is no transition.** Mastra is the generation engine from day 1. n8n is an export feature added when ready (Phase 3 in execution blueprint). They coexist cleanly.

**Future: Mastra-hosted runtime (v3+)**

If/when we want LaunchPath to actually RUN the user's automation (not just design it), Mastra can host the runtime. The user's build path goes from "visual diagram + export" to "click 'Deploy' and it runs inside LaunchPath." That's the long-term lock-in: their system runs on our infrastructure. But this is v3+ and should not influence MVP decisions.

**Architecture diagram (v1):**

```
User input → Mastra workflows → Structured JSON → Supabase
                                                      ↓
                                              Next.js UI reads DB
                                                      ↓
                                           System View (tabs)
                                              ↓        ↓
                                         React Flow   n8n export
                                         (visual)     (file download)
```

Clean separation. No architecture transition risk.

---

## Problem 7: Viral Mechanism Not Yet Product-Native

**The tension:** Virality relies on content marketing, not product behavior. No closed share/clone loop.

### Resolution: The system card is the viral unit.

**What gets shared:** When a user builds a system, LaunchPath auto-generates a **System Card** — a visual summary designed for sharing:

```
┌──────────────────────────────────────────┐
│  🟢 AI Client System                     │
│                                          │
│  OFFER: "I help marketing agencies       │
│  automate client reporting using AI"     │
│                                          │
│  AUDIENCE: Agency founders, 11-50 emp    │
│  PRICE: $2,500 setup + $1,000/mo        │
│  BUILD TIME: ~4 hours                    │
│                                          │
│  6 steps · 6 outreach messages · ready   │
│                                          │
│  Built with LaunchPath                   │
│  → launchpath.com/build                  │
└──────────────────────────────────────────┘
```

**Format:** Generated as an OG image (for link previews) + a shareable page (public URL with limited preview).

**The loop:**

1. User builds system → system card auto-generated.
2. "Share your system" button → copies link or downloads image.
3. User posts to Twitter/LinkedIn: "Just built my AI client system in 2 minutes" + card.
4. Viewer sees the card → clicks link → lands on public preview page.
5. Public preview shows: offer headline, build path summary (blurred detail), "Build yours free" CTA.
6. Viewer signs up → builds their own system → shares → loop.

**Why this works for the audience:**

- They WANT to show they're doing something (not just consuming). Sharing a system card signals "I shipped."
- The card is a humble-brag format: specific offer, specific audience, specific price. It looks real.
- The viewer (also an AI-curious beginner) thinks: "I want one of those."

**Implementation:**

- Phase 1: Generate system card as an image (server-side, using offer_blueprint data). "Share" button copies image + link.
- Phase 2: Public preview page at `/s/[system-id]` — shows summary, blurs details, "Build yours" CTA.
- Phase 3: "Clone this system" — viewer can sign up and use the shared system as a starting template.

**Timing:** System card generation ships with Phase 1 (it's just an image from structured data). Public preview page ships Phase 2. Clone ships Phase 3+.

---

## Summary: All 7 problems resolved

| # | Problem | Resolution |
|---|---------|------------|
| 1 | Positioning vs reality | LaunchPath builds assets, user runs them. Every output usable in 60 seconds. |
| 2 | One-time extraction | Static assets are the hook. Adaptive AI + tracker + system #2 are the lock-in. |
| 3 | Retention data gap | Manual logging at near-zero friction (v1). Integrations reduce friction (v2+). |
| 4 | Unresolved scope | All forks closed. Outreach-first, high-ticket, no landing pages, no ads, no content gen. 5 surfaces only. |
| 5 | Monetization tension | Free for proof (founding cohort). Subscription for power (Pro tier). No credits. |
| 6 | Architecture risk | No transition. Mastra = generation engine. n8n = export format. They coexist. |
| 7 | Viral mechanism | System card = viral unit. Auto-generated, shareable, public preview, clone loop. |

---

## What to do now

1. **Lock these decisions.** Stop debating forks. The product is: build system → use assets → log results → adaptive AI. That's it.
2. **Start Phase 1 of execution blueprint.** Data model → onboarding → build flow → system view → tracker → chat. In that order.
3. **Ship to 5 testers within 3 weeks.** The thinnest slice that delivers the full loop. Offer card + acquisition kit + tracker. Build path visual can follow.
4. **Capture proof.** Every tester who gets a reply, books a call, or closes a client = a case study. That proof funds everything after.

# Competitor Feature Gaps (Build My Agent)

> Feature requests from Build My Agent's public Featurebase board, analyzed for LaunchPath relevance.
> Use this as a reference when prioritizing future features.

---

## Priority: Ship at Launch (Table Stakes)

These are embarrassingly basic gaps. LaunchPath should have all of these from day one.

### Conversation Dates & Timestamps (12 votes — #1 most requested)
**Pain:** Messages only show time (e.g., "8:13") with no day/month/year. Users can't follow up on client history properly.
**LaunchPath status:** Already handled — our conversation UI includes full timestamps.
**Effort:** Zero — just don't make this mistake.

### Platform Performance (1 vote but critical)
**Pain:** "Website is slow, fails to load pages, and freezes consistently." WordPress integration bugs.
**LaunchPath status:** Our stack (Next.js 15 + Vercel) is inherently fast. Keep it that way.
**Effort:** Ongoing — performance monitoring, not a feature build.

---

## Priority: High — Clear Differentiators

These have strong demand and LaunchPath should aim to include them early.

### Voice AI Agent (3 votes + 1 separate post = 4 votes)
**Pain:** Users want AI agents that answer phone calls 24/7, sound human, book appointments, send confirmation emails. One post specifically mentions Retell AI integration.
**LaunchPath status:** Planned as a channel. This is our single biggest differentiator — they don't have it at all.
**Effort:** High — requires voice provider integration (Retell, Vapi, or similar).
**Why it matters:** Voice is the most requested missing feature. Multiple separate posts asking for it.

### Human Agent Conversation Takeover (3 votes)
**Pain:** No way for a human to take over a live web chat mid-conversation. Agency owners need to jump in when the AI gets stuck or when a high-value lead appears.
**LaunchPath status:** Not yet built. Should be a priority — this is essential for any serious business deployment.
**Effort:** Medium — requires real-time handoff mechanism, notification system, and chat UI for human agents.
**Why it matters:** Businesses won't trust a fully autonomous bot. Human takeover is a safety net that closes enterprise/SMB deals.

### Call Reminders / Follow-Ups (3 votes)
**Pain:** After a lead books a call, there's no way to send reminders to increase show-up rates. Users want tagging, lists, and automated reminder sequences.
**LaunchPath status:** Partially covered by campaigns. Could be enhanced with automated follow-up sequences triggered by booking events.
**Effort:** Medium — requires event triggers + automated message sequences.
**Why it matters:** Show-up rates directly impact whether the AI agent looks effective. Low show-up = client thinks the bot doesn't work.

### Per-Agent Interaction Limits (1 vote but detailed)
**Pain:** Agency owners who sell subscription agents need to cap interactions per agent per month, based on the client's subscription tier. Currently only global credit limits exist.
**LaunchPath status:** Our credit system naturally supports this. Per-sub-account credit allocation would solve it.
**Effort:** Low-Medium — extend credit system to support per-client caps.
**Why it matters:** Essential for agencies who resell. Without this, they can't create tiered pricing for their own clients.

### Per-Customer Token Usage Analytics (1 vote but extremely detailed)
**Pain:** Agencies managing multiple clients can't see per-customer token consumption. Makes it impossible to price accurately, detect unusual usage, or make data-driven decisions. Requests include: monthly usage per customer, daily breakdown, comparison views, CSV export.
**LaunchPath status:** Not yet built. This maps directly to our sub-account model — each client workspace should show its own usage analytics.
**Effort:** Medium — aggregate usage data per sub-account, build dashboard views.
**Why it matters:** Agencies literally can't run a profitable business without knowing per-client costs. This is a retention feature.

---

## Priority: Medium — Nice to Have Early

Good features that would improve the product but aren't critical for launch.

### Auto-Open Widget (3 votes)
**Pain:** Chat widget only appears as a floating bubble. Users want an option to auto-open it when the page loads to boost engagement.
**LaunchPath status:** Not yet built. Simple config toggle on the widget.
**Effort:** Low — boolean flag on widget embed config.
**Why it matters:** Boosts visibility and conversion rates for deployed chatbots.

### Fixed Page Embedding (2 votes)
**Pain:** Agents can only deploy as floating widgets. Users want to embed them as fixed elements on landing pages (like shiny.ai does).
**LaunchPath status:** Not yet built.
**Effort:** Low — alternative embed mode (iframe or component) alongside the floating widget.
**Why it matters:** Landing page integrations look more professional than a floating bubble.

### Multiple Choice Buttons in Chat (2 votes)
**Pain:** Users want to present clients with selectable choices in a structured format within the chat, rather than free text only.
**LaunchPath status:** Not yet built. This is a rich message type.
**Effort:** Medium — requires message type system (text, buttons, cards, etc.) in the chat widget.
**Why it matters:** Guided conversations convert better than open-ended ones. Key for lead qualification flows.

### Bulk Agent Testing (3 votes)
**Pain:** A feature where "AI tests the AI" with a large volume of questions was previously available but removed. Users want it back.
**LaunchPath status:** Not built. Would be a unique QA feature.
**Effort:** Medium — automated test suite that fires many questions at an agent and reports quality metrics.
**Why it matters:** Gives agency owners confidence before deploying to a client. Reduces "it broke in front of my client" moments.

### Export Client Data (votes unknown — detailed request)
**Pain:** No way to export chat transcripts, leads, or metrics. Users want CSV export filtered by date and agent.
**LaunchPath status:** Not yet built.
**Effort:** Low — API endpoint that queries conversations/leads with filters and returns CSV.
**Why it matters:** Agencies need to share data with clients who use other CRMs or reporting tools.

---

## Priority: Low — Future Consideration

Niche requests or things that don't align with launch priorities.

### HIPAA Compliance (votes unknown — detailed request)
**Pain:** Users selling to medical/dental/med spas/chiropractors need HIPAA compliance to handle patient information legally in the US.
**LaunchPath status:** Not applicable at launch. Would require BAA agreements, encrypted data handling, audit logs.
**Effort:** Very High — legal + technical requirements.
**Why it matters:** Opens the healthcare vertical entirely. Huge market but massive compliance burden. Consider only after product-market fit is established.

### Email Organization (2 votes)
**Pain:** Sort, delete, move, draft responses for existing emails within the agent interface.
**LaunchPath status:** Out of scope — we're not building an email client.
**Effort:** High — essentially building email management into the platform.
**Relevance:** Low for launch. Email as a channel is sufficient; email management is a different product.

### Upload Files for Social Media Auto-Posting (2 votes)
**Pain:** Upload video/images, auto-generate titles/descriptions/hashtags, post to social media.
**LaunchPath status:** Out of scope for launch. This is more of a social media management tool.
**Effort:** High.
**Relevance:** Low — not aligned with the core agent-building flow.

### Email Campaigns (1 vote)
**Pain:** Run automated email campaigns through the platform.
**LaunchPath status:** We already have campaigns as a concept. Email as a campaign channel could be added.
**Effort:** Medium.
**Relevance:** Medium — aligns with existing campaign infrastructure.

### More Integrations (1 vote)
**Pain:** Business-specific integrations and more customizable agent traits.
**LaunchPath status:** Our tool system (composio, HTTP, webhook, MCP) already provides broad integration capability.
**Effort:** Ongoing.
**Relevance:** Already better positioned than competitor.

### Native RTL Support (1 vote)
**Pain:** Right-to-left UI for Hebrew/Arabic markets.
**LaunchPath status:** Not built. CSS `direction: rtl` on the chat widget.
**Effort:** Low-Medium — CSS changes + testing.
**Relevance:** Low for launch. Consider when expanding to Middle East/Israeli markets.

### API Access (1 vote)
**Pain:** "Get API agents in here to deploy bigger systems not just chatbots."
**LaunchPath status:** Our agent system is already more capable than just chatbots (tools, sub-agents, HTTP calls).
**Effort:** Medium — public API for agent management.
**Relevance:** Medium-term. Power users and developers will want this eventually.

### Unofficial WhatsApp APIs (1 vote)
**Pain:** Use cheaper unofficial WhatsApp APIs (UAZAPI, EvolutionAPI) instead of official WhatsApp Business API.
**LaunchPath status:** Not relevant for launch. Stick with official channels.
**Effort:** Medium.
**Relevance:** Low — unofficial APIs risk account bans and legal issues.

### Voiceflow Integration (1 vote)
**Pain:** Add Voiceflow as an integration.
**LaunchPath status:** Not relevant — we're the builder, not integrating with competing builders.
**Relevance:** None.

### More Templates (1 vote)
**Pain:** Pre-made agent templates for specific use cases (Google Reviews collection, voice receptionists).
**LaunchPath status:** Templates are a future consideration. Easy to build once the agent builder is solid.
**Effort:** Low per template.
**Relevance:** Medium — helps beginners get started faster.

---

## Summary: What to Take from This

**Ship at launch (free wins):**
- Proper conversation timestamps (date + time)
- Fast, reliable platform performance

**Build early (high-impact differentiators):**
- Voice AI (biggest gap — they don't have it)
- Human takeover for live conversations
- Per-client usage analytics (essential for agency model)
- Per-agent interaction limits (credit allocation per sub-account)
- Call reminders / automated follow-up sequences

**Add when ready (nice to haves):**
- Auto-open widget toggle
- Fixed page embedding
- Multiple choice buttons in chat
- Bulk agent testing
- CSV data export

**Ignore for now:**
- HIPAA compliance (too heavy for early stage)
- Email management (not our product)
- Social media auto-posting (not our product)
- Unofficial WhatsApp APIs (legal risk)
- Voiceflow integration (competitor product)

---

## Healthcare Vertical Strategy

> The healthcare market is one of the highest-converting verticals for AI agents. This section covers how LaunchPath users can deploy AI agents into healthcare businesses, what HIPAA means for us, and the practical playbook.

### Why Healthcare Is the #1 Vertical for AI Agents

- Dental practices miss **30-40% of incoming calls** when the front desk is busy
- Each missed call = **$850-$1,300** in first-year patient revenue lost
- Lifetime patient value: **$4,500-$7,500**
- Practices report **9-17x ROI within 6 months** from AI phone receptionist
- Healthcare businesses are used to paying **$500-2,000/mo** for software and services
- AI phone answering is the clearest, most measurable ROI pitch in any vertical

### Target Healthcare Businesses

**High demand (proven market):**
- Dental practices (general, orthodontics, oral surgery, DSOs)
- Med spas (Botox, fillers, laser treatments)
- Chiropractic offices
- Physical therapy practices
- Dermatology clinics
- Plastic surgery practices

**Strong demand:**
- Mental health (therapists, psychologists, counseling centers)
- Optometrists / ophthalmologists
- Urgent care centers
- Weight loss clinics
- Fertility clinics

**Also covered by HIPAA (future opportunity):**
- Pharmacies, home health agencies, nursing homes, labs, medical billing companies

**NOT covered by HIPAA (no compliance needed):**
- Regular spas/salons (non-medical), gyms, life coaches, veterinary practices

### What the AI Agent Handles (Stays Upstream of PHI)

The key to working in healthcare without full HIPAA compliance: **handle scheduling and marketing, not clinical data.**

**AI agent DOES handle:**
- Answering general questions (hours, location, services, pricing)
- Appointment booking (name + phone + "I want a cleaning")
- Missed call text-back ("Sorry we missed you! Want to book?")
- After-hours phone answering (24/7 coverage)
- Appointment reminders (48h, 24h, 2h before)
- Follow-up sequences for leads who didn't book
- Review generation (post-appointment SMS requesting a Google review)
- Reactivation campaigns (patients who haven't visited in 6-12+ months)

**AI agent does NOT handle:**
- Patient medical records or charts
- Diagnosis, treatment plans, or medication discussions
- Insurance claims with actual policy details
- Any detailed health information storage

**The gray area:** Even "name + they're a dental patient" is technically PHI. Smart agencies use HIPAA-compliant voice/chat platforms that sign BAAs, so the compliance burden sits on the platform layer, not the agency.

### Use Cases by Practice Type

**Dental offices (easiest entry point):**
- AI phone receptionist (the bread and butter)
- Appointment booking + reminders
- Recall/reactivation campaigns for lapsed patients
- Review generation for local SEO

**Med spas:**
- Website chat for treatment inquiries (Botox, fillers, laser)
- Lead nurture sequences for high-ticket services
- Social media DM auto-response (Instagram is huge for med spas)
- Appointment booking from chat/social

**Chiropractors:**
- Missed call text-back
- Appointment reminders
- Review requests
- New patient intake scheduling

**Mental health practices:**
- Intake scheduling + waitlist management
- After-hours crisis routing (to emergency line, not AI handling)
- Appointment reminders
- Insurance verification inquiries

### How LaunchPath Users Find Healthcare Clients

**1. Cold email with a missed-call audit (most common):**
- Build a list of local practices from Google Maps
- Send personalized email: "I called your office at 6pm and got voicemail. Here's what an AI receptionist would have done."
- Tools: Apollo.io, Instantly, Saleshandy for email sequences

**2. Loom video audits (highest conversion):**
- Record 2-3 min personalized video showing the practice's specific problems
- "I tested your website — it took 47 seconds before anyone responded"
- Dramatically higher response rate than text-only emails

**3. Free 7-day audit as lead magnet:**
- "Let me track your missed calls for free for a week"
- After 7 days, show them the data: "You missed 23 calls. Here's what that cost you."

**4. Referral snowball (most sustainable):**
- Land one dentist, get results, approach every other dentist in the area
- "Dr. Smith down the street recovered $4,200/month in missed calls"
- Healthcare is tight-knit — word of mouth is powerful

**5. Local networking:**
- Visit practices in person with a tablet demo
- Attend dental society meetings, chamber of commerce events

### What Healthcare Clients Pay

| Service | Monthly price | Agency's platform cost | Profit per client |
|---------|-------------|----------------------|-------------------|
| AI phone receptionist only | $300-500/mo | $100-220/mo | $150-400/mo |
| Full package (phone + chat + follow-up + reviews) | $500-2,000/mo | $200-400/mo | $300-1,600/mo |
| Setup fee (optional, one-time) | $500-2,500 | — | Pure profit |

**The math at scale:** 20 dental clients on basic phone receptionist at $400/mo = $8,000/mo revenue. Platform costs ~$200/mo per client = $4,000/mo. Net profit: **$4,000/mo**.

### The Sales Pitch That Works

**Lead with pain, never technology:**
- "How many calls did your office miss last week?"
- "Each one of those is worth $1,000."
- "You get ~75 inquiries/month, miss 35%, that's $22,000/month walking out the door."
- "Our AI receptionist costs $400/month. It answers every call, 24/7."

**Position as augmentation, not replacement:**
- "Your front desk handles 100 things at once. When they're helping a patient in person, who answers the phone?"
- "This isn't replacing anyone — it's a helper that never calls in sick."

**Risk reversal:**
- Free 7-14 day trial
- Month-to-month, no long-term contract
- "If it doesn't book at least X appointments in the first month, you don't pay"

**Live demo with their practice:**
- Use their name, services, hours in the demo
- Let the dentist hear the AI answer a call about their office
- Call after hours and let them hear their current voicemail vs. the AI

### Common Objections

| Objection | Response |
|-----------|----------|
| "Patients want a real person" | "They do — but right now 35% get voicemail. Would they rather talk to AI or nobody?" |
| "Too expensive" | "You're not paying $400/mo. You're currently losing $22K/mo in missed calls." |
| "What about HIPAA?" | "AI handles scheduling only. Never touches records. Platform is compliant with a BAA." |
| "I don't trust AI" | Live demo on the spot — let them hear it handle their specific scenarios |
| "We tried a chatbot before" | "2020 chatbots and 2026 voice AI are completely different. Let me show you." |

### HIPAA Compliance — When We Need It

**Not needed at launch.** LaunchPath users can serve healthcare clients by staying upstream of PHI (scheduling, marketing, general info only).

**When to pursue HIPAA (future):**
- When healthcare demand justifies the investment
- Offer as a premium tier add-on ($200-500/mo extra)
- Requires BAAs with Supabase ($949/mo), Vercel ($370/mo), and direct LLM APIs (bypassing OpenRouter which has no BAA)
- Year 1 cost: ~$75,000 (infrastructure add-ons + compliance program + audit)
- Ongoing: ~$40-60K/year
- Timeline: 3-4 months with a compliance automation tool (Sprinto, Drata, Vanta)

**Key architectural note:** OpenRouter does NOT offer a BAA. For HIPAA-compliant agents, we'd need to route directly to OpenAI or Anthropic APIs (both offer BAAs). Build a "Healthcare mode" toggle that bypasses OpenRouter for those agents.

**See also:** Detailed HIPAA requirements were researched in the AI cost model discussions (March 2026). Key providers: Supabase (BAA on Team+HIPAA add-on), Vercel (BAA on Pro+add-on), OpenAI (BAA via baa@openai.com), Anthropic (BAA via sales team).

### Voice AI Provider Options for Healthcare

| Provider | Cost | HIPAA Compliant | Notes |
|----------|------|----------------|-------|
| Retell AI | $0.07+/min | Yes | Developer-friendly, good for custom builds |
| Vapi | $0.05/min + $500/mo agency plan | Check | Highly customizable |
| Arini | Custom pricing | Yes | Dental-specific, Y Combinator-backed, 90% call answer rate |
| TrueLark | Custom pricing | Yes | Multi-channel (calls, texts, web chat) |
| Bland AI | $0.09/min | Check | Enterprise-focused |

LaunchPath should integrate with one or more of these for the voice channel, starting with Retell AI or Vapi as they offer the most flexibility.

---

*Source: https://buildmyagent.featurebase.app/ (scraped March 2026)*
*Last updated: 2026-03-09*

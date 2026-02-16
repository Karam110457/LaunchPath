# LaunchPath: Complete Strategic Blueprint

## Executive Summary

LaunchPath is transitioning from a coaching-style advisory product to an execution-first SaaS platform. The core problem identified: current design generates text documents describing what users should build, rather than building executable systems for them. This gap between "here's your plan" and "here's your working system" is the difference between 5% activation and 50% activation.

The product must be redesigned around one principle: **every output must be immediately usable, not just readable.**

---

## The Fundamental Product Shift

### From (Current State):
- User inputs → AI generates text artifacts → User reads → User builds themselves
- Outputs: offer documents, checklists, scripts, advice
- Value model: "Here's what you should do"
- User journey: Setup → Generate → Leave → Maybe return
- Retention driver: Credits for more text generations

### To (Required State):
- User inputs → AI builds executable systems → User deploys → User uses
- Outputs: working demos, ready-to-send messages, actual prospect lists, importable workflows
- Value model: "Here's your working client-getting machine"
- User journey: Setup → Deploy → Monitor → Optimize → Scale
- Retention driver: Ongoing performance data + optimization + fresh resources

**Core metric:** Time from signup to first prospect conversation should be 30 minutes, not 40+ hours.

---

## Critical Architecture Decisions

### Decision 1: Output Contract Enforcement
Every generation must produce at least one executable asset:
- Downloadable file (CSV, JSON, workflow)
- Copy-ready asset (messages with merge fields, scripts)
- Clickable action (pre-built URLs, buttons, links)
- Visual interactive object (editable workflow diagrams, cards)

Pure text-only outputs must be rejected at the workflow validation layer. If AI generates text, auto-convert to executable format (text list → CSV, script → copyable block with button, steps → visual workflow).

### Decision 2: Runtime Location
Choose one path for V1, not both:

**Option A: n8n Export Path (Recommended for V1)**
- Fast to ship (2 weeks)
- User owns and controls deployment
- Lower infrastructure cost
- But: weaker retention, higher support burden
- Migration-ready architecture (store abstract workflow definitions that can later run on Mastra)

**Option B: Mastra Runtime Path**
- Slower to ship (2+ months)
- Strong retention (system only works while subscribed)
- Easy monetization
- Lower support burden
- But: higher complexity, user dependency risk

**Recommended:** Start with export path but architect for future migration (store workflows in platform-agnostic format, can switch to hosted runtime later with zero user friction).

### Decision 3: V1 Scope Lock
Single-page product spec that cannot expand:
- **Channel:** LinkedIn outreach only
- **Offer type:** Lead generation systems for local service businesses
- **Delivery model:** n8n workflow + hosted demo page
- **Monetization:** Credit-based with monthly refill
- **Integration tier:** Basic (demo hosting + CSV exports)

Everything else deferred to V2+. No additions unless something is removed. Forces completion over feature creep.

---

## The High-Impact Feature Set

### Tier 1: Foundation (Week 1-2)

#### 1. Demo Landing Page Agent
**What:** Simple, single-page interface that connects to user's n8n workflow webhook. Shows the AI interaction their prospects would experience.

**Why critical:** Closes the coaching-to-product gap immediately. Users get a working, shareable demo URL within minutes. Solves the "afraid to sell something I haven't built" activation blocker. Creates viral mechanism (shareable proof). Makes n8n workflow valuable (demo needs backend).

**Structure:**
- Branded header (business name, tagline, optional logo)
- Input interface (form or chat based on workflow needs)
- Result display (formatted AI output from workflow)
- Call-to-action (links to user's calendar/contact)
- LaunchPath branding footer (free tier) / custom domain (paid tier)

**Technical flow:** Prospect visits demo URL → fills form → LaunchPath sends to user's n8n webhook → n8n processes → returns result → LaunchPath displays formatted output → prospect sees CTA.

**Free vs Paid:**
- Free: 50 interactions/month, watermarked, demo.launchpath.ai subdomain
- Paid: unlimited interactions, remove branding, custom domain

#### 2. Actual Prospect List Generator
**What:** CSV file with 25 real companies including company name, decision-maker contact, LinkedIn URL, email (if available), website, and one-sentence fit reason.

**Why critical:** Removes hardest activation barrier ("where do I find these people?"). Tangible value (actual leads) vs abstract advice (search criteria). Makes first outreach possible within 1 hour.

**Data sourcing:** Licensed APIs (Apollo.io, ZoomInfo, Clearbit) or public sources (Google Maps, LinkedIn public profiles). No scraped data for legal safety.

**Quality gates:** Verify 80%+ have LinkedIn profiles, check company size matches, ensure emails aren't generic (no info@, contact@), flag and remove suspicious entries.

#### 3. Copy-Ready Personalized Messages
**What:** 25 individual messages pre-written for each prospect, not templates to customize. Each message includes specific detail about that prospect (not just [Name] placeholder).

**Why critical:** Eliminates "I don't know what to say" paralysis. Each message is ready to send immediately. Shows system is "real" (mentions actual companies). Enables first outreach action.

**Format:** Each message presented as copyable block with [Copy to clipboard] button, [Name] and other merge fields highlighted for quick editing inline, includes demo link from landing page feature.

### Tier 2: Retention Core (Week 3-4)

#### 4. Real-World Progress Tracker
**What:** Dashboard tracking actual execution metrics, not system completion metrics.

**Structure:**
- Prospects contacted: X/25
- Replies received: X
- Calls booked: X (with dates)
- First client: Yes/No
- Revenue: $X

**Logging mechanism:**
- Simple one-tap actions ("I sent a message", "Got a reply", "Booked a call")
- Contextual prompts triggered by logged events
- Triggers next actions (reply → generate response, call booked → trigger call prep, first client → celebration + testimonial capture)

**Why critical:** Creates daily return habit (log progress). Makes success visible and motivating. Triggers contextual AI help. Enables performance optimization. This is the retention mechanism that actually works.

**Auto-capture wherever possible:** Demo page views, demo form submissions, calendar webhooks, payment processor webhooks. Manual logging only as fallback or for quick wins.

#### 5. LinkedIn Search URL Generator
**What:** Pre-built clickable URLs that open exact prospect searches in LinkedIn Sales Navigator, LinkedIn basic search, and Google Maps.

**Why critical:** Zero friction prospecting (one click → see prospects). Works even without prospect API access. Feels like magic to beginners. Specific fix identified in brutal feedback.

**Implementation:** Construct URLs with query parameters based on their niche/criteria, test across accounts, provide fallbacks (Sales Nav → basic search → Google Maps).

#### 6. AI Reply Generator (Chat That Produces)
**What:** When user logs prospect reply, AI generates ready-to-send response they can copy-paste. Each response is added to their reusable objection library.

**Why critical:** Removes "what do I say back?" paralysis. Makes chat valuable (produces outputs, not just advice). Builds objection library automatically. Retention driver (they need help in-the-moment).

**Flow:** User logs reply → AI receives prospect context + their reply + offer details → generates 2-3 response options → user copies and sends → response saved to objection library → tracked for future optimization.

### Tier 3: Conversion & Optimization (Week 5-8)

#### 7. Interactive Call Prep
**What:** When user logs "call booked," generates call-specific preparation interface with context, teleprompter-style opening script, flip cards for discovery questions, and objection responses.

**Why critical:** Most beginners lose deals because they fumble calls. Makes calls feel less scary. Creates return trigger ("I have a call tomorrow → I need prep"). Directly impacts conversion rate.

**Components:** Quick context summary (business details, pain point, offer, likely budget), teleprompter view for opening, scenario cards for questions, objection-response pairs, post-call logging to improve future scripts.

#### 8. Workflow Visualization
**What:** React Flow diagram showing their system visually instead of text checklist. Each node clickable with specific instructions, editable inline, "Export to n8n" produces importable JSON.

**Why critical:** Makes abstract system concrete and understandable. Reduces fear ("I can see what it does"). Makes editing intuitive. Export becomes obvious action. Brutal feedback specifically calls this out.

#### 9. Performance-Based Pivot System
**What:** After threshold (25 contacts, 2 weeks, low response rate), trigger data-driven pivot suggestions with one-click generation of new system.

**Why critical:** Most beginners give up after first attempt fails. Creates "try again" loop vs "quit". Uses execution data to improve offers. Retention for users who don't succeed immediately.

**Trigger conditions:** Response rate below benchmark, low demo completion, objection patterns, budget feedback. Suggests specific changes (different niche, positioning, price point, delivery model).

#### 10. Weekly Performance Optimization
**What:** Automated analysis comparing user's system performance to benchmarks, with specific actionable suggestions (not generic advice).

**Why critical:** Gives concrete reason to return weekly. Makes credit refill feel valuable. Requires execution data (reinforces tracking habit). Long-term retention for active users.

**Components:** Compare metrics to all users, identify weak points, generate specific fixes (change message CTA, adjust timing, modify demo flow), one-click application of changes.

---

## Solving The 14 Core Risks

### 1. Product Identity Fragility
**Solution:** Architectural forcing function. Output validation layer rejects pure text. Every UI component must include an action (copy, download, click, open). Track "outputs with zero-click actions" → should be 0%.

### 2. Retention Backbone Weakness  
**Solution:** Auto-capture + smart prompts. Priority: webhooks (demo, email, calendar, payment) → API integrations (Gmail, Calendar) → predictive prompts (smart timing) → manual logging (last resort). Target: >60% of events captured automatically.

### 3. One-Time Extraction Risk
**Solution:** Incomplete exports + continuous value. Free tier gets functional but limited system (core logic works, advanced nodes are placeholders, demo watermarked, 50 interactions/month, no optimization). Paid tier unlocks complete workflows, removes limits, provides ongoing value (fresh prospect lists monthly, performance-based message optimization, automatic workflow updates).

### 4. Output Quality Consistency
**Solution:** Quality gates + context depth. Before generation, require specific niche (not broad category), defined company size range, concrete pain point, measurable outcome, clear differentiation. After generation, verify prospect quality (80%+ real LinkedIn profiles), run generic detector on messages, test workflow execution simulation. Track which outputs get results, feed back into prompts.

### 5. Demo-to-Real Gap
**Solution:** Demo IS the real system. Demo page connects to same n8n workflow as production, just with test data vs real data. No separate demo/production logic. Test data is realistic (real-looking companies, realistic inputs, includes error case). Promise: "What you see in demo is exactly what prospects see."

### 6. Scope Creep Pressure
**Solution:** One-page product spec lock. V1 features must fit on single screen. Any addition requires removal of something else. Forces completion. LinkedIn only, lead gen only, service businesses only, n8n + demo only. Everything else is V2+.

### 7. Channel Dependency (LinkedIn Ban)
**Solution:** Multi-channel message format. Generate messages in channel-agnostic format (hook, problem, solution, CTA, demo link), then format for LinkedIn, email, Twitter DM, cold email. User picks channel(s). If one is blocked, others still work. Teach safe practices (organic engagement first, rate limiting, personalization).

### 8. Compliance/Legal Exposure
**Solution:** Licensed data + liability transfer. Use only licensed APIs (Apollo, ZoomInfo) or public data (Google Maps). No scraping. Clear ToS transferring responsibility (user complies with platform rules, follows anti-spam laws, uses data lawfully). Product provides tools and warnings, not guarantees. No automated sending in V1 (user copies and sends manually). Disclaimers on every export.

### 9. Monetization Tension
**Solution:** Hybrid tier model. Free tier gives complete first system but limited scale (1 system, 50 demo interactions, 25 prospects one-time, watermarked). Starter tier ($49/mo) provides ongoing value (3 systems/mo, unlimited demos, 100 prospects/month refreshed, unlimited messages, remove watermarks). Pro tier ($149/mo) adds unlimited everything plus optimization. Charge for ongoing value (fresh data, updates, infrastructure), not for initial generation.

### 10. Data Access for Optimization
**Solution:** Partial signals + benchmarks. Don't need complete tracking. Use demo analytics (views, completions, time on page, drop-offs), user behavior (system generation frequency, return rate, chat questions, upgrade timing), and manual logs (even incomplete). Optimize individually (if demo views high but completions low → suggest CTA changes) and via cohorts (compare to niche averages, surface top performer tactics, benchmark-based suggestions).

### 11. Infrastructure Transition Risk
**Solution:** Export-first, migration-ready architecture. V1 ships n8n exports for speed. But store workflows in abstract format that can run on Mastra later. When ready to migrate (100+ users, clear monetization, support burden justifies hosting), flip switch and existing users transition with zero friction. Avoid hybrid state—pick one path for V1.

### 12. Attribution/Measurement Gaps
**Solution:** UTM-style tracking IDs. Every output gets unique ID (prospects_user123_system456_batch1, msg_user123_system456_v1, demo URL with tracking params). When logging outcomes, prompt to select which message/prospect/demo. Creates attribution chain (system → message → prospect → demo → reply → call → deal). Enables data-driven insights (which messages work, which prospect sources convert, which demos perform).

### 13. Viral Loop Not Closed
**Solution:** One-click clone from demo. Demo page footer: "Want to build your own? [Start free →]" Pre-fills form with detected niche, generates in 5 minutes, user shares their demo, loop continues. Referral tracking (demo URLs have ?ref=share parameter, original user gets credits). Public showcase page with "Clone This System" buttons. Product makes it easy to create content about product.

### 14. User Execution Variance
**Solution:** Progressive complexity reveal. V1 requires zero technical skill (answer 6 questions, get demo link, copy 25 messages, paste into LinkedIn, ask AI for replies, copy response, send). No n8n setup, API keys, webhook config, domain setup, integrations required initially. Optional depth added later (V1.5 adds "Import to n8n" button, V2 adds auto-send via LinkedIn integration). Documentation: single page "Getting Your First Client" with 7 steps. Advanced docs separate and optional. Target: >80% achieve first outreach without reading docs.

---

## Free Trial Strategy

### Structure
Credit-limited, not time-limited. Trial allocation must be enough to experience real value but not enough to fully complete and churn.

### Free Tier Gets:
- 1 complete system generation (offer + build + sell package)
- Working demo page (50 interactions/month, watermarked)
- 25 actual prospects with contact info (one-time)
- 25 personalized ready-to-send messages (one-time)
- Basic progress tracker (manual logging)
- Access to AI chat for questions

### Free Tier Does NOT Get:
- Multiple system generations
- Unlimited demo interactions
- Fresh prospect lists (monthly refresh)
- Optimization suggestions
- Remove watermark
- Custom domain
- Advanced integrations
- Priority support

### Upgrade Triggers:
Demo interaction limit hit ("3 interested prospects but at limit"), watermark removal request ("prospect asked about LaunchPath footer"), need for multiple systems ("want to try different niche"), performance optimization ("how do I improve response rate?").

### Goal:
Free tier proves value (user can get first client using demo), but scaling or looking professional requires paid tier. Natural upgrade path when they succeed.

---

## Content-Led Growth Strategy

### Current State
Partner creating Instagram Reels using hook-tutorial format:
- Authority hook from famous person (Dan Martell, Alex Hormozi) - 3-4 seconds
- Transition: "Here's how you do it"
- Tutorial showing specific tools (currently Vapi + Instant Data Scraper)
- Result/proof
- CTA to bio link

Validation: 100 followers in 1 week, 13.1k, 8.1k, 3.6k views on first 3 videos.

### Strategic Shift
Replace tutorial tools (Vapi/Scraper) with LaunchPath, making the product itself the reason content goes viral.

### Critical Product Requirements for Tutorial Content

#### 1. Visible AI Work (The Money Shot)
Make generation take 8-12 seconds (not instant) but show what's happening:
- "Analyzing 4,200 companies..."
- "Found 47 matches..."
- "Writing personalized hooks..."
- "Building demo page..."

Why: Slow enough to record, impressive enough to show. Viewer sees "AI working" not just loading.

#### 2. Tutorial-Ready Interface
Design for 60-second screen recordings:
- Larger text (readable in videos)
- Slower animations (easier to follow)
- Clean UI (not cluttered)
- One-click actions (no multi-step processes)
- Specific examples (real numbers, not placeholders)

Optional "Content Creator Mode" that enables recording-optimized interface.

#### 3. Showable Steps
Tutorial format needs 5 visible steps that fit in 60 seconds:
- Step 1: Pick niche (8 sec) - dropdown selection
- Step 2: AI finds prospects (10 sec) - shows scanning animation with numbers
- Step 3: Writes messages (12 sec) - shows generation with preview
- Step 4: Builds demo (10 sec) - shows demo page creation
- Step 5: Copy and send (10 sec) - shows copy button, paste action
- Result: "First client could be 2 days away" (6 sec)

#### 4. Screenshot-Worthy Outputs
Every output must look good in screenshot with zero editing:
- Clean visual design
- Large readable text
- Specific details (not generic)
- Visual elements (not pure text)

Test: Can you screenshot and post to Instagram immediately?

#### 5. Shareable Result Pages
Every generated system gets public showcase page showing what it does, demo link, example messages, results (if public), "Build your own" CTA. Shareable on Instagram story, Twitter, LinkedIn, TikTok descriptions.

#### 6. Built-in Content Tools
Features that make creating content easy:
- Weekly performance digest (pre-made for "results" posts)
- Content hook library (proven tutorial formats)
- Screen recording helper (guides through recording with auto-pauses)
- Timestamp markers for editing
- Suggested voice-over scripts

### 30-Day Content Calendar Structure

**Week 1:** Introduction (first system build, sending messages, first responses, first call, first client, revenue proof, new niche)

**Week 2:** Proof & variations (weekly results, different niches, common mistakes, best messages, demo secrets, outreach tactics, case studies)

**Week 3:** Advanced techniques (scaling to 10 clients, daily routine, speed runs, mistakes/lessons, tech stack, client onboarding, pricing)

**Week 4:** Authority & community (student results, Q&A, live builds, revenue reveals, comparisons, bigger picture, future goals, success stories)

### The Viral Loop
Tutorial posted → viewer watches → clicks bio → sees showcase page → builds own system → gets results → wants to post → uses LaunchPath content tools → posts tutorial → their viewers click → loop continues.

Product should make it easy to create content about product.

### Success Metrics
Track content → product funnel:
- Reels posted per week
- Total views (compound growth expected)
- Bio click rate (target: 2-3%)
- Signup conversion (target: 15% of bio clicks)
- System generation activation (target: 60% of signups)

Key insight: Tutorial content gets 15% bio-to-signup rate. Product must convert 60%+ of signups to activation for viral growth.

---

## Monetization Model

### Tier Structure

**Free (Proof-of-Concept):**
- 1 system generation
- 50 demo interactions/month
- 25 prospects (one-time)
- 25 messages (one-time)
- Watermarked demo
- Manual tracking
- Goal: Prove value, get first client

**Starter ($49/month):**
- 3 systems/month
- Unlimited demo interactions
- 100 prospects/month (refreshed)
- Unlimited messages
- Remove watermarks
- Auto-tracking via integrations
- Email support
- Goal: Scale to 3-5 clients

**Pro ($149/month):**
- Unlimited systems
- Unlimited everything
- Self-host demo pages
- Custom domains
- Weekly optimization reports
- Priority support
- Early access features
- Goal: Run as real business

### Revenue Principles
Don't charge for generation—charge for ongoing value:
- Fresh data (new prospect lists)
- Continuous updates (performance optimizations)
- Infrastructure (demo hosting, tracking, analytics)
- Support (help when stuck)

Incentives align: you want users to succeed (they only upgrade after winning).

### Conversion Strategy
Free tier is complete (can achieve first client). Paid tier required for scale, professionalism, optimization. Natural upgrade moments when they succeed.

Target: >15% free-to-paid conversion within 30 days.

---

## Success Metrics Hierarchy

### Activation Metrics (First 7 Days)
- % completing onboarding (6 questions) - target: >90%
- % generating first system - target: >60%
- Time from signup to first system - target: <10 minutes
- % who get demo link - target: 100% of system generators
- % who download prospect list - target: >80%
- % who copy first message - target: >70%
- % who log first outreach - target: >40%

### Engagement Metrics (Week 2-4)
- Week 2 return rate - target: >50%
- Week 4 return rate - target: >30%
- Days between returns - target: <3 days
- Progress updates logged per user - target: >5 per month
- Chat messages sent - target: >10 per active user
- Demo page views per user - target: >20

### Outcome Metrics (First 90 Days)
- % reporting first prospect conversation - target: >30%
- % reporting first call booked - target: >15%
- % reporting first client - target: >5%
- Time to first client - target: median <14 days
- Revenue per successful user - target: >$1,000

### Retention Metrics
- Month 2 retention - target: >40%
- Month 3 retention - target: >30%
- Systems per active user - target: >2
- Monthly active users (return >1x/month) - target: >50%

### Conversion Metrics
- Free to paid conversion - target: >15%
- Free to Starter conversion time - target: <30 days
- Starter to Pro upgrade rate - target: >10%
- Churn rate (monthly) - target: <5%

### Content Metrics
- Reels posted per week - target: 7
- Average views per reel - target: >10k
- Bio click rate - target: >2.5%
- Bio-to-signup conversion - target: >15%
- Signup-to-activation - target: >60%

---

## Technical Architecture Principles

### Core Stack Decisions
- **Workflow engine:** Mastra for generation logic, n8n for user execution
- **Frontend:** React with emphasis on tutorial-ready UI (large text, clean design, one-click actions)
- **Demo hosting:** Vercel for landing pages, webhook bridge to user's n8n
- **Data storage:** Abstract workflow definitions (can switch runtime later)
- **Prospect data:** Licensed APIs (Apollo.io, ZoomInfo) for legal safety
- **Integrations:** Gmail API, Google Calendar API, Calendly webhooks for auto-tracking
- **Analytics:** PostHog or similar for event tracking with UTM-style IDs

### Quality Assurance Gates
Pre-generation validation:
- Specific niche required (not broad category)
- Company size range defined
- Pain point concrete and measurable
- Differentiation angle clear
- User profile complete

Post-generation validation:
- Prospect list: 80%+ have LinkedIn profiles
- Messages: pass generic detector (must include specific details)
- Workflow: execution simulation runs without errors
- Demo page: renders correctly, webhook connects

Auto-convert pure text to executable format if validation fails.

### Data & Privacy
- Use licensed B2B data only (no scraped consumer data)
- Clear ToS on user responsibility for compliance
- No automated sending without explicit consent
- Rate limiting suggestions (not enforcement - user's choice)
- Disclaimers on all exports
- GDPR/CAN-SPAM compliant data handling

### Scalability Considerations
- Demo pages are lightweight (static + webhook passthrough)
- n8n runs on user's infrastructure (not our compute)
- Heavy lifting (AI generation) rate-limited by credits
- Database scales horizontally (one record per system)
- Webhook endpoints can be load balanced
- Migration path to hosted runtime when volume justifies

---

## Immediate Implementation Roadmap

### Week 0 (Pre-Build)
Make forcing-function decisions:
1. Runtime location: n8n export (migration-ready architecture)
2. V1 scope: LinkedIn outreach for service business lead gen only
3. Free trial end-state: Complete system but limited scale
4. Monetization: Hybrid tier model (free → $49 → $149)
5. One-page product spec locked (no additions without removals)

### Week 1-2: Foundation Build
1. Demo landing page generator and hosting
2. Actual prospect list generator (API integration)
3. Copy-ready personalized messages
4. Output contract enforcement (validation layer)
5. Tutorial-ready UI design (large text, clean, one-click)
6. Content creator mode (recording-optimized interface)

### Week 3-4: Retention Core
1. Real-world progress tracker (with auto-capture)
2. LinkedIn search URL generator
3. AI reply generator (chat produces, not discusses)
4. Weekly performance digest
5. Attribution tracking IDs system
6. Showcase pages (shareable results)

### Week 5-6: Conversion Boost
1. Interactive call prep (teleprompter + flip cards)
2. Workflow visualization (React Flow)
3. Performance optimization suggestions
4. Quality gates and feedback loops
5. Multi-channel message formatting
6. Testimonial capture automation

### Week 7-8: Viral & Optimization
1. One-click clone from demo
2. Offer pivot system (data-driven)
3. Content hook library
4. Screen recording helper
5. Referral tracking and rewards
6. Analytics dashboard

### Week 9+: Polish & Scale
1. Advanced integrations (optional)
2. Migration to hosted runtime (when justified)
3. White-label features (V2)
4. Multi-channel expansion (V2)
5. Team collaboration (V3)
6. API access (V3)

---

## Critical Success Factors

### Product Must Be:
1. **Immediately executable:** Every output has zero-friction use (copy, click, download, open)
2. **Visibly impressive:** AI work is shown, not hidden (scanning companies, writing messages, building systems)
3. **Beginner-friendly:** Requires zero technical setup (no n8n config, API keys, webhooks initially)
4. **Tutorial-ready:** Screen recordings look professional without editing (large text, clean UI, specific examples)
5. **Continuously valuable:** Fresh data monthly, performance optimization, automatic updates (not one-time extraction)

### Content Must Be:
1. **Formulaic:** Hook (3-4 sec) → Tutorial (5 steps, 50 sec) → Result (6 sec) → CTA
2. **Specific:** Real numbers, actual tools, concrete steps (not vague advice)
3. **Achievable:** Viewer thinks "I could do that in 60 seconds"
4. **Provable:** Show actual results, real responses, genuine outcomes
5. **Consistent:** 7 reels per week minimum for compound growth

### Business Model Must Be:
1. **Generous upfront:** Free tier gives complete first system (proves value)
2. **Clear expansion:** Paid tier obviously needed for scale (more systems, fresh data, optimization)
3. **Outcome-aligned:** Users pay when succeeding (not before value received)
4. **Sticky:** Ongoing dependencies (demo hosting, prospect refresh, performance data)
5. **Viral-ready:** Product makes creating content easy (showcase pages, recording tools, hooks library)

### Execution Must Be:
1. **Scope-locked:** V1 features fit on one page (no additions without removals)
2. **Speed-focused:** Ship foundation in 2 weeks (demo page + prospects + messages)
3. **Data-driven:** Track every step of funnel (content → signup → activation → retention → conversion)
4. **Iteration-ready:** Weekly improvements based on user data
5. **Quality-gated:** Validation layers prevent generic or broken outputs

---

## The North Star

**Current Reality:**
User reads beautiful documents about what they should build, feels briefly hopeful, closes tab, returns to consuming content. 90% churn after week 2.

**Required Reality:**
User gets working demo link in 5 minutes, copies 25 pre-written messages, sends first outreach in 30 minutes, gets replies, books calls using AI prep, closes first client in 7-14 days, stays because they need fresh prospects and optimization. 50% still active at month 2.

**The Gap:**
Everything in this document closes that gap by replacing "advice about execution" with "automated execution."

**The Measure:**
If someone can watch a 60-second tutorial and successfully replicate it within 30 minutes, the product works. If not, keep simplifying until they can.

**The Promise:**
LaunchPath builds your client-getting system while you watch. You just copy, send, and respond. We handle everything else.

That's the product. Everything else is support infrastructure.

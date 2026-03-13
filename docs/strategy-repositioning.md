# LaunchPath — Strategic Repositioning: From Agent Builder to Agent Infrastructure

> **Date:** March 12, 2026
> **Status:** Active strategy document
> **Previous positioning:** "From confused beginner to first AI client"
> **New positioning:** AI agent deployment and client management infrastructure for developers and technical agencies

---

## Table of Contents

1. [Why We're Repositioning](#1-why-were-repositioning)
2. [The Build My Agent Case Study](#2-the-build-my-agent-case-study)
3. [Who the Real Buyer Is](#3-who-the-real-buyer-is)
4. [The Infrastructure Thesis](#4-the-infrastructure-thesis)
5. [What Claude Code Can and Cannot Do Without Us](#5-what-claude-code-can-and-cannot-do-without-us)
6. [Product: What Stays](#6-product-what-stays)
7. [Product: What Changes](#7-product-what-changes)
8. [Product: What Gets Removed or Hidden](#8-product-what-gets-removed-or-hidden)
9. [Product: What Gets Added](#9-product-what-gets-added)
10. [Positioning and Messaging](#10-positioning-and-messaging)
11. [Content & Funnel Strategy](#11-content--funnel-strategy)
12. [Distribution Channels](#12-distribution-channels)
13. [The Dependency Playbook](#13-the-dependency-playbook)
14. [Retention Strategy — Why BMA Failed and How We Don't](#14-retention-strategy--why-bma-failed-and-how-we-dont)
15. [Competitive Landscape (Repositioned)](#15-competitive-landscape-repositioned)
16. [Pricing Framework](#16-pricing-framework)
17. [Metrics That Matter](#17-metrics-that-matter)
18. [Risks and Mitigations](#18-risks-and-mitigations)

---

## 1. Why We're Repositioning

### The problem with "beginner AI agency" positioning

BuildMyAgent.io proved the market exists — 1,070 paying subscribers, $106K peak MRR, $587K all-time revenue. It also proved the positioning kills you:

- **Peak to trough:** $106K MRR → $44K MRR in 7 months (-58%)
- **Estimated churn:** 15-20% monthly (catastrophic; healthy SaaS is 3-5%)
- **Listed for sale:** $449K (reduced from $549K) — sub-1x annual revenue
- **Root cause:** When the founder stopped marketing on Instagram, revenue collapsed. The product didn't retain on its own.

The "make money online" audience — people attracted by Instagram reels about earning $10K/mo selling AI to "boomer businesses" — has the highest churn rate in SaaS. They buy on hype, don't follow through, and leave within 1-3 months regardless of product quality.

BMA had comparable features to ours: credit-based system, knowledge base, RAG, client portal, analytics, demos, 750+ integrations. **Features didn't save them.** The audience was wrong.

### The market shift

A significant shift is happening in the AI agent space toward Claude Code and developer-first tooling:

- Claude Code went from zero to #1 AI coding tool in 8 months (75% adoption at small startups)
- 57% of LangChain survey respondents now have agents in production
- The "vibe coding" movement is creating a new class of technical builders who code with AI
- MCP server ecosystem: 1,000+ community servers, growing fast
- Even BMA's founders are pivoting their content toward Claude Code

The buyer is changing. We need to change with them.

---

## 2. The Build My Agent Case Study

### What they built
- No-code AI agent builder with prompt-based creation
- 750+ integrations (via Make.com, Zapier, native)
- Credit-based system (bundled AI costs)
- Client portal, sub-accounts, white-label
- Knowledge base, RAG
- Demos for client previews
- Channels: widget, Instagram DMs, Facebook Messenger, WhatsApp, SMS, Telegram
- Skool community (128-139K members) for client acquisition support
- Bulk AI-on-AI testing (unique feature)

### What they didn't build
- Human-in-the-loop conversation takeover
- Public API / developer access
- MCP server or CLI tools
- Multi-model support (OpenAI only)
- Deep analytics (thinner than ours)
- Webhooks / event system
- Any developer-facing infrastructure

### Why they failed to retain

It wasn't a feature problem. They had a **dependency problem**:

1. **No infrastructure lock-in.** Agent configs are just prompts — rebuildable in 30 minutes on any platform. Nothing in the user's business depended on BMA running.
2. **Wrong audience.** Instagram-driven "make money online" signups have 1-3 month lifecycles regardless of product quality.
3. **No lifecycle progression.** Users didn't naturally move from Starter → Growth → Scale because most never landed their first client.
4. **Course-funnel business model.** The SaaS ($44K MRR) was secondary to the course/community ($116K/mo). When the founder's attention shifted, the SaaS suffered.
5. **No developer adoption.** Zero API, zero CLI, zero MCP — the technical builders who create long-term dependency had no way in.

### The lesson

Features don't create retention. **Dependency creates retention.** When a developer's clients are logged into your portal, conversations are flowing through your channels, analytics are being checked weekly, and webhooks are wired into their CRM — that's when leaving costs more than staying.

---

## 3. Who the Real Buyer Is

### Not this person
- Saw an Instagram reel about making money with AI
- Has never had a client
- Doesn't know what an API is
- Will try the platform for 2 weeks and churn
- Attracted by "no coding required" messaging

### This person

**Profile 1: The Technical Agency Owner**
- Runs a small dev shop or marketing agency (2-10 people)
- Already has clients paying for web/marketing services
- Wants to add AI agents as a new revenue stream
- Technical enough to configure agents properly but doesn't want to build deployment infrastructure
- Charges clients $500-3,000/month for AI services
- Needs: multi-client management, white-label portal, analytics to prove ROI, HITL for quality control

**Profile 2: The Claude Code Developer**
- Already subscribing to Claude Pro/Max ($20-200/month)
- Uses Claude Code daily for building projects
- Builds AI tools for clients or their own products
- Discovers LaunchPath via MCP server inside their existing workflow
- Evaluates tools on capability, not "can this make me rich"
- Needs: API access, programmatic agent creation, deployment channels, client management

**Profile 3: The Freelancer-Turned-Agency**
- Started on Upwork/Fiverr building chatbots ($500-2,000/project)
- Now has 3-5 recurring clients and wants to scale
- Technical enough to use APIs and configure tools
- Needs: a platform that scales with them from 3 clients to 30 without rebuilding everything
- Currently cobbling together multiple tools (LangChain + custom widget + spreadsheet for tracking)

**Profile 4: The SaaS Builder**
- Building a product that needs AI agent capabilities
- Wants to embed chat/agent functionality into their own app
- Needs: white-label everything, API-first, no "LaunchPath" branding visible to their users
- Evaluates infrastructure on reliability, uptime, and API quality

### What they all share
- **Already have clients or clear path to clients** — not aspirational
- **Already spending money on AI tools** ($100-300/month across Claude, Cursor, etc.)
- **Evaluate on capability**, not hype
- **Need infrastructure**, not tutorials
- **Will stay because their clients depend on the platform**

### How they find tools
- MCP server marketplace (mcp.so, Anthropic marketplace)
- GitHub / open source discovery
- Developer Twitter/X
- Product Hunt
- Word of mouth in developer communities
- Technical blog posts and tutorials
- NOT Instagram reels, NOT Skool communities, NOT "make money online" content

---

## 4. The Infrastructure Thesis

### What infrastructure companies do

They provide a **core capability that other businesses rely on daily**. When thousands of companies plug your system into their workflows and it handles something essential, you earn revenue repeatedly as their usage grows.

### How infrastructure companies talk about themselves

| Company | Tagline | What they are |
|---------|---------|---------------|
| **Stripe** | "Financial infrastructure to grow your revenue." | Payments |
| **Twilio** | "Where amazing customer experiences are built." | Communications |
| **Vercel** | "Build and deploy the best web experiences with the AI Cloud." | Frontend deployment |
| **Supabase** | "Build in a weekend. Scale to millions." | Database + auth |
| **Resend** | "Email for developers." | Email delivery |
| **Clerk** | "More than authentication. Complete User Management." | Auth + users |
| **Neon** | "Fast Postgres Databases for Teams and Agents." | Serverless Postgres |

### The pattern

Every infrastructure company follows the same formula:

1. **Solve one hard problem** that developers don't want to build themselves
2. **API-first** — everything is programmable
3. **Free tier** that lets developers prototype and fall in love
4. **Usage-based scaling** that grows with the customer's business
5. **Developer community** that creates ecosystem lock-in
6. **Switching cost** that increases with every integration

### LaunchPath as infrastructure

LaunchPath solves the hard problem of: **deploying AI agents to clients and managing everything that comes after.**

A developer can build an AI agent in an afternoon. They cannot build in an afternoon:
- A production chat widget with session management, theming, and embed snippets
- A client portal with branded login, conversation views, and analytics
- Multi-channel deployment (widget, WhatsApp, SMS, voice)
- Human-in-the-loop conversation takeover with real-time sync
- Per-client usage tracking, credit caps, and billing
- Knowledge base with RAG (website scraping, file uploads, vector search)
- A multi-model credit system that normalizes costs across 60+ models

Building all of this from scratch takes 3-6 months. LaunchPath provides it via API, MCP, and dashboard — ready to deploy in minutes.

---

## 5. What Claude Code Can and Cannot Do Without Us

### Without LaunchPath MCP

Claude Code can:
- Write a chatbot with streaming, system prompts, tool calling
- Set up RAG with embeddings and vector search
- Build a Next.js app with a chat UI
- Connect to any LLM via SDK
- Generate agent logic and conversation flows

Claude Code cannot:
- Deploy a chat widget to a client's website with one embed snippet
- Give the client a branded portal to see their conversations
- Deploy to WhatsApp, SMS, or voice channels
- Manage 10+ clients with separate agents, analytics, and billing
- Do HITL conversation takeover
- Track credits and usage per client
- White-label the entire experience under the agency's brand
- Handle rate limiting, CORS, session management, and security

### With LaunchPath MCP

One command: `/deploy-agent "dental receptionist for brightsmile.com"`

What happens:
1. Agent created with appropriate system prompt
2. Website scraped, knowledge base populated
3. Widget channel deployed with embed snippet
4. Client account created
5. Portal ready for client login
6. Analytics tracking live
7. HITL available for conversation takeover

**The value isn't "we help you create agents." The value is "we handle everything after the agent exists."**

### Why this matters for positioning

If we position as an "agent builder," we compete with Claude Code itself — and we lose. Claude Code will always be better at building things than a dashboard UI.

If we position as "agent infrastructure," we complement Claude Code. We're the deployment and management layer that Claude Code users need but can't build from their terminal.

---

## 6. Product: What Stays

These are the core infrastructure capabilities. They don't change.

### Agent Builder
- Prompt-based creation (now framed as "quick setup," not "for beginners")
- System prompt editing with full control
- Template selection (reframed as "pre-configured starting points")
- Model selection across 60+ models via OpenRouter
- Agent versioning and publishing

### Knowledge Base / RAG
- Website scraping and content extraction
- File uploads (PDF, DOCX)
- FAQ management
- Chunking, embedding, vector search
- Hybrid retrieval (keyword + semantic)

### Tools System
- Webhook integrations
- HTTP tool with auth and URL templates
- MCP server connections
- Composio (500+ pre-built integrations)
- Subagent composition (agent-as-a-tool)

### Client Management
- Client accounts with profiles
- Client members with role-based access (admin, viewer)
- Agent assignment per client
- Per-client credit caps and usage tracking

### Client Portal
- Branded portal with white-label theming
- Conversation views for clients
- Campaign management
- Analytics dashboard (client-scoped)
- Member management

### HITL (Human-in-the-Loop)
- Conversation takeover
- Pause / resume / close
- Live message injection
- Real-time sync between portal and widget
- Status-aware widget behavior

### Deployment Channels
- Web widget (Preact, shadow DOM, embeddable)
- API channel (token auth, rate limiting)
- (Planned) WhatsApp, SMS, Voice

### Analytics
- Agency-wide dashboard (credits, messages, tokens)
- Per-client breakdown
- Per-agent breakdown
- Per-model breakdown
- Daily/weekly/monthly trends
- CSV export

### Credit System
- Multi-model multiplier pricing (60+ models)
- Per-request token-based calculation
- Monthly allocation + top-up balance
- Atomic deduction (race-safe)
- Per-client credit caps
- Promo code redemption

---

## 7. Product: What Changes

### Agent templates — reframe, don't remove

**Before:** "Appointment Booker template — perfect for beginners!"
**After:** "Appointment Booking Agent — pre-configured with scheduling logic, availability handling, and service selection. Customise via API or dashboard."

Same templates. Different framing. They're accelerators for developers, not training wheels for beginners.

### Onboarding flow — simplify

**Before:** Multi-step onboarding collecting time availability, comfort levels, revenue goals, blockers
**After:** Sign up → Create first agent → Deploy. Three steps. Collect profile data later if needed.

Developers evaluate tools in 5 minutes. If the onboarding takes longer than creating an agent, they leave.

### Dashboard — developer-friendly additions

- Show API endpoints alongside UI actions ("Created agent. API: `POST /api/agents`")
- Add code snippets for common operations
- Show webhook payload examples
- API key management in settings (critical — currently missing)

### Agent edit panel — expose configuration depth

- Make system prompt editing more prominent (developers want control)
- Show model multiplier and estimated cost per message
- Expose raw JSON config for advanced users
- Add "View API request" option that shows the equivalent API call

---

## 8. Product: What Gets Removed or Hidden

### Start Business Wizard
The niche selection, SERGE scoring, offer architecture, demo generation, lead qualification — all of this should be removed from the default flow. It signals "we're for beginners" and adds friction for developers who already know what they want to build.

**Action:** Don't delete the code. Move it behind a feature flag or a separate "Business Guide" section that's optional. It could be valuable for a subset of users, but it should never be the first thing someone sees.

### "From confused beginner to first AI client" messaging
Every trace of this positioning — landing page hero, onboarding copy, email sequences, documentation — needs to be rewritten.

### Revenue goal / comfort level / blocker collection
The onboarding questions about "how much do you want to earn" and "what's your technical comfort level" signal a product for people who haven't started yet. Remove from onboarding entirely.

### Overly hand-holding UI copy
Any copy that says "don't worry, you don't need to code" or "we'll guide you step by step" needs to go. Developers read that as "this isn't for me."

---

## 9. Product: What Gets Added

### Priority 1: Public API with API Keys (Critical)

This is the single most important addition. Without it, LaunchPath is a dashboard tool, not infrastructure.

**Required endpoints (matching existing internal routes):**
- `POST /api/v1/agents` — create agent
- `GET /api/v1/agents` — list agents
- `GET /api/v1/agents/:id` — get agent
- `PATCH /api/v1/agents/:id` — update agent
- `DELETE /api/v1/agents/:id` — delete agent
- `POST /api/v1/agents/:id/knowledge` — add knowledge
- `POST /api/v1/agents/:id/channels` — deploy channel
- `POST /api/v1/agents/:id/chat` — send message
- `GET /api/v1/clients` — list clients
- `POST /api/v1/clients` — create client
- `GET /api/v1/clients/:id/usage` — client analytics
- `GET /api/v1/usage` — agency usage data

**API key system:**
- `user_api_keys` table (id, user_id, key_hash, key_prefix, name, last_used, created_at)
- Key format: `lp_live_` + 48 hex chars (or `lp_test_` for sandbox)
- Hash storage (SHA-256), prefix display (`lp_live_a3b7...`)
- Rate limiting per key
- Dashboard UI for key management (generate, revoke, view usage)

### Priority 2: MCP Server

Already planned in detail (see `docs/mcp-server-plan.md`). This is the developer acquisition channel.

**Key tools for infrastructure positioning:**
- `deploy_agent` — create, train, deploy in one command
- `list_agents` — see all agents and status
- `chat_with_agent` — test from terminal
- `list_conversations` — monitor activity
- `create_client` — set up client accounts
- `agent_report` — status across all agents

### Priority 3: Webhooks / Event System

Developers need to react to platform events programmatically.

**Events to support:**
- `conversation.started` — new conversation on any channel
- `conversation.message` — new message in conversation
- `conversation.ended` — conversation closed
- `conversation.takeover_requested` — agent can't handle query
- `agent.deployed` — channel goes live
- `agent.error` — agent failure
- `client.credit_cap_warning` — approaching cap (80%, 95%)
- `usage.threshold` — agency usage alert

**Implementation:**
- `webhook_endpoints` table (id, user_id, url, events[], secret, active)
- Signed payloads (HMAC-SHA256) for verification
- Retry with exponential backoff (3 attempts)
- Webhook logs for debugging
- Dashboard UI for managing endpoints

### Priority 4: Additional Channels

- **WhatsApp** (Twilio Business API) — critical for local business agents
- **SMS** (Twilio) — appointment reminders, lead follow-up
- **Voice** (Vapi or Retell AI) — phone-based businesses (dental, legal, HVAC)

### Priority 5: SDK / CLI (Nice to Have)

```bash
npm install @launchpath/sdk
```

```typescript
import { LaunchPath } from '@launchpath/sdk';

const lp = new LaunchPath({ apiKey: 'lp_live_...' });

const agent = await lp.agents.create({
  name: 'Dental Receptionist',
  template: 'appointment-booker',
  model: 'openai/gpt-4.1-mini',
});

await lp.knowledge.scrape(agent.id, 'https://brightsmile.com');
await lp.channels.deploy(agent.id, 'widget');
```

---

## 10. Positioning and Messaging

### Core positioning statement

**LaunchPath is AI agent infrastructure.**

We handle deployment, client management, and multi-channel delivery so developers can focus on building agents — not building the platform to run them.

### Hero tagline options

**Option A (Stripe-style):**
> "AI agent infrastructure for developers."
> Deploy agents to any channel. Manage every client. Scale without rebuilding.

**Option B (Supabase-style):**
> "Deploy AI agents in minutes. Scale to thousands of clients."
> The deployment and management layer for AI agents — widget, WhatsApp, SMS, voice, and API.

**Option C (Resend-style):**
> "AI agents for developers."
> Build agents however you want. We handle deployment, client portals, analytics, and billing.

**Option D (Direct):**
> "Build AI agents. Deploy to any channel. Manage every client."
> One API. One dashboard. Widget, WhatsApp, SMS, voice. From your terminal or browser.

### Supporting copy

**What it is:**
"LaunchPath is the deployment and management layer for AI agents. Create agents via API, MCP, or dashboard. Deploy to websites, WhatsApp, SMS, and voice. Give clients branded portals. Track everything."

**Who it's for:**
"Built for developers and AI agencies who need infrastructure, not tutorials."

**What it replaces:**
"Stop building chat widgets, client portals, billing systems, and deployment pipelines. LaunchPath handles the infrastructure so you ship agents, not plumbing."

### Words to use
- Infrastructure, deploy, ship, scale, API, channels, clients, manage, monitor
- "From your terminal" (signals developer-first)
- "60+ models" (signals flexibility)
- "One embed snippet" (signals simplicity)

### Words to avoid
- Beginner, easy, no-code, tutorial, guide, step-by-step, journey
- "Make money," "start your agency," "first client"
- "Don't worry," "you don't need to code"
- Any reference to income or revenue potential

---

## 11. Content & Funnel Strategy

### The funnel

```
Instagram (discovery — free, organic reach)
├── Claude Code tips & news (70%) → builds audience of developers
├── Claude Code + LaunchPath demos (20%) → shows the product in action
└── AI agency use cases with LaunchPath UI (10%) → shows the business model
         ↓
"Comment [X] for the free guide"
         ↓
Multi-hour LaunchPath guide (lead magnet)
├── They watch you build agents inside LaunchPath
├── They see the portal, HITL, analytics, deployment
├── They understand it solves their exact problems
└── They NEED it by the time they finish watching
         ↓
Sign up → Free tier → Deploy first agent → Paid
         ↓
YouTube (long-form depth, evergreen SEO)
├── 2-3 hour Claude Code complete tutorials
├── "Start and scale your AI agency with LaunchPath"
├── Feature deep dives (15-30 min)
└── Shorts cross-posted from Instagram reels
```

### Why this funnel works (and why BMA's didn't)

BMA used the same structure (Instagram → lead magnet → product) but targeted the wrong audience. "Make money online" people churn in 1-3 months regardless of product quality.

Our funnel targets **Claude Code users** — developers already spending $100-300/mo on AI tools, already building real things, already have or can get clients. The content attracts them with value (Claude Code tips), the lead magnet shows them the product in depth, and by the time they sign up they already know exactly how to use it.

### Instagram content (3x/week)

**70% — Claude Code content (top of funnel)**

Pure value, no selling. This is the magnet that builds the audience.

- "Claude Code just added X — here's what it means"
- "5 MCP servers every Claude Code user needs"
- "How to use Claude Code for [specific task]"
- "Claude Code tip: did you know you can..."
- "Claude Code vs Cursor for [specific use case]"
- "New Claude model dropped — here's the difference"
- "How I built [thing] entirely with Claude Code"
- "Claude Code shortcuts that save me hours"
- "The Claude Code settings nobody talks about"

Format: 60-90 second reels, screen recordings with music, no face required.

**20% — Claude Code + LaunchPath (middle of funnel)**

The product shown through the Claude Code lens. Every post includes Claude Code so it doesn't feel like a product pitch.

- "I deployed 5 client agents from my terminal using this MCP server"
- "Claude Code + LaunchPath: build an agent, deploy in one command"
- "New LaunchPath MCP update: you can now [feature] from Claude Code"
- "Watch me scrape a website, build knowledge base, and deploy — all from the terminal"
- "Claude Code can build agents. Here's what it can't do (and how we fix that)"
- "The deploy command that replaced 3 months of infrastructure work"

Format: Screen recordings showing terminal → LaunchPath → live result.

**10% — AI agency use cases (bottom of funnel)**

Shows the business model without selling a dream. Framed as workflow demos, not income promises.

- "How to deploy AI agents for clients using Claude Code + LaunchPath"
- "Client portal walkthrough — what your clients see vs what you see"
- "Managing 10 AI agent clients from one dashboard"
- "Per-client analytics: how to prove ROI to your clients"
- "Setting up credit caps so one client doesn't blow your budget"
- "HITL: taking over a conversation when the AI needs help"

Format: Split-screen (agency view vs client view), dashboard recordings.

**Posting cadence:**

| Day | Content type | Example |
|---|---|---|
| Monday | Claude Code tip/news | "Claude Code just added X — here's what it means" |
| Wednesday | Claude Code + LaunchPath demo | "Deploy from your terminal with one command" |
| Friday | AI agency use case / product feature | "What your client sees vs what you see" |

### The lead magnet (multi-hour guide)

Triggered by "Comment [X] for the free guide" on Instagram posts. This is a **product demo disguised as a tutorial** — by the end, the viewer has seen every major feature of LaunchPath in action.

**Part 1: "Build your first agent" (30 min)**
- Creating an agent from scratch inside LaunchPath
- Configuring system prompt, model selection, behaviour
- Adding knowledge base (scrape a real website)
- Testing it in the dashboard chat

**Part 2: "Deploy it" (20 min)**
- Setting up the widget channel
- Customising appearance
- Embedding on a website
- Testing the live widget

**Part 3: "Set up your first client" (20 min)**
- Creating a client account
- Assigning the agent
- Configuring the client portal
- Setting credit caps
- Walking through what the client sees

**Part 4: "Manage conversations" (20 min)**
- Monitoring live conversations
- HITL takeover demo
- Analytics walkthrough
- How to show ROI to clients

**Part 5: "Scale to multiple clients" (20 min)**
- Adding more clients
- Different agents per client
- Per-client analytics
- Managing everything from one dashboard

**Part 6: "Advanced — Claude Code + MCP" (20 min)**
- Installing the MCP server
- Deploying agents from the terminal
- Managing everything without leaving Claude Code
- The power-user workflow

The CTA at the end: "Sign up for free and do what I just showed you." Not "buy my course."

### YouTube (1-2x/week)

YouTube serves a different purpose than Instagram — it's **search-driven and evergreen**.

| Video type | Example | Length | Purpose |
|---|---|---|---|
| **Claude Code tutorials** | "Claude Code Complete Guide 2026" | 2-3 hrs | SEO magnet, top of funnel |
| **AI agency with LaunchPath** | "Build an AI Agency from Scratch with Claude Code" | 2-3 hrs | Full funnel, shows product |
| **Scaling guides** | "Scaling from 1 to 20 AI Agent Clients" | 1-2 hrs | Mid-funnel, existing audience |
| **Feature deep dives** | "LaunchPath HITL: Full Walkthrough" | 15-30 min | Mid-funnel, product education |
| **Shorts** | "Deploy an agent in 60 seconds" | 60 sec | Discovery, cross-post from Instagram |

The 2-3 hour YouTube videos are the **source material** — cut into 20-30 Instagram reels, repurpose as the lead magnet guide.

### Content ecosystem (one video → 20+ pieces)

```
YouTube (2-3 hr tutorial)
  → Cut into 20-30 Instagram reels
  → Repurpose as the "free guide" lead magnet
  → Shorts cross-posted to Instagram/TikTok
  → Key insights become Twitter/X threads
  → Technical details become blog posts

Instagram reel performs well
  → "Full tutorial on YouTube, link in bio"
  → "Comment [X] for the complete guide"

Guide converts viewer
  → Signs up for LaunchPath free tier
  → Already knows how to use it (watched 2 hours)
  → Deploys first agent → Starter plan
```

### Other channels

| Channel | Content type | Frequency | Purpose |
|---------|-------------|-----------|---------|
| **Technical blog** | Deep dives, infrastructure posts | 1-2/week | SEO, developer credibility |
| **Twitter/X** | Short demos, tips, announcements | Daily | Developer community presence |
| **GitHub** | MCP server, SDK, examples | Ongoing | Discovery, open source credibility |
| **Product Hunt** | Launch + major feature launches | Periodic | Initial discovery spike |
| **MCP marketplaces** | Server listing (mcp.so, etc.) | Maintained | Developer discovery |
| **Dev communities** | Hacker News, Reddit, Discord | As relevant | Community presence |

### Content tone and rules

**The tone:**
- Confident, not hype. Show the product, let it speak.
- Technical but accessible. Developers should think "this is legit." Semi-technical people should think "I could use this."
- Builder energy, not guru energy. We're building, not teaching how to get rich.
- Stripe/Vercel vibes, not GHL/BMA vibes. Clean, minimal, product-focused.

**Instagram bio:**
> AI agent infrastructure. Deploy to any channel. Manage every client.
> API / MCP / Dashboard
> [link to signup or docs]

**What we NEVER say in content:**
- "Make money with AI"
- Income claims or revenue screenshots
- "No coding required"
- "Comment FREE for my guide to making $X"
- Lifestyle content (cars, travel, laptops on beaches)
- "I went from $0 to $X"

**What we DO say:**
- "Deploy agents for clients"
- "One command from your terminal"
- "What your client sees vs what you see"
- "60+ models, one credit system"
- "Infrastructure, not a wrapper"

---

## 12. Distribution Channels

### Primary: Instagram + YouTube (Content-led acquisition)

Instagram builds the audience (Claude Code users), the lead magnet converts them (multi-hour guide), YouTube provides evergreen depth. See Section 11 for full strategy.

### Secondary: MCP Server (Developer-first, in-workflow acquisition)

**The funnel:**
1. Developer discovers LaunchPath MCP server (mcp.so, Anthropic marketplace, GitHub)
2. Installs it: `claude mcp add launchpath`
3. Tries it: `/deploy-agent "support bot for acme.com"`
4. Impressed → signs up for free tier
5. Deploys for first client → Starter plan
6. Scales → Growth → Agency

**Why this works:**
- Zero friction discovery (MCP is already in their workflow)
- "Wow moment" is instant (working agent in minutes)
- Self-qualifying audience (Claude Code users are technical, spending money, building real things)
- Distribution is free (marketplace listings cost nothing)

### Tertiary: API / SDK / Open Source discovery

- npm package: `@launchpath/sdk`
- MCP server published on GitHub (open source)
- GitHub stars and contributions
- Developer blog posts that show API usage
- Integration examples with popular frameworks
- Product Hunt launch for initial spike
- Technical blog posts targeting developer search queries

---

## 13. The Dependency Playbook

### How to make LaunchPath irreplaceable

Every infrastructure company becomes irreplaceable through **accumulated integration depth**. Here's the specific playbook for LaunchPath:

### Layer 1: Client conversations flow through us

Every conversation between an end-user and an AI agent happens on LaunchPath infrastructure. The conversation history, context, and analytics are stored with us. Moving means losing history.

### Layer 2: Client portals are branded and shared

When an agency gives their client a portal login, the client bookmarks it. They check conversations daily. They share the URL with their team. Switching platforms means breaking every client's portal access and retraining them.

### Layer 3: Widgets are embedded in production sites

The LaunchPath widget script is embedded in client websites. Each deployment is a physical integration point. Switching means updating every client's website — with the risk of downtime and broken chat.

### Layer 4: Webhooks wire us into external systems

When an agency connects LaunchPath webhooks to their CRM, Slack, email automation, and billing — each webhook is a thread of dependency. Switching means rewiring every integration.

### Layer 5: Knowledge bases accumulate value

Scraped websites, uploaded documents, manually curated FAQs — each knowledge base represents hours of work. It's not technically locked in (we should allow export), but rebuilding it elsewhere is painful.

### Layer 6: Analytics create accountability

When an agency shows monthly analytics reports to clients ("your agent handled 847 conversations, resolved 73%, cost you $X"), those reports come from LaunchPath. Switching means rebuilding the reporting pipeline.

### Layer 7: Credit caps and billing are configured

Per-client credit caps, usage tracking, monthly billing cycles — all configured in LaunchPath. Switching means reconfiguring billing for every client.

### The compounding effect

Each client added multiplies the switching cost:
- 1 client = could switch in a day
- 5 clients = switching is a weekend project
- 15 clients = switching is a multi-week migration with client disruption risk
- 50 clients = switching is practically impossible without dedicated migration support

**This is the moat.** Not features. Not AI model quality. Integration depth that compounds with every client added.

---

## 14. Retention Strategy — Why BMA Failed and How We Don't

### Why BuildMyAgent lost 60% of subscribers

BMA had the features: credit system, knowledge base, RAG, client portal, analytics, demos, 750+ integrations, and a 139K-member Skool community to help users land clients. **They still lost 1,630 subscribers in 7 months.** Understanding why is critical.

**It wasn't a feature problem.** They had comparable features to us.
**It wasn't a support problem.** They had a massive community.
**It wasn't a marketing problem.** Albert Olgaard has 290K Instagram followers.

**It was an activation problem.** Most users never got a real client's conversations flowing through the platform.

The BMA lifecycle for most users:
1. Watch Instagram reel about making money with AI → sign up hyped
2. Build an agent using the platform → feel productive
3. Try to sell it to a local business → get rejected / never try
4. No client = no conversations = no reason to log in
5. Cancel after 1-3 months

The product worked. The user didn't. And no amount of features or community support could fix a user who was never going to follow through.

### Why the audience matters more than the product

BMA's Instagram funnel attracted "make money online" people — aspirational beginners who buy on hype and churn in 1-3 months regardless of product quality. This is the highest-churn segment in all of SaaS.

The revenue pattern proves it: when Albert stopped creating new hype content, revenue collapsed from $106K to $44K MRR. **New signups were the only thing offsetting the constant churn of people who never succeeded.** The moment the top of funnel slowed, the leaky bucket drained.

The product retained poorly not because it was bad — but because the people using it were never going to stay. You cannot retain someone who signs up for a dream and never executes.

### How LaunchPath avoids this

#### 1. Different audience = different retention curve

Our content funnel (Section 11) targets Claude Code users — developers already spending $100-300/mo on AI tools, already building real things, already have or can get clients. These are not dreamers. They sign up because they have a deployment problem to solve, not because they saw an income claim.

A user who signs up because they need to deploy an agent for an existing client has fundamentally different retention characteristics than one who signs up hoping to someday land a client.

#### 2. Retention is an activation problem

The single most important metric is: **how fast does a user get a real client's conversations flowing through LaunchPath?**

Everything before that point is activation. Everything after is retention through dependency.

**The activation timeline:**

```
Day 0: Sign up
         ↓ (must happen immediately)
Day 0-1: Build first agent + test it
         ↓ (must be impressive enough to show a client)
Day 1-7: Demo to a client or prospect
         ↓ (the lead magnet guide already taught them how)
Day 7-30: Client says yes → deploy widget → set up portal
         ↓ THIS is the retention moment
Day 30+: Conversations flowing, client checking portal
         → User is locked in through their client's dependency
```

Everything we build should compress this timeline. The faster someone goes from signup to "client's conversations are flowing through LaunchPath," the higher our retention.

**Activation milestones to track:**

| Milestone | What it means | Target % of signups |
|---|---|---|
| Agent created | They started | 80% |
| Knowledge base added | They're investing time | 60% |
| Widget deployed | They're ready to show clients | 40% |
| First client created | They have a real client | 25% |
| First external conversation | Client's customer is using it | 20% |
| **Client portal accessed by client member** | **Retention lock-in achieved** | 15% |

That last milestone — client portal accessed by a client member — is where retention becomes automatic. Every milestone before it is activation work.

#### 3. The lead magnet pre-activates users

By the time someone finishes our multi-hour guide (Section 11), they've watched the entire workflow: build, deploy, client setup, portal, HITL, analytics. They don't need to figure anything out. They sign up already knowing exactly what to do. This compresses the activation timeline dramatically compared to BMA's approach of signing people up on hype and then hoping the Skool community teaches them.

#### 4. The product demos itself

When a user shows a prospect their agent — the polished widget, the branded client portal, the analytics dashboard — it needs to look so professional that the prospect says yes on the spot.

This means:
- Widget should look premium out of the box (not generic chatbot vibes)
- Portal should feel like a real product (not a side project)
- Demo mode that lets prospects interact with the agent before committing
- Clean, professional default branding that the agency isn't embarrassed to show

The product sells itself to the user's client. That's the conversion mechanism BMA never had — their product looked like a tool, not infrastructure.

#### 5. Once activated, dependency creates retention

Once a client's conversations are flowing through LaunchPath (see Section 13: The Dependency Playbook), retention becomes structural:

- **The client's widget is live on their website.** Cancel = chat disappears, agency has to explain to client.
- **The client logs into the portal.** Cancel = client loses access, asks "what happened?"
- **Conversation history is the record of truth.** Cancel = client's data is gone.
- **Webhooks are wired into other systems.** Cancel = integrations break silently.
- **Each additional client multiplies switching cost.** 1 client = switch in a day. 15 clients = multi-week migration.

BMA's users could leave with zero switching cost because nothing in their business depended on BMA running. Agent configs are just prompts — rebuildable in 30 minutes. Our users can't leave without disrupting their clients.

#### 6. Engagement loops keep active users coming back

Once clients are active, the agency needs reasons to come back regularly:

**Daily triggers:**
- Push notification: "3 new conversations across your agents today"
- HITL alert: "Agent couldn't handle a question — review needed"
- High-priority lead alert: "A lead scored HIGH just came in for [client]"

**Weekly triggers:**
- Summary email: "Your agents handled 127 conversations this week. 2 required human takeover. Client X is at 65% of their credit cap."
- Performance insight: "Agent Y resolved 89% of conversations without human help — up from 74% last week."

**Monthly triggers:**
- Analytics digest: "Monthly report: 847 conversations handled, 73% auto-resolved. Total credits consumed: 2,140."
- This is also what the agency forwards to their clients as a value report — making our analytics their sales tool.

**Event-driven triggers:**
- "Client X hit 80% of their credit cap — consider increasing it"
- "Agent error rate increased for [client] — review knowledge base"
- "New webhook delivery failures detected — check endpoint"

Each notification pulls the agency back into the platform for a real reason — not engagement farming. Every return visit reinforces the habit and deepens the dependency.

#### 7. Nudge emails for stalled users

Users who stop progressing through activation milestones get targeted emails based on exactly where they stalled:

- **Created agent but didn't add knowledge** → "Your agent will perform 3x better with a knowledge base. Here's how to scrape your client's website in 2 clicks."
- **Added knowledge but didn't deploy** → "Your agent is ready. Deploy a widget and test it on a real site — takes 30 seconds."
- **Deployed but no client created** → "Ready to onboard your first client? Set up their portal in 60 seconds."
- **Client created but no external conversations** → "Your client's agent hasn't received any conversations yet. Is the widget embedded? Here's the snippet."
- **Had conversations but went quiet** → "Your agents handled 23 conversations last month. Your clients are still active — check in?"

Each email is specific to what they haven't done yet. Not generic "we miss you" spam.

### The retention formula

```
Retention = Right Audience × Fast Activation × Client Dependency × Engagement Loops
```

BMA had:
- ❌ Wrong audience (MMO/aspirational beginners)
- ❌ Slow activation (users had to figure it out themselves after hype-driven signup)
- ❌ No real dependency (API wrapper with zero switching cost)
- ❌ No engagement loops (build agent → deploy → nothing pulls you back)

LaunchPath needs:
- ✅ Right audience (Claude Code developers, technical agency owners)
- ✅ Fast activation (guide pre-teaches the product, MCP enables instant deployment)
- ✅ Deep dependency (client portals, embedded widgets, webhooks, conversation history)
- ✅ Active engagement loops (HITL alerts, analytics digests, credit cap warnings)

If any one of these four fails, retention suffers. All four together create a product that retains because users' businesses depend on it — not because we're good at marketing.

---

## 15. Competitive Landscape (Repositioned)

### We don't compete with agent builders

We are not competing with:
- ChatGPT / Claude (end-user AI)
- LangChain / CrewAI / Mastra (agent frameworks)
- Claude Code / Cursor (AI coding tools)

These are **complementary tools.** Developers use them to BUILD agents. They use LaunchPath to DEPLOY and MANAGE agents for clients.

### We compete with "build it yourself"

Our real competitor is the developer saying "I'll just build my own widget, portal, and billing system." We win when the cost of building it themselves (3-6 months of development) exceeds the cost of LaunchPath ($29-499/month).

### We also compete with

| Competitor | Their angle | Our advantage |
|-----------|------------|---------------|
| **BuildMyAgent** | "No-code agent builder for beginners" | Declining (-12%/mo), no API, no HITL, no multi-model, wrong audience. We're infrastructure, not a builder. |
| **Stammer AI** | "White-label AI chatbots for agencies" ($97-497) | Chatbot-only. We offer full infrastructure (API, MCP, webhooks, multi-channel). |
| **Voiceflow** | "Conversation AI for enterprises" ($60-150/editor) | Enterprise-focused, expensive per-seat. We're developer-first with usage-based pricing. |
| **Botpress** | "AI agent builder" ($89+) | Technical but no client management layer. We handle the agency workflow. |
| **GoHighLevel** | "Agency operating system" ($97-497) | Not AI-native. They do CRM/funnels. We do AI agent infrastructure. Complementary, not competitive. |

### Our unique position

No platform currently offers:
- AI agent deployment infrastructure (not just building)
- Multi-model support (60+ models) with normalised credit pricing
- Client management + white-label portal
- HITL conversation takeover
- MCP server for Claude Code integration
- Public API for programmatic access
- All in one platform with usage-based pricing

This combination doesn't exist elsewhere. Developers currently cobble together 3-4 tools to achieve what LaunchPath does natively.

---

## 16. Pricing Framework

### Cost foundation

Every credit costs us ~$0.00475 in real API fees (GPT-4o baseline). The multiplier system normalises this across all 60+ models. This is fixed regardless of which model the user chooses.

### Recommended tiers

| | Free | Starter | Growth | Agency | Scale |
|---|---|---|---|---|---|
| **Price** | $0 | $29/mo | $79/mo | $199/mo | $499/mo |
| Credits | 500 | 2,000 | 7,000 | 20,000 | 50,000 |
| Agents | 1 | 3 | 10 | Unlimited | Unlimited |
| Clients | 0 | 2 | 5 | 25 | Unlimited |
| API access | Read-only | Full | Full | Full | Full |
| Channels | Widget (branded) | Widget | All | All | All |
| Client portal | No | No | View-only | Full + HITL | White-label + custom domain |
| Webhooks | No | No | 3 endpoints | 10 endpoints | Unlimited |
| MCP server | Read-only | Full | Full | Full | Full |
| BYOK option | No | No | No | No | Yes |
| **Margin (if maxed)** | — | 67% | 58% | 52% | 52% |

### Upgrade triggers

- Free → Starter: Need to deploy to a client (0 client limit)
- Starter → Growth: Need client #3, or API channel, or client portal
- Growth → Agency: Need client #6, or HITL, or full portal
- Agency → Scale: Need 26+ clients, or BYOK, or unlimited webhooks

The key insight: **clients added is the primary upgrade trigger, not credits consumed.** Credits are generous enough that reasonable usage never hits the limit. Feature gates (portal, HITL, webhooks) and client limits drive upgrades.

### Top-up packs

| Price | Credits | Margin |
|-------|---------|--------|
| $10 | 1,000 | 52% |
| $25 | 3,000 | 43% |
| $50 | 7,000 | 33% |

Intentionally worse value than upgrading. Nudges toward tier upgrades.

---

## 17. Metrics That Matter

### North star metric

**Active client deployments** — the number of clients with at least one agent receiving conversations in the last 7 days. This measures real usage, not signups.

### Leading indicators

| Metric | What it tells us | Target |
|--------|-----------------|--------|
| MCP installs | Developer discovery | Growing month-over-month |
| Free → Starter conversion | Product-market fit | >10% |
| Time to first deployment | Onboarding friction | <15 minutes |
| Clients per account (avg) | Lifecycle progression | >3 for Growth tier |
| Monthly churn (logo) | Retention health | <5% |
| Net revenue retention | Expansion revenue | >110% |

### Lagging indicators

| Metric | What it tells us | Target |
|--------|-----------------|--------|
| MRR | Business health | Growing 10%+ month-over-month |
| ARPU | Value capture | >$80 |
| Conversations per client | Agent utility | >100/month |
| Webhook integrations per account | Dependency depth | >2 for Growth+ tiers |

### Anti-metrics (what NOT to optimise for)

- **Total signups** — vanity metric if they don't deploy
- **Social media followers** — BMA had 290K and still churned 60% of users
- **Feature count** — BMA had 750+ integrations and it didn't save them
- **Agent count** — creating agents is free and easy; deploying them for clients is what matters

---

## 18. Risks and Mitigations

### Risk 1: "Developer-first" market is smaller than "beginner" market

**Reality check:** BMA got 2,700 subscribers from the beginner market and couldn't keep them. A smaller market of real buyers who retain is worth more than a large market of tire-kickers who churn.

**Mitigation:** The MCP server provides organic, zero-cost distribution to a growing market (Claude Code adoption at 75% of startups). The audience is growing faster than any Instagram following.

### Risk 2: Claude Code / AI tools make deployment so easy that LaunchPath isn't needed

**Reality check:** Claude Code can generate a chat widget. It cannot generate a client portal with multi-tenant auth, HITL real-time sync, per-client credit caps, webhook event system, and multi-channel deployment. Infrastructure is more than a widget.

**Mitigation:** Stay ahead on the infrastructure layer. The more integration points (channels, webhooks, portal features), the harder we are to replicate with a prompt.

### Risk 3: A well-funded competitor copies the infrastructure positioning

**Mitigation:** This is the real risk. The moat is built through:
- **Data flywheel** — conversation patterns, niche benchmarks, auto-generated knowledge
- **Integration depth** — each client added increases switching cost
- **MCP ecosystem** — first mover advantage in agent infrastructure for Claude Code
- **Speed** — ship fast, iterate based on real developer feedback

### Risk 4: OpenRouter goes down or changes pricing

**Mitigation:** Provider routing already supports direct Anthropic. Can add direct OpenAI, Google, etc. The credit system abstracts away the provider — users don't know or care where the tokens come from.

### Risk 5: We attract the wrong audience anyway

**Mitigation:** Everything in our distribution, content, and messaging is designed to filter for builders and filter out dreamers. The MCP server is self-selecting — only technical users will install it. The API-first positioning naturally repels the "no code, make money" crowd.

---

## Appendix A: Implementation Priority

```
Phase 1 (Now — Weeks 1-2):
├── Remove/hide startup business wizard from default flow
├── Rewrite onboarding to: Sign up → Create agent → Deploy
├── Update all UI copy to developer-first framing
├── Reframe templates as "pre-configured starting points"
└── Remove beginner-focused messaging everywhere

Phase 2 (Weeks 2-4):
├── Public API with API keys (Priority 1)
├── API key management UI in dashboard
├── API documentation page
└── Rate limiting per API key

Phase 3 (Weeks 4-6):
├── MCP server v1 (Priority 2)
├── Publish to mcp.so and GitHub
├── MCP installation docs
└── "Deploy from terminal" demo content

Phase 4 (Weeks 6-8):
├── Webhook event system (Priority 3)
├── Webhook management UI
├── Webhook logs and debugging
└── Integration examples (Slack, CRM, email)

Phase 5 (Weeks 8-12):
├── WhatsApp channel (Twilio)
├── SMS channel (Twilio)
├── Voice channel (Vapi or Retell)
└── Channel management API endpoints

Phase 6 (Weeks 12-16):
├── SDK published on npm
├── CLI tool
├── New landing page with infrastructure positioning
├── Technical blog launch
└── Product Hunt launch
```

## Appendix B: The One-Sentence Test

Every piece of content, every UI element, every marketing message should pass this test:

> **"Would a developer building AI agents for clients find this useful?"**

If the answer is no — if it's targeted at someone who doesn't have clients yet, doesn't know what an API is, or is just hoping to "make money with AI" — it doesn't belong in the product or the content.

---

## Appendix C: What We Say vs What BMA Says

| Topic | BuildMyAgent | LaunchPath |
|-------|-------------|------------|
| **Hero** | "The #1 AI platform. Deploy AIs in minutes by chatting with AI." | "AI agent infrastructure for developers. Deploy to any channel. Manage every client." |
| **Audience** | "50,000+ AI entrepreneurs" | "Built for developers and AI agencies" |
| **Value prop** | "Unlimited AI builds, 750+ integrations" | "One API for deployment, client management, and multi-channel delivery" |
| **Onboarding** | Prompt-based chat → demo → connect → deploy | Sign up → create agent → deploy (or: install MCP → deploy from terminal) |
| **Content** | "How to make $10K/mo with AI" | "How to deploy a customer support agent to WhatsApp in 5 minutes" |
| **Community** | Skool (139K members, course-driven) | GitHub (open source MCP server, SDK, examples) |
| **Lock-in** | Sub-accounts | Client portals + webhooks + embedded widgets + API integrations |

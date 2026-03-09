# AI Cost Model & Pricing Strategy

> Reference document for LaunchPath's AI pricing structure, cost calculations, and architecture decisions.

---

## Table of Contents

1. [Two AI Cost Centers](#two-ai-cost-centers)
2. [Builder AI (Agent Creation Chat)](#builder-ai-agent-creation-chat)
3. [Runtime AI (Deployed Agents)](#runtime-ai-deployed-agents)
4. [Credit System Design](#credit-system-design)
5. [Pricing Tiers](#pricing-tiers)
6. [Sub-Accounts (Client Workspaces)](#sub-accounts-client-workspaces)
7. [Cost Per User Breakdown](#cost-per-user-breakdown)
8. [Profitability Levers](#profitability-levers)
9. [Competitive Differentiation](#competitive-differentiation)
10. [BYOK (Bring Your Own Key)](#byok-bring-your-own-key)
11. [Key Decisions & Rationale](#key-decisions--rationale)

---

## Two AI Cost Centers

LaunchPath has two distinct AI workloads with different cost profiles and strategies:

| Layer | What it does | Who pays | Why |
|-------|-------------|----------|-----|
| **Builder AI** | Chat interface that creates, edits, and configures agents | Platform (LaunchPath) | Core viral feature — must be frictionless, zero setup |
| **Runtime AI** | Models powering deployed agents (customer conversations, campaigns) | Included in subscription via credits | Beginner-friendly, predictable costs for users |

These must be treated as **separate budget lines** — the builder is a fixed platform cost, runtime scales with usage.

---

## Builder AI (Agent Creation Chat)

### Purpose

The AI-powered agent builder is the viral hook — users describe what they want in plain English, and the AI creates the entire agent (system prompt, tools, knowledge, sub-agents). This is the Instagram-worthy feature and primary selling point.

### Model Strategy

| Task Type | Model | Cost per message | When to use |
|-----------|-------|-----------------|-------------|
| Complex creation (new agents, multi-tool setup) | Claude Sonnet | ~$0.01-0.02 | User describes a new agent or complex workflow |
| Simple edits (rename, tweak greeting, toggle tool) | Claude Haiku | ~$0.001-0.003 | Single-field changes, simple modifications |
| Intent classification (routing to Haiku vs Sonnet) | Claude Haiku | ~$0.001 | Every message — determines which model handles the request |

**Default: Claude Sonnet** — reliable enough for structured tool calls and understanding casual user intent.
**Cascade: Haiku for simple ops** — route ~40-60% of builder messages to Haiku for simple edits, saving 80% on those calls.

### Builder AI Capabilities (Function Calling)

The builder AI is a function-calling agent with access to internal platform tools:

1. **Create agent** — calls `/api/agents`
2. **Update agent config** — system prompt, personality, tone, model selection
3. **Add tools** — browses tool catalog, adds webhook/HTTP/composio tools
4. **Configure tools** — URLs, authentication, parameters, response mapping
5. **Add knowledge** — uploads documents, FAQ entries, website content
6. **Add sub-agents** — creates and links sub-agents for delegation
7. **Test agent** — runs a quick test conversation to verify setup

**Typical agent creation flow:** 5-8 messages, total cost ~$0.10-0.15 per full build.

### Rate Limits

| Plan | Builder messages/day | Estimated monthly cost to platform |
|------|---------------------|-----------------------------------|
| Launch | 30/day | ~$2-5/mo per user |
| Build | 100/day | ~$5-12/mo per user |
| Agency | Unlimited | ~$8-20/mo per user |

30 messages/day is generous for beginners — enough to build 2-3 agents from scratch or do heavy editing on one.

### Cost Optimization Techniques

1. **Prompt caching** — Anthropic's prompt caching gives 90% discount on cached input tokens. The builder's system prompt (tool definitions, platform docs, instructions) is large but identical across users. Cache aggressively.
2. **Two-model cascade** — Haiku for simple edits, Sonnet for complex creation. Route via cheap Haiku intent classification.
3. **Template prefill** — When someone says "customer support bot", pull from pre-built templates then let AI customize. Fewer tokens generated = cheaper.
4. **Batch tool calls** — Combine multiple platform operations into single tool calls where possible to reduce round-trips.

---

## Runtime AI (Deployed Agents)

### Infrastructure

**OpenRouter** as the unified API gateway:

- 500+ models from all major providers (OpenAI, Anthropic, Google, Mistral, Meta, etc.)
- Single API key managed by LaunchPath
- OpenAI-compatible API — works with Vercel AI SDK via `@openrouter/ai-sdk-provider`
- 5.5% fee on credit purchases (one-time, on top-up — no per-token markup after that)

### Model Tiers

Users see simplified tier names, not raw model names:

| Tier Label | Example Models | Approx. cost per interaction* | Best for |
|-----------|---------------|------------------------------|----------|
| **Fast** | GPT-4o mini, Claude Haiku, Gemini Flash | ~$0.001 | High-volume, simple tasks (FAQ, routing) |
| **Standard** | GPT-4o, Claude Sonnet, Gemini Pro | ~$0.005-0.01 | General-purpose agents (support, sales, lead qual) |
| **Advanced** | Claude Opus, GPT-o3, Gemini Ultra | ~$0.02-0.04 | Complex reasoning, nuanced conversations |

*Per interaction = one user message + one agent response (~1K input + 500 output tokens average)

**Default for new agents: Fast tier.** Most beginner use cases (customer support, FAQ bots, lead qualification) work perfectly on GPT-4o mini or Haiku. This keeps average cost per credit at ~$0.001-0.002.

---

## Credit System Design

### Core Principle

**Abstract tokens into "message credits."** The target audience doesn't know what tokens are. One credit = one conceptual unit of agent usage.

### Credit Weighting by Model Tier

| Model Tier | Credits consumed per message | Actual cost to platform |
|-----------|-----------------------------|-----------------------|
| Fast | 1 credit | ~$0.001 |
| Standard | 5 credits | ~$0.005-0.01 |
| Advanced | 20 credits | ~$0.02-0.04 |

Users see: *"This model uses 5 credits per message"* — simple and predictable.

### Credit Top-Ups (Overage)

When users exceed their monthly included credits:

| Top-Up Pack | Price | Credits | Cost to platform | Margin |
|------------|-------|---------|-----------------|--------|
| Small | $5 | 200 | ~$0.40-1.60 | 68-92% |
| Medium | $15 | 700 | ~$1.40-5.60 | 63-91% |
| Large | $35 | 2,000 | ~$4.00-16.00 | 54-89% |

Margin range depends on which model tier the user is primarily consuming.

---

## Pricing Tiers

> **Tier naming:** Avoid "Starter/Growth/Scale" — a direct competitor uses those exact names.
> LaunchPath uses **Launch / Build / Agency** to reflect the beginner → builder → business journey.

### Subscription Plans

| | **Launch** ($29/mo) | **Build** ($79/mo) | **Agency** ($249/mo) |
|--|--|--|--|
| **Positioning** | "Ship your first AI agent" | "Scale to multiple agents & channels" | "Run it as a business" |
| **Included credits** | 500 | 2,500 | 10,000 |
| **Builder AI** | 30 messages/day | 100 messages/day | Unlimited |
| **Sub-accounts (clients)** | 1 | 5 | Unlimited |
| **Channels** | Web chat | Web + email + voice | All channels |
| **Agents** | Unlimited | Unlimited | Unlimited |
| **Demos** | Basic | Custom-branded | White-label |
| **Knowledge sources** | 3 per agent | 10 per agent | Unlimited |
| **Support** | Community | Priority | Dedicated |

### Credit Add-On Dropdown (within each plan)

Each plan includes a base credit allowance. Users can upgrade credits without switching plans:

**Launch plan credit options:**
| Credits | Monthly price |
|---------|-------------|
| 500 (included) | $29/mo |
| 1,000 | $39/mo |
| 1,500 | $49/mo |
| 2,000 | $59/mo |

**Build plan credit options:**
| Credits | Monthly price |
|---------|-------------|
| 2,500 (included) | $79/mo |
| 5,000 | $109/mo |
| 7,500 | $139/mo |
| 10,000 | $169/mo |

**Agency plan credit options:**
| Credits | Monthly price |
|---------|-------------|
| 10,000 (included) | $249/mo |
| 20,000 | $349/mo |
| 35,000 | $449/mo |
| 50,000 | $549/mo |

This gives users a smooth upgrade path within their tier — they don't need to jump to the next plan just for more credits.

### What 500 credits gets a Launch user

- **On Fast tier (1 credit each):** 500 agent conversations/month
- **On Standard tier (5 credits each):** 100 agent conversations/month
- **On Advanced tier (20 credits each):** 25 agent conversations/month

Most Launch users will run Fast-tier agents and barely use 100-200 credits/month.

### Annual Discount

Offer 20% discount on annual plans to improve cash flow:

| Plan | Monthly | Annual (per month) | Annual total |
|------|---------|-------------------|-------------|
| Launch | $29 | $23 | $276 |
| Build | $79 | $63 | $756 |
| Agency | $249 | $199 | $2,388 |

---

## Sub-Accounts (Client Workspaces)

### What Sub-Accounts Are

Sub-accounts let users create **isolated client workspaces** — each with their own agents, knowledge bases, campaigns, and conversations. This is the key feature for users who want to build and sell AI systems to clients.

### Gating by Plan

| Plan | Sub-accounts | Use case |
|------|-------------|----------|
| **Launch** | 1 | Build for yourself or your first client |
| **Build** | 5 | Small agency serving a handful of clients |
| **Agency** | Unlimited | Full agency operation |

### Why Sub-Accounts Drive Upgrades

Sub-accounts are the strongest natural upgrade trigger:
- A user on Launch gets their first client → immediately needs Build for client #2
- A user on Build lands client #6 → needs Agency
- Unlike credits (which feel like a cost), sub-accounts represent **new revenue for the user** — making the upgrade a no-brainer

### Sub-Account Features by Plan

| Feature | Launch | Build | Agency |
|---------|--------|-------|--------|
| Client workspace | 1 | 5 | Unlimited |
| Client portal access | Yes | Yes | Yes |
| Custom branding | No | Basic (logo + colors) | Full white-label |
| Client-facing demos | Basic | Custom-branded | White-label (your brand removed) |
| Client billing/invoicing | No | No | Future feature |

### Monetization Insight

Users are building AI agents **to sell to clients**. The sub-account limit directly correlates with how much revenue they can generate. This makes the upgrade path feel like an investment, not an expense:

- "I'm paying $79/mo for Build, but I'm charging my 5 clients $500/mo each = $2,500/mo revenue"
- The platform pays for itself many times over — reducing churn and increasing willingness to upgrade

---

## Cost Per User Breakdown

### Launch Plan ($29/mo) — Typical Beginner

| Cost Component | Monthly estimate | Notes |
|---------------|-----------------|-------|
| Builder AI (with caching + cascade) | $2-5 | Most beginners use 10-15 builder messages/day max |
| Runtime credits (avg beginner usage ~150 credits) | $0.30-1.50 | Mostly Fast tier models |
| OpenRouter credit fee (5.5% of runtime) | $0.02-0.08 | One-time on top-up, amortized |
| **Total API cost per user** | **$2.32-6.58** | |
| **Revenue** | **$29.00** | |
| **Gross margin** | **$22.42-26.68 (77-92%)** | |

### Build Plan ($79/mo) — Active User

| Cost Component | Monthly estimate | Notes |
|---------------|-----------------|-------|
| Builder AI | $5-12 | More frequent agent editing and creation |
| Runtime credits (avg ~1,500 credits) | $3.00-15.00 | Mix of Fast and Standard tier |
| OpenRouter credit fee | $0.17-0.83 | |
| **Total API cost per user** | **$8.17-27.83** | |
| **Revenue** | **$79.00** | |
| **Gross margin** | **$51.17-70.83 (65-90%)** | |

### Agency Plan ($249/mo) — Power User / Agency

| Cost Component | Monthly estimate | Notes |
|---------------|-----------------|-------|
| Builder AI | $8-20 | Heavy usage, unlimited messages |
| Runtime credits (avg ~7,000 credits) | $14.00-56.00 | Heavier Standard/Advanced tier usage |
| OpenRouter credit fee | $0.77-3.08 | |
| **Total API cost per user** | **$22.77-79.08** | |
| **Revenue** | **$249.00** | |
| **Gross margin** | **$169.92-226.23 (68-91%)** | |

---

## Profitability Levers

### Cost Reduction

1. **Default to Fast tier models** — auto-select GPT-4o mini or Haiku for new agents. Most beginner use cases don't need Sonnet/Opus.
2. **Prompt caching** — 90% discount on cached input tokens for the builder AI. System prompt + tool definitions are identical across users.
3. **Context window trimming** — cap conversation history to last 10-15 messages before sending to the LLM. Longer context = more input tokens = higher cost.
4. **Tool call efficiency** — optimize system prompts to minimize unnecessary tool call round-trips. Each tool call loop burns tokens.
5. **Two-model cascade for builder** — route 40-60% of builder messages to Haiku instead of Sonnet.
6. **Bulk OpenRouter top-ups** — larger credit purchases amortize the 5.5% fee more efficiently.

### Revenue Optimization

1. **Credit top-ups** — overage pricing has 54-92% margin. Users who outgrow their plan either upgrade or buy top-ups — both are profitable.
2. **Annual plans** — 20% discount in exchange for upfront annual payment. Improves cash flow and retention.
3. **Model upsell** — as users see results with Fast tier, they'll naturally want to try Standard/Advanced. Higher credit consumption = more upgrades and top-ups.
4. **Campaign-based usage** — campaigns drive predictable, recurring credit consumption (not one-off).

### Metrics to Monitor

| Metric | Target | Why it matters |
|--------|--------|---------------|
| Avg credits used per user/month | Track by plan | Detect if included credits are too generous |
| Builder messages per user/month | < 300 (Launch) | Catches runaway builder costs |
| % of messages on Fast vs Standard vs Advanced | > 60% Fast | Keeps blended cost per credit low |
| Credit top-up conversion rate | > 10% of users/month | Validates overage pricing |
| Gross margin per plan tier | > 65% | Healthy SaaS unit economics |

---

## Competitive Differentiation

### Known Competitor Pricing (Reference)

A direct competitor with a very similar product (AI agent builder via chat, multi-channel deployment, demos, sub-accounts) uses:

- **Starter** $25/mo → 500 credits, 1 sub-account, basic demos
- **Growth** $79/mo → 3,000 credits, 5 sub-accounts, advanced demos, marketplace
- **Scale** $297/mo → 10,000 credits, unlimited sub-accounts, white-label

Credits are bundled into plan price with a dropdown to upgrade credit amount within each tier.

### Where LaunchPath Differentiates

| Dimension | Competitor | LaunchPath | Why it matters |
|-----------|-----------|------------|---------------|
| **Tier names** | Starter / Growth / Scale | Launch / Build / Agency | Reflects beginner journey, avoids direct copy |
| **Positioning framing** | "For the first client" (agency-first) | "Ship your first AI agent" (builder-first) | Our audience is beginners, not established agencies |
| **Primary upgrade driver** | Sub-accounts + credits | Channels + builder AI + sub-accounts | Multiple expansion vectors, not just client count |
| **Channel gating** | Not visibly gated | Web only → Web+Email+Voice → All | Creates clear upgrade reason beyond credits |
| **Builder AI visibility** | Not surfaced in pricing | Explicitly shown (30/100/Unlimited per day) | Our viral feature — make it a visible differentiator |
| **Knowledge source limits** | Not visibly gated | 3 → 10 → Unlimited per agent | Another natural expansion point |
| **Top-tier pricing** | $297/mo | $249/mo | Slightly undercut — more accessible for our audience |

### Differentiation Strategy Summary

1. **Don't compete on credits alone** — the competitor already does credit-based pricing. Instead, gate by **capabilities** (channels, knowledge, builder AI power) so credits are just one axis of value.
2. **Lead with the builder AI** — it's the viral hook and they don't surface it in pricing. Making it a visible, gated feature positions LaunchPath as "the AI that builds AI" — distinct from just another agent platform.
3. **Frame around the user's journey** — "Launch → Build → Agency" tells a story. It says "you'll grow here" which resonates with beginners more than generic tier labels.
4. **Undercut slightly on the top tier** — $249 vs $297 makes LaunchPath feel more accessible without racing to the bottom. The $29 and $79 tiers are close enough to feel competitive.
5. **Channel gating is unique leverage** — if the competitor gives all channels on all plans, LaunchPath's gating creates friction. But it also creates a much clearer "why upgrade" story — and most Launch users only need web chat anyway.

### What NOT to Copy

- Don't use a "Marketplace" feature as a tier differentiator unless we actually build one
- Don't use identical tier names (Starter/Growth/Scale)
- Don't tie credit pricing 1:1 to plan price (e.g., "$25/mo plan = $25/mo credits") — decouple them for flexibility
- Don't position around client count in marketing copy — position around the builder's own growth

---

## BYOK (Bring Your Own Key)

### Strategy: Deferred — Not for Launch

BYOK is **not** appropriate for the initial target audience (AI-curious beginners). It requires users to:

- Understand different AI providers
- Sign up for separate API accounts
- Navigate developer consoles for API keys
- Manage billing across multiple services

This contradicts the "no jargon, no friction" positioning.

### When to Introduce BYOK

Add as a **power-user feature** once the platform has traction:

- Accessible via Settings → Advanced → "Use your own API key"
- When active, runtime agent usage does **not** consume credits
- Builder AI still runs on platform keys (always platform-funded)
- Target: users on Agency plan who want to reduce per-message costs or need specific provider features

### BYOK Implementation (Future)

**Direct BYOK** (simplest, $0 platform cost):

- User provides API key per provider (OpenAI, Anthropic, etc.)
- Platform stores encrypted, injects at runtime via `createAnthropic({ apiKey: userKey })`
- No gateway needed — Vercel AI SDK supports per-request provider instantiation
- Runtime credit consumption drops to zero for that user

**Alternative: OpenRouter BYOK** (if multi-model access needed):

- User creates their own OpenRouter account and provides their key
- Platform routes through OpenRouter using the user's key
- 1M free requests/month on OpenRouter's free tier
- User pays OpenRouter directly for credits beyond free tier

---

## Key Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| Builder AI is platform-funded, not credit-gated | Viral feature must be frictionless — this is the Instagram moment |
| Credits, not tokens | Target audience doesn't know what tokens are — abstract the complexity |
| OpenRouter for runtime | 500+ models, single integration, no per-token markup |
| Default to Fast tier | Keeps costs low — beginners don't need expensive models |
| No BYOK at launch | Adds friction that contradicts beginner-friendly positioning |
| Sonnet for builder, not Opus | Reliable for structured tool calls, 5-10x cheaper than Opus |
| Rate limits on builder, not credits | Builder cost is fixed overhead — rate limits keep it predictable |
| Credit top-ups over hard cutoffs | Users hitting limits should be upsold, not blocked |

---

*Last updated: 2026-03-09*

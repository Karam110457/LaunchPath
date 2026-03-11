# LaunchPath v1 Roadmap — What to Build Next

Based on full codebase analysis + MCP server plans + competitor feature gaps.

Last updated: 2026-03-11

---

## Current Platform Status

| Area | Status | Notes |
|------|--------|-------|
| Agent Templates (3) | Built | Appointment Booker, Customer Support, Lead Capture |
| Agent Wizard (7 steps) | Built | Full guided flow, localStorage persistence |
| Agent Generation | Built | SSE streaming, Claude-powered, template-aware |
| Agent Edit Panel | ~80% | Some behavior fields missing from UI |
| Template Switching | Built | Switch dialog with tool diff + config migration |
| Chat System | Built | SSE streaming, RAG, tools, multi-conversation |
| Widget Channel | Built | Preact, shadow DOM, full config, embed code |
| API Channel | Built | Token auth, rate limiting, CORS |
| Client Portal | Built | Dashboard, campaigns, conversations, HITL, settings, impersonation |
| HITL | Built | Takeover, pause, resume, close — competitor doesn't have this |
| Agent Tools | Built | Webhook, HTTP, MCP, Composio, Subagent |
| Knowledge Base | Built | Scraping, FAQs, file upload, chunking, embedding |
| Credit System | Built | Per-action costs, ledger, RPC decrement |
| WhatsApp | Not started | No Twilio SDK |
| SMS | Not started | No Twilio SDK |
| Voice | Not started | No Vapi/Retell SDK |
| Stripe/Billing | Not started | No SDK, env var placeholder only |
| API Keys | Not started | No table, no middleware |
| OpenRouter | Not started | No SDK, currently direct OpenAI/Anthropic only |
| Per-Client Analytics | Not started | No usage tracking per client |
| MCP Server | Not started | Docs only |

---

## The Build Order

### Block 1: Stabilize & Test What's Built (Week 1-2)

Everything else depends on the core working flawlessly.

#### 1.1 End-to-End Wizard Testing (All 3 Templates)

Walk through every step for each template. Fix bugs as found.

- [ ] **Appointment Booker:** Full wizard → generation → verify prompt has availability config, service types, lead fields, tool guidelines
- [ ] **Customer Support:** Full wizard → generation → verify prompt has escalation mode, response style, triage questions
- [ ] **Lead Capture:** Full wizard → generation → verify prompt has qualification mode, ICP description, disqualification criteria
- [ ] **Page discovery (Step 2):** Enter a real URL → does sitemap crawl work? Do pages load? Can user select/deselect?
- [ ] **Knowledge Base (Step 3):** Test FAQ generation, file upload (PDF/DOCX), website page scraping
- [ ] **Conversation Flow (Step 4):** Verify all template-specific fields save correctly to wizard config
- [ ] **Integrations (Step 5):** Do Composio tool suggestions show? Do toolkit logos load?
- [ ] **Identity (Step 6):** Validation (all required fields), tone presets
- [ ] **Review (Step 7):** Edit buttons jump to correct step, generation completes without error

#### 1.2 Agent Edit Panel Completeness

- [ ] Missing behavior fields: `cancellation_policy` (booker), `business_hours` (support)
- [ ] Template switching: does tool diff compute correctly? Does prompt regenerate?
- [ ] Goal adoption: prompt-created agent → adopt template → verify wizard config UI appears
- [ ] Advanced tab: system prompt editing, model selector, knowledge toggle
- [ ] Verify config directives update when behavior settings change

#### 1.3 Chat + Widget Testing

- [ ] Dashboard chat with each template agent — RAG retrieval, tool execution
- [ ] Widget embed on external HTML page — CORS, session persistence, greeting bubble
- [ ] Widget config options: primary color, position, theme, conversation starters, auto-open delay
- [ ] HITL flow: take over from portal → widget sees takeover → portal injects message → resume → close
- [ ] Rate limiting: hit 20 RPM, verify 429 response
- [ ] Conversation starters display and fire correctly

#### 1.4 Portal Testing

- [ ] Create client → assign agent → create campaign → deploy widget from portal
- [ ] Portal login as client member (admin role)
- [ ] Portal login as client member (viewer role — verify read-only)
- [ ] Conversation list: filters (status, date, search), pagination
- [ ] Single conversation view: live transcript, controls
- [ ] Settings: update business info, invite member, remove member
- [ ] Impersonation: agency owner views client portal via impersonate cookie
- [ ] Campaign detail: widget config tab, deploy tab, overview tab

---

### Block 2: AI Models via OpenRouter + Analytics (Week 2-3)

These sit right after portal testing because they affect every agent and every client.

#### 2.1 OpenRouter Integration

**Why now:** Users need model choice. Currently hardcoded to OpenAI/Anthropic direct. OpenRouter gives access to 100+ models through one API, with per-model pricing that feeds into the credit/billing system.

- [ ] Install OpenRouter SDK or use OpenAI-compatible client with `baseURL: "https://openrouter.ai/api/v1"`
- [ ] Add `OPENROUTER_API_KEY` to env config
- [ ] Model selector in agent edit panel: curated list of recommended models
  - Budget: Haiku 3.5, GPT-4o-mini, Gemini Flash
  - Standard: Sonnet 4.5, GPT-4o, Gemini Pro
  - Premium: Opus, GPT-4.5, Claude 4
- [ ] Store selected model on `ai_agents.model` field (already exists)
- [ ] Update `run-agent-chat.ts` to route through OpenRouter based on agent model selection
- [ ] Per-model cost tracking: OpenRouter returns token usage + cost in response headers
- [ ] Fallback: if OpenRouter is down, route to direct API (Anthropic/OpenAI)
- [ ] **HIPAA note:** OpenRouter does NOT offer a BAA. Future "Healthcare mode" toggle should bypass OpenRouter and route directly to OpenAI/Anthropic APIs (both offer BAAs)

#### 2.2 Per-Client Usage Analytics

**Why now:** Agencies can't run profitably without knowing per-client costs. This is the #1 retention feature for the agency tier (from competitor gap analysis).

**Data collection layer:**
- [ ] Add `token_usage` fields to `channel_conversations`: `prompt_tokens`, `completion_tokens`, `total_tokens`, `estimated_cost_usd`
- [ ] Update `run-agent-chat.ts` to capture token usage from model response and write to conversation record
- [ ] Add `model_used` field to conversation record (for cost calculation)

**Per-client analytics API:**
- [ ] `GET /api/portal/analytics` (already exists — extend it):
  - Conversations count (total, by day/week/month)
  - Message count (total, average per conversation)
  - Token usage (total, average per conversation)
  - Estimated cost (based on model pricing)
  - Status breakdown (resolved, escalated, abandoned)
  - Human takeover rate
  - Busiest hours
- [ ] `GET /api/clients/[clientId]/analytics` (agency-side view):
  - Same metrics but for agency owner viewing a specific client
  - Comparison to other clients
  - Cost vs revenue (if agency enters their charge per client)

**Agency-wide analytics dashboard:**
- [ ] `GET /api/analytics` (agency owner):
  - Total conversations across all clients
  - Total token usage + estimated cost
  - Per-client breakdown table (client name, conversations, tokens, cost, last active)
  - Per-agent breakdown (agent name, conversations, performance)
  - Trend charts (daily/weekly/monthly)
  - CSV export
- [ ] Dashboard page: `/dashboard/analytics` with charts + tables
- [ ] Portal page: `/portal/analytics` (per-client view, already has route)

**Per-agent interaction limits (from competitor gaps):**
- [ ] Add `monthly_conversation_limit` to `agent_channels` or `campaigns` table
- [ ] Check limit before processing chat message → return 429 with friendly message when exceeded
- [ ] Show usage vs limit in portal dashboard
- [ ] Agency can set different limits per client/campaign

---

### Block 3: Competitor-Gap Quick Wins (Week 3)

Low-effort features that differentiate from Build My Agent. Ship alongside or right after analytics.

#### 3.1 Auto-Open Widget

**Competitor pain:** Widget only shows as floating bubble. Users want auto-open on page load.
**LaunchPath status:** `autoOpenDelay` already exists in `WidgetConfig` type — may just need widget-side implementation.

- [ ] Verify `autoOpenDelay` is read by widget code and auto-opens chat panel after delay
- [ ] Add toggle in widget setup dialog: "Auto-open after X seconds"
- [ ] Test: embed on page → widget opens automatically after delay

#### 3.2 Fixed Page Embedding (Inline Mode)

**Competitor pain:** Can only deploy as floating bubble. Want inline embed on landing pages.
- [ ] Add embed mode to widget: `mode: "floating" | "inline"`
- [ ] Inline mode: renders as a fixed-size div inside a container element
- [ ] Embed code variant: `<div id="launchpath-chat"></div><script src="..." data-channel="..." data-mode="inline"></script>`
- [ ] Test on a landing page layout

#### 3.3 Multiple Choice Buttons in Chat

**Competitor pain:** Free text only. Want structured choice buttons for guided conversations.
- [ ] Add message type system: `{ type: "text" | "buttons", content: string, buttons?: string[] }`
- [ ] Widget renders buttons as clickable options below the message
- [ ] Clicking a button sends it as a user message
- [ ] Conversation starters already work this way — extend the pattern to mid-conversation
- [ ] Agent can trigger buttons via a structured response format or tool call

#### 3.4 CSV Data Export

**Competitor pain:** No way to export transcripts, leads, or metrics.
- [ ] `GET /api/agents/[agentId]/conversations/export?format=csv&from=DATE&to=DATE`
- [ ] Columns: date, session_id, message_count, status, first_message, last_message, duration
- [ ] Full transcript export option (one row per message)
- [ ] Button in dashboard conversations view: "Export CSV"
- [ ] Portal version: `/api/portal/conversations/export` (client-scoped)

#### 3.5 Call Reminders / Follow-Up Sequences

**Competitor pain:** After booking, no reminders → low show-up rates.
**Note:** This is medium effort. Can be v1.1 if time is tight.
- [ ] Event trigger system: "conversation ended with booking" → fire follow-up sequence
- [ ] Sequence definition: send SMS/WhatsApp reminder at -48h, -24h, -2h before appointment
- [ ] Requires SMS/WhatsApp channels (Block 4) to actually send
- [ ] Can start with email reminders if channels aren't ready yet
- [ ] Store sequences on campaign: `follow_up_config` JSONB

---

### Block 4: New Channels — WhatsApp, SMS, Voice (Week 4-5)

The chat system and conversation storage are built. New channels just need message ingress/egress adapters.

#### 4.1 WhatsApp (Twilio)

- [ ] Install `twilio` SDK
- [ ] Webhook route: `POST /api/channels/webhooks/whatsapp`
  - Validate Twilio signature
  - Extract message body, sender phone, media attachments
  - Map phone → session (lookup or create `channel_conversation`)
  - Call `runAgentChat()` with message
  - Send response via Twilio WhatsApp API
- [ ] Channel creation: add `whatsapp` to `ALLOWED_CHANNEL_TYPES`
- [ ] Config: Twilio Account SID, Auth Token, WhatsApp-enabled phone number
- [ ] Dashboard UI: WhatsApp channel setup dialog (enter Twilio creds + phone)
- [ ] Test end-to-end: create channel → send WhatsApp message → agent responds

#### 4.2 SMS (Twilio)

- [ ] Near-identical to WhatsApp — same SDK, same webhook pattern
- [ ] Webhook route: `POST /api/channels/webhooks/sms`
- [ ] Channel type: `sms`
- [ ] Handle SMS character limits (160 chars) — split long responses or send as MMS
- [ ] Config: Twilio Account SID, Auth Token, SMS-enabled phone number
- [ ] Test end-to-end

#### 4.3 Voice (Vapi or Retell AI)

**Evaluate:** Vapi ($0.05/min + $500/mo agency) vs Retell AI ($0.07/min, HIPAA compliant, developer-friendly)
**Recommendation from competitor gaps doc:** Start with Retell AI or Vapi for flexibility.

- [ ] Choose provider and install SDK
- [ ] Integration pattern: voice provider handles STT/TTS/WebRTC, calls LaunchPath chat API as the "brain"
- [ ] Channel type: `voice` with phone number + web call link in config
- [ ] Channel creation: provision number via voice provider API
- [ ] Dashboard UI: Voice channel setup (enter provider creds, get phone number)
- [ ] Test: create voice channel → call number → agent responds by voice
- [ ] Web call option: return a browser-based call link for testing

#### 4.4 Channel Infrastructure Shared Work

- [ ] Update `ALLOWED_CHANNEL_TYPES` to include `whatsapp`, `sms`, `voice`
- [ ] Channel type badges in UI (colors for each type)
- [ ] Embed code / phone number / connection details in channel creation response
- [ ] `POST /api/channels/[agentId]/trigger` — outbound conversation initiation (form fill → WhatsApp/SMS message to lead)

---

### Block 5: Billing — Stripe + Credit Pricing (Week 5-6)

Must be done before MCP server since MCP needs API key auth and usage metering.

#### 5.1 Stripe Integration

- [ ] Install `stripe` SDK
- [ ] Create products + prices in Stripe dashboard:
  - Free: $0 (1 agent, 100 conversations/mo, 1 client)
  - Pro: $49/mo (10 agents, unlimited conversations, all tools, API access)
  - Agency: $149/mo (unlimited agents, client portal, white-label, priority support)
  - Scale: $499/mo (everything + dedicated support, custom integrations, SLA)
- [ ] DB: `user_subscriptions` table (user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end)
- [ ] Checkout flow: Settings → Billing → choose plan → Stripe Checkout session → redirect back
- [ ] Webhook route: `POST /api/webhooks/stripe`
  - `checkout.session.completed` → create subscription record
  - `invoice.paid` → extend period, refill credits
  - `customer.subscription.updated` → plan change
  - `customer.subscription.deleted` → downgrade to free
- [ ] Customer portal: Stripe's hosted portal for managing payment methods, cancellation
- [ ] Gate features by plan:
  - Agent count limit (free=1, pro=10, agency/scale=unlimited)
  - Conversation limit (free=100/mo, pro/agency/scale=unlimited or high cap)
  - Client portal access (agency+ only)
  - White-label (agency+ only)
  - API key access (pro+ only)

#### 5.2 Credit-Based Usage Pricing

Extend existing credit system to cover all platform actions.

- [ ] Define credit costs for agent operations:
  - Chat message (agent-side): tied to token usage — e.g., 1 credit per 1K tokens
  - Website scrape: 1 credit per page
  - FAQ generation: 1 credit
  - Agent generation: 5 credits
  - Voice minute: 2-3 credits per minute
- [ ] Monthly credit allocation by plan:
  - Free: 100 credits/mo
  - Pro: 2,000 credits/mo
  - Agency: 10,000 credits/mo
  - Scale: 50,000 credits/mo
- [ ] Overage: option to buy additional credit packs ($10 for 500 credits)
- [ ] Usage dashboard in Settings → Billing:
  - Credits used this month vs allocation
  - Breakdown by action type
  - Breakdown by agent
  - Breakdown by client (for agency tier)
  - Usage trend chart
- [ ] Per-client credit allocation (for agencies):
  - Agency owner sets credit cap per client/campaign
  - Prevents one client from burning all credits
  - Maps to "per-agent interaction limits" from competitor gap analysis
- [ ] How this works with MCP server:
  - MCP tool calls map to the same credit costs
  - API key → user_id lookup → credit check → deduct
  - MCP `guide` tool: free (no credit cost)
  - MCP `create_agent_from_prompt`: 5 credits
  - MCP `scrape_website`: 1 credit per page
  - MCP `chat_with_agent`: token-based credits

#### 5.3 API Key System

- [ ] Migration: `user_api_keys` table (id, user_id, key_hash, key_prefix, name, created_at, last_used_at, revoked_at)
- [ ] Key format: `lp_key_` + 48 hex chars
- [ ] Store SHA-256 hash only, display prefix (`lp_key_a3b7...`) after creation
- [ ] Auth middleware: `Authorization: Bearer lp_key_xxx` → hash → lookup → attach user_id
- [ ] Accept EITHER Supabase session cookie OR API key (middleware check order)
- [ ] Settings UI: Settings → API Keys
  - Generate new key (show full key ONCE, then only prefix)
  - List keys with name, prefix, created date, last used
  - Revoke key
- [ ] Rate limiting per key (configurable, default 60 RPM)
- [ ] Gate: API keys only available on Pro+ plans

---

### Block 6: MCP Server + Skills + Launch (Week 7-8)

Everything is ready — channels work, billing works, API keys work.

#### 6.1 Build `@launchpath/mcp-server`

- [ ] Package setup: TypeScript, `@modelcontextprotocol/sdk`, separate repo or monorepo package
- [ ] HTTP client wrapper: API key auth, error handling, retries
- [ ] `guide` tool: comprehensive platform documentation (free, no credits)
- [ ] Agent tools: `list_agents`, `get_agent`, `create_agent`, `create_agent_from_prompt`, `update_agent`, `delete_agent`
- [ ] Knowledge tools: `list_knowledge`, `scrape_website`, `add_faq`, `delete_knowledge`
- [ ] Channel tools: `list_channels`, `deploy_channel`, `update_channel`, `trigger_conversation`
- [ ] Client tools: `list_clients`, `create_client`
- [ ] Campaign tools: `list_campaigns`, `create_campaign`
- [ ] Chat tools: `chat_with_agent`, `list_conversations`
- [ ] SSE handling: `create_agent_from_prompt` and `chat_with_agent` consume SSE streams internally, return final result
- [ ] Test end-to-end: install → create agent → scrape → deploy → chat
- [ ] Publish to npm as `@launchpath/mcp-server`

#### 6.2 Skills Plugin

- [ ] Plugin repo structure with `plugin.json`
- [ ] `/deploy-agent` skill (flagship)
- [ ] `/setup-client` skill
- [ ] `/agent-report` skill
- [ ] `/launchpath-guide` auto-invoked skill
- [ ] Test full plugin install + each skill flow
- [ ] Submit to Anthropic marketplace, mcp.so, PulseMCP

#### 6.3 Launch Prep

- [ ] Record demo video: "I Built an AI Agency from My Terminal in 3 Minutes"
- [ ] README with install instructions + demo GIF
- [ ] Product Hunt launch
- [ ] Hacker News (Show HN)
- [ ] Twitter thread + Reddit posts

---

## Features from Competitor Gaps — Where They Land

| Competitor Gap | Priority | Where in Roadmap | LaunchPath Status |
|---------------|----------|-----------------|-------------------|
| Conversation timestamps | Ship at launch | Already built | Done |
| Platform performance | Ship at launch | Already built | Done (Next.js 15 + Vercel) |
| Voice AI | High | Block 4.3 | Not started |
| Human takeover (HITL) | High | Already built | Done — major differentiator |
| Per-client usage analytics | High | Block 2.2 | Not started |
| Per-agent interaction limits | High | Block 5.2 | Not started (credit allocation per client) |
| Call reminders / follow-ups | High | Block 3.5 | Not started |
| Auto-open widget | Medium | Block 3.1 | Partially built (config exists, verify widget reads it) |
| Fixed page embedding | Medium | Block 3.2 | Not started |
| Multiple choice buttons | Medium | Block 3.3 | Not started |
| Bulk agent testing | Medium | MCP Skills (`/test-agent`) | Skill only, no built-in UI |
| CSV data export | Medium | Block 3.4 | Not started |
| HIPAA compliance | Low (future) | Phase 4 in moat doc | Not started — pursue after PMF |
| RTL support | Low | Post-launch | Not started |
| More templates | Low | Post-launch | 3 templates is fine for v1 |

---

## Timeline Summary

```
Week 1-2:  Block 1 — Test wizard, agents, chat, widget, portal. Fix bugs.
Week 2-3:  Block 2 — OpenRouter model selection + per-client analytics.
Week 3:    Block 3 — Quick wins (auto-open, inline embed, buttons, CSV export).
Week 4-5:  Block 4 — WhatsApp + SMS + Voice channels.
Week 5-6:  Block 5 — Stripe billing + credit pricing + API keys.
Week 7-8:  Block 6 — MCP server + Skills + Launch.
```

**Total: ~8 weeks to full v1 launch with MCP server.**

---

## What NOT to Build for v1

These are explicitly out of scope to prevent scope creep:

- HIPAA compliance (too heavy, pursue after PMF)
- Email management (not our product)
- Social media auto-posting (not our product)
- Unofficial WhatsApp APIs (legal risk)
- LLM-as-judge scoring (research-level problem)
- Niche-specific fine-tuned models (need data first)
- Agent-to-agent network (Phase 4 in moat doc)
- In-platform AI agent builder using MCP tools (post-launch)

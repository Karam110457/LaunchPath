# LaunchPath — Platform Vision & Build Plan

> **One-line pitch:** "Describe your client's problem. Get a working AI agent, deployed to phone, SMS, and website — in minutes."

---

## Table of Contents

1. [The Three-Layer Business Model](#the-three-layer-business-model)
2. [Target Audience](#target-audience)
3. [The Agent Builder — What It Does](#the-agent-builder--what-it-does)
4. [Channel Deployment System](#channel-deployment-system)
5. [The Build AI — Conversational Agent Creator](#the-build-ai--conversational-agent-creator)
6. [The Full User Journey](#the-full-user-journey)
7. [What's Already Built](#whats-already-built)
8. [What Needs to Be Built](#what-needs-to-be-built)
9. [Build Phases & Execution Order](#build-phases--execution-order)
10. [API Audit — Existing Endpoints](#api-audit--existing-endpoints)
11. [New APIs Required](#new-apis-required)
12. [Database Changes](#database-changes)
13. [Third-Party Integrations](#third-party-integrations)
14. [Competitive Landscape](#competitive-landscape)
15. [Revenue Model](#revenue-model)
16. [Key Architectural Decisions](#key-architectural-decisions)
17. [Out of Scope (For Now)](#out-of-scope-for-now)

---

## The Three-Layer Business Model

LaunchPath is a vertically integrated business with three layers that feed each other:

```
┌─────────────────────────────────────────────────┐
│              LAYER 3: SOFTWARE                   │
│              (LaunchPath Platform)                │
│                                                   │
│  Every pattern, agent, and result from Layers     │
│  1 & 2 becomes a template other people use.       │
│                                                   │
│  "Here's the exact agent that booked 127          │
│   appointments for MY business. Deploy it."       │
├─────────────────────────────────────────────────┤
│              LAYER 2: AGENCY                      │
│                                                   │
│  Sell AI systems to OTHER local businesses        │
│  using real data from your own business.          │
│                                                   │
│  "I know this works because I run the same        │
│   system in my own business. Here's the data."    │
├─────────────────────────────────────────────────┤
│              LAYER 1: LOCAL BUSINESS              │
│                                                   │
│  Own a local business running AI agents.          │
│  Real customers, real data, real problems.        │
│                                                   │
│  "I'm not theorizing. I use this every day."      │
└─────────────────────────────────────────────────┘
```

### How the layers feed each other

- **Layer 1 (Local Business)** generates real performance data, case studies, and proof.
- **Layer 2 (Agency)** uses that proof to sell to other businesses. Each client generates more data.
- **Layer 3 (Software)** captures all patterns and makes them replicable for anyone.
- Each layer validates and strengthens the others. Anyone can copy one layer. Nobody can copy all three.

### Why this is unkillable

| Threat | Why It Can't Touch You |
|--------|----------------------|
| Another software copies LaunchPath | They don't have your real business data or niche intelligence |
| Another agency competes locally | They can't show their own business dashboard as proof |
| A local competitor uses AI | They're probably using YOUR software or your agency's services |
| Big tech launches an agent builder | Horizontal tool, no niche data, no business proof |
| Your audience copies the model | They use LaunchPath to do it — you still win |

---

## Target Audience

### Who LaunchPath is for

AI-curious beginners who want to start making money with AI but are stuck in one or more of these loops:

- Watching "AI agency" content all day and still not knowing what to do first
- Tool hopping (Make, Zapier, n8n, ChatGPT, agents) without shipping anything real
- Feeling overwhelmed by options: niches, offers, automations, business models
- Wanting speed and results, but not wanting to get scammed or waste months
- Afraid they'll sell something they can't deliver because they don't truly "get" building yet
- Wanting a simple, repeatable path to their first sellable AI system and their first client

### What they need from the platform

- **NOT** another tool to learn — they need the tool that eliminates the need to learn tools
- **NOT** a blank canvas — they need guided creation that tells them what to build
- **NOT** just the agent — they need the agent + deployment + demo link + sell kit
- Direction + execution + proof, not more motivation

### The north star message

> **"Stop learning AI. Start shipping one sellable system."**

### The Skool community's role

The Skool community handles niche selection, pricing guidance, sales coaching, and motivation. The platform handles the hard part: **building and deploying agents that actually work**.

---

## The Agent Builder — What It Does

### Core concept

Users build AI agents customized per business (not per niche). Each agent has:

- A **custom system prompt** tailored to the specific business (scraped from their website)
- A **knowledge base** loaded with that business's FAQs, services, policies
- **Tools** connected to that business's accounts (their calendar, their SMS, their CRM)
- **Channels** deployed to that business's touchpoints (their website, their phone number)

### Why it's custom per business

A dental agent for "Smile Dental" is completely different from one for "Park Lane Dentistry":

| Component | Smile Dental | Park Lane Dentistry |
|-----------|-------------|-------------------|
| Hours | Mon-Fri 8am-5pm | Mon-Sat 9am-6pm |
| Team | Dr. Smith, Dr. Jones | Dr. Williams |
| Insurance | Blue Cross, Delta | NHS, Bupa, AXA |
| Services | Cleanings, implants, emergency | Orthodontics, cosmetic, pediatric |
| Location | 123 High Street, Manchester | 45 Park Lane, Leeds |
| Calendar | Dr. Smith's Google Calendar | Dr. Williams' Google Calendar |

A generic niche template is useless in production. The platform scrapes the actual business and builds a custom agent from real data.

### The customization flow

1. User provides business name + website URL
2. Platform discovers and scrapes all pages (existing wizard API)
3. AI extracts: hours, services, team, location, insurance, policies
4. User corrects any errors or adds missing info
5. AI generates custom system prompt from scraped data
6. AI generates 50-80 FAQs specific to THIS business
7. User connects tools (OAuth into the business's specific calendar, etc.)
8. Agent is tested with realistic scenarios
9. Agent is deployed to channels

### Cloning for scale (agency model)

Once an agent is built for one business in a niche, subsequent agents in the same niche are much faster:

| Client # | Process | Time |
|-----------|---------|------|
| First dental client | Full build: scrape, configure, deploy | ~5 min |
| Second dental client | Clone + scrape new website + swap details + new OAuth | ~1-2 min |
| Third dental client | Clone + scrape + swap | ~30 sec |

The clone API already exists (`POST /api/agents/[agentId]/clone`). It needs a small modification to also clone tools and knowledge.

---

## Channel Deployment System

### Channels overview

Each agent can be deployed to multiple channels simultaneously:

| Channel | What It Does | Technology | Priority |
|---------|-------------|------------|----------|
| **Website Widget** | Chat bubble on any website | Embeddable `<script>` tag | **P0 — Build first** |
| **Voice** | AI answers phone calls | Vapi AI + Twilio | **P1 — High impact** |
| **SMS** | AI responds to text messages | Twilio SMS | **P2 — Straightforward** |
| **WhatsApp** | AI responds on WhatsApp | Twilio / Meta API | **P3 — Phase 2** (Meta restrictions in 2026) |
| **Demo Page** | Shareable link for testing | LaunchPath hosted page | **P0 — Build with widget** |

### Website Widget

```html
<!-- What the user gets -->
<script
  src="https://launchpath.io/widget/abc123.js"
  data-agent="agent_xyz"
  data-color="#4F46E5"
  data-position="bottom-right"
  data-welcome="Hi! How can I help you today?">
</script>
```

- Generates a lightweight chat widget JS bundle
- Widget connects to the public chat API via SSE
- Customizable: colors, position, welcome message, avatar
- No auth required for end users — authenticated via channel token
- Conversation state tracked per browser session

### Voice (via Vapi)

- Vapi REST API creates an assistant with the agent's system prompt
- Phone number assigned (Vapi number or imported Twilio number)
- Incoming calls → Vapi transcribes → sends to LaunchPath webhook → agent responds → Vapi speaks
- Supports call transferring, voicemail, SMS follow-up
- Every feature accessible via Vapi's API for automated setup

### SMS (via Twilio)

- Twilio number purchased or imported
- Webhook set to LaunchPath endpoint
- Incoming SMS → maps phone number to agent → calls agent chat → sends reply via Twilio
- Conversation threading per phone number
- A2P 10DLC registration required for US numbers

### WhatsApp (Phase 2)

- Same webhook pattern as SMS
- Requires Meta Business verification
- Note: Meta restricting third-party AI chatbots on WhatsApp in 2026 — compliance TBD
- Deferred to Phase 2 until compliance requirements are clearer

### Demo Page

- Public URL: `launchpath.io/try/[agentId]`
- Shows agent name, description, capabilities
- Live chat widget connected to the agent
- Lists deployed channels (phone number, SMS number)
- No auth required — anyone with the link can test
- Adapts existing demo page infrastructure

---

## The Build AI — Conversational Agent Creator

> **Build channels first. Build the Build AI second.** The Build AI needs real, tested APIs to call. Build the channels, prove they work manually, then let the AI orchestrate them.

### What it is

An AI agent whose tools are LaunchPath's own API endpoints. The user describes what they want in natural language, and the Build AI creates the agent, loads knowledge, attaches tools, and deploys to channels.

### The Build AI's tool set

```
DISCOVERY (existing APIs as tools):
├── discover_pages      → POST /api/agents/wizard/discover-pages
├── scrape_page         → POST /api/agents/wizard/scrape-page
├── generate_faqs       → POST /api/agents/wizard/generate-faqs
└── generate_questions  → POST /api/agents/wizard/generate-questions

AGENT CREATION (existing APIs as tools):
├── create_agent        → POST /api/agents/generate
├── update_agent        → PATCH /api/agents/[agentId]
├── clone_agent         → POST /api/agents/[agentId]/clone
└── load_knowledge      → POST /api/agents/[agentId]/knowledge/faq + /scrape

TOOL CONNECTIONS (existing APIs, user does OAuth):
├── list_composio_apps  → GET /api/composio/apps
├── connect_app         → POST /api/composio/connect
└── attach_tool         → POST /api/agents/[agentId]/tools

TESTING (thin wrapper over existing chat):
└── test_agent          → POST /api/agents/[agentId]/chat (with simulated scenarios)

DEPLOYMENT (new APIs — built in channel phases):
├── deploy_widget       → POST /api/agents/[agentId]/deploy (type: widget)
├── deploy_voice        → POST /api/agents/[agentId]/deploy (type: voice)
├── deploy_sms          → POST /api/agents/[agentId]/deploy (type: sms)
└── generate_demo_page  → POST /api/agents/[agentId]/deploy (type: demo)
```

### Example conversation

```
Build AI: "What business are we building for? Give me their name and website."

User:     "Smile Dental — smiledental.com"

Build AI: [calls discover_pages("smiledental.com")]
          [calls scrape_page() on top 5 pages]

          "Got it. Here's what I found about Smile Dental:

           📍 123 High Street, Manchester
           🕐 Mon-Fri 8am-5pm, Sat 9am-1pm
           👨‍⚕️ Dr. Smith (general), Dr. Jones (orthodontics)
           🦷 Cleanings, fillings, implants, emergency care
           💳 Blue Cross, Delta Dental, Aetna

           Anything I got wrong or missed?"

User:     "They also accept NHS patients and they're closed on bank holidays"

Build AI: [creates agent with custom prompt including all scraped + corrected details]
          [generates 73 FAQs from website]
          [loads FAQs into knowledge base]

          "Agent created with 73 FAQs. Let's connect their tools.
           For dental, you'll want:

           📅 Google Calendar — for booking appointments
           📱 SMS — for confirmations and follow-ups

           Want to connect their Google Calendar now?"

User:     "Yes"

Build AI: [triggers Composio OAuth flow]

          ...user completes OAuth in popup...

          [attaches Google Calendar tool]
          [runs 3 test scenarios]

          "Test results:
           ✓ 'Do you accept Blue Cross?' → Correct, mentioned NHS too
           ✓ 'I need an emergency appointment' → Correct response
           ✓ 'Book me a cleaning for Tuesday' → Found available slot
           Score: 3/3

           Ready to deploy. Which channels?"

User:     "Website widget and phone"

Build AI: [deploys widget → generates embed code]
          [deploys voice → creates Vapi assistant + phone number]

          "All live:
           🌐 Widget: <script src='launchpath.io/widget/xyz.js'>
           📞 Phone: (0161) 555-7890
           🔗 Demo: launchpath.io/try/smile-dental"
```

### Cloning flow (second+ client in same niche)

```
User: "New client — Park Lane Dentistry, parklanedental.com"

Build AI: "I see you have 2 dental agents. Smile Dental is your best
          performer. I'll clone it and customize for Park Lane.

          Scraping parklanedental.com now..."

          [clones Smile Dental agent]
          [scrapes parklanedental.com]

          "Found the differences:

           Smile Dental          →  Park Lane Dentistry
           123 High Street       →  45 Park Lane, Leeds
           Mon-Fri 8-5           →  Mon-Sat 9-6
           Dr. Smith, Dr. Jones  →  Dr. Williams
           Blue Cross, Delta     →  NHS + Bupa + AXA

           Agent updated. Connect Park Lane's Google Calendar?"
```

---

## The Full User Journey

### For a Skool community member (using the platform manually before Build AI exists)

```
SKOOL COMMUNITY
  Karam teaches: pick dental, here's how to sell
      ↓
LAUNCHPATH DASHBOARD
  Create new agent → wizard flow (existing)
  Scrape client website → load knowledge
  Connect Calendar + SMS tools
  Test in chat panel
      ↓
DEPLOY TO CHANNELS
  Website widget → embed code
  Voice → phone number via Vapi
  SMS → text number via Twilio
      ↓
DEMO PAGE
  Share launchpath.io/try/[agentId] with the client
  Client tries it → "holy shit this works"
      ↓
CLOSE THE DEAL
  £750 setup + £350/mo
      ↓
CLONE FOR NEXT CLIENT
  Clone agent → scrape new website → swap details → deploy
  30 seconds per new client
```

### For a user (after Build AI is built — Phase 6+)

```
INSTAGRAM REEL (sees 60-second build)
    ↓
LANDING PAGE (starts typing before signing up)
    ↓
BUILD CONVERSATION (AI builds the agent from a chat)
    ↓
LIVE BUILD (watches agent assemble in real-time)
    ↓
AUTO-TEST (AI tests itself with realistic scenarios)
    ↓
CHANNEL DEPLOYMENT (widget, voice, SMS — all automated)
    ↓
DEMO PAGE (shareable link, ready for clients)
    ↓
SELL KIT (outreach message + pricing + where to find clients)
    ↓
COMMAND CENTER (stats, next actions, content to share)
    ↓
SCALE (clone for more clients → agency dashboard)
```

---

## What's Already Built

### Agent Builder System (Production Ready)

| Feature | Status | Location |
|---------|--------|----------|
| Agent CRUD + versioning | ✅ Done | `/api/agents/[agentId]` |
| Agent generation (wizard) | ✅ Done | `/api/agents/generate` |
| Agent cloning | ✅ Done | `/api/agents/[agentId]/clone` |
| SSE streaming chat + tool execution | ✅ Done | `/api/agents/[agentId]/chat` |
| Webhook tools (create, test, execute) | ✅ Done | `src/lib/tools/integrations/webhook.ts` |
| MCP tools (discover + execute) | ✅ Done | `src/lib/tools/integrations/mcp.ts` |
| Composio tools (500+ apps, OAuth, pinned params) | ✅ Done | `src/lib/tools/integrations/composio.ts` |
| Tool config masking (security) | ✅ Done | `src/lib/tools/mask-config.ts` |
| Prompt assembly (tools + RAG + degradation) | ✅ Done | `src/lib/agents/assemble-prompt.ts` |
| Knowledge base (upload, scrape, FAQ, RAG) | ✅ Done | `src/lib/knowledge/` |
| Multi-conversation support | ✅ Done | `src/hooks/useAgentChat.ts` |
| Visual canvas editor (React Flow) | ✅ Done | `src/components/agents/canvas/` |
| Tool catalog + setup UI | ✅ Done | Tool modals in canvas |
| Composio app library + OAuth flow | ✅ Done | AppLibraryModal + ComposioToolSetup |
| Website discovery + scraping | ✅ Done | `/api/agents/wizard/discover-pages`, `/scrape-page` |
| FAQ generation from content | ✅ Done | `/api/agents/wizard/generate-faqs` |

### Offer/Demo System (Production Ready)

| Feature | Status | Location |
|---------|--------|----------|
| 6-step offer workflow (parallel agents) | ✅ Done | `src/mastra/workflows/offer-generation.ts` |
| Demo page generation | ✅ Done | `src/mastra/workflows/demo-builder.ts` |
| Public shareable demo pages | ✅ Done | `/demo/[systemId]` |
| Lead scoring + submissions | ✅ Done | `demo_submissions` table |
| 10 niche agent templates | ✅ Done | `src/lib/ai/agents/` registry |
| Config-based + code-based rendering | ✅ Done | DemoPage + DemoPageCode |

### Platform Infrastructure (Production Ready)

| Feature | Status |
|---------|--------|
| Supabase auth + onboarding gate | ✅ Done |
| 19 DB migrations, full RLS | ✅ Done |
| Dashboard (systems + agents) | ✅ Done |
| Multi-step onboarding flow | ✅ Done |
| SSRF/CSRF/audit security | ✅ Done |
| Rate limiting | ✅ Done |

---

## What Needs to Be Built

### The Critical Blocker

**Every API route requires Supabase auth.** A website visitor, Twilio webhook, or Vapi voice call cannot pass auth. This single issue blocks all channel deployments.

**Fix:** Public chat endpoint with token-based auth instead of user session auth.

### New features needed (in build order)

| # | Feature | Effort | Depends On |
|---|---------|--------|------------|
| 1 | **Public chat endpoint** (token auth) | Medium | Nothing — this is first |
| 2 | **agent_channels + channel_conversations tables** | Small | Nothing |
| 3 | **Website widget** (embed script + chat UI) | Medium | #1 |
| 4 | **Agent demo page** (`/try/[agentId]`) | Small | #1 |
| 5 | **Voice deployment** (Vapi integration) | Medium | #1 |
| 6 | **SMS deployment** (Twilio webhook) | Medium | #1 |
| 7 | **Channel management UI** (dashboard) | Medium | #3, #5, #6 |
| 8 | **Clone enhancement** (include tools + knowledge) | Small | Nothing |
| 9 | **Build AI agent + tools** | Medium | #3, #5, #6 |
| 10 | **Build AI conversation UI** | Medium | #9 |
| 11 | **Sell kit generation** | Small | #9 |
| 12 | **Agent analytics dashboard** | Medium | #3, #5, #6 |
| 13 | **Agency view** (multi-client management) | Medium | #12 |

---

## Build Phases & Execution Order

### Phase 1: Public Chat Endpoint (Week 1)

The single thing blocking everything.

- Extract core chat logic from `src/app/api/agents/[agentId]/chat/route.ts` into a shared `runAgentChat()` function
- Create `POST /api/channels/[agentId]/chat` — same logic, token auth
- Create `agent_channels` + `channel_conversations` migration
- Rate limiting per channel token
- Anonymous conversation persistence (per session ID)

**After Phase 1:** Agents can receive messages from unauthenticated sources.

### Phase 2: Website Widget + Demo Page (Week 1-2)

The fastest channel to ship.

- Widget JS bundle (lightweight chat UI in an iframe or shadow DOM)
- `GET /api/widget/[agentId].js` serves the embeddable script
- Customization: colors, position, welcome message
- Deploy UI in agent dashboard: "Add Website Widget" → generates embed code
- Agent demo page route: `/try/[agentId]` — public page with live chat
- Test: embed on a test site, verify chat works end-to-end

**After Phase 2:** Users can deploy agents to any website and share demo links with clients.

### Phase 3: Voice via Vapi (Week 2-3)

The "holy shit" channel.

- Vapi SDK integration: create assistant, buy/import phone number
- `POST /api/channels/voice/webhook` — Vapi server URL handler
- Deploy UI: "Add Phone Channel" → provisions number
- Map Vapi conversation turns → agent chat → response
- Support for: call transferring, voicemail detection, SMS follow-up
- Test: call the number, AI answers with the agent's personality

**After Phase 3:** Agents can answer phone calls. This is the most impressive demo for local businesses.

### Phase 4: SMS via Twilio (Week 3)

Straightforward webhook pattern.

- Twilio SDK: buy number or import existing
- `POST /api/channels/sms/inbound` — Twilio webhook handler
- Map incoming phone number → agent via `agent_channels` table
- Call agent chat, send reply via Twilio REST API
- Conversation threading per phone number
- Deploy UI: "Add SMS Channel" → provisions number

**After Phase 4:** Full multi-channel deployment working: website + phone + SMS.

### Phase 5: Channel Management UI (Week 3-4)

Dashboard for managing all deployed channels.

- Channels tab in agent canvas or agent detail page
- List all channels: status (active/paused/error), type, config
- Pause/resume channels
- View conversation logs per channel
- Usage stats: messages per channel, response times
- Delete channel (revoke number, remove widget)

**After Phase 5:** Users can manage their deployed agents across all channels from one place.

### Phase 6: Build AI (Week 5-6)

The automation layer. Only built after Phases 1-5 are proven.

- Build AI agent definition (system prompt + tool definitions)
- Internal tools that call existing LaunchPath APIs
- Build conversation UI page (`/dashboard/build` or `/build`)
- Live preview panel showing agent being created
- Auto-test runner (simulated conversations with scoring)
- Channel deployment through conversation
- Cloning flow for second+ clients

**After Phase 6:** The full "describe what you want → working agent deployed to all channels" experience.

### Phase 7: Growth Features (Week 7+)

- Sell kit: auto-generated outreach message + pricing per niche
- Agent analytics: messages handled, bookings made, revenue estimated
- Agency dashboard: multi-client view, MRR tracking
- Content generation: build replay timelapses, dashboard screenshots
- Landing page: input field before signup (the viral hook)

---

## API Audit — Existing Endpoints

### Ready to use as-is

| API | Method | Purpose |
|-----|--------|---------|
| `/api/agents/[agentId]` | PATCH | Update agent (name, prompt, model, personality, status) |
| `/api/agents/[agentId]` | DELETE | Delete agent + cleanup |
| `/api/agents/[agentId]/clone` | POST | Clone agent |
| `/api/agents/[agentId]/tools` | GET | List agent's tools (masked configs) |
| `/api/agents/[agentId]/tools` | POST | Create/attach a tool |
| `/api/agents/[agentId]/tools/[toolId]` | PATCH | Update tool config |
| `/api/agents/[agentId]/tools/[toolId]` | DELETE | Remove tool |
| `/api/agents/[agentId]/tools/test` | POST | Test webhook/MCP tool |
| `/api/agents/[agentId]/tools/mcp-discover` | POST | Discover MCP server tools |
| `/api/agents/[agentId]/versions` | GET | List version history |
| `/api/agents/[agentId]/chat` | POST | Test chat (authenticated, SSE stream) |
| `/api/agents/[agentId]/chat/conversations` | GET | List/load conversations |
| `/api/agents/[agentId]/knowledge` | GET | List knowledge documents |
| `/api/agents/[agentId]/knowledge/upload` | POST | Upload file to KB |
| `/api/agents/[agentId]/knowledge/scrape` | POST | Scrape URL into KB |
| `/api/agents/[agentId]/knowledge/faq` | POST/PATCH | Add/edit FAQ |
| `/api/agents/[agentId]/knowledge/retry` | POST | Retry failed processing |
| `/api/agents/generate` | POST | Create agent from wizard (SSE) |
| `/api/agents/wizard/discover-pages` | POST | Find pages on a website |
| `/api/agents/wizard/scrape-page` | POST | Extract page content |
| `/api/agents/wizard/generate-faqs` | POST | AI-generate FAQs |
| `/api/agents/wizard/generate-questions` | POST | AI-generate qualifying questions |
| `/api/composio/apps` | GET | List available Composio apps |
| `/api/composio/tools` | GET | List toolkit actions + schemas |
| `/api/composio/connect` | POST | Initiate OAuth/API key connection |
| `/api/composio/connections` | GET | List user's connections |
| `/api/composio/connections` | DELETE | Disconnect app |

### Need modification

| API | Change Needed |
|-----|--------------|
| `/api/agents/[agentId]/clone` | Add option `{ includeTools: true, includeKnowledge: true }` — currently only clones agent record, not tools/KB |
| `/api/agents/[agentId]/chat` | Extract core logic into shared `runAgentChat()` so it can be reused by public endpoint |

---

## New APIs Required

### Channel System

| API | Method | Purpose | Auth |
|-----|--------|---------|------|
| `/api/channels/[agentId]/chat` | POST | Public chat endpoint | Token (from `agent_channels.api_token`) |
| `/api/agents/[agentId]/deploy` | POST | Deploy agent to a channel | User (Supabase) |
| `/api/agents/[agentId]/channels` | GET | List deployed channels | User (Supabase) |
| `/api/agents/[agentId]/channels/[channelId]` | PATCH | Update channel config | User (Supabase) |
| `/api/agents/[agentId]/channels/[channelId]` | DELETE | Remove channel deployment | User (Supabase) |
| `/api/channels/sms/inbound` | POST | Twilio SMS webhook receiver | Twilio signature validation |
| `/api/channels/voice/webhook` | POST | Vapi server URL webhook | Vapi auth header |
| `/api/widget/[agentId].js` | GET | Serve embeddable widget script | Public (token embedded in script) |

### Demo Page

| API | Method | Purpose | Auth |
|-----|--------|---------|------|
| `/try/[agentId]` | GET | Public agent demo page | Public |

---

## Database Changes

### New tables (one migration)

```sql
-- Channel deployments
CREATE TABLE agent_channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  channel     TEXT NOT NULL,              -- 'widget' | 'voice' | 'sms'
  status      TEXT DEFAULT 'active',      -- 'active' | 'paused' | 'error'
  config      JSONB NOT NULL DEFAULT '{}',
  api_token   TEXT NOT NULL UNIQUE,       -- Public auth token for this channel
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Channel config shapes:
-- Widget: { color, position, welcome_message, avatar_url }
-- Voice:  { vapi_assistant_id, vapi_phone_id, phone_number, voice_id }
-- SMS:    { twilio_number_sid, phone_number }

-- RLS: users can only manage their own channels
ALTER TABLE agent_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own channels"
  ON agent_channels FOR ALL
  USING (user_id = auth.uid());

-- Anonymous conversations from channels
CREATE TABLE channel_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  UUID NOT NULL REFERENCES agent_channels(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,              -- Browser session, phone number, etc.
  messages    JSONB DEFAULT '[]',
  metadata    JSONB DEFAULT '{}',         -- Channel-specific metadata
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_channel_conversations_session
  ON channel_conversations(channel_id, session_id);

CREATE INDEX idx_agent_channels_token
  ON agent_channels(api_token);

-- RLS: public read via token (handled in API), owner full access
ALTER TABLE channel_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Channel owner manages conversations"
  ON channel_conversations FOR ALL
  USING (
    channel_id IN (
      SELECT id FROM agent_channels WHERE user_id = auth.uid()
    )
  );
```

---

## Third-Party Integrations

### Vapi AI (Voice)

- **Purpose:** AI answers phone calls
- **Website:** https://vapi.ai
- **Key APIs:**
  - `POST /assistant` — Create voice assistant with system prompt
  - `POST /phone-number` — Buy or import phone number
  - Assign assistant to phone number
  - Server URL webhook for conversation turns
- **Auth:** API key
- **Pricing:** Per-minute voice usage
- **Docs:** https://docs.vapi.ai/api-reference/assistants/create
- **Supports:** Claude models, custom tools, call transferring, SMS

### Twilio (SMS)

- **Purpose:** AI responds to text messages
- **Key APIs:**
  - Buy phone number
  - Set webhook URL for incoming SMS
  - Send SMS via REST API
- **Auth:** Account SID + Auth Token
- **Pricing:** Per-message
- **Requirements:** A2P 10DLC registration for US numbers
- **Already partially integrated** via Composio (for agent tools)

### Composio (Already Integrated)

- **Purpose:** 500+ pre-built tool integrations (Calendar, Email, CRM, etc.)
- **Status:** Fully integrated — OAuth flow, tool building, pinned params all working
- **Used for:** Connecting agent tools to business-specific accounts

---

## Competitive Landscape

### What exists and why LaunchPath wins

| Platform | What It Does | What's Missing |
|----------|-------------|----------------|
| **Stammer.ai** | White-label chatbot builder for agencies | Manual build, no voice/SMS, no website scraping |
| **MindStudio** | No-code AI agent builder | No channel deployment, no sell kit, 15-60 min build |
| **Relevance AI** | Powerful agent platform with API | Technical, not beginner-friendly |
| **BotPenguin** | White-label with analytics | Generic, no niche intelligence |
| **Voiceflow** | Conversational AI builder | Complex, designed for enterprises |
| **n8n** | Workflow automation with AI | Not an agent builder, requires technical setup |

### LaunchPath's differentiators

1. **Website → Custom Agent** — Scrapes the actual business, not a generic template
2. **Multi-channel deployment** — Widget + Voice + SMS from one agent
3. **Full loop: build → deploy → demo → sell** — Competitors stop at "build"
4. **Beginner-first** — Designed for AI-curious beginners, not developers
5. **Real business data** — Performance insights from Layer 1 (your own business)
6. **Clone and scale** — Build once, clone for every client in the niche

### Market context

- AI agents market: $7.8B (2025) → $52B by 2030
- AI coding tools market: $7.37B (2025) → $24B by 2030
- 85% of organizations have integrated AI agents in at least one workflow
- 41% of enterprise code is now AI-generated
- Voice AI is the "holy shit" moment for local businesses

---

## Revenue Model

| Revenue Stream | Price Range | How |
|---------------|-------------|-----|
| **Platform subscription** | £49-199/mo | Based on number of deployed agents |
| **Per-agent hosting** | £10-29/mo per live agent | Scales with user success |
| **Tool/model usage** | Pass-through + margin | Composio actions, LLM tokens, Vapi minutes |
| **Template marketplace** | 20% commission | Users sell niche templates (Phase 7+) |
| **White-label upgrade** | £99-299/mo | Remove LaunchPath branding |
| **Voice minutes** | Pass-through + margin | Vapi usage for voice channel |
| **SMS messages** | Pass-through + margin | Twilio usage for SMS channel |

### Unit economics for the user (what they sell to clients)

| Service | User Charges Client | User's Cost | Margin |
|---------|-------------------|-------------|--------|
| Setup (one-time) | £500-1500 | 1-2 hours + platform | ~90% |
| Monthly management | £300-800/mo | LaunchPath sub + usage | ~80% |
| Additional channels | £100-300 each | Vapi/Twilio costs | ~85% |

---

## Key Architectural Decisions

### 1. Public chat via token auth, not API keys

Channel endpoints authenticate via a random token stored in `agent_channels.api_token`. This is simpler than API key management and scoped to a single channel deployment.

### 2. Shared `runAgentChat()` function

Extract the core chat logic (tool loading, RAG, prompt assembly, streaming) from the existing chat route into a reusable function. Both the authenticated route and public channel route call the same function.

### 3. Vapi as voice infrastructure, not custom

Don't build voice infrastructure. Vapi handles speech-to-text, text-to-speech, telephony, and call management. LaunchPath provides the AI brain via a server URL webhook.

### 4. Channel conversations separate from agent conversations

`agent_conversations` = owner testing in the dashboard (authenticated).
`channel_conversations` = end-user interactions via deployed channels (anonymous).
Different tables because they have different auth models and lifecycle.

### 5. Build AI is an agent that uses your own APIs

The Build AI doesn't have special access. It calls the same API endpoints a human would use through the UI. This means every capability the Build AI has can also be done manually in the dashboard.

### 6. Channels first, Build AI second

The Build AI orchestrates channel deployments. If channels don't work reliably, the Build AI can't deliver. Build and test channels manually first, then automate with the Build AI.

---

## Out of Scope (For Now)

These features are intentionally deferred. They may become relevant later but are not part of the current build plan.

| Feature | Why It's Deferred |
|---------|------------------|
| WhatsApp channel | Meta restricting third-party AI in 2026. Revisit when compliance is clear |
| Agent marketplace | Needs volume before a marketplace makes sense |
| Public API / MCP server | Developer distribution channel — different audience, later |
| Advanced analytics / A/B testing | Users need clients first |
| Team workspaces / multi-user | Solo builders are the primary audience |
| Email channel | Lower impact than voice/SMS/widget for local businesses |
| Instagram content auto-generation | Manual screenshots work for launch |
| Build replay animations | Cool but not core — add after launch |
| Agent-to-agent communication | Research/experimental — not needed for MVP |
| Research/RAG validation engines | Marked as FUTURE in existing codebase |
| Compliance review engine | Needed for regulated industries, not MVP |

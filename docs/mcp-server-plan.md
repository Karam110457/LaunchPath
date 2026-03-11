# LaunchPath MCP Server + Skills 2.0 — Complete Plan

## Overview

Build an MCP server and Claude Code skills plugin that lets users create, deploy, and manage AI agents as a business — entirely from the terminal. This positions LaunchPath at the intersection of the three hottest trends: Claude Code ($2.5B run-rate), AI agents, and the AI agency business model ($5K-$50K/month).

**No MCP server exists for managing an AI agent platform. This lane is completely empty.**

---

## Why This Matters

### Market Data
- Claude Code: estimated **$2.5B run-rate** by early 2026
- Called **"the most in-demand AI skill in 2026"**
- Top Claude Code viral demo: **853K views** on YouTube
- Non-technical creator (Sabrina Ramonov) grew **500K+ followers in 6 months** with Claude Code content
- **18,320 MCP servers** exist — none for AI agent deployment/management
- AI automation agencies earn **$5K-$50K/month**; per-client retainers average **~$3,200/month**
- One developer: **$15K/month from just 6 chatbot clients**

### Why OpenClaw Went Viral (247K GitHub Stars in 5 weeks)
1. Crossed the threshold from AI that talks to AI that **acts**
2. Created a self-reinforcing viral loop (Moltbook — AI-only social network)
3. Celebrity endorsements (Karpathy, Musk)
4. Open source + free — no subscription
5. 3,016-skill marketplace enabled community extensibility

**Pattern: awe comes from AI doing something you didn't think it could do yet, in a way that's visible and shareable.**

### The LaunchPath Awe Moment
> "I built and deployed an AI business from my terminal in 3 minutes."

User types `/deploy-agent "dental practice support bot for brightsmiledental.com"` → Claude Code creates the agent, scrapes the website, builds the knowledge base, deploys a widget, and returns the embed code. One command. Done.

---

## Architecture

### Two Layers

| Layer | What It Does | How |
|-------|-------------|-----|
| **MCP Server** | Gives Claude Code **access** to LaunchPath (the tools) | HTTP calls to LaunchPath API |
| **Skills** | Teaches Claude Code **how** to use LaunchPath (the intelligence) | Markdown workflow definitions |

- MCP provides the hands (API access)
- Skills provide the brain (best practices, workflows, sequencing)
- Both ship as a single Claude Code plugin

### Why This Order Matters for the Platform

The MCP server forces creation of a clean tool API. The in-platform AI agent builder (future) reuses **the exact same tool definitions** — just called server-side instead of over HTTP. One tool layer, two interfaces (terminal + dashboard).

---

## Prerequisites (Build Before MCP Server)

### 1. API Key Authentication
**Current state:** All API routes use Supabase session cookies.
**Needed:** Personal API keys for programmatic access.

- New table: `user_api_keys` (id, user_id, key_hash, key_prefix, name, created_at, last_used_at, revoked_at)
- Key format: `lp_key_` + 48 hex chars
- Store hashed (SHA-256), display prefix only after creation
- Middleware check: accept either Supabase session OR `Authorization: Bearer lp_key_xxx`
- Dashboard UI: Settings page → "API Keys" section (generate, name, revoke)
- Rate limit: per-key, configurable

### 2. Missing API Endpoint: List Agents
**Current state:** Agent list fetched via `getSidebarData()` (server-side only, not an API route).
**Needed:** `GET /api/agents`

```
GET /api/agents
Auth: requireAuth (session or API key)
Response: {
  agents: [{
    id, name, description, status, model,
    template_id, tool_count, knowledge_doc_count,
    channel_count, created_at, updated_at
  }]
}
```

### 3. Embed Code Helper
**Current state:** Channel creation returns channel object but not a formatted embed snippet.
**Needed:** Include `embed_code` string in channel creation/get responses.

---

## MCP Server — v1 Tools (~15 tools)

### Package Structure
```
@launchpath/mcp-server
├── src/
│   ├── index.ts           — Entry point, MCP server setup
│   ├── server.ts          — Streamable HTTP transport config
│   ├── auth.ts            — API key handling
│   ├── client.ts          — HTTP client wrapper for LaunchPath API
│   └── tools/
│       ├── guide.ts       — The guide tool (most important)
│       ├── agents.ts      — Agent CRUD + generation
│       ├── knowledge.ts   — Knowledge base operations
│       ├── channels.ts    — Deployment management
│       ├── clients.ts     — Client management
│       ├── campaigns.ts   — Campaign management
│       └── chat.ts        — Test chat + conversations
├── package.json
├── tsconfig.json
└── README.md
```

### Tool Definitions

#### The Guide Tool (Most Important)
```
guide()
```
Returns comprehensive documentation on how to use every LaunchPath MCP tool, common workflows, best practices, and troubleshooting. This is what makes Claude Code an expert on the platform — the user doesn't need to read docs.

Content includes:
- What LaunchPath is and what it can do
- Typical workflow: create agent → add knowledge → configure tools → deploy → manage clients
- All available tools with usage examples
- Common patterns by use case (dental clinic, real estate, coaching, etc.)
- Template recommendations
- Troubleshooting tips

#### Agent Management
| Tool | Maps To | Description |
|------|---------|-------------|
| `list_agents` | GET `/api/agents` | List all agents with status, tool count, channel count |
| `get_agent` | GET `/api/agents/[id]` | Read full agent config, system prompt, personality |
| `create_agent` | POST `/api/agents/create-blank` | Create a new blank agent |
| `create_agent_from_prompt` | POST `/api/agents/generate` | AI-generate an agent from a natural language description |
| `update_agent` | PATCH `/api/agents/[id]` | Change name, prompt, model, tone, greeting, status |
| `delete_agent` | DELETE `/api/agents/[id]` | Remove an agent |

#### Knowledge Base
| Tool | Maps To | Description |
|------|---------|-------------|
| `list_knowledge` | GET `/api/agents/[id]/knowledge` | List all documents with processing status |
| `scrape_website` | POST `/api/agents/[id]/knowledge/scrape` | Scrape a URL and add to knowledge base |
| `add_faq` | POST `/api/agents/[id]/knowledge/faq` | Add a question-answer pair |
| `delete_knowledge` | DELETE `/api/agents/[id]/knowledge` | Remove a document |

#### Deployment
| Tool | Maps To | Description |
|------|---------|-------------|
| `list_channels` | GET `/api/agents/[id]/channels` | List deployment channels |
| `deploy_widget` | POST `/api/agents/[id]/channels` | Create a website widget deployment, return embed code |
| `update_channel` | PATCH `/api/agents/[id]/channels/[cid]` | Toggle enable/disable, change origins, rate limit |

#### Clients & Campaigns
| Tool | Maps To | Description |
|------|---------|-------------|
| `list_clients` | GET `/api/clients` | List all clients |
| `create_client` | POST `/api/clients` | Add a new client |
| `list_campaigns` | GET `/api/campaigns` | List all campaigns |
| `create_campaign` | POST `/api/campaigns` | Link an agent to a client as a campaign |

#### Chat & Testing
| Tool | Maps To | Description |
|------|---------|-------------|
| `chat_with_agent` | POST `/api/agents/[id]/chat` | Send a test message to an agent and get a response |
| `list_conversations` | GET `/api/agents/[id]/chat/conversations` | List conversation history |

### v2 Tools (Post-Launch)
- `clone_agent` — Duplicate an agent for another client
- `get_analytics` — Conversation metrics by period
- `add_tool` / `remove_tool` — Manage agent integrations
- `list_composio_apps` — Browse 900+ available integrations
- `invite_client_member` — Send portal access invite
- `upload_file` — Upload PDF/DOCX to knowledge base (base64)
- `get_embed_code` — Get formatted embed snippet for a channel
- `bulk_deploy` — Create agents for multiple clients in one call

---

## Skills 2.0 — v1 Skills (3-4 skills)

### Plugin Structure
```
launchpath-claude-plugin/
├── plugin.json              ← Plugin metadata + MCP server config
├── skills/
│   ├── deploy-agent/
│   │   └── SKILL.md         ← Flagship skill
│   ├── setup-client/
│   │   └── SKILL.md
│   ├── agent-report/
│   │   └── SKILL.md
│   └── launchpath-guide/
│       └── SKILL.md         ← Auto-invoked guide
└── README.md
```

### Skill 1: `/deploy-agent` (Flagship)
```yaml
---
name: deploy-agent
description: Create, train, and deploy an AI agent for a client's business. Scrapes their website, builds a knowledge base, and returns the embed code.
argument-hint: [business description or website URL]
allowed-tools: mcp__launchpath__*
context: fork
---

You are deploying an AI agent using LaunchPath. Follow this workflow:

1. Call `guide` to understand available tools and best practices.

2. Parse the user's input:
   - If they gave a website URL, you'll scrape it for knowledge
   - If they described a business, use that as context for agent generation
   - If both, use both

3. Create the agent:
   - If a website/description is provided, use `create_agent_from_prompt` with a detailed prompt
     combining the business context and desired agent behavior
   - Otherwise, use `create_agent` for a blank agent

4. Add knowledge:
   - If a website URL was provided, call `scrape_website` with the URL
   - Ask the user if they have FAQs to add. If yes, call `add_faq` for each one.

5. Deploy:
   - Call `deploy_widget` to create a website widget channel
   - Return the embed code to the user

6. Summarize what was created:
   - Agent name and what it does
   - Knowledge base contents (pages scraped, FAQs added)
   - Embed code ready to paste
   - Link to LaunchPath dashboard for further configuration

Always confirm the agent name and greeting message with the user before finalizing.
```

### Skill 2: `/setup-client`
```yaml
---
name: setup-client
description: Create a client account on LaunchPath, link an existing agent as a campaign, and generate deployment details.
argument-hint: [client name]
allowed-tools: mcp__launchpath__*
context: fork
---

You are setting up a new client on LaunchPath. Follow this workflow:

1. Ask the user for:
   - Client name (required)
   - Client email (optional)
   - Client website (optional)
   - Which agent to assign (show list from `list_agents`)

2. Create the client:
   - Call `create_client` with the provided details

3. Create the campaign:
   - Call `create_campaign` linking the chosen agent to the new client

4. Deploy:
   - Call `deploy_widget` on the agent with the campaign_id
   - Return the embed code

5. Ask if they want to invite the client to the portal:
   - If yes, note that they can do this from the LaunchPath dashboard
     (portal invite requires dashboard for now)

Summarize: client created, campaign linked, embed code ready.
```

### Skill 3: `/agent-report`
```yaml
---
name: agent-report
description: Pull a summary of all your LaunchPath agents — status, conversations, what needs attention.
allowed-tools: mcp__launchpath__*
context: fork
---

You are generating a report on the user's LaunchPath agents. Follow this workflow:

1. Call `list_agents` to get all agents
2. For each agent, call `list_channels` to see deployment status
3. For each agent, call `list_conversations` to see recent activity

4. Present a structured report:
   - Total agents (active vs draft)
   - Total deployed channels
   - Recent conversation activity per agent
   - Agents with no channels (not yet deployed)
   - Agents with no knowledge base (may need content)

5. Recommendations:
   - Flag any agents that are draft but have no recent edits
   - Flag any deployed agents with zero conversations (may need promotion)
   - Suggest next steps for incomplete agents

Keep the report concise and actionable.
```

### Skill 4: `/launchpath-guide` (Auto-Invoked)
```yaml
---
name: launchpath-guide
description: Internal guide for using LaunchPath MCP tools to manage AI agents, clients, and deployments.
user-invocable: false
---

# LaunchPath Platform Guide

LaunchPath is an AI agent deployment platform. You have access to it via MCP tools.

## What You Can Do
- Create AI agents from natural language descriptions
- Train agents with website content and FAQs
- Deploy agents as website chat widgets
- Manage clients and campaigns
- Test agents via chat
- Monitor conversations

## Common Workflows

### Build an agent for a new client
1. `create_agent_from_prompt` — describe what the agent should do
2. `scrape_website` — add the client's website as knowledge
3. `add_faq` — add common questions and answers
4. `create_client` — create the client account
5. `create_campaign` — link the agent to the client
6. `deploy_widget` — get the embed code

### Update an existing agent
1. `list_agents` — find the agent
2. `get_agent` — read current config
3. `update_agent` — change prompt, greeting, model, etc.
4. `chat_with_agent` — test the changes

### Check on your business
1. `list_agents` — see all agents and their status
2. `list_clients` — see all clients
3. `list_conversations` — check recent activity

## Tips
- Always scrape the client's website before going live — it dramatically improves agent quality
- Use `chat_with_agent` to test after every change
- Deploy as widget first — it's the fastest path to a working agent
- Create the client and campaign before deploying so conversations are properly tracked
```

---

## Installation & Distribution

### User Install (One Command)
```
/plugin install launchpath
```

This installs:
- The MCP server (auto-configured to connect to LaunchPath API)
- All 4 skills (available as `/deploy-agent`, `/setup-client`, `/agent-report`)
- The auto-invoked guide (Claude just knows LaunchPath)

### First-Time Setup
On first use, user is prompted for their LaunchPath API key:
- Sign up at launchpath.com
- Go to Settings → API Keys → Generate
- Paste key when prompted

### Alternative Manual Install
For users who prefer manual setup:

```bash
# Install MCP server
npx @launchpath/mcp-server --api-key lp_key_xxx

# Or add to Claude Code MCP config (.mcp.json)
{
  "mcpServers": {
    "launchpath": {
      "command": "npx",
      "args": ["@launchpath/mcp-server"],
      "env": { "LAUNCHPATH_API_KEY": "lp_key_xxx" }
    }
  }
}
```

### Marketplace Listing
Submit to:
- **Anthropic official marketplace** (`anthropics/skills`) — highest visibility
- **mcp.so** — 18,320 servers listed, major discovery channel
- **PulseMCP** — 8,590+ servers
- **GitHub** — open source repo for community contributions

---

## Monetization Strategy

### The MCP server and skills are FREE (marketing, not product)

LaunchPath (the platform) monetizes on usage:

| Tier | Price | What You Get |
|------|-------|-------------|
| **Free** | $0 | 1 agent, 100 conversations/month, 1 client |
| **Pro** | $49/mo | 10 agents, unlimited conversations, all tools, API access |
| **Agency** | $149/mo | Unlimited agents, client portal, white-label, priority support |
| **Scale** | $499/mo | Everything + dedicated support, custom integrations, SLA |

### Funnel
1. User discovers LaunchPath via Claude Code content (YouTube, skills marketplace)
2. Installs plugin for free → `/deploy-agent` creates first agent
3. Free tier: 1 agent, 100 conversations — enough for the demo
4. Hits limit → upgrades to Pro ($49/mo)
5. Gets more clients → upgrades to Agency ($149/mo)
6. Scales → upgrades to Scale ($499/mo)

### Revenue Potential
- 1,000 Pro users × $49 = **$49K/month**
- 200 Agency users × $149 = **$29.8K/month**
- 50 Scale users × $499 = **$24.9K/month**
- **Total: ~$103.7K/month** at moderate scale

---

## Content Strategy (Ship with Product)

### The Launch Video
Title: **"I Built an AI Agency from My Terminal in 3 Minutes"**

Script outline:
1. Show the problem: "Building AI agents for clients usually takes hours of clicking through dashboards"
2. Install the plugin: `/plugin install launchpath`
3. Deploy first agent: `/deploy-agent "dental practice support bot for brightsmiledental.com"`
4. Show Claude Code creating the agent, scraping the website, deploying the widget — all in terminal
5. Test the agent: ask it about teeth whitening pricing — it responds with accurate info
6. Set up the client: `/setup-client "Bright Smile Dental"`
7. Show the embed code: "Paste this on their website, charge $2,000/month"
8. Check the report: `/agent-report` — show analytics
9. Close: "That's a deployed AI business service, created from my terminal. The MCP server is free. LaunchPath handles the infrastructure."

### Follow-Up Content Ideas
- "How I Manage 10 AI Agent Clients from Claude Code"
- "Claude Code Skills That Actually Make Money (LaunchPath)"
- "Building a $10K/month AI Agency with One Terminal Command"
- "MCP Server Tutorial: Deploy AI Agents from Claude Code"
- "From Zero to First AI Client in 15 Minutes"

### Distribution Channels
- YouTube (primary — highest Claude Code attention)
- Twitter/X (dev community, Claude Code hashtag)
- Reddit (r/ClaudeAI, r/artificial, r/SaaS)
- Product Hunt (launch day)
- Hacker News (Show HN)
- Claude Code skills marketplace
- mcp.so listing

---

## Build Order & Timeline

### Phase 1: Foundation (Days 1-3)
- [ ] Add `user_api_keys` table (migration)
- [ ] Add API key generation UI in Settings page
- [ ] Add API key auth middleware (accept session OR Bearer token)
- [ ] Add `GET /api/agents` list endpoint
- [ ] Add embed code to channel creation/get responses

### Phase 2: MCP Server (Days 4-8)
- [ ] Set up `@launchpath/mcp-server` package (TypeScript, MCP SDK)
- [ ] Implement HTTP client wrapper (auth, error handling, retries)
- [ ] Implement guide tool (comprehensive platform documentation)
- [ ] Implement agent tools (list, get, create, create_from_prompt, update, delete)
- [ ] Implement knowledge tools (list, scrape, add_faq, delete)
- [ ] Implement channel tools (list, deploy_widget, update)
- [ ] Implement client tools (list, create)
- [ ] Implement campaign tools (list, create)
- [ ] Implement chat tool (chat_with_agent, list_conversations)
- [ ] Test end-to-end: install → create agent → scrape → deploy → test chat
- [ ] Publish to npm as `@launchpath/mcp-server`

### Phase 3: Skills + Plugin (Days 9-11)
- [ ] Create plugin repo (`launchpath/claude-plugin`)
- [ ] Write `/deploy-agent` skill (flagship)
- [ ] Write `/setup-client` skill
- [ ] Write `/agent-report` skill
- [ ] Write auto-invoked guide skill
- [ ] Create `plugin.json` with MCP server config
- [ ] Test full plugin install flow
- [ ] Submit to Anthropic skills marketplace
- [ ] List on mcp.so and PulseMCP

### Phase 4: Content & Launch (Days 12-14)
- [ ] Record launch video: "I Built an AI Agency from My Terminal in 3 Minutes"
- [ ] Write README with installation instructions + demo GIF
- [ ] Post to Product Hunt
- [ ] Post to Hacker News (Show HN)
- [ ] Tweet thread with demo video
- [ ] Reddit posts (r/ClaudeAI, r/artificial)

### Phase 5: Iterate (Post-Launch)
- [ ] Monitor installs, sign-ups, conversion to paid
- [ ] Add v2 tools based on user feedback (clone, analytics, bulk deploy, composio)
- [ ] Record follow-up content
- [ ] Build in-platform AI agent builder using same tool definitions

---

## Existing API Coverage

The LaunchPath API already has **60+ endpoints** covering all operations. The MCP server is a thin wrapper.

### Endpoints the MCP Server Uses (v1)

| MCP Tool | HTTP Method | Endpoint | Status |
|----------|-------------|----------|--------|
| `guide` | — | Static content | **NEW** |
| `list_agents` | GET | `/api/agents` | **NEW — needs route** |
| `get_agent` | GET | `/api/agents/[id]` | Exists |
| `create_agent` | POST | `/api/agents/create-blank` | Exists |
| `create_agent_from_prompt` | POST | `/api/agents/generate` | Exists (SSE — needs sync variant or polling) |
| `update_agent` | PATCH | `/api/agents/[id]` | Exists |
| `delete_agent` | DELETE | `/api/agents/[id]` | Exists |
| `list_knowledge` | GET | `/api/agents/[id]/knowledge` | Exists |
| `scrape_website` | POST | `/api/agents/[id]/knowledge/scrape` | Exists |
| `add_faq` | POST | `/api/agents/[id]/knowledge/faq` | Exists |
| `delete_knowledge` | DELETE | `/api/agents/[id]/knowledge` | Exists |
| `list_channels` | GET | `/api/agents/[id]/channels` | Exists |
| `deploy_widget` | POST | `/api/agents/[id]/channels` | Exists (needs embed_code in response) |
| `update_channel` | PATCH | `/api/agents/[id]/channels/[cid]` | Exists |
| `list_clients` | GET | `/api/clients` | Exists |
| `create_client` | POST | `/api/clients` | Exists |
| `list_campaigns` | GET | `/api/campaigns` | Exists |
| `create_campaign` | POST | `/api/campaigns` | Exists |
| `chat_with_agent` | POST | `/api/agents/[id]/chat` | Exists (SSE — needs sync variant or polling) |
| `list_conversations` | GET | `/api/agents/[id]/chat/conversations` | Exists |

**Summary: 18 of 20 tools map to existing endpoints. Only 2 need new routes (list agents + guide content).**

### SSE Endpoints Note
`create_agent_from_prompt` and `chat_with_agent` use SSE streaming. For MCP:
- Option A: Add sync variants (`?sync=true` query param) that return final result
- Option B: MCP tool consumes SSE stream and returns final result
- Option B is preferred — no API changes needed, MCP server handles streaming internally

---

## Competitive Positioning

### What Claude Code Users Get from LaunchPath (That They Can't Build Themselves)
1. **Multi-channel deployment** — widget embed, API channel, CORS management, rate limiting
2. **Client portal** — branded portal with conversation history, HITL takeover, analytics
3. **Knowledge base infrastructure** — chunking, embedding, RAG retrieval, 25MB file processing
4. **900+ tool integrations** — Composio marketplace (Google Calendar, Gmail, Slack, etc.)
5. **Conversation management** — history, human takeover, status tracking
6. **Multi-tenancy** — one platform manages agents for multiple clients
7. **Version control** — agent versioning with rollback

### The Moat
The MCP server is easy to copy — it's a thin wrapper. The platform behind it (deployment infra, client portal, HITL, analytics, 900+ integrations, knowledge processing) is NOT easy to copy. The MCP server gets attention; LaunchPath captures revenue.

---

## Success Metrics

### Week 1 Post-Launch
- [ ] 500+ MCP server installs
- [ ] 100+ LaunchPath sign-ups via MCP/skills funnel
- [ ] Launch video > 10K views
- [ ] Listed on mcp.so, PulseMCP, Anthropic marketplace

### Month 1
- [ ] 2,000+ MCP server installs
- [ ] 500+ LaunchPath accounts
- [ ] 50+ paid conversions (Pro tier)
- [ ] 3+ follow-up content pieces published

### Month 3
- [ ] 10,000+ MCP server installs
- [ ] 2,000+ LaunchPath accounts
- [ ] 200+ paid users
- [ ] $15K+ MRR from MCP/skills funnel

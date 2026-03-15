# LaunchPath MCP Server & Claude Plugin — Updated Final Spec

The definitive reference for building the LaunchPath MCP server and Claude Code plugin. Synthesizes production MCP server research (Supabase, GitHub, Slack, Figma, Linear), Anthropic's own benchmarks, platform capability audit, competitive landscape analysis, and Claude Code best practices.

**Use this file when building the MCP server and plugin to ensure we've got everything.**

---

## Table of Contents

1. [Performance Research — Can Claude Handle This?](#1-performance-research)
2. [Design Philosophy & Production Patterns](#2-design-philosophy)
3. [Architecture Decisions — What to Change](#3-architecture-decisions)
4. [Toolset Filtering](#4-toolset-filtering)
5. [Complete Tool Specification (37 Tools)](#5-complete-tool-specification)
6. [What Claude Handles Natively](#6-what-claude-handles-natively)
7. [Safety — Confirmation Gates & Annotations](#7-safety)
8. [Claude as Testing & Demo Engine](#8-claude-as-testing--demo-engine)
9. [Platform Capability Audit](#9-platform-capability-audit)
10. [Skills Integration (26 Skills)](#10-skills-integration)
11. [CLI Features (15 Features)](#11-cli-features)
12. [Competitive Landscape](#12-competitive-landscape)
13. [Market Validation & Is This Revolutionary?](#13-market-validation)
14. [Distribution — Plugin Format & Marketplaces](#14-distribution)
15. [Implementation Priority](#15-implementation-priority)
16. [Gaps to Close](#16-gaps-to-close)
17. [Final Verdict](#17-final-verdict)

---

## 1. Performance Research

### Claude's Accuracy by Tool Count (Hard Data)

| Tools Loaded | Accuracy | Source |
|---|---|---|
| **20 tools** | 95%+ (19/20 correct) | Practical benchmark |
| **30 tools** | Critical threshold — descriptions start overlapping | Jenova.ai, Speakeasy |
| **37 tools** (ours, unfiltered) | Amber zone — workable with good descriptions but risky | Extrapolated |
| **40 tools** | Cursor enforces this as a hard ceiling | Empirically derived |
| **50+ tools** | Measurable accuracy drop, cost increase | Jenova.ai |
| **100+ tools** | "Virtually guaranteed to fail at tool selection" | Multiple sources |

### Anthropic's Own Benchmark (Tool Search Tool Eval)

| Model | All Tools Loaded | With Deferred Loading | Improvement |
|---|---|---|---|
| Opus 4 | **49%** accuracy | **74%** accuracy | +25 pts |
| Opus 4.5 | **79.5%** accuracy | **88.1%** accuracy | +8.6 pts |

Token reduction: **77k → 8.7k** (89% reduction) when using deferred loading vs all tools.

### Context Window Impact of 37 Tools

Based on production data:
- GitHub MCP: 101 tools = 64.6k tokens (~640 tokens/tool)
- Average across servers: ~640-950 tokens per tool definition

**Our 37 tools = ~24,000-35,000 tokens** consumed by tool definitions alone.
- On 200k context window: **12-18%** consumed
- On 128k context window: **18-27%** consumed
- Combined with other MCP servers user may have: could hit 50-70k total

This is meaningful but not catastrophic. The bigger issue is **selection accuracy**, not context exhaustion.

### Why Our Design Works

**With toolset filtering: 20 default tools loaded** — well under the 30-tool danger zone.

When Claude loads additional toolsets on demand (e.g., WhatsApp), it temporarily pushes to 26-37, which is amber but workable because:
- Tools are domain-separated (WhatsApp tools won't be confused with knowledge tools)
- `verb_noun` naming creates clear differentiation
- Claude only loads extra toolsets when user intent is already clear (reducing selection ambiguity)

### Tool Description Quality > Tool Count

Key finding from Speakeasy: *"Optimizing your tool descriptions and names can have a bigger impact on quality than the underlying LLM models. A well-curated toolset with clear descriptions outperforms a comprehensive but poorly organized toolset, even with smaller models."*

Academic research (arXiv "LLM With Tools"): Tool selection accuracy depends on how well descriptions **differentiate** tools from one another. Overlapping descriptions degrade accuracy faster than raw tool count.

**Practical implication:** Description quality matters more than count up to ~30 tools. Beyond 30, even perfect descriptions can't fully compensate.

### Evidence That Toolset Filtering Works

| Source | Before | After | Improvement |
|---|---|---|---|
| Anthropic (Opus 4) | 49% accuracy | 74% accuracy | +25 pts |
| Anthropic (Opus 4.5) | 79.5% accuracy | 88.1% accuracy | +8.6 pts |
| Speakeasy dynamic toolsets | Full token load | 96% reduction in input tokens | 90% total token reduction |
| GitHub MCP | 101 default tools → user complaints | Curated default toolsets | Resolved selection degradation |
| RAG-MCP paper (arXiv:2505.03275) | 13.62% accuracy | 43.13% accuracy | 3x improvement |

**Verdict:** Dynamic loading/unloading demonstrably improves both accuracy and cost. The evidence is consistent across Anthropic's benchmarks, academic research, and real-world servers.

---

## 2. Design Philosophy

### Research Findings from Production MCP Servers

| Server | Tool Count | Pattern | Key Insight |
|---|---|---|---|
| **Supabase** | 29 tools | Granular `verb_noun` | Zero compound tools. Flat params. Every tool does one thing. |
| **GitHub** | 94 tools | Granular + **toolset filtering** | ~20 toolsets. 5 default. `--toolsets` flag + `X-MCP-Tools` header for cherry-picking. |
| **Slack** | 18 tools | Granular | Simple CRUD per resource. |
| **Figma** | ~15 tools | Granular, read-heavy | Separate tools for `get_design_context`, `get_screenshot`, `get_metadata`. |
| **Linear** | 22 tools | Granular | Separate `create_issue`, `update_issue`, `search_issues`. |
| **Playwright** | 28K stars | Granular | Most popular MCP server. Single-purpose tools for navigation, clicking, typing. |

### Universal Patterns (Zero Exceptions Across All Production Servers)

1. **Granular `verb_noun` naming** — `create_X`, `list_X`, `update_X`, `delete_X`
2. **Flat parameter schemas** — no nested objects, no compound params
3. **No compound tools** — nobody ships a `manage_campaign` that does 10 things based on an `action` param
4. **One tool, one responsibility** — read tools don't write, create tools don't update
5. **snake_case naming** — over 90% of tools use snake_case, ~95% are multi-word
6. **Descriptive, unambiguous parameters** — play to the model's strengths

### Why Granular > Compound

Compound tools (e.g., `manage_campaign(action: "update", ...)`) fail for LLMs because:
- The model must memorize which params apply to which action
- Error messages are ambiguous ("invalid params" — for which action?)
- Tool descriptions become walls of text
- Toolset filtering can't exclude individual actions within a compound tool

Granular tools succeed because:
- Each tool has a focused, clear description
- Parameter validation is exact
- Claude matches intent → tool name directly
- Toolset filtering works at the correct granularity

---

## 3. Architecture Decisions

### What We're Doing Right (Validated by Research)

| Decision | Validation Source |
|---|---|
| Granular `verb_noun` naming | Universal across all production servers |
| Flat parameter schemas | Confirmed best practice — nested objects cause parsing errors (Philipp Schmid, Anthropic docs) |
| Toolset filtering (5 default, rest on-demand) | GitHub pattern validated by Anthropic's own benchmarks (+25 pts accuracy) |
| 20 default tools (under 30 threshold) | Under the critical accuracy threshold from Jenova.ai and Speakeasy |
| Skills bundled with MCP server | No competitor does this. Unique differentiator. |

### What We Need to Change (From Research)

#### Change 1: Replace `guide()` Tool with Server Instructions

The MCP spec now has a protocol-level mechanism: **Server Instructions** — injected into Claude's system prompt during server initialization.

**Why switch:**
- GitHub's MCP saw **25% improvement in workflow adherence** after adopting Server Instructions (some models: 60% improvement)
- Information available immediately — no tool call needed
- Saves one tool slot in the count
- Supported by Claude Code, VS Code, Goose

**What goes in Server Instructions:**
- Cross-tool relationships ("Always call `list_agents` before `update_agent` if you don't have the agent_id")
- Performance tips ("Use `discover_pages` before `scrape_website` for full-site coverage")
- Constraints ("Rate limit: 60 requests/minute across all tools")
- Toolset guidance ("Load the `whatsapp` toolset when the user mentions WhatsApp campaigns")

**What does NOT go in instructions:** Duplicate tool descriptions (those belong in tool schemas), marketing claims, lengthy manuals.

**Fallback:** Keep a `guide()` tool as a fallback for MCP clients that don't support Server Instructions — but make it lightweight.

#### Change 2: Replace `confirm: true` Params with Tool Annotations

The MCP spec now has standardized mechanisms:

**Tool Annotations:**
```json
{
  "name": "delete_agent",
  "description": "Permanently delete an agent and all associated data.",
  "annotations": {
    "destructive": true,
    "requiresConfirmation": true
  }
}
```

Claude Code automatically prompts the user for confirmation when it sees `requiresConfirmation: true`. No custom `confirm` parameter needed.

**Elicitation Protocol** (newer, for complex confirmations):
1. Tool detects a destructive action
2. Tool calls `elicitation.sendRequest()` with a message and JSON Schema for confirmation fields
3. Client presents confirmation UI to the user
4. Client returns `{ action: "accept" | "decline" | "cancel" }`
5. Tool proceeds or aborts

**Verdict:** Use tool annotations for simple confirm/deny. Use Elicitation for complex confirmations (e.g., "Send broadcast to 500 contacts? Type 'SEND' to confirm"). Remove custom `confirm: true` parameters.

#### Change 3: Add Progress Tokens for Long-Running Tools

`scrape_website`, `create_agent_from_prompt`, and `send_wa_broadcast` can take 10-30+ seconds. The MCP spec has built-in progress notifications:

```
Client includes progressToken in request metadata
  → Server sends notifications/progress { progress: 3, total: 15, progressToken: "abc" }
  → Server sends notifications/progress { progress: 7, total: 15, progressToken: "abc" }
  → Server returns final result
```

For truly long-running operations, the spec has **Tasks** (async state machine): supports status tracking, progress updates, results, and cancellation across multiple requests.

**Apply to:** `scrape_website`, `create_agent_from_prompt`, `discover_pages`, `send_wa_broadcast`, `import_wa_contacts`

#### Change 4: Flatten `widget_config` in `update_channel`

Instead of one nested `widget_config` object with 10 fields, flatten to top-level params:

**Before (bad):**
```
update_channel(channel_id, widget_config: { primaryColor, welcomeMessage, conversationStarters, theme, ... })
```

**After (good):**
```
update_channel(channel_id, is_enabled?, allowed_origins?, rate_limit_rpm?)
set_widget_appearance(channel_id, primary_color?, theme?, border_radius?, show_branding?)
set_widget_content(channel_id, agent_name?, welcome_message?, greeting_message?, conversation_starters?)
```

This splits one 10+ param tool into focused tools. Each has clear intent and fewer params for Claude to reason about.

#### Change 5: Use Streamable HTTP Transport

| Transport | Use Case |
|---|---|
| **stdio** | Local-only tools (file system access, dev tools) |
| **Streamable HTTP** | Production SaaS, multi-tenant, remote servers |
| **SSE** | **Deprecated** — replaced by Streamable HTTP |

LaunchPath is a multi-tenant SaaS. **Streamable HTTP is the correct transport.** This also enables:
- Multi-user support (not 1:1 process)
- Centralized updates (no per-client reinstall)
- Full HTTP auth stack (API keys, OAuth)
- Web-based and remote clients

#### Change 6: Rate Limiting (Mandatory Per Spec)

The MCP spec says servers **"MUST rate limit tool invocations."** A single agent retry loop can generate 1,000+ API calls/minute.

**Implementation:** Token bucket per API key. In-memory Map for single-server (fine for v1). Redis for multi-server (v2).

**Error response:** `"Rate limit exceeded. 60 requests/minute per API key. Retry in 12 seconds."` — actionable text the LLM can reason about.

#### Change 7: Error Messages as Self-Correction Hints

Production MCP servers return errors like:
- `"Agent not found. Use list_agents to find available agent IDs."` (not `"404 Not Found"`)
- `"Campaign requires an agent_id. Call list_agents first."` (not `"Missing required field"`)
- `"Template not approved by Meta yet. Status: PENDING. Check back in 1-24 hours."` (not `"Cannot send"`)

The LLM uses error text to self-correct. Every tool error should tell Claude **what happened, why, and what to try next.**

#### Change 8: Tool Use Examples for Complex Tools

Anthropic recommends **1-5 examples per tool** for tools with many optional parameters or domain-specific conventions. Worth the token cost for:

- `deploy_channel` — different param combos for widget vs WhatsApp vs voice
- `create_wa_sequence` — step configuration is nuanced
- `add_agent_tool` — config object varies by tool_type
- `update_agent` — showing system_prompt update patterns

---

## 4. Toolset Filtering

### How It Works (GitHub Pattern)

1. Server registers all 37 tools but only **enables** default toolsets on connection
2. A special `enable_toolset` tool lets Claude load additional toolsets on demand
3. **Server Instructions** list all available toolsets and when to enable them
4. Skills pre-specify which toolsets they need via `allowed-tools`

### Toolset Definitions

| Toolset | Tools | Default? | When Loaded |
|---|---|---|---|
| **core** | `list_agents`, `get_agent`, `chat_with_agent` | Yes | Always — orientation + testing |
| **agent-management** | `create_agent`, `create_agent_from_prompt`, `update_agent`, `delete_agent` | Yes | Always — core CRUD |
| **knowledge** | `list_knowledge`, `scrape_website`, `discover_pages`, `add_faq`, `delete_knowledge` | Yes | Always — training is core flow |
| **deployment** | `list_channels`, `deploy_channel`, `update_channel`, `set_widget_appearance`, `set_widget_content`, `get_embed_code` | Yes | Always — deployment is core flow |
| **clients** | `list_clients`, `create_client`, `update_client`, `get_client` | Yes | Always — client management |
| **campaigns** | `list_campaigns`, `create_campaign`, `update_campaign`, `get_campaign` | No | When managing client campaigns |
| **whatsapp** | `list_wa_templates`, `create_wa_template`, `send_wa_broadcast`, `list_wa_contacts`, `import_wa_contacts`, `create_wa_sequence` | No | When working with WhatsApp campaigns |
| **analytics** | `get_agent_analytics`, `list_conversations`, `get_conversation` | No | When reviewing performance |
| **tools-config** | `list_agent_tools`, `add_agent_tool`, `remove_agent_tool`, `test_agent_tool` | No | When wiring integrations |
| **portal** | `invite_client_member`, `get_portal_settings`, `update_portal_branding` | No | When setting up client portal |
| **versions** | `list_agent_versions`, `diff_agent_versions`, `rollback_agent` | No | When doing version control |

### Default Load: 5 Toolsets (~22 tools)

On connection, Claude sees: **core** + **agent-management** + **knowledge** + **deployment** + **clients** + `enable_toolset` = ~22 tools.

This covers 90% of initial workflows. When a user says "set up a WhatsApp campaign," Claude calls `enable_toolset("whatsapp")` to load the 6 WhatsApp-specific tools.

---

## 5. Complete Tool Specification

### Meta Tools

#### `enable_toolset`
Load additional tool groups on demand.

**Parameters:**
- `toolset` (string, required) — toolset name from the list above

**Returns:** Confirmation + list of newly available tools

---

### Core Toolset (default)

#### `list_agents`
List all agents with status, model, tool count, channel count, and knowledge doc count.

**Maps to:** `GET /api/agents`
**Parameters:**
- `status` (string, optional) — filter: `"active"` | `"draft"` | `"archived"`

#### `get_agent`
Read full agent configuration: system prompt, personality, model, greeting, tool guidelines, status.

**Maps to:** `GET /api/agents/[agentId]`
**Parameters:**
- `agent_id` (string, required)

#### `chat_with_agent`
Send a message to an agent and get a response. Supports multi-turn via conversation ID. This is the tool that powers Claude-as-QA-tester.

**Maps to:** `POST /api/agents/[agentId]/chat`
**Parameters:**
- `agent_id` (string, required)
- `message` (string, required)
- `conversation_id` (string, optional) — for multi-turn conversations

**Returns:** Agent response text, tool calls made, conversation ID for follow-up

---

### Agent Management Toolset (default)

#### `create_agent`
Create a new blank agent.

**Maps to:** `POST /api/agents/create-blank`
**Parameters:**
- `name` (string, required)
- `description` (string, optional)

#### `create_agent_from_prompt`
AI-generate an agent from a natural language description. Creates the agent with an optimized system prompt, personality, greeting, and suggested tools.

**Maps to:** `POST /api/agents/generate`
**Parameters:**
- `prompt` (string, required) — natural language description
- `name` (string, optional) — override generated name

**Returns:** Created agent with full config
**Progress:** Uses progress tokens (generation takes 10-30s)

#### `update_agent`
Update any agent configuration field.

**Maps to:** `PATCH /api/agents/[agentId]`
**Parameters:**
- `agent_id` (string, required)
- `name` (string, optional)
- `description` (string, optional)
- `system_prompt` (string, optional)
- `personality` (string, optional)
- `model` (string, optional)
- `greeting` (string, optional)
- `tool_guidelines` (string, optional)
- `status` (string, optional) — `"active"` | `"draft"` | `"archived"`

#### `delete_agent`
Permanently delete an agent and all associated data.

**Maps to:** `DELETE /api/agents/[agentId]`
**Parameters:**
- `agent_id` (string, required)

**Annotations:** `{ destructive: true, requiresConfirmation: true }`

---

### Knowledge Toolset (default)

#### `list_knowledge`
List all knowledge base documents for an agent with processing status.

**Maps to:** `GET /api/agents/[agentId]/knowledge`
**Parameters:**
- `agent_id` (string, required)

#### `scrape_website`
Scrape a URL and add the content to an agent's knowledge base.

**Maps to:** `POST /api/agents/[agentId]/knowledge/scrape`
**Parameters:**
- `agent_id` (string, required)
- `url` (string, required)

**Progress:** Uses progress tokens (scraping takes 5-30s)

#### `discover_pages`
Discover all same-domain links from a URL (up to 50). Used to plan a full-site scrape.

**Maps to:** `POST /api/agents/[agentId]/knowledge/discover`
**Parameters:**
- `agent_id` (string, required)
- `url` (string, required)

**Returns:** List of discovered URLs with page titles

#### `add_faq`
Add a question-answer pair to the knowledge base.

**Maps to:** `POST /api/agents/[agentId]/knowledge/faq`
**Parameters:**
- `agent_id` (string, required)
- `question` (string, required)
- `answer` (string, required)

#### `delete_knowledge`
Remove a document from the knowledge base.

**Maps to:** `DELETE /api/agents/[agentId]/knowledge`
**Parameters:**
- `agent_id` (string, required)
- `document_id` (string, required)

**Annotations:** `{ destructive: true, requiresConfirmation: true }`

---

### Deployment Toolset (default)

#### `list_channels`
List all deployment channels for an agent.

**Maps to:** `GET /api/agents/[agentId]/channels`
**Parameters:**
- `agent_id` (string, required)

#### `deploy_channel`
Deploy an agent to a channel. Returns embed code, phone number, or API token depending on type.

**Maps to:** `POST /api/agents/[agentId]/channels`
**Parameters:**
- `agent_id` (string, required)
- `channel_type` (string, required) — `"widget"` | `"api"` | `"whatsapp"` | `"sms"` | `"voice"`
- `name` (string, optional)
- `allowed_origins` (string[], optional) — for widget CORS
- `rate_limit_rpm` (number, optional)
- `campaign_id` (string, optional) — link to a campaign

**Returns:** Channel object with embed code / phone number / API token
**Examples:** Include 1-2 examples showing widget vs WhatsApp param combos

#### `update_channel`
Toggle enable/disable, change origins, rate limit.

**Maps to:** `PATCH /api/agents/[agentId]/channels/[channelId]`
**Parameters:**
- `agent_id` (string, required)
- `channel_id` (string, required)
- `is_enabled` (boolean, optional)
- `allowed_origins` (string[], optional)
- `rate_limit_rpm` (number, optional)

#### `set_widget_appearance`
Configure the visual appearance of a widget channel.

**Maps to:** `PATCH /api/agents/[agentId]/channels/[channelId]` (widget_config subset)
**Parameters:**
- `channel_id` (string, required)
- `primary_color` (string, optional) — hex color
- `theme` (string, optional) — `"light"` | `"dark"`
- `border_radius` (string, optional) — `"rounded"` | `"square"`
- `show_branding` (boolean, optional)
- `position` (string, optional) — `"right"` | `"left"`
- `widget_size` (string, optional) — `"default"` | `"compact"` | `"large"`

#### `set_widget_content`
Configure the text content and conversation starters of a widget.

**Maps to:** `PATCH /api/agents/[agentId]/channels/[channelId]` (widget_config subset)
**Parameters:**
- `channel_id` (string, required)
- `agent_name` (string, optional) — display name in widget
- `welcome_message` (string, optional)
- `greeting_message` (string, optional) — bubble text
- `conversation_starters` (string[], optional) — up to 4 clickable starter messages

#### `get_embed_code`
Get a formatted, ready-to-paste embed snippet for a channel.

**Maps to:** `GET /api/agents/[agentId]/channels/[channelId]/embed`
**Parameters:**
- `agent_id` (string, required)
- `channel_id` (string, required)
- `platform` (string, optional) — `"html"` | `"react"` | `"wordpress"` | `"shopify"` — formats the snippet accordingly

---

### Clients Toolset (default)

#### `list_clients`
**Maps to:** `GET /api/clients`
**Parameters:** None

#### `get_client`
**Maps to:** `GET /api/clients/[clientId]`
**Parameters:** `client_id` (string, required)

#### `create_client`
**Maps to:** `POST /api/clients`
**Parameters:** `name` (required), `email`, `website`, `logo_url` (all optional)

#### `update_client`
**Maps to:** `PATCH /api/clients/[clientId]`
**Parameters:** `client_id` (required), `name`, `email`, `website` (all optional)

---

### Campaigns Toolset (on-demand)

#### `list_campaigns`
**Maps to:** `GET /api/campaigns`
**Parameters:** `client_id` (optional filter)

#### `get_campaign`
**Maps to:** `GET /api/campaigns/[campaignId]`
**Parameters:** `campaign_id` (required)

#### `create_campaign`
**Maps to:** `POST /api/campaigns`
**Parameters:** `agent_id` (required), `client_id` (required), `name` (required), `channel_type` (optional, default `"widget"`)

#### `update_campaign`
**Maps to:** `PATCH /api/campaigns/[campaignId]`
**Parameters:** `campaign_id` (required), `name`, `status` (optional)

---

### WhatsApp Toolset (on-demand)

#### `list_wa_templates`
List WhatsApp message templates for a campaign (synced from Meta).
**Maps to:** `GET /api/campaigns/[campaignId]/whatsapp/templates`
**Parameters:** `campaign_id` (required)

#### `create_wa_template`
Create and submit a WhatsApp message template for Meta approval.
**Maps to:** `POST /api/campaigns/[campaignId]/whatsapp/templates`
**Parameters:** `campaign_id`, `name`, `language`, `category` (required), `header`, `body` (required), `footer`, `buttons` (optional)

#### `send_wa_broadcast`
Send a template message to contacts. **This sends real messages to real people.**
**Maps to:** `POST /api/campaigns/[campaignId]/whatsapp/send`
**Parameters:** `campaign_id`, `template_id`, `recipients` (required), `variables` (optional)
**Annotations:** `{ destructive: false, requiresConfirmation: true }` — outbound messaging gate

#### `list_wa_contacts`
**Maps to:** `GET /api/campaigns/[campaignId]/contacts`
**Parameters:** `campaign_id` (required), `status`, `tag` (optional)

#### `import_wa_contacts`
**Maps to:** `POST /api/campaigns/[campaignId]/contacts/ingest`
**Parameters:** `campaign_id` (required), `contacts` (required array of `{ phone, name?, email?, tags? }`)
**Progress:** Uses progress tokens for large imports

#### `create_wa_sequence`
Create a drip campaign (follow-up sequence) with timed template sends.
**Maps to:** `POST /api/campaigns/[campaignId]/sequences`
**Parameters:** `campaign_id`, `name`, `steps` (required), `auto_enroll`, `stop_on_reply` (optional)
**Examples:** Include 1-2 examples showing step configuration

---

### Analytics Toolset (on-demand)

#### `get_agent_analytics`
**Maps to:** `GET /api/agents/[agentId]/analytics`
**Parameters:** `agent_id` or `campaign_id` (optional), `period` (optional, default `"7d"`)
**Returns:** Volume, status distribution, human takeover count, busiest hours, messages/conversation avg

#### `list_conversations`
**Maps to:** `GET /api/agents/[agentId]/chat/conversations`
**Parameters:** `agent_id` or `campaign_id`, `status`, `limit` (all optional)

#### `get_conversation`
**Maps to:** `GET /api/portal/conversations/[id]/messages`
**Parameters:** `conversation_id` (required)

---

### Tools Config Toolset (on-demand)

#### `list_agent_tools`
**Maps to:** `GET /api/agents/[agentId]/tools`
**Parameters:** `agent_id` (required)

#### `add_agent_tool`
**Maps to:** `POST /api/agents/[agentId]/tools`
**Parameters:** `agent_id`, `tool_type` (`"webhook"` | `"http"` | `"composio"` | `"subagent"`), `display_name`, `description`, `config` (all required)
**Examples:** Include examples for each tool_type showing config format

#### `remove_agent_tool`
**Maps to:** `DELETE /api/agents/[agentId]/tools/[toolId]`
**Parameters:** `agent_id`, `tool_id` (required)
**Annotations:** `{ destructive: true, requiresConfirmation: true }`

#### `test_agent_tool`
**Maps to:** `POST /api/agents/[agentId]/tools/test`
**Parameters:** `agent_id`, `tool_id` (required), `test_input` (optional)

---

### Portal Toolset (on-demand)

#### `invite_client_member`
**Maps to:** `POST /api/clients/[clientId]/members`
**Parameters:** `client_id`, `email` (required), `role` (optional, default `"viewer"`)

#### `get_portal_settings`
**Maps to:** `GET /api/portal/settings`
**Parameters:** `client_id` (required)

#### `update_portal_branding`
**Maps to:** `PATCH /api/clients/[clientId]/branding`
**Parameters:** `client_id` (required), `primary_color`, `accent_color`, `logo_url`, `company_name` (optional)

---

### Versions Toolset (on-demand)

#### `list_agent_versions`
**Maps to:** `GET /api/agents/[agentId]/versions`
**Parameters:** `agent_id` (required)

#### `diff_agent_versions`
Compare two versions side-by-side.
**Maps to:** Computed from two version GETs
**Parameters:** `agent_id`, `version_a`, `version_b` (all required)

#### `rollback_agent`
Restore to a previous version. Creates a new version (non-destructive).
**Maps to:** `POST /api/agents/[agentId]/versions/[versionNumber]/rollback`
**Parameters:** `agent_id`, `version_number` (required)
**Annotations:** `{ destructive: false, requiresConfirmation: true }`

---

## 6. What Claude Handles Natively

These don't need MCP tools — Claude's native intelligence handles them:

| Capability | Why No Tool Needed | Used In Skills |
|---|---|---|
| **Web scraping & analysis** | Claude Code can fetch and analyze any website | `/competitor-agent`, `/pitch-agent`, `/niche-research`, `/brand-widget` |
| **FAQ generation** | Claude reasons about content and generates Q&A pairs | `/deep-scrape`, `/niche-research`, `/deploy-agent` |
| **System prompt writing** | Claude is an expert prompt engineer | `/craft-prompt`, `/deploy-agent` |
| **Report/proposal generation** | Claude formats professional markdown | `/client-handoff`, `/agent-report`, `/morning-briefing`, `/proposal-generator` |
| **HTML page generation** | Claude writes self-contained HTML files | `/build-demo`, `/embed-guide` |
| **Conversation pattern analysis** | Claude reads history and identifies patterns | `/conversation-insights`, `/heal-agent` |
| **Competitive analysis** | Claude analyzes websites and generates strategy | `/competitor-agent` |
| **Code generation** | Claude writes embed snippets, scripts | `/build-demo`, `/embed-guide` |

**Key insight:** Skills like `/craft-prompt`, `/proposal-generator`, and `/conversation-insights` are **90% Claude's native reasoning + 10% MCP tool calls** (to read/write agent data). The MCP server provides **data access**; Claude provides **intelligence**.

---

## 7. Safety

### Tool Annotations (MCP Spec Standard)

Replace custom `confirm: true` params with spec-standard annotations:

| Tool | Annotations | Why |
|---|---|---|
| `delete_agent` | `{ destructive: true, requiresConfirmation: true }` | Permanently removes agent + all data |
| `delete_knowledge` | `{ destructive: true, requiresConfirmation: true }` | Removes training data |
| `remove_agent_tool` | `{ destructive: true, requiresConfirmation: true }` | Disconnects an integration |
| `rollback_agent` | `{ destructive: false, requiresConfirmation: true }` | Non-destructive but significant |
| `send_wa_broadcast` | `{ destructive: false, requiresConfirmation: true }` | Sends real messages to real people |

### Read-Only Tools (no gate)
All `list_*`, `get_*`, `chat_with_agent`, `enable_toolset` — safe to call freely.

### Create/Update Tools (no gate, reversible)
`create_agent`, `update_agent`, `deploy_channel`, etc. — create or modify data but easily reversible.

### Error Response Format
Always return actionable text the LLM can use to self-correct:
```json
{
  "content": [{ "type": "text", "text": "Agent not found. Use list_agents to find available agent IDs." }],
  "isError": true
}
```

---

## 8. Claude as Testing & Demo Engine

### Claude Tests Your Agents (Unique Capability)

The `chat_with_agent` tool enables something **no other platform can do**: Claude Code becomes the QA team.

**How it works:**
1. Claude reads agent config (`get_agent`) to understand what the agent should do
2. Claude generates realistic test scenarios based on the agent's purpose
3. Claude calls `chat_with_agent` 20+ times, playing different customer personas
4. Claude analyzes the responses and generates a quality report

**Powers 5 Skills:**
- `/test-agent` — 5-8 scenarios, 3-5 turns each, pass/fail report
- `/heal-agent` — finds failed conversations (human takeovers, dead ends), generates fixes, applies them
- `/agent-audit` — security-focused: prompt injection, data extraction, hallucination probes
- `/agent-benchmark` — run the same scenarios against two agents, pick the winner
- `/rescue-conversation` — forensic analysis of one specific failure, replay with the fix

**Tool side-effect warning:** If the agent has live tools (Calendly, email), testing WILL trigger them. Skills warn the user and offer to skip those scenarios.

**Cost:** ~$0.30-0.50 per test run (20 chat turns across 5 scenarios). A QA team for pocket change.

### Demo Pages Connected to WhatsApp Campaigns

The `/build-demo` skill creates live demo pages. Claude doesn't call a tool for this — it just writes HTML natively.

**Four demo types:**
1. **`landing-page`** — Professional single-page site with hero, features, embedded widget, auto-opens after 3s
2. **`standalone-widget`** — Minimal page, just the chat widget full-screen. Perfect for screen-share demos.
3. **`full-page`** — Entire page IS the chat experience. Looks like a native messaging app.
4. **`form-to-whatsapp`** — Lead capture form → `POST /api/channels/[agentId]/trigger` → WhatsApp conversation starts within seconds

**The `form-to-whatsapp` flow:**
1. Claude creates an HTML page with a lead capture form (name, email, phone, message)
2. Form submission hits the trigger endpoint
3. This initiates a WhatsApp conversation with the AI agent
4. The lead gets an automated WhatsApp message within seconds
5. The AI agent handles the full conversation on WhatsApp

**Why this is a killer sales tool:**
- "Fill out this form, and our AI will reach out on WhatsApp in 10 seconds"
- The prospect experiences the **entire customer journey** live
- The demo page is a **real working product**, not a mockup
- The demo IS the product

### Website Widgets Created by Claude

Claude calls `deploy_channel(channel_type: "widget")` to create a real channel, then writes the embed code into whatever page it's building. The widget connects to the actual agent with real knowledge base, real tools, real AI. Claude can also call `set_widget_appearance` and `set_widget_content` to brand it, or use the `/brand-widget` skill which auto-detects the client's brand from their website.

### Self-Serve Demo Flows

A prospect can experience the full product without signing up:
1. Widget demo → live chat with a real agent
2. Form-to-WhatsApp demo → form triggers AI WhatsApp conversation
3. Full-page chat → immersive experience
4. Landing page → professional page with embedded widget

Each connects to a real agent with real AI. **The demo IS the deployment.**

---

## 9. Platform Capability Audit

### API Route Coverage

The platform has **93+ API routes** across **16 domains:**

| Domain | Routes | MCP Tools | Coverage |
|---|---|---|---|
| Agents | 12 | 6 (core + management) | Full |
| Knowledge | 6 | 5 (knowledge toolset) | Full |
| Channels | 5 | 6 (deployment toolset, split widget config) | Full |
| Clients | 8 | 4 (clients toolset) | Full |
| Campaigns | 6 | 4 (campaigns toolset) | Full |
| WhatsApp | 12 | 6 (whatsapp toolset) | Key operations |
| Agent Tools | 5 | 4 (tools-config toolset) | Full |
| Portal | 8 | 3 (portal toolset) | Key operations |
| Chat/Conversations | 6 | 3 (analytics toolset) | Full |
| Versions | 3 | 3 (versions toolset) | Full |
| Analytics | 2 | 1 (analytics toolset) | Full |
| Composio | 4 | via `add_agent_tool` | Indirect |
| Auth/Settings | 6 | N/A (browser-only) | Out of scope |
| Webhooks | 4 | N/A (server-side) | Infrastructure |
| Widget | 3 | N/A (client-side) | Infrastructure |
| Systems/Workflows | 4 | N/A (internal) | Internal |

**Coverage: ~40 MCP tools cover ~80 of 93 routes.** The remaining ~13 are infrastructure that doesn't need MCP exposure.

### What's NOT on the MCP Server (and why)

| Feature | Why Excluded |
|---|---|
| Webhook handlers (`/api/webhooks/*`) | Server-side infrastructure — not user-callable |
| Widget runtime (`/api/widget/*`) | Client-side SDK — not relevant to MCP |
| Auth routes (`/api/auth/*`) | Browser OAuth flows — can't run in terminal |
| Internal workflows (`/api/systems/*`) | Mastra workflows — platform-internal |
| File uploads | Base64 over MCP is clunky — defer to dashboard (v2: add as tool) |
| Composio OAuth connections | Requires browser redirect — defer to dashboard |

---

## 10. Skills Integration

### 26 Skills Organized by Category

**Build (4):** `/deploy-agent`, `/craft-prompt`, `/deep-scrape`, `/wire-tools`
**Quality (5):** `/test-agent`, `/heal-agent`, `/agent-audit`, `/agent-benchmark`, `/rescue-conversation`
**Deploy (3):** `/brand-widget`, `/go-live`, `/embed-guide`
**Demo (2):** `/demo-showcase`, `/build-demo`
**Operations (4):** `/setup-client`, `/client-handoff`, `/agent-report`, `/morning-briefing`
**Sales (3):** `/competitor-agent`, `/pitch-agent`, `/proposal-generator`
**Scale (3):** `/bulk-deploy`, `/niche-research`, `/clone-for-client`
**Intelligence (1):** `/conversation-insights`
**System (1):** `/launchpath-guide` (auto-invoked, not user-callable)

### How Skills Use Tools

#### Build Skills
| Skill | MCP Tools Used |
|---|---|
| `/deploy-agent` | `create_agent_from_prompt`, `scrape_website`, `deploy_channel` |
| `/craft-prompt` | `get_agent`, `update_agent`, `chat_with_agent` |
| `/deep-scrape` | `get_agent`, `discover_pages`, `scrape_website` (×N), `add_faq` (×N) |
| `/wire-tools` | `get_agent`, `list_agent_tools`, `add_agent_tool`, `test_agent_tool`, `update_agent`, `chat_with_agent` |

#### Quality Skills
| Skill | MCP Tools Used |
|---|---|
| `/test-agent` | `get_agent`, `list_knowledge`, `list_agent_tools`, `chat_with_agent` (×20) |
| `/heal-agent` | `get_agent`, `list_knowledge`, `list_conversations`, `get_conversation`, `update_agent`, `add_faq` |
| `/agent-audit` | `get_agent`, `list_knowledge`, `list_agent_tools`, `chat_with_agent` (×20), `update_agent` |
| `/agent-benchmark` | `get_agent` (×2), `list_knowledge` (×2), `chat_with_agent` (×40) |
| `/rescue-conversation` | `list_conversations`, `get_conversation`, `get_agent`, `update_agent`, `add_faq`, `chat_with_agent` |

#### Deploy Skills
| Skill | MCP Tools Used |
|---|---|
| `/go-live` | `get_agent`, `list_knowledge`, `list_agent_tools`, `list_channels`, `chat_with_agent` (×3), `update_agent`, `deploy_channel` |
| `/brand-widget` | `scrape_website`, `set_widget_appearance`, `set_widget_content`, `deploy_channel` |
| `/embed-guide` | `list_channels`, `get_embed_code` |

#### Demo Skills
| Skill | MCP Tools Used |
|---|---|
| `/demo-showcase` | `get_agent`, `list_knowledge`, `list_agent_tools`, `chat_with_agent` (×12) |
| `/build-demo` | `list_agents`, `get_agent`, `list_channels`, `deploy_channel` + Claude native HTML generation |

#### Operations Skills
| Skill | MCP Tools Used |
|---|---|
| `/setup-client` | `list_agents`, `create_client`, `create_campaign`, `deploy_channel` |
| `/client-handoff` | `get_agent`, `list_knowledge`, `list_channels`, `list_conversations`, `list_agent_tools` |
| `/agent-report` | `list_agents`, `list_channels` (×N), `list_conversations` (×N) |
| `/morning-briefing` | `list_agents`, `list_clients`, `list_conversations` (×N) |

#### Sales Skills
| Skill | MCP Tools Used |
|---|---|
| `/pitch-agent` | `scrape_website`, `create_agent_from_prompt`, `add_faq` (×5), `deploy_channel`, `chat_with_agent` (×3) |
| `/competitor-agent` | `scrape_website`, `create_agent_from_prompt`, `add_faq` (×5), `deploy_channel` |
| `/proposal-generator` | `scrape_website` + Claude native document generation |

#### Scale Skills
| Skill | MCP Tools Used |
|---|---|
| `/bulk-deploy` | `create_client` (×N), `create_agent_from_prompt` (×N), `scrape_website` (×N), `create_campaign` (×N), `deploy_channel` (×N) |
| `/clone-for-client` | `list_agents`, `get_agent`, `list_knowledge`, `list_agent_tools`, `create_agent`, `update_agent`, `scrape_website`, `create_client`, `create_campaign`, `deploy_channel` |
| `/niche-research` | `create_agent_from_prompt`, `add_faq` (×10) + Claude native research |

#### Intelligence Skills
| Skill | MCP Tools Used |
|---|---|
| `/conversation-insights` | `get_agent`, `list_conversations`, `get_conversation` (×50) |

### The Complete Agent Lifecycle — All from Terminal

```
BUILD                    TEST                    DEMO                    DEPLOY
─────                    ────                    ────                    ──────
/deploy-agent       →    /test-agent        →    /demo-showcase     →   /go-live
/craft-prompt       →    /agent-audit       →    /build-demo        →   /brand-widget
/deep-scrape        →    /agent-benchmark   →    /pitch-agent       →   /embed-guide
/wire-tools         →    /rescue-conversation

                    OPERATE                 IMPROVE                 SCALE
                    ───────                 ───────                 ─────
                    /morning-briefing  →    /heal-agent        →   /bulk-deploy
                    /agent-report      →    /conversation-     →   /clone-for-client
                    /setup-client           insights               /niche-research
                    /client-handoff

                    SELL
                    ────
                    /pitch-agent
                    /competitor-agent
                    /proposal-generator
```

---

## 11. CLI Features

### v1 Features (Ship with MCP Server) — 10 Features

| # | Feature | What It Does | Effort |
|---|---|---|---|
| 1 | `preview` | Chat with agent in terminal (SSE streaming) | 1-2 days |
| 2 | `clone` | Export/import agent configs (share via gist/repo) | 3-4 days |
| 3 | `watch` | Hot-reload: edit local YAML → agent updates live | 1 day |
| 4 | `deploy` | One-command multi-channel deployment | 2-3 days |
| 5 | `replay` | Step through past conversations, branch at any turn | 2-3 days |
| 6 | `diff` / `rollback` | Version control with visual diffs | 2-3 days |
| 7 | `compose` | Wire multi-agent routing (subagent orchestration) | 2-3 days |
| 8 | `live` | `tail -f` for AI business — real-time conversation feed | 2-3 days |
| 9 | `handoff` | Generate client delivery report | 2-3 days |
| 10 | `/test-agent` | Autonomous QA — Claude tests your agent (skill, not code) | 0 days (markdown) |

### v1.5 Features (2-4 Weeks Post-Launch) — 4 Features

| # | Feature | What It Does | Effort |
|---|---|---|---|
| 11 | `metrics` | Terminal analytics dashboard | 1 week |
| 12 | `bench` | Automated scoring with tool verification | 1-2 weeks |
| 13 | `voice` | Test via real voice call (Vapi/LiveKit) | 1-2 days |
| 14 | `heal` | Self-improving agents from failure analysis | 3-4 days |

---

## 12. Competitive Landscape

### Who Else Has MCP Servers?

| Platform | MCP Status | What They Can Do | Threat Level |
|---|---|---|---|
| **n8n** | Full server + client | Expose workflows as MCP tools. 1,239 automation nodes. | **High** — closest competitor |
| **Zapier** | MCP endpoints | 30K+ actions exposed to AI agents | **Medium** — generic automation, not agent-specific |
| **Langflow** | Both client + server | Each flow auto-exposes as MCP tool | **Medium** — visual builder, not managed platform |
| **Voiceflow** | Community MCP server | Connect Claude to Voiceflow agents | **Low** — community-built, MCP client only officially |
| **Botpress** | Via Composio only | Indirect, not native | **Low** |
| **CrewAI** | MCP client only | Can consume MCP servers | **Low** — no outbound MCP |

### What Nobody Has Done

**A single MCP server that combines:** agent deployment + knowledge base + multi-channel (widget + WhatsApp + SMS + voice) + campaign management + client portal + analytics + 26 workflow skills — all from one Claude Code session.

The individual pieces exist separately. The **integrated experience** does not.

### Moat Analysis

| Layer | Defensibility | Time to Copy |
|---|---|---|
| MCP server (thin wrapper) | **Zero** | 1-2 weeks |
| Tool definitions | **Low** | Days |
| Skills (markdown) | **Medium** — content quality matters | 2-4 weeks basic, months for proven templates |
| Platform (RAG, HITL, portal, analytics) | **High** | 3-6 months |
| Vertical templates (dental, real estate) | **High** — domain expertise | Months |
| User data + client relationships | **Highest** | Can't be copied |

**The MCP server is the distribution channel, not the product.** The product is everything behind it.

### Window of Opportunity

**6-12 months** before n8n, Zapier, or a well-funded startup ships something equivalent. From Leonis Capital: *"Generic MCP connector startups are next in line for commoditization."*

Speed and quality of execution are everything.

---

## 13. Market Validation

### Is the Market Real?

| Data Point | Value | Source |
|---|---|---|
| Agentic AI market (2026) | **$9-11 billion** | Fortune Business Insights, Precedence Research |
| CAGR | **40-44%** to $139-199B by 2034 | Multiple |
| Agentic AI startup funding (H1 2025) | **$2.8 billion** | NewMarketPitch |
| Enterprise positive ROI | **88%** of early adopters | Google AI Business Trends Report |
| Claude Code annualized run-rate | **$2.5 billion** (Feb 2026) | DemandSage, external modeling |
| Claude Code growth | $1B (Nov 2025) → $2.5B (Feb 2026) | Multiple |
| Anthropic business customers | **300,000+**, 70% of Fortune 100 | Anthropic |
| MCP servers in ecosystem | **18,500+** | mcp.so |

### Are AI Agencies Real?

| Metric | Value |
|---|---|
| Documented case | $23K MRR with 14 clients at $800-$3,500/month |
| Typical project pricing | $5K-$15K per chatbot build |
| Retainer range | $2K-$25K/month |
| Realistic median (solo operator) | $8K-$15K/month |
| Gross margins | 70%+ achievable |

The space is real but getting crowded. Winners will have distribution advantages or vertical specialization.

### Is This Revolutionary?

**Honest answer: The technology isn't. The experience is.**

- It will **NOT** be a mass-consumer viral moment (audience too narrow — Claude Code users who want to run agencies)
- It **WILL** be a "Cursor-style" developer community moment — word-of-mouth, Twitter/X, YouTube
- Cursor hit **$200M revenue before a single enterprise sales rep** purely through developer word-of-mouth. That's the model.

**What's genuinely unique:**
1. **No other MCP server ships with workflow skills** — this is currently true across all 18,500+ servers
2. **Claude testing its own agents** via `chat_with_agent` — no other platform has an LLM that can reason about test cases AND execute them
3. **Form-to-WhatsApp demo flow** — Claude builds a page, connects it to WhatsApp, prospect experiences the product live
4. **"Entire agency from terminal" breadth** — build, test, deploy, monitor, heal, scale — unprecedented

**The differentiator is the bundle**, not any individual piece. Skills are a 3-6 month head start, not a permanent advantage. The lasting value is in the **quality** of the skills (do they produce results?) rather than their existence.

---

## 14. Distribution

### Ship as a Claude Code Plugin (Not Just MCP Server)

Claude Code now has a proper **plugin system** that bundles MCP server + skills + hooks + subagents:

```
launchpath-claude-plugin/
├── plugin.json              ← Plugin metadata + MCP server config
├── skills/
│   ├── deploy-agent/SKILL.md
│   ├── test-agent/SKILL.md
│   ├── heal-agent/SKILL.md
│   ├── ... (26 skills total)
│   └── launchpath-guide/SKILL.md  ← Auto-invoked context
└── README.md
```

### Install Flow

```bash
# Plugin install (one command)
claude plugin add @launchpath/agent-tools

# Or manual MCP server install
claude mcp add --transport http launchpath https://api.launchpath.com/mcp \
  --header "Authorization: Bearer lp_key_xxx"

# Or via .mcp.json (shared via git)
{
  "mcpServers": {
    "launchpath": {
      "type": "http",
      "url": "https://api.launchpath.com/mcp",
      "headers": { "Authorization": "Bearer ${LAUNCHPATH_API_KEY}" }
    }
  }
}
```

### Marketplace Listings

| Directory | Count | Priority |
|---|---|---|
| **Anthropic Connectors Directory** | Official, verified | Highest — cross-platform (Claude web, desktop, mobile, Code, API) |
| **Anthropic Plugins Directory** (`claude-plugins-official`) | Official | High — bundled skills discovery |
| **Official MCP Registry** (`registry.modelcontextprotocol.io`) | Preview | High — backed by Anthropic, GitHub, Microsoft |
| **mcp.so** | 18,500+ servers | High — largest directory |
| **PulseMCP** | 10,390+ servers | Medium |
| **Smithery** | 2,000+ servers | Medium — has its own CLI |
| **npm** | Universal | Required — `@launchpath/mcp-server` |
| **GitHub** | Source code | Required — open source for trust |

### Cross-Client Compatibility

The MCP server should work across:
- Claude Code (primary — has Skills)
- Cursor (40-tool limit — our 22 default tools fit)
- VS Code Copilot
- Windsurf
- Any MCP-compatible client

Skills only work in Claude Code. This is fine — Skills are the Claude Code differentiator; the MCP server is the universal interface.

---

## 15. Implementation Priority

### Phase 1: Core Server (Ship First)

- ~22 default tools (core + agent-management + knowledge + deployment + clients + enable_toolset)
- Server Instructions (replace guide tool)
- `enable_toolset` meta tool
- Tool annotations for confirmation gates
- Progress tokens for long-running tools
- API key authentication
- Streamable HTTP transport
- Rate limiting (token bucket per API key)
- Actionable error messages
- HTTP client with retries

### Phase 2: Extended Toolsets

- Campaigns toolset (4 tools)
- Analytics toolset (3 tools)
- Tools config toolset (4 tools)

### Phase 3: WhatsApp + Advanced

- WhatsApp toolset (6 tools)
- Portal toolset (3 tools)
- Versions toolset (3 tools)

### Skills: Ship ALL with Phase 1

All 26 skills are markdown files — zero engineering cost. Ship them all on day one. Most use only Phase 1 tools. Skills that require Phase 2/3 tools will become functional when those toolsets ship.

### Plugin: Ship with Phase 1

Package the MCP server + all 26 skills as a Claude Code plugin from day one. One install command.

---

## 16. Gaps to Close

### Before Building

| Gap | What to Do | Priority |
|---|---|---|
| **`llms.txt`** | Add `llms.txt` at domain root so AI agents can discover LaunchPath capabilities | Medium |
| **API key auth** | Build `user_api_keys` table + generation UI + auth middleware | **Blocker** |
| **`GET /api/agents` endpoint** | Agent list currently only available server-side via `getSidebarData()` | **Blocker** |
| **Embed code in channel response** | Channel creation/get needs to return formatted embed snippet | High |
| **Sync variants for SSE endpoints** | `create_agent_from_prompt` and `chat_with_agent` use SSE — MCP server needs to consume stream and return final result | High |
| **`GET /api/agents/[id]/versions` endpoint** | Versions table exists, needs API route | Medium |
| **Agent analytics endpoint** | `GET /api/agents/[id]/analytics` — aggregate queries against existing data | Medium |

### Architecture Items

| Item | What to Do | Priority |
|---|---|---|
| **Tool use examples** | Write 1-5 examples for `deploy_channel`, `create_wa_sequence`, `add_agent_tool` | High |
| **Server Instructions content** | Write the instruction document (cross-tool guidance, toolset loading hints, rate limits) | High |
| **Progress token implementation** | Add to `scrape_website`, `create_agent_from_prompt`, `send_wa_broadcast`, `import_wa_contacts` | Medium |
| **Elicitation for `send_wa_broadcast`** | Complex confirmation: "Send to 500 contacts?" with count display | Medium |

---

## 17. Final Verdict

### Can Claude Handle This?
**Yes, with toolset filtering.** 22 default tools is well under the 30-tool danger zone. On-demand loading keeps additional toolsets focused and contextual. Anthropic's own benchmarks validate this approach.

### Are We Optimizing Correctly?
**Mostly yes. Six changes needed:**
1. Server Instructions instead of `guide()` tool
2. Tool annotations instead of `confirm: true` params
3. Progress tokens for long-running tools
4. Flatten `widget_config` into separate tools
5. Streamable HTTP transport
6. Rate limiting (mandatory per spec)

### Does the User Have Full Control?
**Yes.** ~40 tools cover ~80 of 93 API routes. The only things excluded are infrastructure (webhooks, widget runtime) and browser-required flows (OAuth, file uploads).

### Can They Do Everything from Claude Code?
**Yes**, except:
- Composio OAuth connections (requires browser redirect)
- File uploads to knowledge base (base64 is clunky over MCP — v2)
- Real-time conversation monitoring (polling-based via `live` feature)

### Is It Revolutionary?
**The technology isn't. The integrated experience is.** Nobody else bundles MCP tools + 26 workflow skills + agent platform + multi-channel deployment + WhatsApp campaigns into one Claude Code plugin.

### What's the Window?
**6-12 months** before competitors catch up. The MCP server is the distribution channel; the platform is the moat. Ship fast.

### Tool Count Comparison

| Platform | MCP Tools | Skills | Default Loaded | Total Surface |
|---|---|---|---|---|
| **Supabase** | 29 | 0 | 29 (no filtering) | 29 tools |
| **GitHub** | 94 | 0 | ~30 (5 toolsets) | 94 tools |
| **Slack** | 18 | 0 | 18 | 18 tools |
| **Linear** | 22 | 0 | 22 | 22 tools |
| **n8n** | Variable | 0 | Variable | Workflow-dependent |
| **LaunchPath** | ~40 | 26 | ~22 (5 toolsets) | **40 tools + 26 skills** |

---

## The Full Picture

```
USER                     CLAUDE CODE                    LAUNCHPATH
─────                    ───────────                    ──────────

"Deploy a dental          Claude reads                  API receives
 support bot for          /deploy-agent skill    →      tool calls:
 brightsmiledental.com"   which chains:                 1. create_agent_from_prompt
                                                        2. scrape_website
                          create_agent_from_prompt()    3. add_faq (×5)
                          scrape_website()              4. deploy_channel
                          add_faq() × 5                 5. get_embed_code
                          deploy_channel()
                          get_embed_code()              Returns:
                                                        - Agent ID
                          Claude formats output:        - Embed code
                          "Agent deployed! Here's       - Dashboard URL
                           your embed code..."

                          Total time: ~90 seconds
                          Total cost: ~$0.15
```

### The Killer 5-Command Workflow

```
/deploy-agent "dental bot for brightsmiledental.com"   → Agent + knowledge + widget
/wire-tools                                             → Calendar + Gmail connected
/test-agent                                             → 5/5 passed
/build-demo form-to-whatsapp                            → Demo page + WhatsApp flow
/go-live                                                → Checklist passed, deployed
```

### The Multi-Channel Killer Workflow

```
/deploy-agent "real estate lead qualifier for luxuryrealty.com"
/wire-tools                                              → CRM + Calendar connected
/build-demo form-to-whatsapp                             → Demo page with lead form → WhatsApp
/test-agent                                              → 5/5 passed
/go-live                                                 → Deploy to widget + WhatsApp + voice
```

One agent. Three channels. Form → WhatsApp. Website → widget. Phone → voice agent. All from the terminal.

**~40 tools. 26 skills. 11 toolsets. One plugin install. One terminal.**

---

## Sources

### Anthropic Official
- [Advanced Tool Use Engineering Blog](https://www.anthropic.com/engineering/advanced-tool-use)
- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Tool Search Tool Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)
- [Tool Use with Claude](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Claude Code Skills Docs](https://code.claude.com/docs/en/skills)
- [Claude Code Plugins Docs](https://code.claude.com/docs/en/plugins)
- [Claude Code MCP Docs](https://code.claude.com/docs/en/mcp)

### MCP Spec & Protocol
- [MCP Tools Specification](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- [MCP Authorization Specification](https://modelcontextprotocol.io/specification/draft/basic/authorization)
- [MCP Server Instructions Blog](http://blog.modelcontextprotocol.io/posts/2025-11-03-using-server-instructions/)
- [MCP Elicitation Protocol](https://dev.to/kachurun/mcp-elicitation-human-in-the-loop-for-mcp-servers-m6a)

### Production MCP Servers
- [GitHub MCP Server](https://github.com/github/github-mcp-server) — 94 tools, toolset filtering
- [GitHub MCP Toolset Config](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/configure-toolsets)
- [Supabase MCP](https://github.com/supabase-community/supabase-mcp) — 29 tools
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) — 28K stars, most popular

### Research & Benchmarks
- [RAG-MCP Paper (arXiv:2505.03275)](https://arxiv.org/abs/2505.03275) — Tool selection accuracy research
- [Jenova.ai: AI Tool Overload](https://www.jenova.ai/en/resources/mcp-tool-scalability-problem)
- [Speakeasy: Why Less Is More for MCP](https://www.speakeasy.com/mcp/tool-design/less-is-more)
- [Speakeasy: 100x Token Reduction with Dynamic Toolsets](https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2)

### Market Data
- [Agentic AI Market — Fortune Business Insights](https://www.fortunebusinessinsights.com/agentic-ai-market-114233)
- [Claude AI Statistics 2026 — DemandSage](https://www.demandsage.com/claude-ai-statistics/)
- [MCPs: Value Creation & Destruction — Leonis Capital](https://www.leoniscap.com/research/mcps-value-creation-capture-and-destruction-lessons-from-the-api-era)

### Architecture Best Practices
- [MCP Best Practices — Philipp Schmid](https://www.philschmid.de/mcp-best-practices)
- [MCP Naming Conventions](https://zazencodes.com/blog/mcp-server-naming-conventions)
- [MCP Error Handling — MCPcat](https://mcpcat.io/guides/error-handling-custom-mcp-servers/)
- [MCP Rate Limiting — Fast.io](https://fast.io/resources/mcp-server-rate-limiting/)
- [MCP Transports: stdio vs Streamable HTTP](https://dev.to/jefe_cool/mcp-transports-explained-stdio-vs-streamable-http-and-when-to-use-each-3lco)

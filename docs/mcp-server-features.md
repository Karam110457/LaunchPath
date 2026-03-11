# LaunchPath MCP Server — Feature Feasibility & v1 Scope

Reference document breaking down every proposed CLI/MCP feature: what it actually is, how it works technically, how real it is, and whether it ships in v1.

---

## v1 Features (Ship These)

### 1. `launchpath preview` — Chat with Your Agent in Terminal

**What it is:** A terminal chat session with your deployed agent. You type, the agent responds with full tool calls, knowledge retrieval, and reasoning visible inline.

**How it works:**
- MCP tool calls `POST /api/agents/[agentId]/chat` with the user's API key
- Parses the SSE stream chunk by chunk
- Prints text deltas to stdout as they arrive
- Claude Code's terminal already renders markdown nicely
- Tool call events (`tool-call`, `tool-result`) displayed as collapsible sections

**What exists today:** The chat API endpoint is fully built. SSE streaming works. The MCP server just needs to consume the stream and return the final result (Option B from the main plan — no API changes needed).

**Effort:** 1-2 days
**How real:** 100%. This is a formatted HTTP call to an existing endpoint.

---

### 2. `launchpath clone` — Fork Any Agent Config

**What it is:** Export an agent's full configuration to a portable format, then import it to create a copy. Enables sharing agent templates via GitHub gists, repos, or a future public registry.

**How it works:**
- `clone` (export side): `GET /api/agents/[agentId]` returns full config (prompt, personality, model, tool_guidelines, greeting). MCP tool serializes this to a JSON/YAML blob.
- `clone` (import side): `POST /api/agents/create-blank` with the exported config applied via `PATCH /api/agents/[newId]`.
- For cross-user sharing: user exports to a file/gist, recipient imports from URL or file path.

**What transfers cleanly:**
- System prompt, personality, model, greeting, tool guidelines, name, description

**What does NOT transfer:**
- Composio connections (per-user OAuth/API keys)
- Knowledge base documents (stored in Supabase storage, tied to user_id)
- Webhook/HTTP tool configs with secrets
- Subagent references (target agent IDs are user-specific)

**The clone output must clearly state:** "Agent config cloned. 3 tools need reconfiguration. Knowledge base is empty — scrape the website or add FAQs."

**New API needed:** None for v1. Export = GET existing endpoint. Import = POST + PATCH existing endpoints. A dedicated `POST /api/agents/clone` would be a nice-to-have but isn't required.

**Effort:** 3-4 days
**How real:** 90%. Config clones perfectly. Tools and knowledge require manual re-setup, which is expected and honest.

---

### 3. `launchpath watch` — Hot Reload Agent Config

**What it is:** Watch a local agent config file (YAML/JSON). On save, automatically push changes to the LaunchPath API. The agent updates in real time — next message it receives uses the new config.

**How it works:**
- User runs `launchpath export my-agent > agent.yaml` to get a local copy
- User runs `launchpath watch agent.yaml --agent my-agent-id`
- MCP tool (or companion CLI) uses `fs.watch()` on the file
- On change: debounce 500ms, parse the file, `PATCH /api/agents/[agentId]` with changed fields
- Terminal shows: "Updated system_prompt and greeting. Agent live."

**What actually updates live:**
- System prompt, personality, greeting, model, tool guidelines, name, description
- These all take effect on the next message (no restart needed)

**What doesn't hot reload:**
- Knowledge base (requires re-scraping/re-uploading)
- Tool configurations (require separate API calls)
- These are correctly scoped out — prompt iteration is 90% of the workflow

**Important caveat:** "Changes reflect immediately in WhatsApp" means the *next* message uses the new config. The conversation history stays the same. This is correct behavior, not a limitation.

**Effort:** 1 day
**How real:** 100%. It's a file watcher + one API call. ~50 lines of code.

---

### 4. `launchpath deploy` — One-Command Channel Deployment

**What it is:** Deploy an agent to a channel with a single command. Returns the token, embed code, or connection details.

**How it works:**
- `POST /api/agents/[agentId]/channels` with `channel_type`, `name`, `allowed_origins`, `rate_limit_rpm`
- Returns channel object including token and (with the embed_code prerequisite from the main plan) a ready-to-paste HTML snippet

**What works in one command (v1):**
- `--channel widget` — creates widget channel, returns embed `<script>` tag. Done.
- `--channel api` — creates API channel, returns token + curl example. Done.
- `--channel whatsapp` — creates WhatsApp channel, registers webhook with Twilio, returns the WhatsApp number. Done. (Platform handles webhook + send message — it's simple infra.)
- `--channel sms` — creates SMS channel, registers Twilio webhook, returns the SMS number. Done.
- `--channel voice` — creates voice channel via Vapi/LiveKit integration, returns the phone number or web call link. Done.

**What does NOT work in one command:**
- `--channel slack` — Requires OAuth app creation and workspace installation. Could be semi-automated (open browser for OAuth, wait for callback) but not "one command."

**Honest scope for v1:** Widget, API, WhatsApp, SMS, and Voice channels all work in one command. WhatsApp/SMS/Voice infrastructure will be built into LaunchPath BEFORE the MCP server ships — they're just a webhook + send message. Voice uses Vapi/LiveKit as the STT/TTS layer, LaunchPath is the brain. Slack requires OAuth which can't be fully automated.

**Effort:** 2-3 days (mostly formatting output nicely — all channel infra already exists)
**How real:** 100% for widget/API/WhatsApp/SMS/Voice. Misleading for Slack — don't promise what you can't deliver.

---

### 5. `launchpath replay` — Conversation Replay & Branch

**What it is:** Step through any past conversation turn by turn, seeing the agent's reasoning and tool calls. Then branch off at any point with a different user message to test alternative paths.

**How it works:**
- **Replay:** `GET /api/agents/[agentId]/chat/conversations?id=xxx` returns full conversation with messages array. MCP tool formats and displays turn by turn. `--step-through` mode waits for user input between turns.
- **Branch:** Take messages array up to turn N, append a new user message, `POST /api/agents/[agentId]/chat` with that history. The chat endpoint already accepts a `messages` array for stateless mode. No API changes needed.

**What makes this powerful:**
- The chat API is already stateless-capable — it accepts arbitrary message history
- Branching literally works with the current API, zero changes
- You can test "what if the customer said X instead" without creating a new conversation
- Debugging tool call behavior by replaying the exact context that triggered it

**Edge cases:**
- Tool calls in history: the replayed conversation includes tool-call/tool-result messages. The LLM sees the full context including past tool usage. This is correct behavior.
- Long conversations: message arrays can get large. Consider a `--from-turn N` flag to trim early history.

**Effort:** 2-3 days
**How real:** 100%. This is the most "undersold" feature — it's genuinely useful and costs nothing to build because the API already supports it.

---

### 6. `launchpath diff` / `launchpath rollback` — Agent Version Control

**What it is:** Compare two versions of an agent's config side-by-side, showing exactly what changed. Roll back to any previous version instantly.

**How it works:**
- **Versions exist today:** The `agent_versions` table stores a snapshot (version_number, config JSON) every time an agent is saved via `PATCH /api/agents/[agentId]`.
- **Diff:** New endpoint `GET /api/agents/[agentId]/versions` returns version list. MCP tool fetches two versions, JSON-diffs the config objects, formats as colored terminal output (green = added, red = removed).
- **Rollback:** Read the target version's config, `PATCH /api/agents/[agentId]` with those values. The patch auto-creates a new version snapshot, so rollback is non-destructive.

**New API needed:** `GET /api/agents/[agentId]/versions` — list all versions with version_number, change_title, created_at. Simple query against existing table.

**Nice-to-have (not v1):** Named tags (`launchpath version my-agent --tag "before-refactor"`). Would need a `tag` column on `agent_versions`. Skip for v1 — version numbers are sufficient.

**Effort:** 2-3 days
**How real:** 100%. The data already exists. This is query + formatting.

---

### 7. `launchpath compose` — Multi-Agent Orchestration

**What it is:** Wire multiple agents together with a routing layer. One "router" agent decides which specialist handles each message. Visualize the agent network as an ASCII diagram.

**How it works:**
- **Already built:** The `subagent` tool type lets Agent A call Agent B via `generateText()`. Circular reference detection and depth limits (max 3) are implemented.
- **What the CLI adds:** A nicer interface to create the wiring.
  1. `list_agents` to show available agents
  2. Create a new "router" agent with a system prompt like "Route customer messages to the right specialist"
  3. Add subagent tools pointing to each specialist agent
  4. `--visualize` queries the router's tools, finds subagent references, draws an ASCII tree

**Example output:**
```
Router Agent (support-router)
├── Billing Agent (billing-bot)
├── Technical Agent (tech-support)
└── Sales Agent (sales-bot)
```

**This is not new functionality** — it's a better interface to existing subagent composition. The value is making multi-agent setups discoverable and easy to create without clicking through the dashboard.

**Effort:** 2-3 days
**How real:** 100%. The underlying system exists. This is UX sugar.

---

### 8. `launchpath live` — Real-Time Conversation Feed

**What it is:** `tail -f` for your AI business. Watch every conversation happening across all your agents in real time. Messages scroll by as customers talk to your bots.

**How it works:**
- `GET /api/portal/conversations` with filtering returns active conversations
- The widget already polls `/api/widget/[channelId]/status?sessionId=X&since=N` for new messages with incremental fetching
- The MCP tool polls the conversations endpoint every 2-3 seconds, diffs against last known state, prints new messages
- Filter by agent, campaign, or client: `launchpath live --agent billing-bot`
- Color-code: blue for user messages, green for agent responses, red for human_takeover requests

**What exists today:** The portal analytics endpoint (`GET /api/portal/analytics`) provides conversation counts. The portal conversations endpoint provides full conversation lists with messages. The widget status endpoint supports `since` parameter for incremental message fetching.

**Why it's insane:** Watching real customers interact with your AI agents in a terminal feed is mesmerizing. It's the "I built something real" moment. Every agency owner would leave this running on a second monitor.

**VS Code note:** In VS Code, the conversation feed competes with the Claude Code chat panel for attention. Best approach: output to VS Code's Output panel or a dedicated terminal tab, not the sidebar.

**Effort:** 2-3 days
**How real:** 100%. It's polling existing endpoints and formatting output.

---

### 9. `launchpath handoff` — Client Delivery Package

**What it is:** Generate a complete client deliverable: agent summary, embed instructions, conversation analytics, and a formatted report. Everything an agency needs to "deliver" the bot to a client and justify the monthly retainer.

**How it works:**
1. `get_agent` — agent name, description, capabilities, model
2. `list_channels` — deployment info + embed code
3. `list_knowledge` — knowledge base summary (X pages scraped, Y FAQs, Z files)
4. `GET /api/portal/analytics?period=30d` — conversation volume, human takeover count, active campaigns
5. `list_conversations` — recent conversation samples

Compiled into a structured report:
- Agent overview (name, description, what it handles)
- Knowledge base inventory (sources, page count, FAQ count)
- Deployment details (embed code, allowed origins, rate limits)
- Performance metrics (conversations this month, avg messages per conversation, human takeover rate)
- Sample conversations (best interactions)
- Recommended improvements

**Output formats:**
- Markdown (default) — prints to terminal or opens in VS Code tab
- `--file report.md` — writes to file for sharing

**Why agencies care:** The hardest part of running an agency isn't building the bot — it's making the client feel like they got $2,000/month of value. A professional delivery report does that. Right now agencies manually screenshot dashboards and paste into Google Docs.

**Effort:** 2-3 days
**How real:** 100%. Every data point comes from existing endpoints. It's aggregation and formatting.

---

### 10. `/test-agent` — Autonomous Agent Testing (Skill)

**What it is:** Claude Code becomes the QA team. It reads your agent's config, generates realistic test scenarios, plays the role of a customer, runs multi-turn conversations, and reports back with a full analysis — no human in the loop.

**How it works:**

Claude Code uses existing MCP tools to autonomously test the agent:

1. **Understand the agent:** Calls `get_agent` (system prompt, personality, greeting), `list_knowledge` (knowledge base contents), and `list_tools` (connected tools and types)

2. **Generate scenarios:** Based on the agent's purpose, Claude creates 5-8 test scenarios:
   - Happy path (standard customer flow end-to-end)
   - Edge case (unusual but valid request)
   - Objection handling (price, timing, competitor comparison)
   - Off-topic resistance (does it stay on track?)
   - Tool verification (does each connected tool fire correctly?)
   - Knowledge retrieval (does it reference scraped content accurately?)
   - Multi-turn context (does it remember what was said 3 turns ago?)
   - Hostile input (prompt injection, rude customer)

3. **Run each scenario:** For each test, Claude calls `chat_with_agent` multiple times, playing the role of a realistic customer. Each scenario is a separate conversation (no conversationId = fresh context). Claude maintains the message array and passes it each turn for stateless multi-turn.

4. **Analyze and report:**
   - Pass/warning/fail per scenario with specific quotes
   - Tool connection status (did the tool fire? did it return valid data?)
   - Knowledge accuracy (did the agent reference real info from the KB or hallucinate?)
   - Prompt improvement suggestions
   - Overall readiness: "Ready to deploy" / "Needs work" / "Critical issues"

**Why this is uniquely possible:** No other platform has an LLM sitting in front that can read an agent's config, reason about test cases, simulate customers, AND judge the quality of responses. Claude Code IS the testing framework — you don't build any testing UI.

**Tool side effects warning:** If the agent has live tools (webhooks that book appointments, emails that send), testing WILL trigger them. The skill warns the user before running tool-triggering scenarios and offers to skip them.

**Cost per test run:** ~$0.30-0.50 in agent API costs (20 chat turns across 5 scenarios) + Claude Code usage. Way cheaper than manual QA.

**Skill definition:**
```yaml
---
name: test-agent
description: Autonomously test a LaunchPath agent by simulating realistic customer conversations across multiple scenarios. Reports back with pass/fail analysis.
argument-hint: [agent name or ID]
allowed-tools: mcp__launchpath__*
context: fork
---

You are a QA tester for a LaunchPath AI agent. Your job is to thoroughly test the agent by simulating realistic customers.

1. Get the agent's full context:
   - Call `get_agent` to read system prompt, personality, greeting, model
   - Call `list_knowledge` to see knowledge base contents and topics
   - Call `list_tools` to see connected tools and their types

2. Generate 5-8 test scenarios based on the agent's purpose:
   - Happy path: standard customer interaction end-to-end
   - Edge case: unusual but valid request
   - Objection handling: price sensitivity, competitor comparison
   - Off-topic: unrelated questions (should redirect)
   - Tool verification: trigger each connected tool
   - Knowledge test: ask about specific topics from the knowledge base
   - Context retention: reference something from earlier in the conversation
   - Adversarial: prompt injection, rude customer

3. IMPORTANT — Before running tool-triggering scenarios:
   - Check if any tools are webhooks, HTTP calls, or Composio integrations
   - Warn: "This agent has live tools. Testing will trigger real API calls.
     Skip tool-triggering scenarios? [list which ones]"
   - If user says skip, test those scenarios with questions that APPROACH
     the tool trigger but don't cross it (e.g., ask about booking without
     confirming the appointment)

4. Run each scenario:
   - Start a NEW conversation for each (don't pass conversationId)
   - Play a realistic customer — natural language, varied phrasing, follow-ups
   - Go 3-5 turns deep per scenario
   - After each agent response, note: response quality, tool calls made,
     knowledge accuracy, tone consistency

5. Deliver the report:
   - Scenario-by-scenario results with pass/warning/fail
   - Specific quotes from concerning responses
   - Tool connection status (working / error / untested)
   - Knowledge gaps: questions the agent couldn't answer from its KB
   - Prompt improvements: specific additions to fix found issues
   - Overall assessment: ready to deploy / needs work / critical issues

Be a tough but fair tester. A passing agent should be ready for real customers.
Do not pass scenarios where a real customer would be confused or misled.
```

**Effort:** 0 days — this is a Skill (markdown file), not code. The testing logic lives entirely in Claude's reasoning. The `chat_with_agent` MCP tool already exists.
**How real:** 100%. The only "build" is writing the SKILL.md file. Everything else uses existing MCP tools.

---

## v1.5 Features (Ship 2-4 Weeks After v1)

### 11. `launchpath metrics` — Real-Time Agent Analytics

**What it is:** A terminal dashboard showing conversation volume, resolution rates, tool usage, and costs per agent.

**How it works:**
- Query `channel_conversations` for volume (COUNT by time bucket), status distribution, message counts
- Query `agent_conversations` for test chat activity
- Format as a terminal table or dashboard (using `cli-table3` or similar)

**What you can show today (no backend changes):**
- Conversations per hour/day/week
- Message count per conversation (avg, min, max)
- Status distribution (active, paused, human_takeover, closed)
- Conversations per channel
- Busiest hours

**What you can NOT show today (needs backend work):**
- Token usage / cost per conversation — not currently tracked. Need to add token counting in `runAgentChat()` and store per-conversation.
- Resolution rate — need to define what "resolved" means. Is it `status = 'closed'`? Is it no follow-up within 24h?
- Tool success rate — tool results exist in message history as `tool-result` role entries but aren't aggregated anywhere.
- Response time — timestamps exist per message, but p50/p95 latency isn't calculated.

**Why v1.5:** The interesting metrics (cost, resolution, tool success) require backend instrumentation that shouldn't block the MCP server launch. Ship basic volume metrics in v1 if easy, then add the rich dashboard in v1.5.

**New backend needed:**
- Token count field on `channel_conversations` (updated per chat request)
- `GET /api/agents/[agentId]/analytics` endpoint that aggregates the queries above
- ~3-4 days of backend work before the MCP tool can consume it

**Effort:** 1 week total (backend + MCP tool + formatting)
**How real:** Basic volume metrics: 100%. Cost/resolution/tool metrics: needs backend work first.

---

### 12. `launchpath bench` — Automated Agent Testing

**What it is:** Generate realistic test conversations, run them against your agent, and produce a scorecard with pass/fail per scenario.

**How it works:**
1. **Generate scenarios:** Send a meta-prompt to Claude/GPT: "Given this agent's system prompt, knowledge base topics, and available tools, generate N realistic multi-turn user conversations with expected behaviors." Returns structured test cases.
2. **Run scenarios:** Loop through test cases. For each one, POST messages sequentially to `/api/agents/[agentId]/chat`. Collect responses.
3. **Score results:** This is the hard part (see below).

**Scoring approaches (honest assessment):**

| Method | What It Measures | Reliability | Cost |
|--------|-----------------|-------------|------|
| **Tool call verification** | Did the agent call the expected tool? | High — deterministic | Free |
| **Keyword/pattern matching** | Does the response contain expected info? | Medium — brittle | Free |
| **LLM-as-judge** | Overall response quality rated by another LLM | Medium — subjective, inconsistent | ~$0.01-0.05 per eval |
| **Hallucination detection** | Did the agent claim something not in its knowledge? | Low — very hard to do well | Expensive |
| **Latency measurement** | Response time per turn | High — easy metric | Free |

**What to ship in v1.5:**
- Scenario generation (easy, high value)
- Run scenarios and collect responses (easy)
- Tool call verification (did it use the right tool? deterministic, reliable)
- Keyword checks (does the response mention the expected topic?)
- Latency per turn
- Simple pass/fail based on: responded without error + used expected tools + mentioned expected topics

**What to save for v2:**
- LLM-as-judge scoring (expensive, needs calibration)
- Hallucination detection (research-level problem)
- Regression testing (compare scores across agent versions)

**Effort:** 1-2 weeks
**How real:** Scenario generation and execution: 100%. Scoring: simple heuristics work, fancy scoring is hand-wavy. Be honest about what the scores mean.

---

### 13. `launchpath voice` — Voice Agent Testing

**What it is:** Test your agent via a real voice call. LaunchPath uses Vapi/LiveKit for STT/TTS, and the LaunchPath chat API as the brain. The MCP tool triggers a test voice call or returns a web call link.

**How it works:**
1. **Option A (phone call):** MCP tool calls `POST /api/agents/[agentId]/channels` with `channel_type: "voice"`. Platform provisions a Vapi/LiveKit voice agent linked to the LaunchPath chat API. Returns a phone number to call.
2. **Option B (web call):** Returns a browser-based call link (Vapi web widget or LiveKit room URL). User clicks, talks to their agent immediately.
3. **No local audio stack needed.** Vapi/LiveKit handle all STT/TTS/WebRTC. LaunchPath is just the brain receiving text, responding with text.

**Why this is now simple:**
- Voice infrastructure (Vapi/LiveKit integration) is built into LaunchPath BEFORE the MCP server ships
- The MCP tool just creates/returns a voice channel — same pattern as widget/WhatsApp/SMS
- No sox, no OS-specific audio commands, no mic permissions
- Works on every OS because the voice call happens on the phone or in a browser, not in the terminal

**What the MCP tool actually does:**
- `deploy --channel voice` creates a voice channel, returns phone number + web call link
- `preview --voice` opens the web call link (or prints the phone number to call)

**Effort:** 1-2 days (MCP tool is just a channel creation call — voice infra is a platform prereq)
**How real:** 100%. Voice infra is a platform feature, not an MCP feature. The MCP tool just triggers it.

---

### 14. `launchpath heal` — Self-Improving Agent

**What it is:** Analyze conversations where the agent failed — human takeovers, dead ends, unanswered questions — then automatically suggest prompt fixes, missing FAQs, and knowledge gaps. Agents that get smarter over time.

**How it works:**
1. Query `channel_conversations` where `status = 'human_takeover'` or conversations that ended with the agent's last message getting no reply (dead end heuristic: agent was last to speak, no follow-up within 24h)
2. Pull the full message history for each failed conversation
3. Send to Claude with a meta-prompt: "Analyze these failed conversations. Identify: (a) questions the agent couldn't answer, (b) topics missing from the knowledge base, (c) prompt instructions that led to bad responses, (d) patterns across multiple failures"
4. Output: list of suggested FAQs to add, prompt tweaks, and URLs to scrape
5. With `--apply` flag: automatically call `add_faq` and `update_agent` to implement the fixes

**What exists today:**
- `channel_conversations` has `status` field including `human_takeover` with `taken_over_by` and `taken_over_at` timestamps
- `GET /api/portal/conversations` supports status filtering
- Full message history is stored per conversation
- `add_faq` and `update_agent` endpoints exist for applying fixes

**Example output:**
```
Heal Report — "Bright Smile Support" (last 7 days)
════════════════════════════════════════════════════
Analyzed: 12 failed conversations (8 human takeover, 4 dead ends)

Knowledge Gaps:
  - 4 conversations asked about "insurance accepted" — not in KB
  - 3 conversations asked about "parking at the office" — not in KB
  - 2 conversations asked "do you treat children?" — not in KB

Prompt Issues:
  - Agent quoted prices in 3 conversations (hallucinated $150 cleaning fee)
    → Fix: Add "Never quote specific prices" to system prompt
  - Agent didn't redirect to phone when asked about emergencies
    → Fix: Add "For dental emergencies, direct to (555) 123-4567"

Suggested Actions:
  1. Add FAQ: "What insurance do you accept?" → [needs answer from client]
  2. Add FAQ: "Is there parking available?" → [needs answer from client]
  3. Add FAQ: "Do you treat children?" → [needs answer from client]
  4. Update prompt: +2 instructions (pricing, emergencies)

Apply prompt fixes now? (FAQs need client input first) [y/n]
```

**Why this is insane:** This is the feature that makes agents a living product, not a one-time build. Every week, you run `/heal` and your agent gets smarter. Clients see improvement without asking for it. This justifies ongoing retainers.

**Effort:** 3-4 days
**How real:** 90%. The data exists, the analysis is straightforward LLM work, the fix endpoints exist. The only fuzzy part is the "dead end" heuristic — but human_takeover conversations are a clean, reliable signal on their own.

---

## Skills (Ship with Plugin)

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

---

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

---

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

---

### Skill 4: `/test-agent` (Autonomous QA)

```yaml
---
name: test-agent
description: Autonomously test a LaunchPath agent by simulating realistic customer conversations across multiple scenarios. Reports back with pass/fail analysis.
argument-hint: [agent name or ID]
allowed-tools: mcp__launchpath__*
context: fork
---

You are a QA tester for a LaunchPath AI agent. Your job is to thoroughly test the agent by simulating realistic customers.

1. Get the agent's full context:
   - Call `get_agent` to read system prompt, personality, greeting, model
   - Call `list_knowledge` to see knowledge base contents and topics
   - Call `list_tools` to see connected tools and their types

2. Generate 5-8 test scenarios based on the agent's purpose:
   - Happy path: standard customer interaction end-to-end
   - Edge case: unusual but valid request
   - Objection handling: price sensitivity, competitor comparison
   - Off-topic: unrelated questions (should redirect)
   - Tool verification: trigger each connected tool
   - Knowledge test: ask about specific topics from the knowledge base
   - Context retention: reference something from earlier in the conversation
   - Adversarial: prompt injection, rude customer

3. IMPORTANT — Before running tool-triggering scenarios:
   - Check if any tools are webhooks, HTTP calls, or Composio integrations
   - Warn: "This agent has live tools. Testing will trigger real API calls.
     Skip tool-triggering scenarios? [list which ones]"
   - If user says skip, test those scenarios with questions that APPROACH
     the tool trigger but don't cross it (e.g., ask about booking without
     confirming the appointment)

4. Run each scenario:
   - Start a NEW conversation for each (don't pass conversationId)
   - Play a realistic customer — natural language, varied phrasing, follow-ups
   - Go 3-5 turns deep per scenario
   - After each agent response, note: response quality, tool calls made,
     knowledge accuracy, tone consistency

5. Deliver the report:
   - Scenario-by-scenario results with pass/warning/fail
   - Specific quotes from concerning responses
   - Tool connection status (working / error / untested)
   - Knowledge gaps: questions the agent couldn't answer from its KB
   - Prompt improvements: specific additions to fix found issues
   - Overall assessment: ready to deploy / needs work / critical issues

Be a tough but fair tester. A passing agent should be ready for real customers.
Do not pass scenarios where a real customer would be confused or misled.
```

---

### Skill 5: `/heal-agent` (Self-Improvement)

```yaml
---
name: heal-agent
description: Analyze failed conversations and automatically fix your agent's knowledge gaps, prompt issues, and weak spots.
argument-hint: [agent name or ID]
allowed-tools: mcp__launchpath__*
context: fork
---

You are diagnosing and fixing a LaunchPath agent based on its real conversation failures.

1. Get context:
   - Call `get_agent` to read current system prompt and config
   - Call `list_knowledge` to see what's in the knowledge base
   - Call `list_conversations` to find recent conversations

2. Identify failures:
   - Look for conversations with status "human_takeover" — these are confirmed failures
   - Look for conversations where the agent was last to respond and the customer
     didn't reply (possible dead end — customer gave up)
   - Look for conversations with very few turns (1-2) — may indicate the agent
     failed to engage

3. Analyze failure patterns:
   - Read the full message history of each failed conversation
   - Categorize failures:
     a) Knowledge gap: customer asked something not in the KB
     b) Hallucination: agent made up information
     c) Tone issue: agent was too formal/informal/pushy
     d) Missing instruction: agent didn't know how to handle a situation
     e) Tool failure: a tool call errored or returned bad data
   - Look for PATTERNS — the same question appearing in multiple failures
     is a high-priority fix

4. Generate fixes:
   - For knowledge gaps: draft FAQ entries (mark which need client input)
   - For hallucinations: add explicit "never" instructions to the prompt
   - For tone issues: adjust personality settings
   - For missing instructions: add specific handling rules to the prompt
   - For tool failures: flag for manual investigation

5. Present the plan:
   - Show each fix with the evidence (quote the failed conversation)
   - Separate into "auto-fixable" (prompt updates) and "needs input" (FAQs
     requiring client answers)
   - Ask for approval before applying changes

6. Apply approved fixes:
   - Call `update_agent` for prompt/personality changes
   - Call `add_faq` for new FAQ entries
   - Confirm: "Applied X fixes. Run /test-agent to verify improvements."

Never apply changes without showing them first. Always explain WHY each fix is needed
with a quote from the actual failed conversation.
```

---

### Skill 6: `/client-handoff`

```yaml
---
name: client-handoff
description: Generate a professional client delivery report for a deployed agent — summary, metrics, embed instructions, and recommendations.
argument-hint: [agent name or client name]
allowed-tools: mcp__launchpath__*
context: fork
---

You are generating a client-facing delivery report for a LaunchPath agent deployment.

1. Gather data:
   - Call `get_agent` — agent name, description, model, personality
   - Call `list_knowledge` — knowledge base inventory
   - Call `list_channels` — deployment channels and embed codes
   - Call `list_conversations` — recent conversation history
   - Call `list_tools` — connected integrations

2. Build the report with these sections:

   ## Agent Overview
   - Name, description, what it handles
   - Personality and tone
   - Model powering it

   ## Knowledge Base
   - Sources: X pages scraped from [website], Y FAQs, Z files
   - Topics covered (summarize from knowledge doc names)
   - Last updated date

   ## Deployment
   - Channel type and status
   - Embed code (ready to paste)
   - Allowed origins / CORS config
   - Rate limiting settings

   ## Performance (if conversations exist)
   - Total conversations to date
   - Average messages per conversation
   - Human takeover rate
   - Most common customer questions (analyze message content)

   ## Connected Integrations
   - List each tool with status (enabled/disabled)

   ## Recommendations
   - Knowledge gaps to fill
   - Suggested FAQ additions based on conversation patterns
   - Next steps for the client

3. Format as clean markdown. Keep it professional — this is what the agency
   sends to justify a $1,500-3,000/month retainer.

4. Ask the user if they want to save to a file or just view in terminal.
```

---

### Skill 7: `/competitor-agent`

```yaml
---
name: competitor-agent
description: Research a competitor's business and build an agent that's better than whatever chatbot they have.
argument-hint: [competitor website URL]
allowed-tools: mcp__launchpath__*
context: fork
---

You are building a competitive AI agent by analyzing a competitor's website.

1. Scrape the competitor's site:
   - Call `scrape_website` with the competitor URL
   - This gives you their offerings, pricing language, FAQs, and messaging

2. Analyze what you learned:
   - What services/products do they offer?
   - What questions would their customers ask?
   - What's their tone? (formal, casual, technical?)
   - What's missing from their site? (gaps = opportunities)

3. Create a superior agent:
   - Use `create_agent_from_prompt` with a detailed prompt that:
     a) Handles everything the competitor's site covers
     b) Fills gaps the competitor misses
     c) Uses a more engaging, helpful tone
     d) Includes qualifying questions to capture leads
     e) Has clear call-to-action guidance

4. Add the scraped knowledge to the new agent:
   - The scrape already added the content as knowledge
   - Identify 5-10 FAQs from the competitor's site and add via `add_faq`

5. Deploy:
   - Call `deploy_widget` to create a channel
   - Return embed code

6. Present the competitive analysis:
   - "Here's what [competitor] covers: ..."
   - "Here's what we added that they don't: ..."
   - "Here's how our agent handles [scenario] differently: ..."
   - Suggest running `/test-agent` to verify quality

This is designed for agencies pitching against a prospect's current solution.
"Look, here's what their current bot does. Here's what ours does. Built it in 5 minutes."
```

---

### Skill 8: `/morning-briefing`

```yaml
---
name: morning-briefing
description: Get a daily summary of your AI agency — new conversations, issues, revenue impact, and what needs attention today.
allowed-tools: mcp__launchpath__*
context: fork
---

You are generating a morning briefing for an AI agency owner. This should feel like
a chief of staff report — concise, actionable, prioritized.

1. Gather data across all agents:
   - Call `list_agents` to get all agents and their statuses
   - Call `list_clients` to get client count
   - For each active agent, call `list_conversations` to see last 24h activity

2. Build the briefing:

   ## Today's Numbers
   - New conversations (last 24h) across all agents
   - Total active conversations right now
   - Human takeovers requested (urgent attention needed)

   ## Needs Attention
   - Agents with human_takeover conversations (list them, link to dashboard)
   - Agents with errors or failures
   - Clients with zero activity (may need check-in)

   ## Agent Health
   - For each agent: status, conversations yesterday, any issues
   - Flag agents that haven't been updated in 30+ days

   ## Suggested Actions
   - "Run /heal-agent on [agent] — 3 human takeovers yesterday"
   - "Client [name] has had 0 conversations in 7 days — check deployment"
   - "[Agent] is still in draft — consider activating or archiving"

3. Keep it under 30 lines. Agency owners are busy. Lead with what matters.
```

---

### Skill 9: `/bulk-deploy`

```yaml
---
name: bulk-deploy
description: Set up multiple AI agents for multiple clients in one session — the agency scaling workflow.
argument-hint: [number of clients or CSV file path]
allowed-tools: mcp__launchpath__*
context: fork
---

You are helping an agency owner onboard multiple clients at once.

1. Get the client list:
   - If a CSV/file path is provided, read it for client details
     (expected columns: name, website, email, description)
   - If a number is given, ask for each client's details interactively
   - If nothing provided, ask how many clients to set up

2. For each client:
   a) Create the client: `create_client`
   b) Create an agent: `create_agent_from_prompt` using the client's business
      description and website context
   c) Scrape their website: `scrape_website` with their URL
   d) Create a campaign: `create_campaign` linking agent to client
   e) Deploy: `deploy_widget` with the campaign

3. Track progress:
   - Show a running tally: "Client 3/8: Bright Smile Dental — agent created,
     scraping website..."
   - If any step fails, note it and continue to the next client
   - Don't let one failure block the entire batch

4. Deliver summary:
   - Table of all clients with: name, agent name, embed code, status
   - Any failures that need manual attention
   - Total: "8 clients onboarded, 8 agents deployed, 24 pages scraped"

5. Suggest next steps:
   - "Run /test-agent on each to verify quality"
   - "Send embed codes to clients"
   - "Set up portal access via the dashboard"

This is the workflow that turns "building bots one at a time" into
"I onboarded 10 clients before lunch."
```

---

### Skill 10: `/pitch-agent`

```yaml
---
name: pitch-agent
description: Generate a sales pitch and live demo agent for a prospect. Scrapes their website, builds a working agent, and creates talking points — all before the sales call.
argument-hint: [prospect website URL or business name]
allowed-tools: mcp__launchpath__*
context: fork
---

You are preparing a sales pitch for an AI agency. The goal: walk into the meeting
with a WORKING agent already built for the prospect's business.

1. Research the prospect:
   - Call `scrape_website` with their URL
   - Analyze: what do they do, who are their customers, what are their FAQs,
     what are their pain points?

2. Build the demo agent:
   - Use `create_agent_from_prompt` with a detailed prompt tailored to their business
   - Add scraped content as knowledge
   - Identify and add 5-8 FAQs from their website
   - Deploy as widget: `deploy_widget`

3. Test the agent:
   - Run 3 quick test conversations using `chat_with_agent`:
     a) A typical customer question
     b) A lead capture scenario
     c) A question about their specific services
   - Note the best responses for the pitch

4. Generate pitch materials:

   ## Talking Points
   - "We've already built a working prototype for your business"
   - "It knows your services, your FAQ, and your pricing page"
   - "Here are 3 conversations it handled perfectly: [quotes]"
   - "This took us 5 minutes. Imagine what we can do with a full onboarding."

   ## Objection Handling
   - "What if it says something wrong?" → "We have human takeover built in"
   - "How much does this cost?" → [agency's pricing]
   - "Can it handle [X]?" → "Let me show you — ask it right now"

   ## Demo Script
   - Open the widget preview URL
   - Let the prospect type a question live
   - Show the knowledge base in the dashboard
   - Show the human takeover feature

5. Deliver:
   - Widget preview URL (send to prospect beforehand or show live)
   - Pitch talking points
   - Agent dashboard link for the full demo

The power move: the prospect sees their own business data in a working AI agent
before the meeting even starts.
```

---

### Skill 11: `/niche-research`

```yaml
---
name: niche-research
description: Research a business niche and generate an optimized agent template — system prompt, FAQs, tools, and deployment strategy.
argument-hint: [niche name, e.g., "dental clinics" or "real estate agents"]
allowed-tools: mcp__launchpath__*
context: fork
---

You are researching a business niche to create the optimal AI agent template.

1. Analyze the niche:
   - What are the top 10 questions customers ask in this niche?
   - What are the common pain points?
   - What tools would be most useful? (scheduling, email, CRM, etc.)
   - What tone works best? (dental = warm/reassuring, legal = professional, etc.)
   - What are the compliance/sensitivity considerations?

2. Build the template agent:
   - Use `create_agent_from_prompt` with a detailed niche-specific prompt
   - The prompt should include:
     a) Role definition specific to the niche
     b) Common scenarios and how to handle them
     c) Lead qualification questions relevant to the niche
     d) Compliance guardrails (e.g., "never give medical/legal advice")
     e) Escalation triggers (when to suggest human contact)

3. Add starter FAQs:
   - Call `add_faq` for each of the top 10 niche questions
   - Use generic but realistic answers (agency will customize per client)

4. Recommend tools:
   - List which Composio integrations are most relevant
   - Suggest webhook configurations (e.g., lead notifications)
   - Note which tools would need client-specific setup

5. Deliver the niche package:
   - Agent created and ready as a template
   - FAQ library added
   - Tool recommendations with setup notes
   - Deployment strategy: "For dental clinics, deploy as website widget.
     Average client has 50-100 conversations/month. Suggest $1,500/month retainer."
   - Content marketing angle: "Blog post: 'How AI Chat Reduces No-Shows by 30%'"

This is how an agency goes from "we build custom chatbots" to
"we are THE AI solution for [niche]." Niche dominance, not generalism.
```

---

### Skill 12: `/clone-for-client`

```yaml
---
name: clone-for-client
description: Duplicate an existing agent for a new client — copy the template, customize for their business, scrape their website, and deploy.
argument-hint: [source agent name] [new client website or name]
allowed-tools: mcp__launchpath__*
context: fork
---

You are cloning a proven agent template for a new client.

1. Get the source agent:
   - Call `list_agents` to find the source agent by name
   - Call `get_agent` to read its full config
   - Call `list_knowledge` to see what knowledge it has
   - Call `list_tools` to see what tools it uses

2. Create the new agent:
   - Call `create_agent` to create a blank agent
   - Call `update_agent` to copy over: system prompt, personality, model,
     tool guidelines from the source
   - Customize the name and description for the new client

3. Customize for the new client:
   - If a website URL was provided, call `scrape_website`
   - Replace any client-specific references in the system prompt
     (business name, phone number, address, etc.)
   - Ask the user for any client-specific details to add

4. Set up tools:
   - List what tools the source agent had
   - Note which ones need reconfiguration for the new client
   - "Source agent had Calendly integration — provide new Calendly link for this client"

5. Set up the client:
   - Call `create_client` with the new client's details
   - Call `create_campaign` linking the new agent
   - Call `deploy_widget` to deploy

6. Deliver:
   - New agent deployed with embed code
   - List of tools that need manual reconfiguration
   - "This agent is based on [source agent] which has handled X conversations
     successfully. The template is proven."

This is the agency scaling workflow: build one great agent, replicate it
for every client in the same niche.
```

---

### Skill 13: `/launchpath-guide` (Auto-Invoked)

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
- Generate client deliverables and reports

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

### Test and improve
- `/test-agent` — autonomous testing with simulated customers
- `/heal-agent` — find and fix issues from failed conversations
- `chat_with_agent` — quick manual test

### Scale your agency
- `/bulk-deploy` — onboard multiple clients at once
- `/clone-for-client` — replicate a proven agent for a new client
- `/niche-research` — build a template for a specific industry

### Win new business
- `/pitch-agent` — build a working demo before the sales call
- `/competitor-agent` — analyze and beat a competitor's chatbot
- `/client-handoff` — generate a professional delivery report

## Tips
- Always scrape the client's website before going live — it dramatically improves quality
- Use `/test-agent` after every change to catch issues before customers do
- Run `/heal-agent` weekly to continuously improve your agents
- Deploy as widget first — it's the fastest path to a working agent
- Create the client and campaign before deploying so conversations are properly tracked
- Use `/morning-briefing` daily to stay on top of your agency
```

---

## Summary Table

| # | Feature/Skill | Type | Effort | How Real | Ship In | Killer Factor |
|---|---------------|------|--------|----------|---------|---------------|
| 1 | `preview` — terminal chat | MCP Tool | 1-2 days | 100% | **v1** | Table stakes |
| 2 | `clone` — fork agents | MCP Tool | 3-4 days | 90% | **v1** | Network effect |
| 3 | `watch` — hot reload | MCP Tool | 1 day | 100% | **v1** | Dev workflow |
| 4 | `deploy` — one-command | MCP Tool | 2-3 days | 100% | **v1** | "It just works" |
| 5 | `replay` — conversation branch | MCP Tool | 2-3 days | 100% | **v1** | Unique debugger |
| 6 | `diff/rollback` — versioning | MCP Tool | 2-3 days | 100% | **v1** | Expected by devs |
| 7 | `compose` — multi-agent | MCP Tool | 2-3 days | 100% | **v1** | UX on existing |
| 8 | `live` — conversation feed | MCP Tool | 2-3 days | 100% | **v1** | "I built something real" |
| 9 | `handoff` — client report | MCP Tool | 2-3 days | 100% | **v1** | Agency money feature |
| 10 | `/test-agent` — autonomous QA | Skill | 0 days | 100% | **v1** | Claude IS the QA team |
| 11 | `metrics` — analytics | MCP Tool | 1 week | Partial | **v1.5** | Needs backend |
| 12 | `bench` — scoring framework | MCP Tool | 1-2 weeks | Partial | **v1.5** | Sells Pro tier |
| 13 | `voice` — voice testing | MCP Tool | 1-2 days | 100% | **v1** | Voice infra is platform prereq |
| 14 | `heal` — self-improvement | MCP Tool | 3-4 days | 90% | **v1.5** | Agents get smarter |
| 15 | `/deploy-agent` — full deploy flow | Skill | 0 days | 100% | **v1** | Flagship demo |
| 16 | `/setup-client` — client onboarding | Skill | 0 days | 100% | **v1** | Agency workflow |
| 17 | `/agent-report` — status report | Skill | 0 days | 100% | **v1** | Daily operations |
| 18 | `/heal-agent` — auto-fix | Skill | 0 days | 100% | **v1** | Self-improving agents |
| 19 | `/client-handoff` — delivery report | Skill | 0 days | 100% | **v1** | Justifies retainers |
| 20 | `/competitor-agent` — competitive demo | Skill | 0 days | 100% | **v1** | Sales weapon |
| 21 | `/morning-briefing` — daily summary | Skill | 0 days | 100% | **v1** | Agency owner habit |
| 22 | `/bulk-deploy` — multi-client onboard | Skill | 0 days | 100% | **v1** | Scaling workflow |
| 23 | `/pitch-agent` — sales prep | Skill | 0 days | 100% | **v1** | Walk in with a demo |
| 24 | `/niche-research` — industry template | Skill | 0 days | 100% | **v1** | Niche dominance |
| 25 | `/clone-for-client` — template reuse | Skill | 0 days | 100% | **v1** | Scale proven agents |
| 26 | `/launchpath-guide` — auto context | Skill | 0 days | 100% | **v1** | Claude just knows |

---

## What Makes This Insane

### Skills are free to build

Every Skill is a markdown file. Zero code. They're workflow instructions that tell Claude Code how to chain MCP tools together. The MCP tools do the work, the Skills provide the intelligence. This means:

- 13 Skills ship on day one at zero engineering cost
- Each Skill is a shareable workflow — users can fork and customize them
- New Skills can be added in minutes, not days
- Community can contribute Skills (open source plugin repo)

### The agency multiplier

A single agency owner with this plugin can:
1. **Morning:** Run `/morning-briefing` to see what needs attention
2. **Client call:** Run `/pitch-agent` before the meeting — walk in with a working demo
3. **Won the deal:** Run `/setup-client` to onboard them in 2 minutes
4. **Build phase:** Run `/deploy-agent` or `/clone-for-client` to create their agent
5. **QA:** Run `/test-agent` to verify quality before going live
6. **Weekly:** Run `/heal-agent` to improve agents from real conversation data
7. **Monthly:** Run `/client-handoff` to generate the retainer justification report
8. **Scale:** Run `/bulk-deploy` when onboarding 5 clients at once

That's a complete agency operating system, run from a terminal.

### v1 effort breakdown

- MCP server core + auth: 3 days (from main plan)
- MCP tools (15 API wrappers): 5 days (from main plan)
- Additional MCP tools (live, handoff, preview, etc.): 8-10 days
- Skills (13 markdown files): 1 day
- Plugin packaging + testing: 2 days
- **Total: ~3-4 weeks for everything in v1**

### v1.5 adds the "pro" features

- Metrics dashboard with real analytics: 1 week
- Bench scoring framework: 1-2 weeks
- Heal with auto-apply: 3-4 days
- **Total: ~2-3 weeks additional**

### Build order note

WhatsApp, SMS, and Voice channel infrastructure is built into LaunchPath BEFORE the MCP server. This means:
- All 5 channel types (widget, API, WhatsApp, SMS, voice) are available from MCP v1 day one
- `deploy --channel whatsapp/sms/voice` just works — same pattern as widget
- WhatsApp/SMS = webhook + send message (Twilio). Simple infra, not complex.
- Voice = Vapi/LiveKit handles STT/TTS, LaunchPath chat API is the brain
- The MCP server doesn't need to build any channel infrastructure — it wraps what already exists

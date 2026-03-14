# WhatsApp & SMS Campaign Channels — Technical Specification

> **Date:** March 13, 2026
> **Status:** Research & planning (no implementation yet)
> **Dependencies:** Campaigns, agent channels, Composio, credit system
> **Related:** `strategy-repositioning.md` (Priority 4: Additional Channels)

---

## Table of Contents

1. [Strategic Context](#1-strategic-context)
2. [Architecture Overview](#2-architecture-overview)
3. [WhatsApp Business API — How It Works](#3-whatsapp-business-api--how-it-works)
4. [Meta Account Connection](#4-meta-account-connection)
5. [Inbound Messages (Receiving)](#5-inbound-messages-receiving)
6. [Outbound Messages (Sending)](#6-outbound-messages-sending)
7. [24-Hour Session Window](#7-24-hour-session-window)
8. [Template Management & Approval](#8-template-management--approval)
9. [Template Syncing](#9-template-syncing)
10. [Sending Template Messages](#10-sending-template-messages)
11. [Contact Ingestion & Management](#11-contact-ingestion--management)
12. [Tagging & Segmentation](#12-tagging--segmentation)
13. [Follow-Up Sequences (Drip Campaigns)](#13-follow-up-sequences-drip-campaigns)
14. [CRM Integration](#14-crm-integration)
15. [Voice Notes & Media](#15-voice-notes--media)
16. [Response Delay & Humanisation](#16-response-delay--humanisation)
17. [Business Hours & Away Messages](#17-business-hours--away-messages)
18. [Conversation Initiation Models](#18-conversation-initiation-models)
19. [HITL on WhatsApp](#19-hitl-on-whatsapp)
20. [WhatsApp-Specific Features](#20-whatsapp-specific-features)
21. [Composio WhatsApp Tools](#21-composio-whatsapp-tools)
22. [Database Schema](#22-database-schema)
23. [API Routes](#23-api-routes)
24. [SMS — Duplicate Pattern](#24-sms--duplicate-pattern)
25. [WhatsApp Pricing & Cost Pass-Through](#25-whatsapp-pricing--cost-pass-through)
26. [Campaign Configuration — WhatsApp vs Widget](#26-campaign-configuration--whatsapp-vs-widget)
27. [Implementation Priority](#27-implementation-priority)
28. [Open Questions](#28-open-questions)

---

## 1. Strategic Context

### Why WhatsApp Matters

From `strategy-repositioning.md`: WhatsApp is listed as **Priority 4** under "Product: What Gets Added" and is a core differentiator in our positioning. The pricing table gates WhatsApp/SMS behind **Growth tier ($79/mo)** — "All channels" starts there.

Multi-channel deployment (widget, WhatsApp, SMS, voice) is referenced throughout the strategy doc as infrastructure that developers can't build in an afternoon — and that competitors like BMA had but we can do better with HITL, multi-model, and API-first design.

### Who This Serves

**Target buyer profiles and their WhatsApp use cases:**

| Profile | WhatsApp Use Case |
|---------|------------------|
| **Technical agency owner** (2-10 people) | Deploys AI agents for local business clients (dental, legal, HVAC) who already communicate with customers via WhatsApp |
| **Claude Code developer** | Programmatically deploys WhatsApp channels via API/MCP for client projects |
| **Freelancer-turned-agency** | Manages 3-5 clients who need appointment booking, lead follow-up, customer support via WhatsApp |
| **SaaS builder** | Embeds WhatsApp-based AI support into their product |

### Dependency Playbook Impact

WhatsApp channels deepen the dependency layers from the strategy doc:
- **Layer 1 (conversations flow through us):** WhatsApp conversations are stored in LaunchPath
- **Layer 3 (production integrations):** WhatsApp number is wired through LaunchPath — harder to migrate than a widget embed
- **Layer 4 (webhooks/CRM):** CRM sync, contact lists, sequences all configured in LaunchPath
- **New layer:** Contact lists and campaign history create data gravity that increases switching cost

---

## 2. Architecture Overview

### Current Architecture (Widget Only)

```
Campaign → Channel (type: widget) → Conversations (per session_id)
                                          ↓
                              Widget sends POST to /api/channels/[agentId]/chat
                              Token auth, rate limiting, CORS, streaming response
```

### WhatsApp Architecture

```
Campaign → Channel (type: whatsapp) → Conversations (per phone_number)
                                          ↓
                        ┌─────────────────┴──────────────────┐
                   INBOUND                              OUTBOUND
              Meta webhook pushes to              Agent reply sent via
          /api/webhooks/whatsapp              WhatsApp Cloud API
          Verify signature                     (direct or Composio)
          Route to correct channel
          Feed to agent via runAgentChat()
```

### How It Fits the Existing System

The current system is well-designed for extension:

- **DB:** `agent_channels.channel_type` has a CHECK constraint currently allowing `'widget' | 'api'`. Adding `'whatsapp'` (and `'sms'`) is a migration.
- **Conversations:** `channel_conversations` already uses `session_id` — for WhatsApp this becomes the sender's phone number.
- **HITL:** Conversation status system (`active`, `paused`, `human_takeover`, `closed`) works identically for WhatsApp — the agent route just sends replies via WhatsApp API instead of SSE stream.
- **Campaign lifecycle:** Same `draft → active → paused` flow. Deploying a WhatsApp campaign means verifying the Meta connection instead of generating an embed snippet.

---

## 3. WhatsApp Business API — How It Works

WhatsApp Business Platform uses the **WhatsApp Cloud API** hosted by Meta. Key concepts:

| Concept | Description |
|---------|-------------|
| **WhatsApp Business Account (WABA)** | The top-level business entity. Agencies create one per Meta Business Suite account. |
| **Phone Number ID** | Each registered WhatsApp Business phone number has a unique ID. Messages are sent/received through this. |
| **System User Access Token** | Long-lived token for API access. Created in Meta Business Suite. |
| **Webhook** | Meta pushes inbound messages and status updates to a configured webhook URL. |
| **Templates** | Pre-approved message formats required for initiating conversations outside the 24-hour window. |
| **Session Window** | 24-hour free-form messaging window that opens when a customer messages you. |

### Messaging Tiers (Sending Limits)

| Tier | Limit | How to Reach |
|------|-------|--------------|
| Unverified business | 250 unique contacts/24h | Default for new accounts |
| Tier 1 | 1,000 unique contacts/24h | Verify business |
| Tier 2 | 10,000 unique contacts/24h | Volume + quality |
| Tier 3 | 100,000 unique contacts/24h | Volume + quality |
| Tier 4 | Unlimited | Volume + quality |

Tier upgrades happen automatically when quality and volume thresholds are met.

### API Rate Limits

- **Message sending:** 80 messages/second per phone number (upgradable to 1,000/sec)
- **Business management API:** ~200 calls/hour per user token
- **Template limits:** 250 templates (unverified), 6,000 templates (verified)

---

## 4. Meta Account Connection

Agencies connect their own WhatsApp Business account to LaunchPath. This is the BYOA (Bring Your Own Account) model.

### What the Agency Provides

1. **WhatsApp Business Account ID** — from Meta Business Suite
2. **Phone Number ID** — the registered WhatsApp number
3. **System User Access Token** — long-lived API token
4. **Webhook Verify Token** — a shared secret for webhook verification

### Connection Flow in LaunchPath UI

```
1. Campaign → Add Channel → WhatsApp
2. "Connect your WhatsApp Business account"
3. Enter: WABA ID, Phone Number ID, Access Token
4. LaunchPath generates a unique Webhook URL:
   https://app.launchpath.dev/api/webhooks/whatsapp/{channelId}
5. Agency copies this URL into Meta Business Suite → WhatsApp → Configuration → Webhook
6. Agency enters the Verify Token shown in LaunchPath
7. LaunchPath verifies the connection by calling GET /v25.0/{PHONE_NUMBER_ID}
8. ✅ Connected — phone number, display name, and quality rating shown
```

### Why BYOA (Not Platform-Managed)

- **Speed:** No Meta Business Verification needed for LaunchPath itself
- **Control:** Agency owns their phone number and data
- **Compliance:** Agency handles their own WhatsApp Business Policy compliance
- **Billing:** Meta bills the agency directly for WhatsApp message costs
- **Isolation:** One agency's quality issues don't affect others

### Security

- Access tokens stored encrypted in `agent_channels.config` (same pattern as existing tool configs)
- Masked in UI as `••••last4` (same pattern as `mask-config.ts`)
- Webhook verify token stored hashed
- Webhook signature verification on every inbound request (X-Hub-Signature-256)

---

## 5. Inbound Messages (Receiving)

### Webhook Endpoint

```
POST /api/webhooks/whatsapp/{channelId}
GET  /api/webhooks/whatsapp/{channelId}  (verification challenge)
```

### Verification Challenge (GET)

When Meta sets up the webhook, it sends a verification request:

```
GET /api/webhooks/whatsapp/{channelId}
  ?hub.mode=subscribe
  &hub.verify_token={verify_token}
  &hub.challenge={challenge_string}
```

LaunchPath validates `hub.verify_token` against the stored verify token for this channel, then returns `hub.challenge` as plain text with 200 status.

### Inbound Message Processing (POST)

```
POST /api/webhooks/whatsapp/{channelId}
Headers:
  X-Hub-Signature-256: sha256={signature}
Body: {
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "{WABA_ID}",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "phone_number_id": "...", "display_phone_number": "..." },
        "contacts": [{ "profile": { "name": "John" }, "wa_id": "15551234567" }],
        "messages": [{
          "id": "wamid.xxx",
          "from": "15551234567",
          "timestamp": "1234567890",
          "type": "text",
          "text": { "body": "I'd like to book an appointment" }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Processing Flow

```
1. Verify X-Hub-Signature-256 (HMAC-SHA256 with app secret)
2. Parse message type (text, image, audio, video, document, location, contacts, interactive, button)
3. Look up channel by channelId → get agent_id, config
4. Check channel is_enabled and campaign status
5. Look up or create channel_conversation using sender phone as session_id
6. Check conversation status (active, paused, human_takeover, closed)
   - human_takeover → route to human agent (push notification), don't run AI
   - paused → store message, don't respond
   - closed → reopen conversation, run AI
7. Process media if applicable:
   - Audio/voice note → download → transcribe (Whisper) → feed text to agent
   - Image → download → feed to vision model (if enabled)
   - Document → download → extract text (if enabled)
   - Location → format as text coordinates
8. Run agent via runAgentChat() with the extracted text
9. Send agent response via WhatsApp Cloud API
10. Store message pair in channel_conversation.messages
11. Update campaign_contacts (last_replied_at, conversation_count)
12. Send read receipt (optional, based on config)
```

### Message Types Handled

| Inbound Type | Processing |
|-------------|------------|
| `text` | Direct → agent |
| `image` | Download media → vision model (if enabled) → agent gets description + original caption |
| `audio` | Download media → Whisper transcription → agent gets transcript |
| `video` | Download media → extract frame or caption → agent |
| `document` | Download media → OCR/text extraction → agent |
| `location` | Format as "Location: {name}, {lat},{lng}" → agent |
| `contacts` | Format as structured text → agent |
| `interactive` (button reply) | Extract button payload/text → agent |
| `interactive` (list reply) | Extract selected item → agent |

### Status Updates (Delivery Receipts)

Meta also sends status webhooks (same endpoint):
```json
{
  "statuses": [{
    "id": "wamid.xxx",
    "status": "delivered",  // sent, delivered, read, failed
    "timestamp": "...",
    "recipient_id": "15551234567"
  }]
}
```

Store these for message-level delivery tracking. Show in conversation view: ✓ sent, ✓✓ delivered, ✓✓ read (blue).

---

## 6. Outbound Messages (Sending)

### Two Sending Approaches

**1. Direct WhatsApp Cloud API (recommended for standard replies):**

```
POST https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "text",
  "text": { "body": "Your appointment is confirmed for 3pm tomorrow." }
}
```

Lower latency, fewer dependencies, full control over retry logic. Use for standard text replies from the agent.

**2. Composio WhatsApp tools (for rich message types):**

The AI agent has access to Composio WhatsApp tools and can decide to send:
- `WHATSAPP_SEND_INTERACTIVE_BUTTONS` — "Would you prefer morning or afternoon?" [Morning] [Afternoon]
- `WHATSAPP_SEND_INTERACTIVE_LIST` — Service selection menus
- `WHATSAPP_SEND_MEDIA` — Brochures, images, price lists
- `WHATSAPP_SEND_LOCATION` — Business location pin

The agent chooses the appropriate message format based on conversation context.

**Recommended hybrid approach:** Use direct API for standard text replies (fast, simple). Expose Composio tools to the agent for rich interactions (the agent decides when buttons/lists/media are appropriate).

### Typing Indicator

Before sending a response, send a typing indicator:

```json
POST /v25.0/{PHONE_NUMBER_ID}/messages
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "reaction",
  "status": "typing"
}
```

Combined with response delay (Section 16), this creates a human-like feel.

### Read Receipts

Mark messages as read (configurable per channel):

```json
POST /v25.0/{PHONE_NUMBER_ID}/messages
{
  "messaging_product": "whatsapp",
  "status": "read",
  "message_id": "wamid.xxx"
}
```

---

## 7. 24-Hour Session Window

This is the single most important constraint in WhatsApp Business API.

### Rules

1. **Customer sends a message** → a 24-hour service window opens
2. **During the window:** You can send unlimited free-form messages (text, media, interactive, etc.)
3. **Window resets** every time the customer sends a new message
4. **Window closes** 24 hours after the customer's last message
5. **After the window:** You can ONLY send pre-approved template messages
6. **Template delivery does NOT reopen the window** — only a customer reply does
7. **Click-to-WhatsApp ads:** Window extends to 72 hours

### What This Means for LaunchPath

Every conversation record needs to track:
```
last_customer_message_at: TIMESTAMPTZ  -- when the customer last messaged
session_window_expires_at: TIMESTAMPTZ -- last_customer_message_at + 24h
```

The agent reply logic must check:
```
IF now() < session_window_expires_at:
  → Send free-form message (agent's normal response)
ELSE:
  → Cannot send free-form message
  → Must use template OR wait for customer to message again
  → If template_fallback is configured, send the configured template
  → Otherwise, queue the response and notify the agency
```

### Template Fallback Configuration

In channel config:
```
Template fallback (outside 24-hour window):
  ☑ Automatically send re-engagement template
  Template: [Follow Up Template ▼]

  ☐ Queue response and notify agency
```

### Cost Implications

| Scenario | Cost |
|----------|------|
| Customer messages first, agent replies within 24h | **Free** (service conversation) |
| Business sends utility template within active session | **Free** |
| Business sends marketing template (initiating) | **Paid** (~$0.01-0.22 per message, varies by region) |
| Business sends utility template (initiating) | **Paid** (lower cost) |
| Business sends authentication template | **Paid** (lowest cost) |

---

## 8. Template Management & Approval

Agencies connect their own Meta account, so they already have templates OR they create new ones through LaunchPath.

### Template Structure

A WhatsApp message template has these components:

| Component | Required | Details |
|-----------|----------|---------|
| **HEADER** | Optional | TEXT (60 chars, 1 variable), IMAGE, VIDEO, DOCUMENT, or LOCATION |
| **BODY** | Required | Main text (up to 550 chars, multiple variables, supports bold/italic/strikethrough/monospace) |
| **FOOTER** | Optional | Short text (60 chars, no variables, rendered in grey) |
| **BUTTONS** | Optional | Up to 10 buttons: URL (2 max), PHONE_NUMBER (1 max), QUICK_REPLY (up to 10), COPY_CODE (1 max) |

### Variable Syntax

Variables use positional syntax: `{{1}}`, `{{2}}`, etc.

Meta also supports named parameters via `parameter_format: "NAMED"` where you use `{{param_name}}`.

Example body: `"Hi {{1}}, your appointment at {{2}} is confirmed for {{3}}. Reply YES to confirm or NO to reschedule."`

### Template Categories

| Category | Purpose | Opt-in Required | Pricing |
|----------|---------|-----------------|---------|
| **MARKETING** | Promotions, offers, newsletters, re-engagement, abandoned cart | Yes (explicit opt-in) | Most expensive |
| **UTILITY** | Transaction-related: confirmations, reminders, updates, alerts | Implicit via transaction | Mid-range; free within active session |
| **AUTHENTICATION** | OTPs, 2FA codes, password resets | Implied by user action | Lowest cost |

**Important 2025-2026 rules:**
- Meta auto-reclassifies templates to the correct category (you can't game it)
- Generic satisfaction surveys are MARKETING unless tied to a specific transaction
- Body exceeding 550 characters → rejected
- More than 10 emojis in body → rejected
- URL shorteners (bit.ly, etc.) in template content → rejected
- Variables that start or end the body ("dangling parameters") → rejected

### Template Approval Process

| Status | Meaning |
|--------|---------|
| `PENDING` | Under review (most approved in minutes via ML, up to 48h for human review) |
| `APPROVED` | Ready to send |
| `REJECTED` | Failed review — common reasons: policy violation, bad variable usage, category mismatch, spelling errors |
| `PAUSED` | Paused by Meta due to recurring negative user feedback |
| `DISABLED` | Disabled due to repeated negative feedback or policy violation |

**Common rejection reasons:**
- Requesting sensitive data (credit card numbers, PINs)
- Abusive, threatening, or explicit content
- Variables with special characters (#, $, %)
- Non-sequential variable numbering
- URL shorteners
- Category mismatch (marketing submitted as utility)
- Body > 550 characters or > 10 emojis
- Language mismatch

### Template Management API (Meta → LaunchPath)

**Create template:**
```
POST https://graph.facebook.com/v25.0/{WABA_ID}/message_templates
{
  "name": "appointment_reminder",
  "language": "en_US",
  "category": "UTILITY",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}}, this is a reminder for your {{2}} appointment on {{3}} at {{4}}. Reply CONFIRM to confirm or RESCHEDULE to change.",
      "example": { "body_text": [["Sarah", "dental cleaning", "March 15", "2:00 PM"]] }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        { "type": "QUICK_REPLY", "text": "Confirm" },
        { "type": "QUICK_REPLY", "text": "Reschedule" }
      ]
    }
  ]
}
```

**Important:** You must provide `example` values for any component containing variables, otherwise the template is rejected.

### Template Management in LaunchPath UI

```
Campaign → Templates tab
  ├── [Sync Templates] — pull existing templates from Meta (see Section 9)
  ├── [Create Template] — build a new template via UI
  │     ├── Name (lowercase, alphanumeric, underscores)
  │     ├── Category (Marketing / Utility / Authentication)
  │     ├── Language
  │     ├── Header (optional): text / image / video / document
  │     ├── Body: rich text editor with variable insertion ({{1}}, {{2}}, ...)
  │     ├── Footer (optional)
  │     ├── Buttons (optional): URL, phone, quick reply
  │     ├── Example values for each variable (required for approval)
  │     └── [Submit for Approval] → POST to Meta API
  ├── Template list:
  │     ├── appointment_reminder — APPROVED — Utility — en_US
  │     ├── welcome_offer — PENDING — Marketing — en_US
  │     ├── follow_up — REJECTED — Marketing — en_US [View reason]
  │     └── ...
  └── Status auto-refresh (poll every 60 seconds for PENDING templates)
```

---

## 9. Template Syncing

Since agencies connect their own Meta account, they likely already have templates. LaunchPath syncs these in.

### Sync Flow

```
1. Agency clicks [Sync Templates] in campaign template management
2. LaunchPath calls: GET https://graph.facebook.com/v25.0/{WABA_ID}/message_templates
3. Paginate through all templates (cursor-based pagination)
4. For each template:
   - If exists in LaunchPath by (name + language) → update status, components
   - If new → insert into whatsapp_templates table
   - If exists in LaunchPath but not in Meta → mark as deleted
5. Show sync summary: "Synced 23 templates (5 new, 2 updated, 1 removed)"
```

### Filter Options

The Meta API supports filtering:
```
GET /v25.0/{WABA_ID}/message_templates?status=APPROVED
GET /v25.0/{WABA_ID}/message_templates?category=MARKETING
GET /v25.0/{WABA_ID}/message_templates?name=appointment_reminder
```

### Auto-Sync

Optional: poll for template status changes every 5 minutes (for PENDING templates only). When a template moves from PENDING → APPROVED, update the local record and optionally notify the agency.

### Template Data Model

```sql
whatsapp_templates (
  id UUID PRIMARY KEY,
  channel_id UUID REFERENCES agent_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Meta identifiers
  meta_template_id TEXT,          -- Meta's template ID
  name TEXT NOT NULL,             -- lowercase, alphanumeric, underscores
  language TEXT NOT NULL,         -- e.g., "en_US"

  -- Classification
  category TEXT NOT NULL,         -- MARKETING, UTILITY, AUTHENTICATION
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED, PAUSED, DISABLED
  rejected_reason TEXT,
  quality_score TEXT,             -- GREEN, YELLOW, RED (from Meta)

  -- Content
  components JSONB NOT NULL,      -- Full component tree (header, body, footer, buttons)

  -- Variable mapping (for campaign sends)
  variable_mapping JSONB,         -- Maps variable positions to contact fields
                                  -- e.g., {"1": "name", "2": "custom_fields.service"}

  -- Tracking
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(channel_id, name, language)
)
```

### Variable Mapping

When sending template messages to a contact list, variables need to map to contact data. The `variable_mapping` field defines this:

```json
{
  "1": "name",
  "2": "custom_fields.service_interest",
  "3": "custom_fields.appointment_date",
  "4": "custom_fields.appointment_time"
}
```

This is configured in the UI when setting up a template send:

```
Template: appointment_reminder
Variables:
  {{1}} → [Contact Name ▼]
  {{2}} → [Custom: service_interest ▼]
  {{3}} → [Custom: appointment_date ▼]
  {{4}} → [Custom: appointment_time ▼]
```

---

## 10. Sending Template Messages

### Single Send (Agent-Initiated Re-engagement)

When the 24-hour window expires and the agent needs to follow up:

```
POST https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "template",
  "template": {
    "name": "follow_up",
    "language": { "code": "en_US" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Sarah" },
          { "type": "text", "text": "teeth whitening consultation" }
        ]
      }
    ]
  }
}
```

### Bulk Send (Campaign Blast)

For sending templates to a filtered contact list:

```
1. Agency selects template + audience filter (tags, status, etc.)
2. LaunchPath queries campaign_contacts matching the filter
3. For each contact:
   a. Resolve variable mapping (replace {{1}} with contact.name, etc.)
   b. Queue message for sending
4. Send messages with rate limiting (respect 80/sec per phone number)
5. Track delivery status per contact
6. Update contact.last_contacted_at
```

### Bulk Send Job Model

```sql
template_send_jobs (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  channel_id UUID REFERENCES agent_channels(id),
  user_id UUID REFERENCES auth.users(id),

  -- What to send
  template_id UUID REFERENCES whatsapp_templates(id),
  variable_mapping JSONB,        -- variable position → contact field

  -- Who to send to
  audience_filter JSONB,         -- { tags: ["new-lead"], status: "active", ... }
  total_contacts INT,

  -- Progress
  status TEXT DEFAULT 'pending', -- pending, sending, completed, failed, cancelled
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  replied_count INT DEFAULT 0,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,      -- null = send immediately
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
)
```

### Send Rate Management

- WhatsApp allows 80 messages/second per phone number
- For bulk sends, stagger at ~50/sec to stay safely under limit
- Honour the messaging tier (e.g., Tier 1 = 1,000 unique contacts/24h)
- Queue excess messages and resume next day if tier limit is hit
- Show progress bar in UI: "Sending: 450/1,200 (37%) — 3 failed"

---

## 11. Contact Ingestion & Management

### Contact Data Model

```sql
campaign_contacts (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Identity
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  profile_name TEXT,              -- from WhatsApp profile (auto-populated on first message)

  -- Tagging & Segmentation
  tags TEXT[] DEFAULT '{}',

  -- Source tracking
  source TEXT,                    -- 'csv', 'hubspot', 'ghl', 'manual', 'composio', 'inbound'
  source_id TEXT,                 -- external CRM ID for dedup

  -- Custom data from CRM
  custom_fields JSONB DEFAULT '{}',

  -- Consent & Status
  status TEXT DEFAULT 'active',   -- active, opted_out, invalid, blocked
  opted_in_at TIMESTAMPTZ,
  opted_out_at TIMESTAMPTZ,

  -- Conversation tracking
  last_contacted_at TIMESTAMPTZ,  -- last time we sent a message
  last_replied_at TIMESTAMPTZ,    -- last time they sent a message
  conversation_count INT DEFAULT 0,
  last_conversation_id UUID,      -- FK to channel_conversations

  -- Sequence tracking
  active_sequence_id UUID,        -- currently in a follow-up sequence
  sequence_step INT,              -- which step they're on
  sequence_paused BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(campaign_id, phone)      -- one record per phone per campaign
)
```

**Scoped to campaign:** A contact in "Teeth Whitening Campaign" is separate from the same phone in "Check-up Reminder Campaign." Different agents, different contexts, different sequences.

### Three Ingestion Methods

#### Method 1: CSV Upload (Manual, No Sync)

```
Campaign → Contacts → [Upload CSV]
  1. Select file
  2. Column mapping UI:
     Phone → column A
     Name → column B
     Email → column C
     Tags → column D (comma-separated)
     Custom fields → remaining columns
  3. Preview: "200 contacts to import (3 invalid phone numbers, 2 duplicates)"
  4. [Import] → upsert into campaign_contacts
```

#### Method 2: Inbound Webhook (Live CRM Sync)

LaunchPath exposes an ingest endpoint per campaign:

```
POST /api/campaigns/{campaignId}/contacts/ingest
Authorization: Bearer {api_key} or {campaign_token}
Content-Type: application/json

{
  "contacts": [
    {
      "phone": "+447123456789",
      "name": "John Smith",
      "email": "john@example.com",
      "tags": ["new-lead", "teeth-whitening"],
      "source": "hubspot",
      "source_id": "hubspot_contact_abc123",
      "custom_fields": {
        "service_interest": "whitening",
        "budget": "500",
        "appointment_date": "2026-03-20"
      }
    }
  ]
}

Response: {
  "imported": 18,
  "updated": 2,
  "skipped": 0,
  "errors": [{ "phone": "+invalid", "reason": "Invalid phone number format" }]
}
```

**Upsert logic:**
- If `source_id` exists for this campaign → update name, tags, custom_fields
- If `source_id` is new but `phone` exists → update (phone is natural key)
- If both new → insert

**How agencies wire this up (from their CRM side):**
- **GHL:** Workflow trigger "Contact Created" → HTTP action → POST to LaunchPath ingest endpoint
- **HubSpot:** Workflow "Contact enters list" → Webhook action → POST to LaunchPath
- **Salesforce:** Flow → HTTP Callout → POST to LaunchPath
- **Zapier/Make:** "New Contact in [CRM]" → "Webhooks by Zapier" → POST to URL
- **MCP/Claude Code:** Developer builds custom sync via API

LaunchPath doesn't need to know anything about the CRM. We expose an endpoint. They wire it up however they want. **This is the infrastructure pattern.**

**Auto-send on ingest** (optional campaign setting):
```
When new contact is ingested:
  ○ Do nothing (manual send later)
  ○ Automatically send template: [Welcome Template ▼]
  ○ Add to sequence: [Onboarding Sequence ▼]
```

This enables fully automated pipelines: CRM lead creation → webhook → LaunchPath ingest → auto-send WhatsApp template → contact replies → agent handles it.

#### Method 3: Composio CRM Pull (UI-Only Sync)

For agencies who want to import from inside LaunchPath without touching CRM automations:

```
Campaign → Contacts → [Import from CRM]
  1. Select connected Composio account (HubSpot, GHL, Salesforce, etc.)
  2. Select list/tag/filter from the CRM
  3. Preview contacts
  4. [Import] → pull via Composio (e.g., HUBSPOT_LIST_CONTACTS) → upsert
  5. Optional: schedule recurring sync (every N hours)
```

#### Automatic Ingestion: Inbound Conversations

When a new phone number messages the WhatsApp channel and isn't in `campaign_contacts`, auto-create a contact record:

```sql
INSERT INTO campaign_contacts (campaign_id, user_id, phone, profile_name, source, status)
VALUES ({campaignId}, {userId}, {senderPhone}, {whatsappProfileName}, 'inbound', 'active')
ON CONFLICT (campaign_id, phone) DO UPDATE SET
  profile_name = EXCLUDED.profile_name,
  last_replied_at = now(),
  conversation_count = campaign_contacts.conversation_count + 1;
```

This means the contact list grows organically from inbound conversations as well as CRM sync.

---

## 12. Tagging & Segmentation

### Why Tags (Not Lists or Segments)

Tags are simple, composable, and don't require a complex segment builder. An agency with 200 contacts and 5-10 tags can filter effectively without boolean logic builders.

### Tag Sources

| Source | How Tags Are Applied |
|--------|---------------------|
| **CRM sync** | Tags pushed with the contact data (e.g., GHL tags, HubSpot lists) |
| **CSV upload** | Tags column in the CSV |
| **Manual** | Agency adds/removes tags in the contact list UI |
| **Agent-assigned** | After a conversation, the agent auto-tags based on outcome |
| **Sequence events** | "Completed sequence" → auto-tag "sequence-completed" |

### Agent Auto-Tagging

Configure per campaign in the agent behaviour section:

```
Post-conversation auto-tagging:
  ☑ Enabled
  Rules:
    If outcome is "appointment booked" → add tag: "booked"
    If outcome is "not interested" → add tag: "cold"
    If outcome is "needs follow-up" → add tag: "follow-up"
    If outcome is "price enquiry" → add tag: "price-sensitive"
```

The agent extracts this from conversation context — it already understands the outcome. We just persist it as a tag on the contact record. This could be implemented as a system-prompt addition that instructs the agent to call a `tag_contact` tool at conversation end.

### Contact List UI

```
Campaign → Contacts

[Search] [Filter by tag ▼] [Filter by status ▼] [Upload CSV] [Import from CRM]

| Phone          | Name        | Tags                    | Last Contact | Status  | Actions    |
|----------------|-------------|-------------------------|--------------|---------|------------|
| +447123456789  | John Smith  | new-lead, whitening     | 2h ago       | Active  | [Edit] [→] |
| +447987654321  | Sarah Jones | booked                  | 1d ago       | Active  | [Edit] [→] |
| +447555123456  | Mike Brown  | cold                    | 3d ago       | Active  | [Edit] [→] |
| +447111222333  | —           | inbound                 | Just now     | Active  | [Edit] [→] |

Selected: 12 contacts
[Add Tag] [Remove Tag] [Send Template] [Add to Sequence] [Export]
```

### Campaign Send Targeting

When launching a template send or adding contacts to a sequence:

```
Send to: [Custom filter ▼]
  ├── All contacts (200)
  ├── Tagged: "new-lead" (50)
  ├── Tagged: "follow-up" (12)
  ├── Never contacted (80)
  ├── No reply to last message (45)
  ├── Contacted > 7 days ago (30)
  └── Custom: [tag selector] + [status selector] + [date range]
```

This is just a query filter on `campaign_contacts`:
- `WHERE tags @> ARRAY['new-lead']`
- `WHERE last_contacted_at IS NULL`
- `WHERE last_contacted_at IS NOT NULL AND last_replied_at IS NULL`
- `WHERE last_contacted_at < now() - interval '7 days'`

---

## 13. Follow-Up Sequences (Drip Campaigns)

### What a Sequence Is

A sequence is an automated series of template messages sent to a contact over time, with conditional logic based on whether they reply.

### Sequence Data Model

```sql
follow_up_sequences (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES agent_channels(id),
  user_id UUID REFERENCES auth.users(id),

  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- Sequence steps (ordered)
  steps JSONB NOT NULL,
  -- Example:
  -- [
  --   { "step": 1, "delay_hours": 0, "template_id": "uuid", "stop_on_reply": true },
  --   { "step": 2, "delay_hours": 48, "template_id": "uuid", "stop_on_reply": true },
  --   { "step": 3, "delay_hours": 168, "template_id": "uuid", "stop_on_reply": true }
  -- ]

  -- Entry conditions
  auto_enroll_tags TEXT[],        -- auto-enroll contacts with these tags
  auto_enroll_on_ingest BOOLEAN DEFAULT false,  -- auto-enroll new contacts from CRM sync

  -- Exit conditions
  stop_tags TEXT[],               -- remove from sequence if contact gets these tags (e.g., "booked")

  -- Stats
  enrolled_count INT DEFAULT 0,
  completed_count INT DEFAULT 0,
  replied_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### Contact Sequence State

```sql
contact_sequence_state (
  id UUID PRIMARY KEY,
  sequence_id UUID REFERENCES follow_up_sequences(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,

  current_step INT NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'active',   -- active, completed, stopped_reply, stopped_tag, paused, failed

  -- Timing
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  next_send_at TIMESTAMPTZ,       -- when to send the next step
  last_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Outcome
  stopped_reason TEXT,            -- "replied", "tagged:booked", "manual", "opted_out"

  UNIQUE(sequence_id, contact_id)
)
```

### Sequence Execution Flow

```
1. Contact is enrolled (manually, auto-enroll on tag, or auto-enroll on ingest)
2. Step 1 executed:
   a. Resolve template variables from contact data
   b. Send template message via WhatsApp Cloud API
   c. Update last_sent_at, advance current_step
   d. Calculate next_send_at = now() + step[2].delay_hours
3. Wait for delay period...
4. During wait, check for exit conditions:
   a. Contact replied? → stop_on_reply → mark "stopped_reply", hand off to agent
   b. Contact tagged with stop_tag? → mark "stopped_tag"
   c. Contact opted out? → mark "stopped_opted_out"
   d. Sequence deactivated? → pause all contacts
5. If no exit condition met → execute step 2
6. Repeat until all steps completed or exit condition met
```

### Sequence Processing (Background Job)

A background job runs every 1-5 minutes:

```sql
SELECT css.*, cs.phone, cs.name, cs.custom_fields, fs.steps, fs.channel_id
FROM contact_sequence_state css
JOIN campaign_contacts cs ON css.contact_id = cs.id
JOIN follow_up_sequences fs ON css.sequence_id = fs.id
WHERE css.status = 'active'
  AND css.next_send_at <= now()
  AND fs.is_active = true;
```

For each result: resolve template, send message, advance state.

### Example Sequence: Dental Clinic Re-engagement

```
Sequence: "Teeth Whitening Promo"
Entry: Auto-enroll contacts tagged "new-lead"
Exit: Stop if tagged "booked" or "opted-out"

Step 1 (immediately):
  Template: welcome_offer
  "Hi {{name}}, we're offering 20% off teeth whitening this month at {{clinic}}.
   Would you like to book a free consultation?"
  [Book Now] [Not Interested]
  → If reply → agent handles conversation

Step 2 (48 hours, if no reply):
  Template: follow_up_gentle
  "Hi {{name}}, just checking if you saw our teeth whitening offer.
   Happy to answer any questions!"
  [Tell Me More] [Not Now]
  → If reply → agent handles conversation

Step 3 (7 days, if no reply):
  Template: last_chance
  "Hi {{name}}, last chance for 20% off teeth whitening.
   Offer ends this week. Book here: {{booking_link}}"
  [Book Now]
  → If no reply → mark as cold, auto-tag "cold"
```

### Sequence UI

```
Campaign → Sequences

[Create Sequence]

| Name                    | Status | Enrolled | Replied | Completed | Actions      |
|-------------------------|--------|----------|---------|-----------|--------------|
| Teeth Whitening Promo   | Active | 45       | 12 (27%)| 28        | [Edit] [⏸]  |
| Check-up Reminder       | Active | 120      | 89 (74%)| 98        | [Edit] [⏸]  |
| New Patient Welcome     | Paused | 0        | 0       | 0         | [Edit] [▶]   |

Sequence Editor:
┌─────────────────────────────────────────────────────┐
│ Step 1: Send "welcome_offer" — Immediately          │
│   ☑ Stop sequence if contact replies                │
│                                                     │
│         ↓ Wait 48 hours (if no reply)               │
│                                                     │
│ Step 2: Send "follow_up_gentle"                     │
│   ☑ Stop sequence if contact replies                │
│                                                     │
│         ↓ Wait 7 days (if no reply)                 │
│                                                     │
│ Step 3: Send "last_chance"                          │
│   ☑ Stop sequence if contact replies                │
│   ☑ Auto-tag "cold" on completion (no reply)        │
│                                                     │
│ [+ Add Step]                                        │
│                                                     │
│ Entry: ☑ Auto-enroll contacts tagged: [new-lead]    │
│        ☑ Auto-enroll on CRM ingest                  │
│ Exit:  ☑ Stop if tagged: [booked] [opted-out]       │
└─────────────────────────────────────────────────────┘
```

---

## 14. CRM Integration

### Philosophy: Infrastructure, Not Integration

LaunchPath does NOT build direct CRM integrations. We provide:
1. **Ingest endpoint** — CRMs push contacts to us
2. **Webhook events** — we push events to CRMs (or anywhere)
3. **Composio tools** — the agent can write back to CRMs during conversations
4. **API** — developers build whatever custom sync they need

### Inbound: CRM → LaunchPath (Contact Ingestion)

See Section 11. The agency wires up a webhook from their CRM to our ingest endpoint. We receive contacts. That's it.

### Outbound: LaunchPath → CRM (Event-Driven)

Using the webhook/event system (Priority 3 from strategy doc):

**Events to fire:**
| Event | When | Payload |
|-------|------|---------|
| `whatsapp.message.received` | Customer sends a message | phone, name, message, channel_id |
| `whatsapp.conversation.started` | First message from a new contact | phone, name, profile_name |
| `whatsapp.conversation.completed` | Conversation closed (by agent or auto-close) | phone, transcript_summary, outcome, tags, extracted_fields |
| `whatsapp.contact.tagged` | Contact receives a new tag | phone, tag, source (agent/manual/sequence) |
| `whatsapp.sequence.replied` | Contact replied during a sequence | phone, sequence_name, step, message |
| `whatsapp.sequence.completed` | Contact finished sequence without replying | phone, sequence_name |
| `whatsapp.appointment.booked` | Agent booked an appointment (if appointment tool used) | phone, name, date, time, service |

The agency wires these webhooks to their CRM:
- `whatsapp.conversation.completed` → Create/update contact in HubSpot with outcome fields
- `whatsapp.appointment.booked` → Create calendar event in GHL
- `whatsapp.contact.tagged` with tag "booked" → Move contact to "Booked" pipeline stage

### Agent-as-CRM-Bridge (via Composio Tools)

The AI agent can write directly to the CRM during a conversation:

```
Customer: "Yes, I'd like to book the whitening treatment for next Tuesday"
Agent: [calls GOOGLE_CALENDAR_CREATE_EVENT tool]
Agent: [calls HUBSPOT_UPDATE_CONTACT tool with deal_stage: "booked"]
Agent: "Great! I've booked your teeth whitening for Tuesday at 2pm. You'll receive a confirmation shortly."
```

This is already supported by the existing Composio tool infrastructure. The agency just needs to:
1. Connect their CRM via Composio (existing flow)
2. Enable the relevant CRM tools on their agent (existing ToolsTab UI)
3. Configure the agent's system prompt to use CRM tools appropriately

### What We Build vs Don't Build

| Build | Don't Build |
|-------|-------------|
| Contact ingest webhook endpoint | Native HubSpot/GHL/Salesforce integrations |
| Webhook events for CRM push | Two-way field mapping UI |
| Contact data model with custom_fields | Complex segment/audience builders |
| Tag management | Deal/pipeline management |
| Composio CRM pull (optional UI path) | Direct CRM API integrations |
| Auto-tag from agent conversations | Manual conversation scoring |

---

## 15. Voice Notes & Media

### Voice Notes (Killer Feature)

Voice notes are extremely common on WhatsApp, especially for local business customers. Handling them well is a significant differentiator.

**Inbound voice notes:**
1. Meta webhook delivers audio message with media ID
2. Download audio: `GET https://graph.facebook.com/v25.0/{MEDIA_ID}` → get URL → download
3. Transcribe via Whisper (or equivalent model)
4. Feed transcription to agent as text: `"[Voice note transcription]: I'd like to book an appointment for next week"`
5. Store both the media URL and transcription in conversation history
6. Display in conversation view: 🎤 voice note player + transcript below

**Outbound voice notes (optional, high differentiation):**
1. Agent generates text response
2. TTS model converts to audio (ElevenLabs, OpenAI TTS, etc.)
3. Upload audio to WhatsApp: `POST /v25.0/{PHONE_NUMBER_ID}/media`
4. Send as audio message: `WHATSAPP_SEND_MEDIA` with type "audio"
5. Configurable per channel (on/off, voice selection)

**Configuration:**
```
Voice Notes:
  Inbound:
    ☑ Transcribe voice notes (using Whisper)
    Transcription model: [openai/whisper-1 ▼]

  Outbound:
    ☐ Reply with voice notes
    TTS model: [elevenlabs/rachel ▼]
    Voice: [Professional Female ▼]
```

### Image Handling

**Inbound images:**
1. Download image from Meta
2. If vision model enabled → feed to multimodal model for description/analysis
3. Agent receives: `"[Image received]: Customer sent a photo showing {description}"`
4. Store image URL in conversation history

**Outbound images:**
- Agent can send images via `WHATSAPP_SEND_MEDIA` (brochures, product photos, before/after)
- Could also send from knowledge base assets

### Document Handling

**Inbound documents:**
1. Download document
2. If text extraction enabled → OCR/parse
3. Feed extracted text to agent
4. Store document URL in conversation history

**Outbound documents:**
- Agent can send PDFs, price lists, invoices via `WHATSAPP_SEND_MEDIA`

---

## 16. Response Delay & Humanisation

WhatsApp users expect human-like timing. Instant responses feel robotic and can reduce trust.

### Configuration

```
Response timing:
  ☑ Add human-like delay
  Minimum delay: [1] seconds
  Maximum delay: [5] seconds
  ☑ Scale delay with response length (longer response = longer "typing")
  ☑ Send typing indicator before responding
  ☑ Mark messages as read before responding
  Read receipt delay: [1] seconds
```

### Implementation

```
1. Receive inbound message
2. Wait read_receipt_delay → send read receipt (message marked as "read")
3. Process message through agent (this takes 1-5 seconds naturally)
4. Calculate typing_delay:
   - base = random(min_delay, max_delay)
   - if scale_with_length: base += (response_length / 50) * 0.5  // ~0.5s per 50 chars
   - cap at 15 seconds total
5. Send typing indicator
6. Wait max(0, typing_delay - agent_processing_time)  // don't double-delay
7. Send response
```

### Why This Matters

- Local business customers are accustomed to human-speed WhatsApp replies
- Too fast = feels like a bot = lower trust = lower conversion
- The sweet spot is 2-8 seconds for short messages, 5-15 seconds for longer ones
- Typing indicator ("typing...") creates anticipation, mimics human behaviour

---

## 17. Business Hours & Away Messages

### Configuration

```
Business hours:
  ☑ Enable business hours
  Timezone: [Europe/London ▼]

  Monday:    [09:00] - [17:30]
  Tuesday:   [09:00] - [17:30]
  Wednesday: [09:00] - [17:30]
  Thursday:  [09:00] - [17:30]
  Friday:    [09:00] - [17:00]
  Saturday:  [10:00] - [14:00]
  Sunday:    Closed

  Outside hours behaviour:
    ○ Don't respond (queue for business hours)
    ○ Send away message, then queue
    ○ Agent responds normally (24/7)

  Away message: "Thanks for reaching out! Our office hours are Mon-Fri 9am-5:30pm.
                 We'll get back to you first thing. For emergencies, call 0800 123 456."
```

### Implementation

```
1. Receive inbound message
2. Check if current time (in configured timezone) is within business hours
3. If within hours → normal agent processing
4. If outside hours:
   a. "Don't respond" → store message, mark for morning processing
   b. "Away message" → send away message, store for morning processing
   c. "Agent responds normally" → process as usual (default for 24/7 businesses)
5. Morning processing job: at business hours start, process queued messages
```

---

## 18. Conversation Initiation Models

### Model A: Customer-Initiated (Reactive)

The "widget equivalent" for WhatsApp. Customer messages the business number, agent responds.

**Flow:**
```
Customer sends WhatsApp message → webhook → agent processes → reply
```

**Use cases:** Customer support, enquiries, booking requests.

**Implementation:** This is the base case. Same as widget chat but via WhatsApp transport.

### Model B: Business-Initiated (Proactive)

The agency reaches out first using template messages.

**Flow:**
```
Agency selects contacts → sends template message → customer replies → agent takes over
```

**Use cases:** Lead nurturing, appointment reminders, re-engagement, promotions.

**Implementation:** Template send jobs (Section 10) + sequence engine (Section 13).

**The key difference:** This is where WhatsApp campaigns fundamentally differ from widget campaigns. Widgets are passive (embed and wait). WhatsApp campaigns can be proactive (reach out to contacts, run sequences, follow up).

### Model C: Hybrid (Most Common)

Contacts enter from CRM sync (proactive trigger) AND from inbound messages (reactive).

**Flow:**
```
CRM creates lead → webhook → contact ingested → template sent → customer replies → agent handles
                                                                                        ↓
                                                                        outcome extracted → CRM updated
```

Meanwhile, customers also message the number directly and are handled by the agent without being part of a sequence.

---

## 19. HITL on WhatsApp

Human-in-the-loop works the same way as the widget, with minor transport differences.

### Flow

```
1. Agent handling conversation via WhatsApp
2. Agent can't handle query OR auto-escalation keyword detected
3. Conversation status → "human_takeover"
4. Portal notification: "WhatsApp conversation needs human attention"
5. Human agent views conversation in PortalConversationView (same UI as widget)
6. Human types response in portal → sent via WhatsApp Cloud API (not SSE)
7. Customer replies on WhatsApp → webhook → routed to human (not AI agent)
8. Human resolves → sets status back to "active" → AI agent resumes
```

### Key Difference from Widget HITL

- **Widget:** Human response injected into SSE stream, widget polls for new messages
- **WhatsApp:** Human response sent via WhatsApp Cloud API, customer sees it as a normal WhatsApp message
- **Same portal UI**, different transport layer

### HITL WhatsApp-Specific Features

- Human can send voice notes (record in portal → TTS → send as audio)
- Human can send images, documents (upload in portal → send via media API)
- Human can send interactive buttons/lists (pre-configured quick response templates)
- Conversation handback: human can add notes visible to AI agent for context continuity

---

## 20. WhatsApp-Specific Features

### Delivery Status Tracking

Show message delivery status in conversation view:
- ✓ Sent (received by Meta servers)
- ✓✓ Delivered (received by customer's phone)
- ✓✓ Read (customer opened the message) — shown in blue

### Interactive Message Types

The AI agent can choose to send these based on conversation context:

**Quick Reply Buttons (up to 3):**
```
Agent: "Would you prefer a morning or afternoon appointment?"
[Morning] [Afternoon] [Check Availability]
```

**List Messages (up to 10 sections, 10 items each):**
```
Agent: "Which service are you interested in?"
┌─────────────────────┐
│ Dental Services     │
│ ├── Teeth Whitening │
│ ├── Dental Cleaning │
│ └── Check-up        │
│ Cosmetic Services   │
│ ├── Veneers         │
│ └── Braces          │
└─────────────────────┘
```

**Location Messages:**
```
Agent: "Here's our clinic location:"
📍 Bright Smile Dental
   123 High Street, London EC1A 1BB
   [Open in Maps]
```

**Contact Card Messages:**
```
Agent: "Here's our receptionist's contact:"
👤 Sarah Johnson
   📞 020 1234 5678
   ✉️ reception@brightsmile.com
```

### Opt-Out Handling

WhatsApp requires businesses to honour opt-out requests.

```
Customer: "STOP" or "Unsubscribe" or "Don't message me"
  → Auto-detect opt-out intent (keyword list + AI detection)
  → Set contact status to "opted_out"
  → Remove from all active sequences
  → Send confirmation: "You've been unsubscribed. You won't receive further messages."
  → Never message this contact again (unless they re-initiate)
```

### Contact Profile Enrichment

WhatsApp provides profile information:
- Profile name (auto-populated on first message)
- Profile picture URL (if public)
- Phone number (verified, real)

This data auto-populates the `campaign_contacts` record.

---

## 21. Composio WhatsApp Tools

### Available Actions (17 Total)

**Messaging (8 actions):**
| Action Slug | Description |
|---|---|
| `WHATSAPP_SEND_MESSAGE` | Send a text message |
| `WHATSAPP_SEND_TEMPLATE_MESSAGE` | Send a pre-approved template message |
| `WHATSAPP_SEND_MEDIA` | Send media (image/video/audio/doc) via URL |
| `WHATSAPP_SEND_MEDIA_BY_ID` | Send media using a previously uploaded media ID |
| `WHATSAPP_SEND_INTERACTIVE_BUTTONS` | Send message with 1-3 reply buttons |
| `WHATSAPP_SEND_INTERACTIVE_LIST` | Send interactive list menu |
| `WHATSAPP_SEND_LOCATION` | Send a location pin with coordinates |
| `WHATSAPP_SEND_CONTACTS` | Send contact card(s) |

**Media Management (2 actions):**
| Action Slug | Description |
|---|---|
| `WHATSAPP_UPLOAD_MEDIA` | Upload files to WhatsApp servers |
| `WHATSAPP_GET_MEDIA_INFO` | Get metadata and temporary download URL |

**Template Management (4 actions):**
| Action Slug | Description |
|---|---|
| `WHATSAPP_CREATE_MESSAGE_TEMPLATE` | Create a new message template |
| `WHATSAPP_DELETE_MESSAGE_TEMPLATE` | Delete an existing template |
| `WHATSAPP_GET_MESSAGE_TEMPLATES` | List templates with filtering |
| `WHATSAPP_GET_TEMPLATE_STATUS` | Check template approval status |

**Account/Phone Info (3 actions):**
| Action Slug | Description |
|---|---|
| `WHATSAPP_GET_PHONE_NUMBERS` | List all registered phone numbers |
| `WHATSAPP_GET_PHONE_NUMBER` | Get details for a specific number |
| `WHATSAPP_GET_BUSINESS_PROFILE` | Retrieve business profile info |

### Trigger (Limited)

Only one trigger: `WHATSAPP_MESSAGE_STATUS_UPDATED_TRIGGER` — monitors delivery status changes (sent, delivered, read, failed). **No inbound message trigger.**

### How Composio Fits

| Use Case | Approach |
|----------|----------|
| **Receiving messages** | Direct Meta webhook (NOT Composio — no trigger available) |
| **Standard text replies** | Direct WhatsApp Cloud API (lower latency, simpler) |
| **Rich replies (buttons, lists, media)** | Composio tools exposed to agent (agent decides format) |
| **Template management** | Direct API or Composio `WHATSAPP_GET_MESSAGE_TEMPLATES` |
| **Media upload** | Composio `WHATSAPP_UPLOAD_MEDIA` or direct API |

**Recommended:** Hybrid approach. Direct API for core message flow (inbound webhook, outbound text replies). Composio tools available to the agent for rich interactions.

---

## 22. Database Schema

### Migration: Expand Channel Types

```sql
-- Add whatsapp and sms to channel_type CHECK constraint
ALTER TABLE agent_channels DROP CONSTRAINT agent_channels_channel_type_check;
ALTER TABLE agent_channels ADD CONSTRAINT agent_channels_channel_type_check
  CHECK (channel_type IN ('widget', 'api', 'whatsapp', 'sms'));
```

### New Table: whatsapp_templates

```sql
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES agent_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  meta_template_id TEXT,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en_US',

  category TEXT NOT NULL CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED')),
  rejected_reason TEXT,
  quality_score TEXT,

  components JSONB NOT NULL,
  variable_mapping JSONB DEFAULT '{}',

  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(channel_id, name, language)
);
```

### New Table: campaign_contacts

```sql
CREATE TABLE campaign_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  profile_name TEXT,

  tags TEXT[] DEFAULT '{}',

  source TEXT,
  source_id TEXT,
  custom_fields JSONB DEFAULT '{}',

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'opted_out', 'invalid', 'blocked')),
  opted_in_at TIMESTAMPTZ,
  opted_out_at TIMESTAMPTZ,

  last_contacted_at TIMESTAMPTZ,
  last_replied_at TIMESTAMPTZ,
  conversation_count INT DEFAULT 0,
  last_conversation_id UUID REFERENCES channel_conversations(id),

  active_sequence_id UUID,
  sequence_step INT,
  sequence_paused BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(campaign_id, phone)
);

CREATE INDEX idx_campaign_contacts_tags ON campaign_contacts USING gin(tags);
CREATE INDEX idx_campaign_contacts_status ON campaign_contacts(campaign_id, status);
CREATE INDEX idx_campaign_contacts_source ON campaign_contacts(campaign_id, source_id);
```

### New Table: follow_up_sequences

```sql
CREATE TABLE follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES agent_channels(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,

  steps JSONB NOT NULL DEFAULT '[]',

  auto_enroll_tags TEXT[],
  auto_enroll_on_ingest BOOLEAN DEFAULT false,
  stop_tags TEXT[],

  enrolled_count INT DEFAULT 0,
  completed_count INT DEFAULT 0,
  replied_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### New Table: contact_sequence_state

```sql
CREATE TABLE contact_sequence_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES follow_up_sequences(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES campaign_contacts(id) ON DELETE CASCADE,

  current_step INT NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'stopped_reply', 'stopped_tag', 'paused', 'failed')),

  enrolled_at TIMESTAMPTZ DEFAULT now(),
  next_send_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  stopped_reason TEXT,

  UNIQUE(sequence_id, contact_id)
);

CREATE INDEX idx_sequence_state_next_send ON contact_sequence_state(next_send_at)
  WHERE status = 'active';
```

### New Table: template_send_jobs

```sql
CREATE TABLE template_send_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  channel_id UUID NOT NULL REFERENCES agent_channels(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  template_id UUID NOT NULL REFERENCES whatsapp_templates(id),
  variable_mapping JSONB,

  audience_filter JSONB,
  total_contacts INT NOT NULL,

  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'completed', 'failed', 'cancelled')),
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  replied_count INT DEFAULT 0,

  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Extend: channel_conversations metadata

Add WhatsApp-specific fields to conversation metadata:
```json
{
  "whatsapp": {
    "profile_name": "John Smith",
    "phone": "+447123456789",
    "last_customer_message_at": "2026-03-13T10:30:00Z",
    "session_window_expires_at": "2026-03-14T10:30:00Z",
    "message_statuses": {
      "wamid.xxx": "read",
      "wamid.yyy": "delivered"
    }
  }
}
```

---

## 23. API Routes

### Webhook (Public)

```
GET  /api/webhooks/whatsapp/[channelId]     — Meta verification challenge
POST /api/webhooks/whatsapp/[channelId]     — Inbound messages + status updates
```

### Contact Management (Authenticated)

```
GET    /api/campaigns/[campaignId]/contacts              — List contacts (with filtering)
POST   /api/campaigns/[campaignId]/contacts              — Create single contact
POST   /api/campaigns/[campaignId]/contacts/ingest       — Bulk ingest (CRM sync endpoint)
POST   /api/campaigns/[campaignId]/contacts/upload       — CSV upload
PATCH  /api/campaigns/[campaignId]/contacts/[contactId]  — Update contact
DELETE /api/campaigns/[campaignId]/contacts/[contactId]  — Delete contact
POST   /api/campaigns/[campaignId]/contacts/bulk-tag     — Add/remove tags in bulk
```

### Template Management (Authenticated)

```
GET    /api/campaigns/[campaignId]/templates             — List templates
POST   /api/campaigns/[campaignId]/templates             — Create template (submit to Meta)
POST   /api/campaigns/[campaignId]/templates/sync        — Sync templates from Meta
DELETE /api/campaigns/[campaignId]/templates/[templateId] — Delete template
GET    /api/campaigns/[campaignId]/templates/[templateId]/status — Check approval status
```

### Template Sends (Authenticated)

```
POST   /api/campaigns/[campaignId]/sends                 — Create send job (blast/schedule)
GET    /api/campaigns/[campaignId]/sends                 — List send jobs
GET    /api/campaigns/[campaignId]/sends/[sendId]        — Get send job status/progress
DELETE /api/campaigns/[campaignId]/sends/[sendId]        — Cancel send job
```

### Sequences (Authenticated)

```
GET    /api/campaigns/[campaignId]/sequences             — List sequences
POST   /api/campaigns/[campaignId]/sequences             — Create sequence
PATCH  /api/campaigns/[campaignId]/sequences/[seqId]     — Update sequence
DELETE /api/campaigns/[campaignId]/sequences/[seqId]     — Delete sequence
POST   /api/campaigns/[campaignId]/sequences/[seqId]/enroll — Enroll contacts
POST   /api/campaigns/[campaignId]/sequences/[seqId]/pause  — Pause sequence
```

### Portal Routes (Client Access)

```
GET    /api/portal/campaigns/[campaignId]/contacts       — View contacts (read-only or admin)
GET    /api/portal/campaigns/[campaignId]/templates       — View templates
GET    /api/portal/campaigns/[campaignId]/sends           — View send history
GET    /api/portal/campaigns/[campaignId]/sequences       — View sequences
```

---

## 24. SMS — Duplicate Pattern

Once WhatsApp is built, SMS is a simplified version using the same abstractions.

### WhatsApp vs SMS Comparison

| Aspect | WhatsApp | SMS (via Twilio) |
|--------|----------|------------------|
| Inbound webhook | Meta webhook | Twilio webhook |
| Outbound | WhatsApp Cloud API | Twilio SMS API |
| Rich media | Full support (images, video, audio, docs) | MMS only (limited, US/CA mainly) |
| Voice notes | Yes | No |
| Interactive elements | Buttons, lists, contacts, location | No |
| Session window | 24-hour rule | No restriction |
| Templates | Required for business-initiated | No (but carrier compliance: A2P 10DLC) |
| Identity | Phone number | Phone number |
| Response delay | Important (humanisation) | Same |
| Delivery receipts | Sent, delivered, read | Sent, delivered only |
| Cost | Per-message (Meta) | Per-segment (Twilio, ~$0.0079/msg US) |
| Opt-out | Manual handling required | Twilio auto-handles STOP/UNSUBSCRIBE |
| Global reach | 2B+ users worldwide | Universal (every phone) |

### What SMS Shares with WhatsApp

The channel abstraction layer means SMS shares:
- Campaign contacts table and ingestion endpoints
- Follow-up sequences engine
- Tag management
- CRM sync (same ingest endpoint)
- HITL system
- Conversation storage
- Analytics
- Portal views

### What SMS Needs Differently

- **Twilio webhook endpoint:** `POST /api/webhooks/sms/[channelId]` (different payload format)
- **Twilio outbound:** `POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json`
- **SMS channel config:** Twilio Account SID, Auth Token, From Number
- **A2P 10DLC registration** (US requirement for business SMS)
- **Character limits:** 160 chars per segment (longer = multiple segments = higher cost)
- **No templates required** but compliance rules exist (carrier filtering)

### Implementation

Once WhatsApp channels are built, SMS is essentially:
1. New webhook handler for Twilio format
2. New send function using Twilio API
3. SMS-specific channel config (Twilio credentials)
4. Remove media/interactive features (or map to MMS where supported)
5. Everything else (contacts, sequences, tags, CRM sync) is shared

---

## 25. WhatsApp Pricing & Cost Pass-Through

### Meta's Pricing Model (Post-July 2025)

**Free messaging:**
- All service messages (customer-initiated, within 24h window) → **FREE, unlimited**
- Utility templates sent within an active 24h service window → **FREE**
- First 1,000 service conversations per month → **FREE** (legacy, now all are free)

**Paid messaging (per delivered template message):**

| Category | Example Rate (UK) | Example Rate (US) | Example Rate (India) |
|----------|-------------------|--------------------|--------------------|
| Marketing | ~£0.09-0.14 | ~$0.025 | ~$0.016 |
| Utility | ~£0.04 | ~$0.015 | ~$0.004 |
| Authentication | ~£0.04 | ~$0.015 | ~$0.004 |

Rates vary significantly by country. Meta bills the agency directly since they use their own WABA.

### LaunchPath Cost Model

Since agencies connect their own Meta account, **Meta bills them directly** for WhatsApp message costs. LaunchPath does NOT handle WhatsApp message billing.

LaunchPath charges for:
- **AI credits consumed** by the agent processing conversations (same as widget)
- **Transcription credits** for voice notes (Whisper API cost)
- **Vision credits** for image analysis (multimodal model cost)
- **TTS credits** for voice note replies (if enabled)

**This is clean separation:** Meta handles message delivery costs. LaunchPath handles AI processing costs.

---

## 26. Campaign Configuration — WhatsApp vs Widget

| Feature | Widget Campaign | WhatsApp Campaign |
|---------|----------------|-------------------|
| **Deployment** | Embed snippet on website | Connect WhatsApp Business number |
| **Session identity** | Random UUID (anonymous) | Phone number (persistent, real) |
| **Conversation initiation** | User opens widget | Customer messages OR business sends template |
| **Proactive outreach** | Greeting bubble only | Template messages to contact lists |
| **Media support** | File upload (user→agent only) | Bidirectional (images, video, audio, voice notes, docs) |
| **Rich interactions** | Text only | Buttons, lists, locations, contacts |
| **Response timing** | Instant (expected) | Delayed/humanised (expected) |
| **Business hours** | N/A (always on) | Away messages, scheduled responses |
| **HITL** | Same — status-based gating | Same — replies via WhatsApp API |
| **CSAT** | Post-chat survey widget | Interactive button rating or follow-up template |
| **Identity** | Anonymous (optional pre-chat form) | Known phone number + profile |
| **Template messages** | N/A | Required outside 24-hour window |
| **Follow-up sequences** | N/A | Drip campaigns with conditional logic |
| **Contact management** | N/A | Full contact list with tags, CRM sync |
| **CRM integration** | Webhooks only | Webhooks + contact ingest + agent tools |
| **Delivery tracking** | N/A | Sent, delivered, read receipts |
| **Opt-out** | Close button | Legal requirement, auto-detection |

---

## 27. Implementation Priority

| # | Feature | Priority | Complexity | Notes |
|---|---------|----------|------------|-------|
| 1 | DB migrations (channel types, contacts, templates, sequences) | P0 | Medium | Foundation for everything |
| 2 | Meta webhook endpoint (inbound messages) | P0 | Medium | Core receive path |
| 3 | WhatsApp outbound (text replies via direct API) | P0 | Low | Core send path |
| 4 | WhatsApp channel config UI (connection flow) | P0 | Medium | How agencies connect their number |
| 5 | Template syncing (pull from Meta) | P0 | Low | Agencies already have templates |
| 6 | Template management UI (create, view status) | P0 | Medium | Create new templates |
| 7 | Contact ingestion (CSV upload) | P0 | Low | Basic contact import |
| 8 | Contact ingest webhook endpoint (CRM sync) | P0 | Low | Live CRM push |
| 9 | Template sending (single + bulk) | P0 | Medium | Outbound campaigns |
| 10 | 24-hour window tracking + template fallback | P0 | Medium | WhatsApp compliance |
| 11 | Contact list UI (view, filter, tag) | P1 | Medium | Contact management |
| 12 | Follow-up sequences (drip engine) | P1 | High | Automated follow-ups |
| 13 | Response delay + typing indicator | P1 | Low | Humanisation |
| 14 | Voice note transcription (Whisper) | P1 | Medium | Handle audio messages |
| 15 | Delivery status tracking (sent/delivered/read) | P1 | Low | Status in conversation view |
| 16 | Rich message types (buttons, lists via Composio) | P2 | Medium | Agent uses interactive messages |
| 17 | Business hours / away messages | P2 | Low | Schedule-based responses |
| 18 | Image handling (vision model) | P2 | Medium | Process incoming images |
| 19 | Agent auto-tagging | P2 | Medium | Outcome-based tagging |
| 20 | Webhook events for CRM push | P2 | Low | Outbound event notifications |
| 21 | Composio CRM pull (import from CRM UI) | P2 | Low | UI-based CRM import |
| 22 | Opt-out handling | P2 | Low | Compliance |
| 23 | Voice note TTS replies | P3 | Medium | High differentiation, high cost |
| 24 | SMS channel (Twilio) | P3 | Medium | Duplicate WhatsApp pattern |
| 25 | Native CRM integrations | **Never** | High | Use Composio + webhooks instead |

---

## 28. Open Questions

1. **Sequence processing:** Background job via cron/setTimeout (simple, Vercel-unfriendly) vs external queue (BullMQ, Inngest, Vercel Cron)? Sequences need reliable, timed execution.

2. **Multi-language templates:** Support creating templates in multiple languages for the same campaign? Or one language per campaign?

3. **Contact limits per tier:** How many contacts per campaign per pricing tier? (e.g., Starter: 500, Growth: 5,000, Agency: 50,000, Scale: unlimited)

4. **WhatsApp testing:** Meta requires test phone numbers during development. Need a sandbox/test mode in LaunchPath?

5. **Voice note cost:** Whisper transcription costs ~$0.006/minute. Pass through as credits or absorb? At scale (thousands of voice notes/month), this adds up.

6. **Portal access:** Should client portal users be able to manage contacts and sequences? Or agency-only?

7. **Shared contacts across campaigns:** Should contacts be campaign-scoped (current design) or account-scoped with campaign membership? Account-scoped allows a global contact database but adds complexity.

8. **Auto-send on ingest:** Is this safe to enable by default? Risk of accidentally messaging contacts who haven't opted in. Probably should require explicit opt-in confirmation per contact.

9. **Sequence timing:** Should sequences respect business hours? (e.g., don't send step 2 at 3am even if 48 hours have elapsed — wait until next business hours window)

10. **WhatsApp + Widget on same campaign:** Should a campaign support multiple channel types simultaneously? (e.g., widget on website + WhatsApp for follow-up). Or one channel type per campaign?

# WhatsApp Campaign Builder — Audit Implementation Plan

> All findings from the comprehensive audit, organized into 6 phases by priority and dependency order.

---

## Phase 1: Critical Security & Data Integrity (5 items)

These must be fixed first — they cause data loss, duplicate messages, or auth bypass.

### 1.1 Concurrency Guard on Edge Functions (CRITICAL)

**Problem:** `template-sends/index.ts` and `sequence-processor/index.ts` have no concurrency protection. If pg_cron fires while a previous invocation is still running, the same messages/sequences get processed twice → duplicate WhatsApp sends.

**Files:**
- `supabase/functions/template-sends/index.ts`
- `supabase/functions/sequence-processor/index.ts`

**Fix:**
- Add `pg_advisory_xact_lock` or use a `processing_started_at` claim pattern:
  ```sql
  UPDATE template_send_messages
  SET status = 'processing', processing_started_at = now()
  WHERE status = 'pending' AND (processing_started_at IS NULL OR processing_started_at < now() - interval '5 minutes')
  RETURNING *
  ```
- This atomically claims rows so concurrent invocations never process the same messages
- Same pattern for `contact_sequence_state` in sequence-processor

### 1.2 Opt-Out Contact Filter on Bulk Sends (CRITICAL)

**Problem:** Bulk send and sequence processor don't filter out `status='opted_out'` contacts. Opted-out users continue receiving messages.

**Files:**
- `supabase/functions/template-sends/index.ts`
- `supabase/functions/sequence-processor/index.ts`
- `src/app/api/campaigns/[campaignId]/sequences/[seqId]/enroll/route.ts`

**Fix:**
- Add `.neq('contact.status', 'opted_out')` filter when querying pending messages
- In sequence-processor, skip contacts with `opted_out` status
- In enroll route, reject opted_out contacts from enrollment

### 1.3 Atomic Counter Increments (CRITICAL)

**Problem:** `conversation_count` and credit counters use read-modify-write pattern. Under concurrent webhooks, counts are lost.

**Files:**
- `src/app/api/webhooks/whatsapp/[webhookPath]/route.ts`

**Fix:**
- Replace `.update({ conversation_count: currentCount + 1 })` with atomic SQL:
  ```sql
  UPDATE campaign_contacts
  SET conversation_count = conversation_count + 1
  WHERE id = $1
  ```
- Use `.rpc()` or raw SQL for atomic increment

### 1.4 Portal Auth Bypass (CRITICAL)

**Problem:** `portal/campaigns/[campaignId]/route.ts` PATCH allows channel config updates without verifying the portal user owns that channel. Token/secret fields leak to portal users.

**Files:**
- `src/app/api/portal/campaigns/[campaignId]/route.ts`

**Fix:**
- Add ownership verification: channel must belong to the campaign, campaign must belong to the client
- Strip sensitive fields (`access_token`, `verify_token`, `webhook_secret`) from responses to portal users
- Only allow portal admins to update non-sensitive channel config

### 1.5 Campaign Auth Verification (CRITICAL)

**Problem:** `campaigns/route.ts` POST doesn't verify `client_id` belongs to the user. `campaigns/[campaignId]/route.ts` PATCH doesn't verify `client_id` ownership.

**Files:**
- `src/app/api/campaigns/route.ts`
- `src/app/api/campaigns/[campaignId]/route.ts`

**Fix:**
- On POST: verify `client_id` exists in `clients` table and user is the owner
- On PATCH: if `client_id` is being changed, verify ownership of the new client

---

## Phase 2: High Severity Bugs (9 items)

### 2.1 PostgREST Filter Injection

**Problem:** `contacts/route.ts` search uses `.or()` with string interpolation — attacker can inject arbitrary PostgREST filters.

**Files:**
- `src/app/api/campaigns/[campaignId]/contacts/route.ts`

**Fix:**
- Sanitize search input: strip special characters, use parameterized `.ilike()` instead of `.or()` string building
- Or use `.textSearch()` with proper escaping

### 2.2 N+1 Contact Ingestion (300 round-trips)

**Problem:** Both `ingest/route.ts` and `upload/route.ts` do row-by-row upserts — up to 300 and 10,000 DB round-trips respectively.

**Files:**
- `src/app/api/campaigns/[campaignId]/contacts/ingest/route.ts`
- `src/app/api/campaigns/[campaignId]/contacts/upload/route.ts`

**Fix:**
- Batch upserts using `.upsert()` with `onConflict` — single query for all contacts
- For upload, process in chunks of 500 with a single `.upsert()` per chunk
- Tags should merge (array_cat + array_distinct) not overwrite

### 2.3 SequenceEditor Wrong Endpoint

**Problem:** `SequenceEditor.tsx` fetches templates from incorrect API endpoint, causing template picker to fail.

**Files:**
- `src/components/campaigns/whatsapp/SequenceEditor.tsx`

**Fix:**
- Correct the template fetch URL to match the templates API route

### 2.4 Webhook Processes Only First Entry

**Problem:** WhatsApp webhook payload can contain multiple messages/statuses per entry, but handler only processes `messages[0]` and `statuses[0]`.

**Files:**
- `src/app/api/webhooks/whatsapp/[webhookPath]/route.ts`
- `src/lib/channels/whatsapp.ts` (parseInboundMessage)

**Fix:**
- Loop over all messages and statuses in the payload
- Process each one individually

### 2.5 conversation_count Always Resets to 1

**Problem:** Contact upsert sets `conversation_count: 1` on every message instead of incrementing.

**Files:**
- `src/app/api/webhooks/whatsapp/[webhookPath]/route.ts`

**Fix:**
- On new contact: set to 1
- On existing contact: use atomic increment (ties into fix 1.3)

### 2.6 SSRF Prevention Incomplete

**Problem:** `dispatcher.ts` SSRF check misses private IP ranges (e.g., 172.16.x.x, 10.x.x.x link-local).

**Files:**
- `src/lib/events/dispatcher.ts`

**Fix:**
- Add full private range checks: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `127.0.0.0/8`, `::1`, `fc00::/7`
- Also block `0.0.0.0` and metadata endpoints (`169.254.169.254`)

### 2.7 Business Hours Locale-Fragile

**Problem:** `business-hours.ts` weekday lookup uses locale-dependent string matching — breaks in non-English locales.

**Files:**
- `src/lib/channels/business-hours.ts`

**Fix:**
- Use `getDay()` (returns 0-6) instead of locale-dependent weekday strings
- Map day numbers to schedule keys

### 2.8 Rate Limiter In-Memory (Serverless)

**Problem:** `rate-limit.ts` uses in-memory Map — doesn't work across serverless instances, effectively no rate limiting.

**Files:**
- `src/lib/api/rate-limit.ts`

**Fix:**
- Use Supabase/Redis for rate limit state, or
- Use Vercel's `@vercel/kv` if deployed on Vercel, or
- Use a simple DB-based rate limiter with `INSERT ON CONFLICT UPDATE` pattern

### 2.9 Sequence Processor Missing Template Variables

**Problem:** `sequence-processor/index.ts` sends templates without resolving variable placeholders ({{1}}, {{name}}, etc.).

**Files:**
- `supabase/functions/sequence-processor/index.ts`

**Fix:**
- Load contact data and map to template variable positions
- Resolve variables before sending via Meta API

---

## Phase 3: Input Validation & Data Safety (8 items)

### 3.1 Phone Number E.164 Validation

**Problem:** `AddContactDialog.tsx` has no phone validation. `import-crm/route.ts` doesn't validate phone format.

**Files:**
- `src/components/campaigns/whatsapp/AddContactDialog.tsx`
- `src/app/api/campaigns/[campaignId]/contacts/import-crm/route.ts`
- `src/app/api/campaigns/[campaignId]/contacts/ingest/route.ts`

**Fix:**
- Add E.164 regex validation: `/^\+[1-9]\d{1,14}$/`
- Strip spaces/dashes before validation
- Reject invalid numbers with clear error messages

### 3.2 Event Subscription Validation

**Problem:** `events/route.ts` doesn't validate `event_type` values or sanitize `webhook_url`.

**Files:**
- `src/app/api/campaigns/[campaignId]/events/route.ts`

**Fix:**
- Whitelist event types: `whatsapp.message.received`, `whatsapp.conversation.completed`, `whatsapp.contact.tagged`, `whatsapp.sequence.replied`, `whatsapp.sequence.completed`
- Validate webhook_url is HTTPS, run SSRF checks
- Limit subscriptions per channel (e.g., max 20)

### 3.3 Sequence Steps Validation

**Problem:** `sequences/[seqId]/route.ts` doesn't validate the `steps` JSONB array structure.

**Files:**
- `src/app/api/campaigns/[campaignId]/sequences/[seqId]/route.ts`

**Fix:**
- Validate with Zod: each step must have `stepNumber` (int), `delayMinutes` (positive int), `templateId` (UUID)
- Reject steps with missing/invalid fields

### 3.4 Contact Custom Fields Validation

**Problem:** `contacts/[contactId]/route.ts` accepts arbitrary `custom_fields` JSON with no schema.

**Files:**
- `src/app/api/campaigns/[campaignId]/contacts/[contactId]/route.ts`

**Fix:**
- Limit custom_fields to max 20 keys
- Validate key names (alphanumeric + underscore only)
- Validate values are strings/numbers/booleans (no nested objects)
- Cap total JSON size at 4KB

### 3.5 Enroll Route Size Limit

**Problem:** `enroll/route.ts` accepts unlimited `contactIds` array — could be used to enqueue millions of rows.

**Files:**
- `src/app/api/campaigns/[campaignId]/sequences/[seqId]/enroll/route.ts`

**Fix:**
- Limit `contactIds` to max 1000 per request
- For bulk enrollment, use the filter-based approach

### 3.6 CRM Import Row Limit

**Problem:** `import-crm/route.ts` has no limit on rows fetched from CRM.

**Files:**
- `src/app/api/campaigns/[campaignId]/contacts/import-crm/route.ts`

**Fix:**
- Default limit of 1000 contacts per import
- Paginate if CRM returns more
- Show count in preview before import

### 3.7 Tags Array Validation

**Problem:** Tags arrays throughout the codebase accept any values without validation.

**Files:**
- `src/app/api/campaigns/[campaignId]/contacts/[contactId]/route.ts`
- `src/app/api/campaigns/[campaignId]/contacts/ingest/route.ts`

**Fix:**
- Tags must be non-empty strings, max 50 chars each
- Max 20 tags per contact
- Lowercase/trim on save

### 3.8 Media Download Safety

**Problem:** `media.ts` has no timeout on media download, no image buffer size validation.

**Files:**
- `src/lib/channels/media.ts`

**Fix:**
- Add fetch timeout (30s)
- Limit buffer size (10MB for images, 25MB for audio)
- Validate MIME type matches expected content type

---

## Phase 4: UX Polish — Error Handling & Feedback (12 items)

### 4.1 Silent Failures → Toast Notifications

**Problem:** Multiple components swallow errors with `console.error` only — user sees nothing.

**Files:**
- `src/components/campaigns/whatsapp/TemplatesTab.tsx` (sync/delete failures)
- `src/components/campaigns/whatsapp/ContactsTab.tsx` (fetch failures)
- `src/components/campaigns/whatsapp/ContactsList.tsx` (load failures)
- `src/components/campaigns/whatsapp/SendsTab.tsx` (fetch failures)

**Fix:**
- Add toast notifications on all API failures
- Use existing toast system or add one (e.g., sonner)
- Show specific error messages, not generic "something went wrong"

### 4.2 Unsaved Changes Warning

**Problem:** `CampaignBuilder.tsx` has no unsaved changes detection — user can navigate away and lose config.

**Files:**
- `src/components/campaigns/CampaignBuilder.tsx`

**Fix:**
- Track dirty state for each tab's config
- Show confirmation dialog on tab switch or navigation if dirty
- Use `beforeunload` event for browser navigation

### 4.3 Memory Leak in CampaignBuilder

**Problem:** `setTimeout` in tab switch isn't cleaned up on unmount.

**Files:**
- `src/components/campaigns/CampaignBuilder.tsx`

**Fix:**
- Store timeout ID in ref, clear on unmount via `useEffect` cleanup

### 4.4 Template Character Counter

**Problem:** `TemplateEditor.tsx` has no character count — users don't know limits until submission fails.

**Files:**
- `src/components/campaigns/whatsapp/TemplateEditor.tsx`

**Fix:**
- Show character count below each text field (header: 60, body: 1024, footer: 60)
- Color indicator: green/yellow/red as limit approaches
- Variable insertion should insert at cursor position, not always append

### 4.5 BulkSendDialog Improvements

**Problem:** No recipient count on confirm step, no escape key handling.

**Files:**
- `src/components/campaigns/whatsapp/BulkSendDialog.tsx`

**Fix:**
- Show "You are about to send to X contacts" on confirmation step
- Add `onKeyDown` handler for Escape to close
- Disable send button while processing

### 4.6 SequenceDetail Shows Template IDs

**Problem:** Shows raw template UUIDs instead of human-readable template names.

**Files:**
- `src/components/campaigns/whatsapp/SequenceDetail.tsx`

**Fix:**
- Fetch template names on mount
- Display template name + status badge instead of UUID
- Add edit button linking to SequenceEditor

### 4.7 Delete Confirmations Missing

**Problem:** `EventsConfigPanel.tsx` deletes webhooks without confirmation. `SequenceDetail.tsx` "Enroll All" has no confirmation.

**Files:**
- `src/components/campaigns/whatsapp/EventsConfigPanel.tsx`
- `src/components/campaigns/whatsapp/SequenceDetail.tsx`

**Fix:**
- Add confirmation dialogs for destructive actions
- Show count of affected items in confirmation

### 4.8 Polling Optimization

**Problem:** `SendsTab.tsx` continues polling when browser tab is hidden — wasted requests.

**Files:**
- `src/components/campaigns/whatsapp/SendsTab.tsx`

**Fix:**
- Use `document.visibilityState` to pause polling when tab is hidden
- Resume on visibility change
- Also stop polling when all sends are in terminal state

### 4.9 AudienceBuilder Race Condition

**Problem:** Rapid filter changes cause stale count to display (old request resolving after new one).

**Files:**
- `src/components/campaigns/whatsapp/AudienceBuilder.tsx`

**Fix:**
- Use `AbortController` to cancel previous count fetch when filters change
- Or use a request ID / timestamp check to discard stale responses

### 4.10 CsvUploadDialog Improvements

**Problem:** "Drag and drop" text but no drag-and-drop handler. Duplicate column mapping allowed.

**Files:**
- `src/components/campaigns/whatsapp/CsvUploadDialog.tsx`

**Fix:**
- Add `onDragOver`/`onDrop` handlers for file drop
- Prevent same column from being mapped to multiple fields
- Show preview of first 3 rows after column mapping

### 4.11 TemplateList Touch Accessibility

**Problem:** Action buttons only visible on hover — inaccessible on touch devices.

**Files:**
- `src/components/campaigns/whatsapp/TemplateList.tsx`

**Fix:**
- Always show action buttons (or use a kebab/three-dot menu)
- Ensure buttons have proper touch targets (min 44px)

### 4.12 ContactDetail Focus Trap

**Problem:** Slide-over panel has no focus trap — tab key escapes to background content.

**Files:**
- `src/components/campaigns/whatsapp/ContactDetail.tsx`

**Fix:**
- Add focus trap (use `focus-trap-react` or manual implementation)
- Focus first input on open, return focus on close
- Close on Escape key

---

## Phase 5: UX Polish — Layout & Visual (8 items)

### 5.1 Contacts Pagination

**Problem:** `ContactsTab.tsx` loads all contacts at once — breaks with large contact lists.

**Files:**
- `src/components/campaigns/whatsapp/ContactsTab.tsx`
- `src/components/campaigns/whatsapp/ContactsList.tsx`
- `src/app/api/campaigns/[campaignId]/contacts/route.ts`

**Fix:**
- Add cursor-based or offset pagination (50 per page)
- Add pagination controls at bottom of list
- API already supports `.range()` — wire it up

### 5.2 ContactsList Responsive Grid

**Problem:** Fixed grid columns break on mobile/tablet screens.

**Files:**
- `src/components/campaigns/whatsapp/ContactsList.tsx`

**Fix:**
- Use responsive grid: 1 col on mobile, 2 on tablet, 3+ on desktop
- Or switch to a table layout with horizontal scroll on mobile

### 5.3 Inconsistent Empty States

**Problem:** Some tabs show empty states, others show blank space when no data exists.

**Files:**
- `src/components/campaigns/CampaignBuilder.tsx`
- Various tab components

**Fix:**
- Add consistent empty state components with icon, message, and CTA
- "No contacts yet — Import or add your first contact"
- "No sequences yet — Create your first drip campaign"

### 5.4 Verify Token Visibility

**Problem:** `WhatsAppConfigPanel.tsx` shows verify token in plaintext.

**Files:**
- `src/components/campaigns/WhatsAppConfigPanel.tsx`

**Fix:**
- Mask the token by default (show last 4 chars)
- Add eye/copy button to reveal/copy
- Same treatment for any secrets in config

### 5.5 VariableMappingEditor Hardcoded Fields

**Problem:** Custom field options are hardcoded instead of dynamic.

**Files:**
- `src/components/campaigns/whatsapp/VariableMappingEditor.tsx`

**Fix:**
- Fetch distinct custom_field keys from campaign contacts
- Merge with standard fields (name, email, phone, tags)
- Allow free-text entry for new field names

### 5.6 CrmImportDialog Connection Check

**Problem:** No check whether user has active CRM connections before showing import UI.

**Files:**
- `src/components/campaigns/whatsapp/CrmImportDialog.tsx`

**Fix:**
- Check Composio connection status on dialog open
- Show "Connect your CRM first" with link if no connections
- Disable import button until connection is verified

### 5.7 WhatsAppConfigPanel Type Safety

**Problem:** Heavy use of `as never` type casts throughout the component.

**Files:**
- `src/components/campaigns/WhatsAppConfigPanel.tsx`

**Fix:**
- Define proper TypeScript interfaces for all config sections
- Replace `as never` casts with proper type narrowing
- Use discriminated unions where appropriate

### 5.8 GripVertical Drag Handle (SequenceEditor)

**Problem:** GripVertical icon implies drag-to-reorder but no drag implementation exists.

**Files:**
- `src/components/campaigns/whatsapp/SequenceEditor.tsx`

**Fix:**
- Either implement drag-to-reorder (using `@dnd-kit/core` or similar)
- Or remove the GripVertical icon and use up/down arrow buttons instead

---

## Phase 6: Missing Features & Enhancements (10 items)

### 6.1 Opt-In (START) Handler

**Problem:** `opt-out.ts` handles STOP but no re-subscribe flow for START/UNSTOP.

**Files:**
- `src/lib/channels/opt-out.ts`

**Fix:**
- Add `isOptInKeyword(text)` — match: START, SUBSCRIBE, OPT IN, OPT-IN, RESUME
- Update contact status back to `active`
- Send confirmation: "You've been re-subscribed..."

### 6.2 Scheduled Sends

**Problem:** BulkSendDialog only supports immediate sends — no scheduling.

**Files:**
- `src/components/campaigns/whatsapp/BulkSendDialog.tsx`
- `src/app/api/campaigns/[campaignId]/sends/route.ts`
- `supabase/functions/template-sends/index.ts`

**Fix:**
- Add date/time picker to BulkSendDialog
- Store `scheduled_for` on send job
- Template-sends processor: skip jobs where `scheduled_for > now()`

### 6.3 Template Preview

**Problem:** No way to preview how a template will look with actual contact data before sending.

**Files:**
- `src/components/campaigns/whatsapp/TemplateEditor.tsx` (or new component)

**Fix:**
- Add preview panel showing template with sample data filled in
- WhatsApp-style message bubble rendering
- Use first contact's data as preview values

### 6.4 Send Analytics Dashboard

**Problem:** No aggregate view of send performance (delivery rates, read rates, failures).

**Files:**
- New: `src/components/campaigns/whatsapp/SendAnalytics.tsx`

**Fix:**
- Query `template_send_messages` for aggregate stats per send job
- Show: total, delivered, read, failed counts + percentages
- Simple bar/donut chart visualization

### 6.5 Auto-Retry Failed Sends

**Problem:** Failed template sends have no retry mechanism.

**Files:**
- `supabase/functions/template-sends/index.ts`

**Fix:**
- Add `retry_count` and `last_error` columns to `template_send_messages`
- On failure: increment retry_count, set status back to pending if retries < 3
- Exponential backoff: next retry = `now() + (2^retry_count * 5 minutes)`

### 6.6 Contact Search & Filters

**Problem:** Contact list has basic search but no advanced filtering (by tag, status, date range).

**Files:**
- `src/components/campaigns/whatsapp/ContactsTab.tsx`
- `src/components/campaigns/whatsapp/ContactsList.tsx`

**Fix:**
- Add filter bar: status dropdown, tag multi-select, date range picker
- Wire up to API query params
- Persist filters in URL params

### 6.7 Bulk Contact Actions

**Problem:** No way to bulk-tag, bulk-delete, or bulk-enroll selected contacts.

**Files:**
- `src/components/campaigns/whatsapp/ContactsList.tsx`
- New API routes or extend existing

**Fix:**
- Add checkbox selection to contact rows
- Bulk action bar: "Tag Selected", "Delete Selected", "Enroll in Sequence"
- Batch API operations

### 6.8 Message Templates Folder/Category Organization

**Problem:** All templates in a flat list — hard to manage at scale.

**Files:**
- `src/components/campaigns/whatsapp/TemplatesTab.tsx`
- `src/components/campaigns/whatsapp/TemplateList.tsx`

**Fix:**
- Add category filter tabs (Marketing, Utility, Authentication)
- Add search/filter within templates
- Sort by: name, status, last used

### 6.9 Conversation Export

**Problem:** No way to export conversation history for compliance/records.

**Files:**
- New API route + UI button

**Fix:**
- Add "Export" button on conversation view
- Generate CSV/JSON with all messages, timestamps, statuses
- Include contact info and metadata

### 6.10 WhatsApp Business Hours UI Polish

**Problem:** Business hours config exists but may need UX refinement.

**Files:**
- `src/components/campaigns/WhatsAppConfigPanel.tsx`

**Fix:**
- Visual schedule grid (7 rows × time pickers)
- Timezone auto-detect from browser
- Quick presets: "Mon-Fri 9-5", "Always On", "Custom"
- Preview: "Currently OPEN" / "Currently CLOSED" indicator

---

## Database Migration Additions

Needed across phases:

```sql
-- Phase 2: Auto-retry support
ALTER TABLE template_send_messages ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;
ALTER TABLE template_send_messages ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE template_send_messages ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

-- Phase 2: Scheduled sends
ALTER TABLE template_send_jobs ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

-- Phase 3: Better indexing for event subscriptions
CREATE INDEX IF NOT EXISTS idx_event_sub_channel_type
ON event_subscriptions(channel_id, event_type) WHERE is_enabled = true;

-- Phase 1: RLS performance fix
-- Replace per-row subquery RLS on template_send_messages with a simpler policy
DROP POLICY IF EXISTS "..." ON template_send_messages;
CREATE POLICY "Users manage own send messages" ON template_send_messages FOR ALL
USING (EXISTS (
  SELECT 1 FROM template_send_jobs j
  WHERE j.id = template_send_messages.job_id AND j.user_id = auth.uid()
));
```

---

## Dependency Graph

```
Phase 1 (Critical) ──→ Phase 2 (High) ──→ Phase 3 (Validation)
                                    │              │
                                    ▼              ▼
                              Phase 4 (UX Errors) ──→ Phase 5 (UX Visual)
                                                            │
                                                            ▼
                                                     Phase 6 (Features)
```

- Phase 1 is prerequisite for all others (security/data integrity)
- Phases 2 & 3 can partially overlap
- Phases 4 & 5 are independent of each other but depend on 2/3
- Phase 6 features build on the stable foundation from 1-5

---

## Estimated Scope

| Phase | Items | Severity | Files Touched |
|-------|-------|----------|---------------|
| 1 | 5 | Critical | ~8 files + 1 migration |
| 2 | 9 | High | ~12 files |
| 3 | 8 | Medium (Security) | ~10 files |
| 4 | 12 | Medium (UX) | ~12 files |
| 5 | 8 | Low-Medium (Visual) | ~10 files |
| 6 | 10 | Enhancement | ~15 files + 2 new components |
| **Total** | **52** | | |

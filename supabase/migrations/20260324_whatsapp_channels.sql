-- WhatsApp Channels: widen channel_type, add webhook_path, create campaign_contacts
-- ==================================================================================

-- 1a. Widen channel_type CHECK to include whatsapp and sms
ALTER TABLE public.agent_channels
  DROP CONSTRAINT IF EXISTS agent_channels_channel_type_check;

ALTER TABLE public.agent_channels
  ADD CONSTRAINT agent_channels_channel_type_check
  CHECK (channel_type IN ('widget', 'api', 'whatsapp', 'sms'));

-- 1b. Add webhook_path column for secure webhook routing (WhatsApp/SMS)
-- Uses a random token instead of channel UUID to prevent enumeration.
ALTER TABLE public.agent_channels
  ADD COLUMN IF NOT EXISTS webhook_path TEXT UNIQUE;

-- 1c. Create campaign_contacts table
-- Stores contacts per channel (phone-based identity for WhatsApp/SMS).
-- Scoped to channel: same phone in different channels = different records.
CREATE TABLE IF NOT EXISTS public.campaign_contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id      UUID REFERENCES public.agent_channels(id) ON DELETE SET NULL,
  agent_id        UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,

  -- Identity
  phone           TEXT NOT NULL,
  name            TEXT,
  email           TEXT,
  profile_name    TEXT,

  -- Tagging & segmentation
  tags            TEXT[] DEFAULT '{}',

  -- Source tracking
  source          TEXT DEFAULT 'inbound',
  source_id       TEXT,
  custom_fields   JSONB DEFAULT '{}',

  -- Status
  status          TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'opted_out', 'invalid', 'blocked')),

  -- Conversation tracking
  last_contacted_at TIMESTAMPTZ,
  last_replied_at   TIMESTAMPTZ,
  conversation_count INT DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(channel_id, phone)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_tags
  ON public.campaign_contacts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_user
  ON public.campaign_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_agent
  ON public.campaign_contacts(agent_id);

-- RLS
ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contacts"
  ON public.campaign_contacts FOR ALL
  USING (auth.uid() = user_id);

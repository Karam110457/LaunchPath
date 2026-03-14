-- Phase 1: Voice channel support
-- Widens the channel_type CHECK constraint and adds voice_config to ai_agents.

-- Widen channel_type to include 'voice'
ALTER TABLE public.agent_channels
  DROP CONSTRAINT IF EXISTS agent_channels_channel_type_check;

ALTER TABLE public.agent_channels
  ADD CONSTRAINT agent_channels_channel_type_check
  CHECK (channel_type IN ('widget', 'api', 'whatsapp', 'sms', 'voice'));

-- Agent-level voice settings (TTS provider, voice ID, speed)
-- Stored on the agent because voice is part of agent identity,
-- independent of which channel the agent is deployed to.
ALTER TABLE public.ai_agents
  ADD COLUMN IF NOT EXISTS voice_config JSONB DEFAULT NULL;

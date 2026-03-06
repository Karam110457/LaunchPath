-- Add config JSONB column to agent_channels for widget-specific settings.
-- Widget config shape: { primaryColor, agentName, agentAvatar, welcomeMessage, conversationStarters, position, headerText }

ALTER TABLE public.agent_channels
ADD COLUMN config JSONB NOT NULL DEFAULT '{}';

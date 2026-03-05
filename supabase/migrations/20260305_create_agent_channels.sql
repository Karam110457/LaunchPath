-- Channel deployments: each row represents a deployed channel for an agent.
-- Channels have bearer tokens for public API authentication.

CREATE TABLE public.agent_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Channel type (extensible: add 'voice', 'sms', 'whatsapp' later)
  channel_type TEXT NOT NULL CHECK (channel_type IN ('widget', 'api')),

  -- Human-readable label (e.g. "Website Widget", "Support API")
  name TEXT NOT NULL,

  -- Bearer token for public API access
  -- Format: "lp_ch_" + 48 random hex chars = 54 chars total
  token TEXT NOT NULL UNIQUE,

  -- Optional: restrict to specific origins (CORS allowlist)
  -- Empty array = allow all origins
  allowed_origins TEXT[] DEFAULT '{}',

  -- Rate limit override (requests per minute). NULL = use default (20/min).
  rate_limit_rpm INT,

  -- Soft toggle — disabled channels reject all requests
  is_enabled BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER agent_channels_updated_at
  BEFORE UPDATE ON public.agent_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_agent_channels_agent_id ON public.agent_channels(agent_id);
CREATE INDEX idx_agent_channels_user_id ON public.agent_channels(user_id);

-- RLS: only the agent owner can manage channels
ALTER TABLE public.agent_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own channels"
  ON public.agent_channels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own channels"
  ON public.agent_channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channels"
  ON public.agent_channels FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channels"
  ON public.agent_channels FOR DELETE
  USING (auth.uid() = user_id);


-- Channel conversations: anonymous end-user interactions via deployed channels.
-- Separate from agent_conversations (which are owner test chats with user_id FK).

CREATE TABLE public.channel_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.agent_channels(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,

  -- Session identifier: opaque string from the caller
  -- (browser UUID for widgets, phone number for SMS/voice, etc.)
  session_id TEXT NOT NULL,

  messages JSONB NOT NULL DEFAULT '[]',

  -- Optional metadata from the channel (page URL, user agent, referrer, etc.)
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER channel_conversations_updated_at
  BEFORE UPDATE ON public.channel_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- One conversation per session per channel
CREATE UNIQUE INDEX idx_channel_conversations_session
  ON public.channel_conversations(channel_id, session_id);

CREATE INDEX idx_channel_conversations_channel_id ON public.channel_conversations(channel_id);
CREATE INDEX idx_channel_conversations_agent_id ON public.channel_conversations(agent_id);

-- RLS: agent owner can read conversations (for analytics).
-- Writes happen via service role only (no anon INSERT/UPDATE/DELETE).
ALTER TABLE public.channel_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view channel conversations"
  ON public.channel_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_channels ch
      WHERE ch.id = channel_id AND ch.user_id = auth.uid()
    )
  );

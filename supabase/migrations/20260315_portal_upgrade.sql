-- ============================================================
-- Portal Upgrade: HITL, Client Agents, Client Branding
-- Transforms the client portal from read-only to a managed
-- sub-account workspace with human-in-the-loop controls.
-- ============================================================

-- ============================================================
-- 1. Conversation status for human-in-the-loop
-- ============================================================

ALTER TABLE public.channel_conversations
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'human_takeover', 'closed')),
  ADD COLUMN taken_over_by UUID REFERENCES auth.users(id),
  ADD COLUMN taken_over_at TIMESTAMPTZ,
  ADD COLUMN paused_at TIMESTAMPTZ;

CREATE INDEX idx_channel_conversations_status
  ON public.channel_conversations(status);

-- ============================================================
-- 2. Client-agent assignment table
-- Controls which agents a client can create campaigns with.
-- ============================================================

CREATE TABLE public.client_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, agent_id)
);

ALTER TABLE public.client_agents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_client_agents_client_id ON public.client_agents(client_id);
CREATE INDEX idx_client_agents_agent_id ON public.client_agents(agent_id);

-- Agency owner manages agent assignments
CREATE POLICY "Agency manages client agents"
  ON public.client_agents FOR ALL
  USING (public.is_client_owner(client_id))
  WITH CHECK (public.is_client_owner(client_id));

-- Client members can view which agents are assigned to them
CREATE POLICY "Client members can view assigned agents"
  ON public.client_agents FOR SELECT
  USING (public.is_client_member(client_id));

-- ============================================================
-- 3. Client branding table (white-label prep)
-- No UI yet — schema only so future features can read from it.
-- ============================================================

CREATE TABLE public.client_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  primary_color TEXT,
  accent_color TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  custom_domain TEXT,
  custom_css TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_branding ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER client_branding_updated_at
  BEFORE UPDATE ON public.client_branding
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Agency owner manages branding
CREATE POLICY "Agency manages client branding"
  ON public.client_branding FOR ALL
  USING (public.is_client_owner(client_id))
  WITH CHECK (public.is_client_owner(client_id));

-- Client members can view branding (for portal theming)
CREATE POLICY "Client members can view branding"
  ON public.client_branding FOR SELECT
  USING (public.is_client_member(client_id));

-- ============================================================
-- 4. SECURITY DEFINER helper: is_client_admin
-- Checks if the current user is an admin member of the client.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_client_admin(p_client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_members
    WHERE client_id = p_client_id
      AND user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- ============================================================
-- 5. RLS policies for client admin write access
-- ============================================================

-- Client admins can create campaigns for their client
CREATE POLICY "Client admins can insert campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (
    client_id IS NOT NULL
    AND public.is_client_admin(client_id)
  );

-- Client admins can update their client's campaigns
CREATE POLICY "Client admins can update campaigns"
  ON public.campaigns FOR UPDATE
  USING (
    client_id IS NOT NULL
    AND public.is_client_admin(client_id)
  );

-- Client admins can insert channels for their campaigns
CREATE POLICY "Client admins can insert channels"
  ON public.agent_channels FOR INSERT
  WITH CHECK (
    campaign_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.campaigns camp
      WHERE camp.id = campaign_id
        AND camp.client_id IS NOT NULL
        AND public.is_client_admin(camp.client_id)
    )
  );

-- Client admins can update channels for their campaigns
CREATE POLICY "Client admins can update channels"
  ON public.agent_channels FOR UPDATE
  USING (
    campaign_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.campaigns camp
      WHERE camp.id = campaign_id
        AND camp.client_id IS NOT NULL
        AND public.is_client_admin(camp.client_id)
    )
  );

-- Client admins can update conversation status (for takeover/pause)
CREATE POLICY "Client admins can update conversation status"
  ON public.channel_conversations FOR UPDATE
  USING (
    channel_id IN (
      SELECT ac.id FROM public.agent_channels ac
      JOIN public.campaigns camp ON camp.id = ac.campaign_id
      WHERE camp.client_id IS NOT NULL
        AND public.is_client_admin(camp.client_id)
    )
  );

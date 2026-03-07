-- ============================================================
-- Clients + Client Members
-- Turns "client" from text fields on campaigns into a real
-- entity with login access for the client portal.
-- ============================================================

-- Clients: one per business the agency serves
CREATE TABLE public.clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  website     TEXT,
  logo_url    TEXT,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Agency owner full access (no cross-table reference)
CREATE POLICY "Agency manages own clients"
  ON public.clients FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_clients_user_id ON public.clients(user_id);

-- Client members: people who can log into the portal for this client
CREATE TABLE public.client_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  invited_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_id)
);

ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;

-- Client members can see their own membership rows
CREATE POLICY "Client members can view own membership"
  ON public.client_members FOR SELECT
  USING (user_id = auth.uid());

CREATE INDEX idx_client_members_client_id ON public.client_members(client_id);
CREATE INDEX idx_client_members_user_id ON public.client_members(user_id);

-- ============================================================
-- SECURITY DEFINER helpers to break mutual RLS recursion
-- between clients ↔ client_members cross-table policies.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_client_member(p_client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_members
    WHERE client_id = p_client_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_client_owner(p_client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = p_client_id AND user_id = auth.uid()
  );
$$;

-- ============================================================
-- Cross-referencing policies (use SECURITY DEFINER functions)
-- ============================================================

-- Client members can read their own client record
CREATE POLICY "Client members can view their client"
  ON public.clients FOR SELECT
  USING (public.is_client_member(id));

-- Agency owner (who owns the client) can manage members
CREATE POLICY "Agency manages client members"
  ON public.client_members FOR ALL
  USING (public.is_client_owner(client_id))
  WITH CHECK (public.is_client_owner(client_id));

-- ============================================================
-- Link campaigns to clients
-- ============================================================

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX idx_campaigns_client_id ON public.campaigns(client_id);

-- Client members can view campaigns for their client
CREATE POLICY "Client members can view their campaigns"
  ON public.campaigns FOR SELECT
  USING (client_id IS NOT NULL AND public.is_client_member(client_id));

-- ============================================================
-- Client member access to channels + conversations
-- ============================================================

-- Client members can view channels linked to their campaigns
CREATE POLICY "Client members can view their channels"
  ON public.agent_channels FOR SELECT
  USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      WHERE c.client_id IS NOT NULL AND public.is_client_member(c.client_id)
    )
  );

-- Client members can view conversations for their channels
CREATE POLICY "Client members can view their conversations"
  ON public.channel_conversations FOR SELECT
  USING (
    channel_id IN (
      SELECT ac.id FROM public.agent_channels ac
      JOIN public.campaigns camp ON camp.id = ac.campaign_id
      WHERE camp.client_id IS NOT NULL AND public.is_client_member(camp.client_id)
    )
  );

-- Event subscriptions for CRM push / webhook events
CREATE TABLE event_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES agent_channels(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  secret TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE event_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON event_subscriptions
  FOR ALL USING (auth.uid() = user_id);

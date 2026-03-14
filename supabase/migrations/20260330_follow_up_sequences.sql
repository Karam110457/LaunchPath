-- Follow-up sequences (drip campaigns)

CREATE TABLE follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES agent_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  steps JSONB NOT NULL DEFAULT '[]',
  -- [{ stepNumber, delayMinutes, templateId, stopOnReply? }]
  auto_enroll JSONB DEFAULT '{}',
  -- { on_tag?: string[], on_ingest?: boolean }
  stop_on_reply BOOLEAN DEFAULT true,
  stop_on_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contact_sequence_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES follow_up_sequences(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  current_step INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','stopped_reply','stopped_tag','stopped_optout','stopped_manual')),
  next_send_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  stop_reason TEXT,
  UNIQUE(sequence_id, contact_id)
);

CREATE INDEX idx_css_next_send ON contact_sequence_state(next_send_at) WHERE status = 'active';
CREATE INDEX idx_css_contact ON contact_sequence_state(contact_id);
CREATE INDEX idx_fus_campaign ON follow_up_sequences(campaign_id);

ALTER TABLE follow_up_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_sequence_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sequences" ON follow_up_sequences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own sequence states" ON contact_sequence_state
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM follow_up_sequences s
      WHERE s.id = contact_sequence_state.sequence_id
        AND s.user_id = auth.uid()
    )
  );

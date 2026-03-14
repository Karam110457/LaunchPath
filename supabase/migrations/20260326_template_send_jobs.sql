-- Template send jobs (bulk outbound campaigns)
CREATE TABLE template_send_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES agent_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  audience_filter JSONB,
  variable_mapping JSONB,
  total_contacts INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual messages within a send job
CREATE TABLE template_send_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES template_send_jobs(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES campaign_contacts(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  whatsapp_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  error_code TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_send_messages_job_status ON template_send_messages(job_id, status);
CREATE INDEX idx_send_messages_wamid ON template_send_messages(whatsapp_message_id);
CREATE INDEX idx_send_jobs_channel_status ON template_send_jobs(channel_id, status);

ALTER TABLE template_send_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_send_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own send jobs"
  ON template_send_jobs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own send messages"
  ON template_send_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM template_send_jobs
      WHERE template_send_jobs.id = template_send_messages.job_id
      AND template_send_jobs.user_id = auth.uid()
    )
  );

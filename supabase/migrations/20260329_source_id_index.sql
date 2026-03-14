-- Index for source_id lookups during CRM ingest upsert
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_source
  ON public.campaign_contacts(channel_id, source_id)
  WHERE source_id IS NOT NULL;

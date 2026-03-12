-- When a client is deleted, cascade delete their campaigns too.
-- Previously this was ON DELETE SET NULL, leaving orphaned campaigns.
ALTER TABLE public.campaigns
  DROP CONSTRAINT IF EXISTS campaigns_client_id_fkey;

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id)
  ON DELETE CASCADE;

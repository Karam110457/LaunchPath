-- Ensure every campaign must belong to a client (no orphaned campaigns)
ALTER TABLE public.campaigns ALTER COLUMN client_id SET NOT NULL;

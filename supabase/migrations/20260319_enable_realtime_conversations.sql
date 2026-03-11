-- Enable Supabase Realtime on channel_conversations so the portal and
-- agency dashboards can receive live message and status updates.
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_conversations;

-- Full replica identity ensures the Realtime payload includes ALL columns
-- (especially the large `messages` JSONB) on every UPDATE event.
ALTER TABLE public.channel_conversations REPLICA IDENTITY FULL;

-- Add location fields to user_profiles so location is collected at onboarding
-- (profile-level) rather than per-system in the chat flow.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_country text;

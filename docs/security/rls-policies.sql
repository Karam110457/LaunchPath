-- =============================================================================
-- LaunchPath — Starter RLS policies for multi-tenant / user-scoped tables
-- Run in Supabase SQL Editor after creating the tables.
-- Adapt table and column names to your schema (e.g. user_id, org_id).
-- =============================================================================

-- Example: profiles (one row per user, keyed by auth.uid())
-- Assume table: public.profiles (id uuid primary key, user_id uuid references auth.users, ...)

-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can read own profile"
--   ON public.profiles FOR SELECT
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can update own profile"
--   ON public.profiles FOR UPDATE
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert own profile"
--   ON public.profiles FOR INSERT
--   WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Example: org-scoped table (e.g. projects belonging to an organization)
-- Assume: public.projects (id, org_id, ...) and public.members (org_id, user_id, role)
-- -----------------------------------------------------------------------------

-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Members can view org projects"
--   ON public.projects FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.members m
--       WHERE m.org_id = projects.org_id AND m.user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Members with role admin can insert/update/delete org projects"
--   ON public.projects FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.members m
--       WHERE m.org_id = projects.org_id AND m.user_id = auth.uid() AND m.role = 'admin'
--     )
--   );

-- -----------------------------------------------------------------------------
-- Service role bypass: avoid using service_role in app. Use only for migrations
-- or back-office tools. Anon key + RLS is the default for the Next.js app.
-- -----------------------------------------------------------------------------

-- No GRANT to service_role needed for normal app flow; RLS applies to anon/authenticated.

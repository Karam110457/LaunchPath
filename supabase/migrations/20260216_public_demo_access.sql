-- Allow anonymous users to read complete systems for demo pages.
-- The system UUID acts as a de facto access token (unguessable).
create policy "Anyone can read complete systems for demos"
  on public.user_systems for select
  using (status = 'complete');

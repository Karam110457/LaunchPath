-- Demo submissions: tracks prospect form submissions on demo pages.
-- Public INSERT (prospects are anonymous), owner SELECT.

create table if not exists public.demo_submissions (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null references public.user_systems(id) on delete cascade,
  form_data jsonb not null default '{}'::jsonb,
  result jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- Index for owner lookups
create index if not exists idx_demo_submissions_system_id
  on public.demo_submissions(system_id, created_at desc);

-- RLS
alter table public.demo_submissions enable row level security;

-- System owner can read their submissions
create policy "Owner can view submissions"
  on public.demo_submissions for select
  using (
    system_id in (
      select id from public.user_systems where user_id = auth.uid()
    )
  );

-- Anyone can insert (demo pages are public)
create policy "Anyone can submit demo form"
  on public.demo_submissions for insert
  with check (true);

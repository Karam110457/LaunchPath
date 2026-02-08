-- Create waitlist table
create table if not exists public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  created_at timestamptz default now() not null,
  status text default 'pending' check (status in ('pending', 'invited', 'joined')),
  source text
);

-- Enable RLS
alter table public.waitlist enable row level security;

-- Create policy to allow public to insert (join waitlist)
create policy "Allow public insert to waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

-- Create policy to allow admins to view (placeholder for now, usually restricted to service_role or specific admin users)
-- For now, we'll restrict read access to service_role only to prevent public exposure of emails
create policy "Allow service_role to read waitlist"
  on public.waitlist
  for select
  to service_role
  using (true);

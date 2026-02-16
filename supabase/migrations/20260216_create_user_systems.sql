-- Create user_systems table for Start Business flow data
create table if not exists public.user_systems (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text default 'in_progress' check (status in ('in_progress', 'complete', 'archived')),
  current_step int default 1,
  -- Start Business answers
  intent text,
  direction_path text check (direction_path in ('beginner', 'stuck', 'has_clients')),
  industry_interests text[],
  own_idea text,
  tried_niche text,
  what_went_wrong text,
  current_niche text,
  current_clients int,
  current_pricing text,
  growth_direction text,
  delivery_model text,
  pricing_direction text,
  location_city text,
  location_target text,
  -- AI Results
  ai_recommendations jsonb,
  chosen_recommendation jsonb,
  -- Offer
  offer jsonb,
  -- Generated assets
  demo_url text,
  prospects jsonb,
  messages jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.user_systems enable row level security;

-- Users can read their own systems
create policy "Users can read own systems"
  on public.user_systems
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert their own systems
create policy "Users can insert own systems"
  on public.user_systems
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own systems
create policy "Users can update own systems"
  on public.user_systems
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own systems
create policy "Users can delete own systems"
  on public.user_systems
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Reuse the updated_at trigger function
create trigger on_user_systems_updated
  before update on public.user_systems
  for each row
  execute function public.handle_updated_at();

-- Index for fast lookup by user
create index idx_user_systems_user_id on public.user_systems(user_id);

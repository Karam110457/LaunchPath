-- Create user_profiles table for onboarding data
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  time_availability text check (time_availability in ('under_5', '5_to_15', '15_to_30', '30_plus')),
  outreach_comfort text check (outreach_comfort in ('never_done', 'nervous_willing', 'fairly_comfortable', 'love_sales')),
  technical_comfort text check (technical_comfort in ('use_apps', 'used_tools', 'built_basic', 'can_code')),
  revenue_goal text check (revenue_goal in ('500_1k', '1k_3k', '3k_5k', '5k_10k_plus')),
  current_situation text check (current_situation in ('complete_beginner', 'consumed_content', 'tried_no_clients', 'has_clients')),
  blockers text[] default '{}',
  onboarding_completed boolean default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.user_profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.user_profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.user_profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-update updated_at on change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_user_profiles_updated
  before update on public.user_profiles
  for each row
  execute function public.handle_updated_at();

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill profiles for any existing users
insert into public.user_profiles (id)
select id from auth.users
where id not in (select id from public.user_profiles);

-- User-level Composio app connections.
-- Each row = one OAuth connection between a user and a Composio toolkit.
-- Agents reference these via agent_tools rows with tool_type = 'composio'.

create table public.user_composio_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  toolkit text not null,            -- composio slug e.g. "gmail", "hubspot"
  toolkit_name text not null,       -- display name e.g. "Gmail", "HubSpot"
  toolkit_icon text,                -- optional icon URL or emoji
  status text not null default 'pending',  -- pending | active | expired
  composio_account_id text,         -- composio connected_account ID
  connected_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- One connection per user per toolkit
create unique index idx_composio_conn_unique
  on user_composio_connections(user_id, toolkit);

create index idx_composio_conn_user
  on user_composio_connections(user_id);

-- Auto-update timestamp
create trigger set_composio_conn_updated_at
  before update on user_composio_connections
  for each row execute function public.set_updated_at();

-- RLS
alter table user_composio_connections enable row level security;

create policy "Users can view own connections"
  on user_composio_connections for select
  using (auth.uid() = user_id);

create policy "Users can create own connections"
  on user_composio_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own connections"
  on user_composio_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own connections"
  on user_composio_connections for delete
  using (auth.uid() = user_id);

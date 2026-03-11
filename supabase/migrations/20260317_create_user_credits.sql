-- User credit balances for the credit system
create table user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_included int not null default 500,
  monthly_used int not null default 0,
  topup_balance int not null default 0,
  billing_cycle_start timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS
alter table user_credits enable row level security;

create policy "Users can read own credits"
  on user_credits for select
  using (auth.uid() = user_id);

create policy "Users can update own credits"
  on user_credits for update
  using (auth.uid() = user_id);

create policy "Users can insert own credits"
  on user_credits for insert
  with check (auth.uid() = user_id);

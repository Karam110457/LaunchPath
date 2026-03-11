-- Promo code system for credit top-ups
create table promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  credits_amount numeric(10,2) not null check (credits_amount > 0),
  max_uses int not null default 1,
  used_count int not null default 0,
  expires_at timestamptz,
  created_at timestamptz default now() not null
);

create table promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  promo_code_id uuid references promo_codes(id) on delete cascade not null,
  credits_added numeric(10,2) not null,
  created_at timestamptz default now() not null,
  unique(user_id, promo_code_id)
);

-- RLS
alter table promo_codes enable row level security;
alter table promo_redemptions enable row level security;

create policy "Users can read own redemptions"
  on promo_redemptions for select
  using (auth.uid() = user_id);

-- Atomic redemption function (race-safe via FOR UPDATE)
create or replace function redeem_promo(p_user_id uuid, p_code text)
returns jsonb
language plpgsql security definer as $$
declare
  v_promo promo_codes%rowtype;
  v_already_redeemed boolean;
begin
  select * into v_promo
    from promo_codes
    where code = upper(trim(p_code))
    for update;

  if not found then
    return jsonb_build_object('error', 'Invalid promo code');
  end if;

  if v_promo.expires_at is not null and v_promo.expires_at < now() then
    return jsonb_build_object('error', 'This promo code has expired');
  end if;

  if v_promo.used_count >= v_promo.max_uses then
    return jsonb_build_object('error', 'This promo code has reached its usage limit');
  end if;

  select exists(
    select 1 from promo_redemptions
    where user_id = p_user_id and promo_code_id = v_promo.id
  ) into v_already_redeemed;

  if v_already_redeemed then
    return jsonb_build_object('error', 'You have already redeemed this code');
  end if;

  -- Increment usage
  update promo_codes set used_count = used_count + 1 where id = v_promo.id;

  -- Add to topup balance
  update user_credits
    set topup_balance = topup_balance + v_promo.credits_amount,
        updated_at = now()
    where user_id = p_user_id;

  -- Record redemption
  insert into promo_redemptions (user_id, promo_code_id, credits_added)
    values (p_user_id, v_promo.id, v_promo.credits_amount);

  return jsonb_build_object(
    'success', true,
    'credits_added', v_promo.credits_amount
  );
end;
$$;

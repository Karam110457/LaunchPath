-- Atomic credit deduction function (race-safe)
-- Deducts from monthly first, overflows to topup.
-- Returns the actual credits deducted (0 if insufficient).
create or replace function deduct_credits(
  p_user_id uuid,
  p_amount numeric(10,2)
)
returns numeric(10,2)
language plpgsql
security definer
as $$
declare
  v_monthly_included int;
  v_monthly_used numeric(10,2);
  v_topup_balance numeric(10,2);
  v_monthly_remaining numeric(10,2);
  v_from_monthly numeric(10,2);
  v_from_topup numeric(10,2);
begin
  -- Lock the row to prevent concurrent updates
  select monthly_included, monthly_used, topup_balance
    into v_monthly_included, v_monthly_used, v_topup_balance
    from user_credits
    where user_id = p_user_id
    for update;

  if not found then
    return 0;
  end if;

  v_monthly_remaining := greatest(0, v_monthly_included - v_monthly_used);

  -- Check total available
  if (v_monthly_remaining + v_topup_balance) < p_amount then
    return 0;
  end if;

  -- Deduct from monthly first
  v_from_monthly := least(p_amount, v_monthly_remaining);
  v_from_topup := p_amount - v_from_monthly;

  update user_credits
    set monthly_used = monthly_used + v_from_monthly,
        topup_balance = greatest(0, topup_balance - v_from_topup),
        updated_at = now()
    where user_id = p_user_id;

  return p_amount;
end;
$$;

-- Allow usage_logs INSERT from service role (public channel context)
create policy "Service role can insert usage logs"
  on usage_logs for insert
  with check (true);

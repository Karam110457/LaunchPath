-- Change credit columns from int to numeric to support fractional multipliers
alter table usage_logs alter column credits_consumed type numeric(10,2);
alter table user_credits alter column monthly_used type numeric(10,2);
alter table user_credits alter column topup_balance type numeric(10,2);

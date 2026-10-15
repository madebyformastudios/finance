-- Security hardening (audit findings 1, 3, 4).
-- Safe to apply while the old app version is still deployed.

-- ─── One allowlist, used by RLS and by the sign-up block below ───
create or replace function public.is_whitelisted_email(email text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(lower(email), '') in (
    'jairolopes99@gmail.com',
    'njt0404@gmail.com'
  );
$$;

create or replace function public.is_whitelisted_user()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select public.is_whitelisted_email(auth.jwt() ->> 'email');
$$;

-- ─── Only the two allowed accounts can ever be created ───
create or replace function public.block_unlisted_signup()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_whitelisted_email(new.email) then
    raise exception 'Sign-ups are closed for this app.';
  end if;
  return new;
end;
$$;

revoke execute on function public.block_unlisted_signup() from public, anon, authenticated;

drop trigger if exists block_unlisted_signup on auth.users;
create trigger block_unlisted_signup
  before insert on auth.users
  for each row execute function public.block_unlisted_signup();

-- Accounts that already exist but are not on the list can no longer sign in
-- (reversible: set banned_until back to null).
update auth.users
set banned_until = '2999-01-01'
where not public.is_whitelisted_email(email);

-- ─── couple_settings and profiles were open to every signed-in user ───
drop policy if exists "settings are readable by any authenticated user" on public.couple_settings;
drop policy if exists "settings are editable by any authenticated user" on public.couple_settings;

create policy "settings are readable by whitelisted users"
  on public.couple_settings for select
  to authenticated
  using (public.is_whitelisted_user());

create policy "settings are editable by whitelisted users"
  on public.couple_settings for update
  to authenticated
  using (public.is_whitelisted_user())
  with check (public.is_whitelisted_user());

drop policy if exists "profiles are readable by any authenticated user" on public.profiles;
create policy "profiles are readable by whitelisted users"
  on public.profiles for select
  to authenticated
  using (public.is_whitelisted_user());

-- ─── Locked months are really read-only ───
create or replace function public.month_is_open(record_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.monthly_records
    where id = record_id and not locked_status
  );
$$;

drop policy if exists "expenses are writable by whitelisted users" on public.expenses;

create policy "expenses are insertable in open months"
  on public.expenses for insert
  to authenticated
  with check (public.is_whitelisted_user() and public.month_is_open(monthly_record_id));

create policy "expenses are updatable in open months"
  on public.expenses for update
  to authenticated
  using (public.is_whitelisted_user() and public.month_is_open(monthly_record_id))
  with check (public.is_whitelisted_user() and public.month_is_open(monthly_record_id));

create policy "expenses are deletable in open months"
  on public.expenses for delete
  to authenticated
  using (public.is_whitelisted_user() and public.month_is_open(monthly_record_id));

drop policy if exists "savings transactions are insertable by whitelisted users" on public.savings_transactions;
create policy "savings transactions are insertable in open months"
  on public.savings_transactions for insert
  to authenticated
  with check (
    public.is_whitelisted_user()
    and (monthly_record_id is null or public.month_is_open(monthly_record_id))
  );

-- ─── Savings can't go below zero, and month deposits are always positive ───
alter table public.savings_pots
  add constraint savings_pots_balance_not_negative check (current_balance >= 0);

alter table public.savings_transactions
  add constraint savings_transactions_deposit_positive check (monthly_record_id is null or amount > 0);

-- ─── Tighten default grants (RLS already blocks the rest) ───
-- anon keeps SELECT: the keep-alive cron queries with the anon key.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke insert, update, delete on all tables in schema public from anon;

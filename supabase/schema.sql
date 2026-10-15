-- Couple Finance Tracker — schema, RLS policies, and seed
-- Run this in the Supabase SQL editor (or via `supabase db push`).

-- ─────────────────────────────────────────────────────────
-- Allowlist: this is a private two-person app. The same list is enforced
-- three times: at sign-up (block_unlisted_signup, so outsiders can't even
-- create an account), in every RLS policy (is_whitelisted_user), and in the
-- Next.js proxy (lib/auth/whitelist.ts — keep that list in sync).
-- Incremental changes to an existing project live in supabase/migrations/.
-- ─────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────
-- couple_settings: single-row config with the shared/default fixed costs
-- ─────────────────────────────────────────────────────────
create table if not exists couple_settings (
  id boolean primary key default true check (id), -- enforces a single row
  joint_fixed numeric(12, 2) not null default 1480,
  joint_groceries numeric(12, 2) not null default 600,
  updated_at timestamptz not null default now()
);

insert into couple_settings (id) values (true) on conflict (id) do nothing;

alter table couple_settings enable row level security;

create policy "settings are readable by whitelisted users"
  on couple_settings for select
  to authenticated
  using (is_whitelisted_user());

create policy "settings are editable by whitelisted users"
  on couple_settings for update
  to authenticated
  using (is_whitelisted_user())
  with check (is_whitelisted_user());

-- ─────────────────────────────────────────────────────────
-- monthly_records: one row per calendar month
-- Personal fixed costs (Auto, Verzekering, ...) are itemized in `expenses`
-- (type = 'personal_fixed'), not stored as columns here.
-- ─────────────────────────────────────────────────────────
create table if not exists monthly_records (
  id uuid primary key default gen_random_uuid(),
  month smallint not null check (month between 1 and 12),
  year smallint not null check (year between 2000 and 2100),
  user1_income numeric(12, 2) not null default 0,
  user2_income numeric(12, 2) not null default 0,
  joint_fixed numeric(12, 2) not null default 0,
  joint_groceries numeric(12, 2) not null default 0,
  credit_card_bill numeric(12, 2) not null default 0,
  locked_status boolean not null default false,
  -- Whether personal_fixed carry-forward has been resolved for this month
  -- (cloned from the nearest prior month, or found nothing to clone). Set
  -- once, lazily, on first visit — never re-cloned afterward, so a
  -- deliberate deletion sticks.
  personal_fixed_cloned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (month, year)
);

alter table monthly_records enable row level security;

create policy "monthly records are readable by whitelisted users"
  on monthly_records for select
  to authenticated
  using (is_whitelisted_user());

create policy "monthly records are insertable by whitelisted users"
  on monthly_records for insert
  to authenticated
  with check (is_whitelisted_user());

-- Locked months can only be edited by first unlocking them (enforced in app logic + this check).
create policy "unlocked monthly records are editable by whitelisted users"
  on monthly_records for update
  to authenticated
  using (is_whitelisted_user())
  with check (is_whitelisted_user());

create policy "monthly records are deletable by whitelisted users"
  on monthly_records for delete
  to authenticated
  using (is_whitelisted_user() and locked_status = false);

-- ─────────────────────────────────────────────────────────
-- expenses: line items linked to a monthly_record.
-- type = 'extra'          one-off expense for the month
-- type = 'personal_fixed' recurring personal fixed cost (Auto, Verzekering,
--                          Mobiel, ...), assigned via `assignee`
-- assignee 'user1' = Jairo, 'user2' = Naroa, 'joint' = shared
-- ─────────────────────────────────────────────────────────
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  monthly_record_id uuid not null references monthly_records (id) on delete cascade,
  type text not null check (type in ('fixed', 'extra', 'joint', 'personal_fixed')),
  amount numeric(12, 2) not null,
  description text not null default '',
  assignee text not null default 'joint' check (assignee in ('user1', 'user2', 'joint')),
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;

create policy "expenses are readable by whitelisted users"
  on expenses for select
  to authenticated
  using (is_whitelisted_user());

-- Locked months are read-only: writes are only allowed while the parent month is open.
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

create policy "expenses are insertable in open months"
  on expenses for insert
  to authenticated
  with check (is_whitelisted_user() and month_is_open(monthly_record_id));

create policy "expenses are updatable in open months"
  on expenses for update
  to authenticated
  using (is_whitelisted_user() and month_is_open(monthly_record_id))
  with check (is_whitelisted_user() and month_is_open(monthly_record_id));

create policy "expenses are deletable in open months"
  on expenses for delete
  to authenticated
  using (is_whitelisted_user() and month_is_open(monthly_record_id));

-- ─────────────────────────────────────────────────────────
-- savings_pots: persistent savings goals (Spaardoelen) whose balance
-- carries forward automatically — not scoped to a single month.
-- savings_transactions: the ledger. Positive amount = deposit (e.g. a
-- month's allocation), negative = withdrawal (from /spaardoelen).
-- monthly_record_id links a deposit back to the month it came from, so the
-- dashboard can compute how much of *that* month's savings pot is already
-- spoken for; withdrawals leave it null. current_balance on savings_pots is
-- kept in sync by the apply_savings_transaction trigger below — the app
-- never updates it directly, only inserts transactions.
-- ─────────────────────────────────────────────────────────
create table if not exists savings_pots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  current_balance numeric(12, 2) not null default 0 check (current_balance >= 0),
  target_amount numeric(12, 2) check (target_amount is null or target_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table savings_pots enable row level security;

create policy "savings pots are readable by whitelisted users"
  on savings_pots for select
  to authenticated
  using (is_whitelisted_user());

create policy "savings pots are writable by whitelisted users"
  on savings_pots for all
  to authenticated
  using (is_whitelisted_user())
  with check (is_whitelisted_user());

create table if not exists savings_transactions (
  id uuid primary key default gen_random_uuid(),
  pot_id uuid not null references savings_pots (id) on delete cascade,
  monthly_record_id uuid references monthly_records (id) on delete set null,
  amount numeric(12, 2) not null check (amount <> 0),
  description text not null default '',
  created_at timestamptz not null default now(),
  -- deposits (linked to a month) are positive; withdrawals have no month
  check (monthly_record_id is null or amount > 0)
);

alter table savings_transactions enable row level security;

create policy "savings transactions are readable by whitelisted users"
  on savings_transactions for select
  to authenticated
  using (is_whitelisted_user());

create policy "savings transactions are insertable in open months"
  on savings_transactions for insert
  to authenticated
  with check (is_whitelisted_user() and (monthly_record_id is null or month_is_open(monthly_record_id)));

create or replace function apply_savings_transaction()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.savings_pots
  set current_balance = current_balance + new.amount,
      updated_at = now()
  where id = new.pot_id;
  return new;
end;
$$;

drop trigger if exists savings_transactions_apply on savings_transactions;
create trigger savings_transactions_apply
  after insert on savings_transactions
  for each row execute procedure apply_savings_transaction();

-- Keep updated_at current on monthly_records.
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists monthly_records_set_updated_at on monthly_records;
create trigger monthly_records_set_updated_at
  before update on monthly_records
  for each row execute procedure set_updated_at();

-- ─────────────────────────────────────────────────────────
-- Tighten default grants (RLS already blocks the rest). anon keeps SELECT:
-- the keep-alive cron queries with the anon key.
-- ─────────────────────────────────────────────────────────
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke insert, update, delete on all tables in schema public from anon;

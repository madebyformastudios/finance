-- Couple Finance Tracker — schema, RLS policies, and seed
-- Run this in the Supabase SQL editor (or via `supabase db push`).

-- ─────────────────────────────────────────────────────────
-- profiles: one row per authenticated user (mirrors auth.users)
-- ─────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  slot smallint check (slot in (1, 2)), -- which side of the couple (User1/User2); null until assigned
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are readable by any authenticated user"
  on profiles for select
  to authenticated
  using (true);

create policy "users can upsert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create a profile row on first sign-in.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- handle_new_user only makes sense as an auth.users insert trigger (it
-- references NEW) — revoke direct RPC access so it can't be called via
-- PostgREST by anon/authenticated roles.
revoke execute on function handle_new_user() from public, anon, authenticated;

-- Backfill profiles for any auth.users created before this trigger existed
-- (e.g. anyone who signed in before schema.sql was first run).
insert into public.profiles (id, email, display_name)
select id, email, coalesce(raw_user_meta_data ->> 'full_name', email)
from auth.users
on conflict (id) do nothing;

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

create policy "settings are readable by any authenticated user"
  on couple_settings for select
  to authenticated
  using (true);

create policy "settings are editable by any authenticated user"
  on couple_settings for update
  to authenticated
  using (true);

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
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (month, year)
);

alter table monthly_records enable row level security;

create policy "monthly records are readable by any authenticated user"
  on monthly_records for select
  to authenticated
  using (true);

create policy "monthly records are insertable by any authenticated user"
  on monthly_records for insert
  to authenticated
  with check (true);

-- Locked months can only be edited by first unlocking them (enforced in app logic + this check).
create policy "unlocked monthly records are editable by any authenticated user"
  on monthly_records for update
  to authenticated
  using (true)
  with check (true);

create policy "monthly records are deletable by any authenticated user"
  on monthly_records for delete
  to authenticated
  using (locked_status = false);

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

create policy "expenses are readable by any authenticated user"
  on expenses for select
  to authenticated
  using (true);

create policy "expenses are writable by any authenticated user"
  on expenses for all
  to authenticated
  using (true)
  with check (true);

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
  current_balance numeric(12, 2) not null default 0,
  target_amount numeric(12, 2) check (target_amount is null or target_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table savings_pots enable row level security;

create policy "savings pots are readable by any authenticated user"
  on savings_pots for select
  to authenticated
  using (true);

create policy "savings pots are writable by any authenticated user"
  on savings_pots for all
  to authenticated
  using (true)
  with check (true);

create table if not exists savings_transactions (
  id uuid primary key default gen_random_uuid(),
  pot_id uuid not null references savings_pots (id) on delete cascade,
  monthly_record_id uuid references monthly_records (id) on delete set null,
  amount numeric(12, 2) not null check (amount <> 0),
  description text not null default '',
  created_at timestamptz not null default now()
);

alter table savings_transactions enable row level security;

create policy "savings transactions are readable by any authenticated user"
  on savings_transactions for select
  to authenticated
  using (true);

create policy "savings transactions are insertable by any authenticated user"
  on savings_transactions for insert
  to authenticated
  with check (true);

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

-- NOTE on auth scope: the PRD calls for restricting login to two specific
-- Google accounts. For now, RLS only requires `authenticated` (any Google
-- account can sign in and read/write). To restrict later, add an email
-- allowlist check (e.g. `auth.jwt() ->> 'email' in (...)`) to each policy's
-- `using`/`with check` clause, or filter at the Google OAuth consent screen.

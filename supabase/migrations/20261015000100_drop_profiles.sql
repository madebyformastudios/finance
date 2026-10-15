-- Removes the unused profiles table (audit finding 15).
-- Apply AFTER the app version that no longer writes monthly_records.created_by
-- is deployed, otherwise the old code fails when it creates a new month.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
alter table public.monthly_records drop column if exists created_by;
drop table if exists public.profiles;

// Keep in sync with public.is_whitelisted_email() in supabase/schema.sql: the
// database enforces the same list on sign-up and on every table.
const ALLOWED_EMAILS = ["jairolopes99@gmail.com", "njt0404@gmail.com"];

export function isWhitelistedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
